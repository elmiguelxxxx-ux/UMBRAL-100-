import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, AlertTriangle } from 'lucide-react';
import { ensurePdfJs } from '../lib/extractors';
import { getOriginalFile } from '../lib/pdfStore';
import { useActivityTracker } from '../activityLogService';

interface PdfCanvasViewerProps {
  docId: string;
  docTitle?: string;
}

// Visor real: dibuja cada página del PDF original en un <canvas> y superpone una
// capa de texto invisible (posicionada igual que el texto real) para poder
// seleccionar/copiar, en vez de mostrar solo el texto plano extraído.
export default function PdfCanvasViewer({ docId, docTitle }: PdfCanvasViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);
  const textLayerTaskRef = useRef<any>(null);
  // Se incrementa en cada intento de render; si ya no coincide con el actual
  // cuando una operación async termina, esa operación quedó obsoleta y se descarta.
  const renderIdRef = useRef(0);

  const [numPages, setNumPages] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [scale, setScale] = useState(1.2);
  // El zoom real que se usa para renderizar se "asienta" 150ms después del
  // último click de +/- zoom, para no relanzar el render pesado (canvas +
  // capa de texto) en cada click si el usuario hace varios seguidos.
  const [renderScale, setRenderScale] = useState(1.2);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  // Hook que hace upsert automático en activity_log cada vez que se abre o avanza en el PDF
  useActivityTracker({
    resourceType: 'pdf',
    resourceId: docId,
    resourceTitle: docTitle || 'Documento PDF',
    status: 'in_progress',
    progressPct: numPages > 0 ? (pageNum / numPages) * 100 : 0,
    dependencyKey: `${pageNum}:${status}`,
  });

  useEffect(() => {
    const t = setTimeout(() => setRenderScale(scale), 150);
    return () => clearTimeout(t);
  }, [scale]);

  // Carga el documento cuando cambia el id
  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setErrorMsg('');
    setPageNum(1);
    pdfDocRef.current = null;

    (async () => {
      try {
        const buffer = await getOriginalFile(docId);
        if (!buffer) {
          throw new Error('No se encontró el archivo original guardado para este documento.');
        }
        const pdfjsLib = await ensurePdfJs();
        const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
        if (cancelled) return;
        pdfDocRef.current = doc;
        setNumPages(doc.numPages);
        setStatus('ready');
      } catch (err: any) {
        if (cancelled) return;
        setErrorMsg(err?.message || 'No se pudo cargar el PDF original.');
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [docId]);

  // Renderiza la página actual (canvas + capa de texto) cada vez que cambia
  // página, zoom, o termina de cargar el documento.
  useEffect(() => {
    if (status !== 'ready' || !pdfDocRef.current || !canvasRef.current) return;
    let cancelled = false;
    const myRenderId = ++renderIdRef.current;

    (async () => {
      try {
        const page = await pdfDocRef.current.getPage(pageNum);
        if (cancelled || myRenderId !== renderIdRef.current) return;

        const viewport = page.getViewport({ scale: renderScale });
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clave del fix de zoom: si hay un render anterior en curso, cancelarlo
        // NO libera el canvas al instante. Hay que esperar a que su promesa
        // termine (aunque termine en error de cancelación) antes de arrancar
        // el siguiente render sobre el mismo canvas, o pdf.js tira
        // "Cannot use the same canvas during multiple render() operations"
        // y el redibujo con el nuevo zoom se pierde en silencio.
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
          try {
            await renderTaskRef.current.promise;
          } catch {
            /* cancelación esperada */
          }
        }
        if (cancelled || myRenderId !== renderIdRef.current) return;

        // Fix de nitidez: en pantallas de alta densidad (Retina, la mayoría de
        // laptops modernas) hay que dibujar el canvas a una resolución interna
        // mayor (viewport * devicePixelRatio) y luego achicarlo visualmente con
        // CSS al tamaño lógico. Si no, el canvas queda con la resolución justa
        // de CSS y el navegador lo estira, viéndose borroso vs. el PDF original.
        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

        const task = page.render({ canvasContext: ctx, viewport, transform });
        renderTaskRef.current = task;
        await task.promise;
        if (cancelled || myRenderId !== renderIdRef.current) return;

        // Capa de texto real encima del canvas: permite seleccionar y copiar
        // texto cuando el PDF trae texto embebido (no funciona en escaneados
        // sin OCR, porque ahí no existe ese texto).
        const textLayerDiv = textLayerRef.current;
        if (textLayerDiv) {
          const pdfjsLib = await ensurePdfJs();
          const textContent = await page.getTextContent();
          if (cancelled || myRenderId !== renderIdRef.current) return;

          // Fix definitivo del desfase/duplicado al hacer zoom: pdf.js NO
          // garantiza que cancel() detenga al instante la escritura de spans
          // en el contenedor (puede seguir insertando nodos un momento
          // después). Si escribiéramos directo sobre el textLayerDiv visible,
          // una capa vieja (de otra escala) podía terminar de escribirse
          // DESPUÉS de que ya empezó la nueva, mezclando ambas — eso causaba
          // el bloque de texto duplicado y desplazado.
          // Solución: renderizar siempre en un contenedor DESCONECTADO del
          // DOM (invisible, nadie lo ve) y "publicarlo" — reemplazar el
          // contenido real — solo si este render sigue siendo el vigente al
          // terminar. Así una escritura tardía de una capa vieja cae en un
          // nodo huérfano que se descarta solo, nunca se mezcla con lo visible.
          const offscreen = document.createElement('div');
          offscreen.style.width = `${viewport.width}px`;
          offscreen.style.height = `${viewport.height}px`;

          const textTask = pdfjsLib.renderTextLayer({
            textContentSource: textContent,
            container: offscreen,
            viewport,
            textDivs: [],
          });
          textLayerTaskRef.current = textTask;
          try {
            await textTask.promise;
          } catch {
            /* si se cancela por un cambio rápido de página/zoom, no pasa nada */
          } finally {
            if (textLayerTaskRef.current === textTask) textLayerTaskRef.current = null;
          }

          if (cancelled || myRenderId !== renderIdRef.current) return;

          // Publicación atómica: recién acá tocamos el contenedor visible,
          // y de una sola vez (nunca queda a medio construir).
          textLayerDiv.style.width = `${viewport.width}px`;
          textLayerDiv.style.height = `${viewport.height}px`;
          textLayerDiv.replaceChildren(...Array.from(offscreen.children));
        }
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn('Error al renderizar página del PDF', err);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (textLayerTaskRef.current) {
        try {
          textLayerTaskRef.current.cancel();
        } catch {
          /* noop */
        }
      }
    };
  }, [status, pageNum, renderScale]);

  if (status === 'loading') {
    return (
      <div className="flex-1 flex items-center justify-center gap-2 text-[11px] text-[#9B9A97]">
        <Loader2 size={14} className="animate-spin" /> Cargando documento original…
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 text-center text-[11px] text-[#9B9A97]">
        <AlertTriangle size={16} className="text-amber-500" />
        {errorMsg}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-center gap-3 py-2 border-b border-[#E9E8E4] bg-white shrink-0">
        <button
          onClick={() => setPageNum((p) => Math.max(1, p - 1))}
          disabled={pageNum <= 1}
          className="p-1 rounded text-[#5A5A58] hover:bg-[#F4F3EF] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={15} />
        </button>
        <span className="text-[11px] text-[#5A5A58] tabular-nums select-none">
          Página {pageNum} de {numPages}
        </span>
        <button
          onClick={() => setPageNum((p) => Math.min(numPages, p + 1))}
          disabled={pageNum >= numPages}
          className="p-1 rounded text-[#5A5A58] hover:bg-[#F4F3EF] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={15} />
        </button>
        <span className="w-px h-4 bg-[#E9E8E4] mx-1" />
        <button
          onClick={() => setScale((s) => Math.max(0.5, +(s - 0.2).toFixed(2)))}
          className="p-1 rounded text-[#5A5A58] hover:bg-[#F4F3EF]"
        >
          <ZoomOut size={14} />
        </button>
        <span className="text-[11px] text-[#9B9A97] tabular-nums w-9 text-center select-none">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => setScale((s) => Math.min(3, +(s + 0.2).toFixed(2)))}
          className="p-1 rounded text-[#5A5A58] hover:bg-[#F4F3EF]"
        >
          <ZoomIn size={14} />
        </button>
      </div>
      <div className="flex-1 overflow-auto flex justify-center py-6 bg-[#F4F3EF]">
        <div className="relative shadow-md bg-white" style={{ lineHeight: 0 }}>
          <canvas ref={canvasRef} className="block" />
          <div ref={textLayerRef} className="textLayer" />
        </div>
      </div>
    </div>
  );
}
