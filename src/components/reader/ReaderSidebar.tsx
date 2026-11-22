import React, { useState } from 'react';
import { Highlighter, StickyNote, HelpCircle, Layers, Trash2, Plus } from 'lucide-react';
import { Highlight, Note } from '../../types';
import { interrogateConcept } from '../../lib/aiClient';

interface ReaderSidebarProps {
  activeTab: 'anotaciones' | 'notas' | 'interrogador';
  highlights: Highlight[];
  docNotes: Note[];
  docContent?: string;
  folderId: string;
  onSelectTab: (tab: 'anotaciones' | 'notas' | 'interrogador') => void;
  onSendHighlightToCanvas: (text: string, color?: string) => void;
  onRequestNoteFromHighlight: (text: string, folderId: string) => void;
  onDeleteHighlight: (id: string) => void;
  onAddNoteForDoc: () => void;
  onUpdateNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  onSendNoteToCanvas: (note: Note) => void;
}

export const ReaderSidebar: React.FC<ReaderSidebarProps> = ({
  activeTab,
  highlights,
  docNotes,
  docContent = '',
  folderId,
  onSelectTab,
  onSendHighlightToCanvas,
  onRequestNoteFromHighlight,
  onDeleteHighlight,
  onAddNoteForDoc,
  onUpdateNote,
  onDeleteNote,
  onSendNoteToCanvas,
}) => {
  const [userExplanation, setUserExplanation] = useState('');
  const [isInterrogating, setIsInterrogating] = useState(false);
  const [interrogationQuestions, setInterrogationQuestions] = useState<string[] | null>(null);

  const handleInterrogate = async () => {
    if (userExplanation.trim().length < 80) return;
    setIsInterrogating(true);
    try {
      const questions = await interrogateConcept(userExplanation.trim(), docContent);
      setInterrogationQuestions(questions);
    } catch {
      setInterrogationQuestions([
        '¿Cómo justificarías tu planteamiento sin apoyarte en la memoria inmediata?',
        '¿Qué aspecto del texto contradice o matiza tu explicación?',
      ]);
    } finally {
      setIsInterrogating(false);
    }
  };

  return (
    <div className="w-80 shrink-0 border-l border-[var(--border-color)] bg-[var(--bg-card)] flex flex-col h-full text-[var(--text-primary)]">
      {/* Pestañas superiores */}
      <div className="flex border-b border-[var(--border-color)] shrink-0 bg-[var(--bg-app)]">
        <button
          onClick={() => onSelectTab('anotaciones')}
          className={`flex-1 text-xs font-mono py-3 flex items-center justify-center gap-1 transition-colors cursor-pointer ${
            activeTab === 'anotaciones'
              ? 'text-[var(--text-primary)] border-b-2 border-[var(--text-primary)] font-bold'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Highlighter size={12} /> Subr. ({highlights.length})
        </button>
        <button
          onClick={() => onSelectTab('notas')}
          className={`flex-1 text-xs font-mono py-3 flex items-center justify-center gap-1 transition-colors cursor-pointer ${
            activeTab === 'notas'
              ? 'text-[var(--text-primary)] border-b-2 border-[var(--text-primary)] font-bold'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <StickyNote size={12} /> Apuntes ({docNotes.length})
        </button>
        <button
          onClick={() => onSelectTab('interrogador')}
          className={`flex-1 text-xs font-mono py-3 flex items-center justify-center gap-1 transition-colors cursor-pointer ${
            activeTab === 'interrogador'
              ? 'text-[var(--text-primary)] border-b-2 border-[var(--text-primary)] font-bold'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <HelpCircle size={12} /> Indagar
        </button>
      </div>

      {/* Subrayados */}
      {activeTab === 'anotaciones' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {highlights.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-secondary)] space-y-2">
              <Highlighter size={22} className="mx-auto opacity-40" />
              <p className="text-xs font-mono">Sin subrayados todavía</p>
              <p className="text-[11px] leading-relaxed">
                Selecciona texto en el documento para extraer fragmentos.
              </p>
            </div>
          ) : (
            highlights.map((h) => (
              <div
                key={h.id}
                className="p-3 border border-[var(--border-color)] bg-[var(--bg-app)] space-y-2 transition-colors"
                style={{ borderLeftWidth: '3px', borderLeftColor: h.color }}
              >
                <p className="text-xs leading-relaxed italic text-[var(--text-primary)]">
                  "{h.text}"
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-[var(--border-color)] text-[10px] font-mono text-[var(--text-secondary)]">
                  <span>Pág. {h.pageNumber}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSendHighlightToCanvas(h.text, h.color)}
                      className="hover:text-[var(--text-primary)] flex items-center gap-1 cursor-pointer"
                      title="Enviar fragmento al Canvas"
                    >
                      <Layers size={11} />
                      <span>Canvas</span>
                    </button>
                    <button
                      onClick={() => onRequestNoteFromHighlight(h.text, folderId)}
                      className="hover:text-[var(--text-primary)] flex items-center gap-1 cursor-pointer"
                      title="Convertir a Apunte"
                    >
                      <Plus size={11} />
                      <span>Nota</span>
                    </button>
                    <button
                      onClick={() => onDeleteHighlight(h.id)}
                      className="hover:text-red-500 cursor-pointer"
                      title="Eliminar subrayado"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Apuntes */}
      {activeTab === 'notas' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-[var(--border-color)]">
            <span className="font-ailerons text-[11px] tracking-wider uppercase text-[var(--text-secondary)]">
              Apuntes del Texto
            </span>
            <button
              onClick={onAddNoteForDoc}
              className="text-xs font-mono flex items-center gap-1 text-[var(--text-primary)] border border-[var(--border-color)] px-2 py-1 hover:border-[var(--text-primary)] cursor-pointer"
            >
              <Plus size={12} />
              <span>Nuevo</span>
            </button>
          </div>

          {docNotes.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-secondary)] space-y-2">
              <StickyNote size={22} className="mx-auto opacity-40" />
              <p className="text-xs font-mono">Sin notas registradas</p>
              <p className="text-[11px]">Sintetiza tus reflexiones mientras estudias.</p>
            </div>
          ) : (
            docNotes.map((note) => (
              <div
                key={note.id}
                className="p-3 border border-[var(--border-color)] bg-[var(--bg-app)] space-y-2"
              >
                <input
                  type="text"
                  value={note.title}
                  onChange={(e) => onUpdateNote({ ...note, title: e.target.value })}
                  placeholder="Título del apunte..."
                  className="w-full text-xs font-semibold bg-transparent border-b border-transparent focus:border-[var(--border-color)] outline-none text-[var(--text-primary)]"
                />
                <textarea
                  value={note.content}
                  onChange={(e) => onUpdateNote({ ...note, content: e.target.value })}
                  placeholder="Escribe tu síntesis personal..."
                  rows={3}
                  className="w-full text-xs bg-transparent border border-transparent focus:border-[var(--border-color)] p-1 outline-none text-[var(--text-secondary)] resize-none"
                />
                <div className="flex justify-end gap-2 pt-1 border-t border-[var(--border-color)] text-[10px] font-mono">
                  <button
                    onClick={() => onSendNoteToCanvas(note)}
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 cursor-pointer"
                  >
                    <Layers size={11} /> Canvas
                  </button>
                  <button
                    onClick={() => onDeleteNote(note.id)}
                    className="text-[var(--text-secondary)] hover:text-red-500 cursor-pointer"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pestaña: Interrogador Socrático */}
      {activeTab === 'interrogador' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-1">
            <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-[var(--fig-mute)] block">
              Interrogador Socrático
            </span>
            <p className="text-xs text-[var(--text-secondary)]">
              Redacta primero tu propia explicación (mín. 80 caracteres). La IA formulará preguntas que expongan vacíos, sin darte la respuesta.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase text-[var(--fig-mute)] block">
              Mi explicación:
            </label>
            <textarea
              value={userExplanation}
              onChange={(e) => setUserExplanation(e.target.value)}
              placeholder="Explica con tus palabras lo que has comprendido de esta sección..."
              rows={5}
              className="w-full text-xs p-2.5 bg-[var(--bg-app)] border border-[var(--border-color)] text-[var(--text-primary)] outline-none focus:border-[var(--fig-ink)] resize-none"
            />
            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className={userExplanation.length < 80 ? 'text-[var(--fig-mute)]' : 'text-[var(--fig-accent)]'}>
                {userExplanation.length} / 80 caracteres
              </span>
              <button
                type="button"
                onClick={handleInterrogate}
                disabled={userExplanation.trim().length < 80 || isInterrogating}
                className="px-3 py-1 border border-[var(--fig-ink)] text-xs font-mono uppercase tracking-wider text-[var(--fig-ink)] hover:bg-[var(--fig-ink)] hover:text-[var(--bg-app)] disabled:opacity-40 transition-colors cursor-pointer"
              >
                {isInterrogating ? 'Cuestionando...' : 'Interrogarme'}
              </button>
            </div>
          </div>

          {interrogationQuestions && (
            <div className="p-3 border border-[var(--fig-line)] bg-[var(--bg-app)] space-y-2 animate-in fade-in">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--fig-mute)] block">
                Preguntas para poner a prueba tu comprensión:
              </span>
              <ul className="space-y-2 text-xs text-[var(--fig-ink)] list-disc list-inside">
                {interrogationQuestions.map((q, idx) => (
                  <li key={idx} className="leading-relaxed italic">
                    "{q}"
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
