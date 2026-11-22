import mammoth from 'mammoth';
import JSZip from 'jszip';

const PDFJS_VERSION = '3.11.174';

// Dynamic loader for PDF.js to extract real text from PDFs in browser
export const ensurePdfJs = async () => {
  if ((window as any).pdfjsLib) return (window as any).pdfjsLib;
  if ((window as any).__pdfjsLoadingPromise) return (window as any).__pdfjsLoadingPromise;

  (window as any).__pdfjsLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;
    script.onload = () => {
      try {
        (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;
        resolve((window as any).pdfjsLib);
      } catch (err) {
        reject(err);
      }
    };
    script.onerror = () => reject(new Error('No se pudo cargar el visor PDF.js'));
    document.head.appendChild(script);
  });

  return (window as any).__pdfjsLoadingPromise;
};

export interface PdfExtractionResult {
  text: string;
  totalPages: number;
  processedPages: number;
  scannedPageNumbers: number[];
}

// Antes había un tope fijo de 50 páginas sin ningún aviso. Ahora se sube el
// límite (pensado para no congelar la pestaña con documentos gigantes) y,
// si de verdad se trunca, el resultado lo informa explícitamente para que la
// UI pueda avisarle al usuario en vez de dejarlo con contenido incompleto
// sin explicación.
const MAX_PDF_PAGES = 400;

export const extractPdfText = async (arrayBuffer: ArrayBuffer): Promise<PdfExtractionResult> => {
  const pdfjsLib = await Promise.race([
    ensurePdfJs(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Tiempo de espera agotado cargando PDF.js')), 12000)
    ),
  ]);

  const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = doc.numPages;
  const processedPages = Math.min(totalPages, MAX_PDF_PAGES);
  let fullText = '';
  const scannedPageNumbers: number[] = [];

  for (let i = 1; i <= processedPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = reconstructPageText(content.items as any[]);
    if (pageText.trim()) {
      fullText += `--- Página ${i} ---\n${pageText.trim()}\n\n`;
    } else {
      // Sin fragmentos de texto seleccionable: casi siempre es una página
      // escaneada (imagen) sin OCR, no un error. Se marca en vez de omitirla
      // en silencio, para que tanto el usuario como la IA sepan que ahí falta
      // contenido real (esto NO hace OCR, solo evita que la ausencia sea invisible).
      scannedPageNumbers.push(i);
      fullText += `--- Página ${i} (sin texto seleccionable — probablemente escaneada) ---\n\n`;
    }
  }

  return { text: fullText.trim(), totalPages, processedPages, scannedPageNumbers };
};

type TextItem = { str: string; x: number; y: number; width: number; height: number };

/**
 * Busca una "calle" vertical cerca del centro de la página que casi ningún
 * fragmento de texto atraviesa — la señal geométrica típica de un layout a
 * 2 columnas (papers académicos, revistas). Sigue siendo una heurística
 * (no hay detección de layout entrenada con ML como en Document AI/Textract),
 * pero es sensiblemente más confiable que ordenar todo por Y sin más.
 * Devuelve el X del corte, o null si no hay evidencia clara de 2 columnas.
 */
function detectColumnSplit(items: TextItem[]): number | null {
  if (items.length < 20) return null; // muy poco texto para que valga la pena analizar

  const minX = Math.min(...items.map((i) => i.x));
  const maxX = Math.max(...items.map((i) => i.x + i.width));
  const pageWidth = maxX - minX;
  if (pageWidth <= 0) return null;

  const candidateFractions = [0.42, 0.45, 0.48, 0.5, 0.52, 0.55, 0.58];
  for (const frac of candidateFractions) {
    const splitX = minX + pageWidth * frac;
    const crossing = items.filter((i) => i.x < splitX && i.x + i.width > splitX).length;
    if (crossing / items.length > 0.04) continue; // demasiados fragmentos cruzan esa línea

    const left = items.filter((i) => i.x + i.width / 2 <= splitX);
    const right = items.filter((i) => i.x + i.width / 2 > splitX);
    const minSideRatio = Math.min(left.length, right.length) / items.length;
    if (minSideRatio > 0.15) return splitX; // ambos lados tienen contenido real, no es ruido
  }
  return null;
}

/**
 * pdf.js entrega los fragmentos de texto en el orden del stream interno del PDF,
 * que casi nunca coincide con el orden de lectura visual. Esto reordena por
 * posición real en la página: primero intenta separar en 2 columnas si detecta
 * una calle vertical clara (ver detectColumnSplit), y dentro de cada columna
 * agrupa fragmentos en líneas por su altura (Y) y separa párrafos cuando el
 * espacio vertical entre líneas es mayor a lo normal.
 * Sigue sin resolver layouts de 3+ columnas o tablas complejas (para eso hace
 * falta un modelo de layout entrenado, no geometría), pero cubre el caso más
 * común de columnas mezcladas que antes rompía el orden de lectura.
 */
function reconstructPageText(rawItems: any[]): string {
  const parsed: TextItem[] = rawItems
    .filter((it) => typeof it?.str === 'string' && it.str.length > 0)
    .map((it) => ({
      str: it.str,
      x: it.transform?.[4] ?? 0,
      y: it.transform?.[5] ?? 0,
      width: typeof it.width === 'number' ? it.width : 0,
      height: Math.abs(it.transform?.[3] ?? it.height ?? 10) || 10,
    }));

  if (parsed.length === 0) return '';

  const splitX = detectColumnSplit(parsed);
  if (splitX == null) return reconstructColumnText(parsed);

  const left = parsed.filter((i) => i.x + i.width / 2 <= splitX);
  const right = parsed.filter((i) => i.x + i.width / 2 > splitX);
  return [reconstructColumnText(left), reconstructColumnText(right)].filter(Boolean).join('\n\n');
}

/** Ordena y agrupa en líneas/párrafos los fragmentos de UNA sola columna (o de toda la página si es una sola columna). */
function reconstructColumnText(parsed: TextItem[]): string {
  if (parsed.length === 0) return '';

  // 1) Orden real: de arriba hacia abajo (Y descendente en coordenadas PDF),
  //    y dentro de la misma altura, de izquierda a derecha (X ascendente).
  const sorted = [...parsed].sort((a, b) => b.y - a.y || a.x - b.x);

  // 2) Agrupar en líneas: fragmentos cuya Y cae dentro de una tolerancia
  //    relativa al tamaño de letra se consideran parte del mismo renglón.
  const lines: TextItem[][] = [];
  for (const item of sorted) {
    const lastLine = lines[lines.length - 1];
    const lastItem = lastLine?.[lastLine.length - 1];
    const tolerance = Math.max(item.height, lastItem?.height || item.height) * 0.55;
    if (lastLine && lastItem && Math.abs(item.y - lastItem.y) <= tolerance) {
      lastLine.push(item);
    } else {
      lines.push([item]);
    }
  }
  lines.forEach((line) => line.sort((a, b) => a.x - b.x));

  const lineTexts = lines
    .map((line) => ({
      text: line.map((it) => it.str).join(' ').replace(/\s+/g, ' ').trim(),
      y: line[0].y,
      height: Math.max(...line.map((it) => it.height)),
    }))
    .filter((l) => l.text.length > 0);

  // 3) Unir líneas en párrafos: salto simple si el espacio vertical es el normal
  //    entre renglones, salto de párrafo (línea en blanco) si es mayor.
  let out = '';
  for (let i = 0; i < lineTexts.length; i++) {
    const line = lineTexts[i];
    if (i === 0) {
      out += line.text;
      continue;
    }
    const prev = lineTexts[i - 1];
    const gap = prev.y - line.y;
    const isParagraphBreak = gap > (prev.height || 10) * 1.6;
    out += isParagraphBreak ? '\n\n' : '\n';
    out += line.text;
  }
  return out;
}

/**
 * mammoth.extractRawText descarta tablas por completo (las trata como si no
 * existieran), lo cual es un problema real en apuntes y papers donde la
 * información clave a veces está en una tabla. Por eso se usa convertToHtml
 * en su lugar y se reconstruye el texto a mano: párrafos/encabezados/listas
 * tal cual, y las tablas como filas de celdas separadas por " | " (formato
 * legible tanto para el usuario como para la IA, sin perder la estructura).
 */
export const extractDocxText = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const html = (result.value || '').trim();
  if (!html) return '';
  return htmlToStructuredText(html);
};

function htmlToStructuredText(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const blocks: string[] = [];
  const blockTags = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI']);

  const walk = (node: Element) => {
    for (const child of Array.from(node.children)) {
      if (child.tagName === 'TABLE') {
        const tableText = tableToText(child as HTMLTableElement);
        if (tableText) blocks.push(tableText);
      } else if (blockTags.has(child.tagName)) {
        const text = (child.textContent || '').trim();
        if (text) blocks.push(text);
      } else {
        // Contenedores (div, ul, ol, etc.): seguir bajando para no perder contenido anidado.
        walk(child);
      }
    }
  };

  walk(doc.body);
  return blocks.join('\n\n');
}

function tableToText(table: HTMLTableElement): string {
  const rows: string[] = [];
  for (const tr of Array.from(table.querySelectorAll('tr'))) {
    const cells = Array.from(tr.querySelectorAll('td,th')).map((c) => (c.textContent || '').trim());
    if (cells.some((c) => c)) rows.push(cells.join(' | '));
  }
  return rows.length ? `[Tabla]\n${rows.join('\n')}` : '';
}

/**
 * Extracts real text content from PowerPoint (.pptx) files using JSZip
 * Reads ppt/slides/slide{N}.xml in natural order and collects <a:t> text nodes.
 */
export const extractPptxText = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  const zip = await JSZip.loadAsync(arrayBuffer);
  
  // Find all slide XML files
  const slideFiles: { name: string; index: number; file: JSZip.JSZipObject }[] = [];
  
  zip.forEach((relativePath, file) => {
    const match = relativePath.match(/^ppt\/slides\/slide(\d+)\.xml$/i);
    if (match) {
      slideFiles.push({
        name: relativePath,
        index: parseInt(match[1], 10),
        file,
      });
    }
  });

  if (slideFiles.length === 0) {
    throw new Error('No se encontraron diapositivas legibles en la presentación.');
  }

  // Sort slides in natural numeric order
  slideFiles.sort((a, b) => a.index - b.index);

  const slideTexts: string[] = [];
  const parser = new DOMParser();

  for (const item of slideFiles) {
    const xmlContent = await item.file.async('text');
    const xmlDoc = parser.parseFromString(xmlContent, 'application/xml');
    
    // Find all paragraph (<a:p>) elements or direct text (<a:t>) nodes
    const paragraphs = xmlDoc.getElementsByTagName('a:p');
    const paragraphLines: string[] = [];

    if (paragraphs.length > 0) {
      for (let p = 0; p < paragraphs.length; p++) {
        const textNodes = paragraphs[p].getElementsByTagName('a:t');
        let line = '';
        for (let t = 0; t < textNodes.length; t++) {
          line += textNodes[t].textContent || '';
        }
        if (line.trim()) {
          paragraphLines.push(line.trim());
        }
      }
    } else {
      // Fallback to all <a:t>
      const textNodes = xmlDoc.getElementsByTagName('a:t');
      for (let t = 0; t < textNodes.length; t++) {
        const str = textNodes[t].textContent;
        if (str && str.trim()) paragraphLines.push(str.trim());
      }
    }

    if (paragraphLines.length > 0) {
      slideTexts.push(`[Diapositiva ${item.index}]\n${paragraphLines.join('\n')}`);
    } else {
      slideTexts.push(`[Diapositiva ${item.index}]\n(Sin texto directo / Diapositiva gráfica)`);
    }
  }

  return slideTexts.join('\n\n');
};
