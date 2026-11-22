import React, { useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Note, PdfDoc, CanvasNode } from '../types';
import { useData } from '../context/DataContext';
import { useSettings } from '../context/SettingsContext';
import { useNavigation } from '../context/NavigationContext';
import { useActivityTracker } from '../activityLogService';

import { CanvasView } from './CanvasView';
import { FlashcardsView } from './FlashcardsView';
import { JournalView } from './JournalView';
import { BibliotecaView } from './BibliotecaView';
import { DocumentReaderView } from './DocumentReaderView';
import { SettingsModal } from './SettingsModal';
import { EvaluationSection } from './EvaluationSection';
import { DailyHome } from '../features/figure/DailyHome';
import { FigureShell } from '../features/figure/FigureShell';
import { ExecutionBar } from '../features/figure/ExecutionBar';
import { ContractView } from '../features/figure/ContractView';
import { MissionView } from '../features/figure/MissionView';
import { EvidenceView } from '../features/figure/EvidenceView';
import { useFigureState } from '../features/figure/useFigureState';
import { useMission } from '../features/figure/useMission';
import { ConfirmModal, ImportPickerModal, NoteFromHighlightModal } from './AppModals';

export function AppShell() {
  const {
    data,
    saveError,
    folderPath,
    createFolder,
    renameFolder,
    deleteFolderCascade,
    createFolderWithName,
    addNote,
    updateNote,
    deleteNote,
    sendNoteToCanvas,
    deletePdf,
    movePdf,
    moveMultiplePdfs,
    renamePdf,
    sendDocToCanvas,
    sendHighlightToCanvas,
    addHighlight,
    deleteHighlight,
    addNoteForDoc,
    createNoteFromHighlight,
    clearDocumentChat,
    saveAiResponseAsNote,
    isImporting,
    aiLoading,
    importDocumentFile,
    sendAiMessage,
    triggerAiAction,
    updateCanvas,
    sendJournalToCanvas,
    updateFlashcards,
    addReviewEvent,
    addExamAttempt,
    prioritizeConcepts,
    updateWarLog,
    updateJournal,
    updateHomeData,
  } = useData();

  const {
    settings,
    aiConfig,
    theme,
    toggleTheme,
    updateSettings,
    isSettingsOpen,
    setIsSettingsOpen,
  } = useSettings();

  const {
    activeView,
    setActiveView,
    selectedFolderId,
    setSelectedFolderId,
    openPdfId,
    setOpenPdfId,
    toastMessage,
    showToast,
    clearToast,
    handleOpenPdf,
    handleClosePdfEditor,
    handleMissionContinue,
  } = useNavigation();

  // Modo ejecución de misión
  const [executionMission, setExecutionMission] = useState<{
    title: string;
    startTime: number;
  } | null>(null);

  // Modales y estado transitorio de la UI
  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [importPicker, setImportPicker] = useState<{ folderId: string } | null>(null);
  const [noteFromHighlight, setNoteFromHighlight] = useState<{ text: string; folderId: string } | null>(null);

  // Selector de archivos para importación
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingImportFolderIdRef = useRef<string>('root');

  // Tracking de actividad en documento abierto
  const currentOpenDoc = data.pdfs.find((p) => p.id === openPdfId);
  useActivityTracker({
    resourceType: 'pdf',
    resourceId: currentOpenDoc?.id,
    resourceTitle: currentOpenDoc?.title,
    status: 'in_progress',
    enabled: activeView === 'pdf-editor' && !!currentOpenDoc,
    dependencyKey: currentOpenDoc?.highlights?.length,
  });

  // Integración con Figura Concéntrica y Misión Diaria
  const { currentObjective, activeThreshold } = useFigureState();
  const { mission, updateMissionStatus } = useMission(currentObjective, activeThreshold);

  // Handlers para acciones de interfaz
  const handleStartMissionExecution = () => {
    const started = Date.now();
    updateMissionStatus('in_progress', { startedAt: started });
    const targetTool = mission?.tool || 'canvas';
    if (targetTool === 'canvas') setActiveView('canvas');
    else if (targetTool === 'pdf') {
      const firstDoc = data.pdfs[0];
      if (firstDoc) {
        setOpenPdfId(firstDoc.id);
        setActiveView('pdf-editor');
      } else {
        setActiveView('biblioteca');
      }
    } else if (targetTool === 'aprendizaje') setActiveView('aprendizaje');
    else if (targetTool === 'examen') setActiveView('examen');
    else setActiveView('canvas');
  };

  const handleFinishMissionExecution = () => {
    updateMissionStatus('pending_evidence', { endedAt: Date.now() });
    setActiveView('evidencia');
  };

  const handleDeleteFolder = (folderId: string) => {
    if (folderId === 'root') return;
    setConfirmModal({
      message: '¿Eliminar esta carpeta y todo su contenido (subcarpetas, notas y PDFs)?',
      onConfirm: () => {
        deleteFolderCascade(folderId);
        if (selectedFolderId === folderId) {
          setSelectedFolderId('root');
        }
      },
    });
  };

  const handleDeleteNote = (noteId: string) => {
    setConfirmModal({
      message: '¿Eliminar esta nota?',
      onConfirm: () => deleteNote(noteId),
    });
  };

  const handleDeletePdf = (pdfId: string) => {
    setConfirmModal({
      message: '¿Eliminar este documento? No se puede deshacer.',
      onConfirm: () => {
        deletePdf(pdfId);
        if (openPdfId === pdfId) {
          handleClosePdfEditor();
        }
      },
    });
  };

  const handleSendNoteToCanvas = (note: Note) => {
    const res = sendNoteToCanvas(note);
    if (res.alreadyExists) {
      setActiveView('canvas');
      showToast('Esta nota ya está en el Canvas.');
    } else {
      showToast(`Nota "${note.title}" enviada al Canvas`, {
        label: 'Ver en Canvas',
        onClick: () => setActiveView('canvas'),
      });
    }
  };

  const handleSendDocToCanvas = (doc: PdfDoc) => {
    sendDocToCanvas(doc);
    showToast(`Documento "${doc.title}" enviado al Canvas`, {
      label: 'Ver en Canvas',
      onClick: () => setActiveView('canvas'),
    });
  };

  const handleSendHighlightToCanvas = (highlightText: string) => {
    const pdf = data.pdfs.find((p) => p.id === openPdfId);
    sendHighlightToCanvas(highlightText, openPdfId || undefined, pdf?.title);
    showToast('Fragmento enviado al Canvas como nodo', {
      label: 'Ver en Canvas',
      onClick: () => {
        setOpenPdfId(null);
        setActiveView('canvas');
      },
    });
  };

  const handleAddNoteForDoc = () => {
    if (!openPdfId) return;
    addNoteForDoc(openPdfId);
    showToast('Nueva nota creada para este documento');
  };

  const handleConfirmNoteFromHighlight = (text: string, folderId: string) => {
    createNoteFromHighlight(text, folderId, openPdfId || undefined);
    setNoteFromHighlight(null);
    showToast('Nota generada y guardada en Biblioteca', {
      label: 'Ver en Biblioteca',
      onClick: () => {
        setOpenPdfId(null);
        setActiveView('biblioteca');
      },
    });
  };

  const handleClearDocumentChat = () => {
    if (!openPdfId) return;
    clearDocumentChat(openPdfId);
    showToast('Historial de chat eliminado de este documento.');
  };

  const handleSaveAiResponseAsNote = (content: string) => {
    saveAiResponseAsNote(content, openPdfId || undefined);
    showToast('Respuesta guardada como nota en Biblioteca', {
      label: 'Ver en Biblioteca',
      onClick: () => {
        setOpenPdfId(null);
        setActiveView('biblioteca');
      },
    });
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;

    const folderId = pendingImportFolderIdRef.current || 'root';
    await importDocumentFile(file, folderId, aiConfig, (docId) => {
      handleOpenPdf(docId);
    });
  };

  const openDoc = data.pdfs.find((p) => p.id === openPdfId);

  // Renderizado del contenido interno de cada herramienta
  const renderViewContent = () => {
    if (activeView === 'canvas') {
      return (
        <CanvasView
          canvasData={data.canvas}
          notes={data.notes}
          documents={data.pdfs}
          onUpdateCanvas={updateCanvas}
          onUpdateNote={updateNote}
          onOpenDoc={handleOpenPdf}
        />
      );
    }

    if (activeView === 'journal') {
      return (
        <JournalView
          entries={data.journal || []}
          onUpdateEntries={updateJournal}
          onSendToCanvas={(title, content) => {
            sendJournalToCanvas(title, content);
            setActiveView('canvas');
            showToast('Apunte del diario añadido al Canvas');
          }}
        />
      );
    }

    if (activeView === 'aprendizaje') {
      return (
        <FlashcardsView
          cards={data.flashcards}
          folders={data.folders}
          documents={data.pdfs}
          notes={data.notes}
          initialDeckId={selectedFolderId}
          onUpdateCards={updateFlashcards}
          reviewEvents={data.reviewEvents || []}
          onAddReviewEvent={addReviewEvent}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      );
    }

    if (activeView === 'examen' || activeView === 'dashboard' || activeView === 'warlog') {
      return (
        <EvaluationSection
          data={data}
          selectedFolderId={selectedFolderId}
          initialTab={
            activeView === 'dashboard'
              ? 'dashboard'
              : activeView === 'warlog'
              ? 'warlog'
              : 'examen'
          }
          addExamAttempt={addExamAttempt}
          prioritizeConcepts={prioritizeConcepts}
          updateWarLog={updateWarLog}
          onNavigateToAprendizaje={() => setActiveView('aprendizaje')}
        />
      );
    }

    if (activeView === 'biblioteca') {
      return (
        <BibliotecaView
          data={data}
          onOpenPdf={handleOpenPdf}
          onAddNote={addNote}
          onUpdateNote={updateNote}
          onDeleteNote={handleDeleteNote}
          onDeletePdf={handleDeletePdf}
          onMovePdf={movePdf}
          onMoveMultiplePdfs={moveMultiplePdfs}
          onRenamePdf={renamePdf}
          onCreateFolderWithName={createFolderWithName}
          onSendDocToCanvas={handleSendDocToCanvas}
          onSendNoteToCanvas={handleSendNoteToCanvas}
          onOpenImportPicker={(folderId) => setImportPicker({ folderId })}
          onSelectFolder={setSelectedFolderId}
          isImporting={isImporting}
        />
      );
    }

    if (activeView === 'pdf-editor' && openDoc) {
      return (
        <DocumentReaderView
          pdf={openDoc}
          data={data}
          path={folderPath(openDoc.folderId)}
          onClose={() => handleClosePdfEditor(openDoc.folderId)}
          onAddHighlight={(color, text) => addHighlight(openDoc.id, color, text)}
          onDeleteHighlight={(highlightId) => deleteHighlight(openDoc.id, highlightId)}
          onSendHighlightToCanvas={handleSendHighlightToCanvas}
          onAddNoteForDoc={handleAddNoteForDoc}
          onUpdateNote={updateNote}
          onDeleteNote={handleDeleteNote}
          onSendNoteToCanvas={handleSendNoteToCanvas}
          onRequestNoteFromHighlight={(text, folderId) =>
            setNoteFromHighlight({ text, folderId })
          }
          onMovePdf={movePdf}
          onMoveMultiplePdfs={moveMultiplePdfs}
          onRenamePdf={renamePdf}
          onCreateFolderWithName={createFolderWithName}
          onDeletePdf={handleDeletePdf}
        />
      );
    }

    return null;
  };

  // Mapeo de títulos y niveles para FigureShell
  const getSectionMeta = () => {
    switch (activeView) {
      case 'contrato':
        return { title: 'OBJETIVO · CONTRATO', level: 1 as const };
      case 'examen':
      case 'dashboard':
      case 'warlog':
        return { title: 'UMBRAL · EVALUACIÓN', level: 2 as const };
      case 'mision':
        return { title: 'MISIÓN ACTUAL', level: 3 as const };
      case 'evidencia':
        return { title: 'EVIDENCIA Y VEREDICTO', level: 5 as const };
      case 'canvas':
        return { title: 'CONSTRUCCIÓN', level: 4 as const };
      case 'biblioteca':
        return { title: 'BIBLIOTECA', level: 4 as const };
      case 'pdf-editor':
        return { title: 'BIBLIOTECA · LECTOR', level: 4 as const };
      case 'aprendizaje':
        return { title: 'APRENDIZAJE ACTIVO', level: 4 as const };
      case 'journal':
        return { title: 'DIARIO', level: 4 as const };
      default:
        return { title: 'UMBRAL', level: 4 as const };
    }
  };

  const isMissionInProgress = mission?.status === 'in_progress';

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)] relative">
      {/* 1. Vista Home / Ritual de la Figura */}
      {activeView === 'inicio' ? (
        <DailyHome
          mode="home"
          onSelectLevel={(level) => {
            if (level === 1) setActiveView('contrato');
            else if (level === 2) setActiveView('examen');
            else if (level === 3) setActiveView('mision');
            else if (level === 4) handleStartMissionExecution();
            else if (level === 5) setActiveView('evidencia');
          }}
          onSelectToolDirect={(tool) => {
            setOpenPdfId(null);
            setActiveView(tool);
          }}
        />
      ) : activeView === 'contrato' ? (
        <FigureShell
          sectionTitle="OBJETIVO · CONTRATO"
          currentLevel={1}
          onGoHome={() => setActiveView('inicio')}
        >
          <ContractView
            objective={currentObjective}
            onBack={() => setActiveView('inicio')}
          />
        </FigureShell>
      ) : activeView === 'mision' ? (
        <FigureShell
          sectionTitle="MISIÓN DEL DÍA"
          currentLevel={3}
          onGoHome={() => setActiveView('inicio')}
        >
          <MissionView
            mission={mission}
            onStartMission={handleStartMissionExecution}
            onBack={() => setActiveView('inicio')}
          />
        </FigureShell>
      ) : activeView === 'evidencia' ? (
        <FigureShell
          sectionTitle="EVIDENCIA Y VEREDICTO"
          currentLevel={5}
          onGoHome={() => setActiveView('inicio')}
        >
          {mission && activeThreshold ? (
            <EvidenceView
              mission={mission}
              threshold={activeThreshold}
              docExcerpt={data.pdfs[0]?.content || ''}
              onFinishCycle={() => {
                updateMissionStatus('completed');
                setActiveView('inicio');
                showToast('Ciclo completado. Registrado en tu progreso.');
              }}
              onSaveJournalNote={(text) => {
                sendJournalToCanvas('Reflexión de misión', text);
                showToast('Reflexión guardada.');
              }}
            />
          ) : (
            <div className="p-8 text-center text-xs font-mono text-[var(--fig-mute)]">
              No hay evidencia pendiente de evaluar.
            </div>
          )}
        </FigureShell>
      ) : isMissionInProgress ? (
        /* 2. Modo Ejecución: Barra mínima ExecutionBar + Herramienta a pantalla completa */
        <div className="w-full h-screen flex flex-col overflow-hidden bg-[var(--bg-app)]">
          <ExecutionBar
            threshold={activeThreshold}
            mission={mission}
            onFinish={handleFinishMissionExecution}
          />
          <div className="flex-1 w-full min-h-0 overflow-hidden">
            {renderViewContent()}
          </div>
        </div>
      ) : (
        /* 3. Vistas Interiores Libres envueltas en FigureShell */
        <FigureShell
          sectionTitle={getSectionMeta().title}
          currentLevel={getSectionMeta().level}
          onGoHome={() => {
            setOpenPdfId(null);
            setActiveView('inicio');
          }}
        >
          {renderViewContent()}
        </FigureShell>
      )}

      {/* Notificación Toast Unificada */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#1F2328] text-white px-4 py-2.5 rounded-xl text-xs flex items-center gap-3 shadow-xl border border-[#32363C] animate-in slide-in-from-bottom">
          <span className="text-xs">{toastMessage.text}</span>
          {toastMessage.action && (
            <button
              onClick={() => {
                toastMessage.action?.onClick();
                clearToast();
              }}
              className="px-2.5 py-1 rounded-lg bg-white text-[#1F2328] hover:bg-[#F4F3EF] font-semibold text-[11px] transition-colors"
            >
              {toastMessage.action.label}
            </button>
          )}
          <button onClick={clearToast} className="text-[#9B9A97] hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Input Oculto de Importación de Archivos */}
      <input
        ref={fileInputRef}
        id="umbral-file-input"
        type="file"
        accept=".pdf,.docx,.doc,.pptx,.ppt"
        onChange={handleFileSelected}
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          border: 0,
        }}
      />

      {/* Modales Desacoplados */}
      <ConfirmModal modal={confirmModal} onClose={() => setConfirmModal(null)} />

      <ImportPickerModal
        picker={importPicker}
        folders={data.folders}
        onClose={() => setImportPicker(null)}
        onSelectAndChooseFile={(folderId) => {
          pendingImportFolderIdRef.current = folderId;
          setImportPicker(null);
          fileInputRef.current?.click();
        }}
      />

      <NoteFromHighlightModal
        noteData={noteFromHighlight}
        folders={data.folders}
        onClose={() => setNoteFromHighlight(null)}
        onConfirm={handleConfirmNoteFromHighlight}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={(newSettings) => {
          updateSettings(newSettings);
        }}
      />
    </div>
  );
}
