import React from 'react';
import {
  Edit2,
  Trash2,
  FileText,
  X,
  Plus,
  Search,
} from 'lucide-react';
import { CanvasNode, CanvasEdge, Note } from '../../types';
import { NODE_COLORS } from './canvasTypes';

interface NodeEditModalProps {
  editingNode: CanvasNode | null;
  onClose: () => void;
  onDeleteNode: (id: string) => void;
  onUpdateNodeData: (updated: CanvasNode) => void;
  onOpenDoc?: (docId: string) => void;
}

export const NodeEditModal: React.FC<NodeEditModalProps> = ({
  editingNode,
  onClose,
  onDeleteNode,
  onUpdateNodeData,
  onOpenDoc,
}) => {
  if (!editingNode) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#121214] rounded-[8px] max-w-md w-full p-5 space-y-4 text-[#18181B] dark:text-[#F4F4F5] border border-[#E7E2D3] dark:border-[#27272A]"
        style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.18)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#E9E8E4] dark:border-[#222225] pb-2">
          <h3 className="text-sm font-semibold text-[#18181B] dark:text-[#F4F4F5] flex items-center gap-1.5">
            <Edit2 size={14} /> Editar Tarjeta
          </h3>
          <button
            onClick={() => onDeleteNode(editingNode.id)}
            className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors"
            title="Eliminar nodo"
          >
            <Trash2 size={13} /> Eliminar
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-[#787774] dark:text-[#A1A1AA] mb-1">
              Título del Concepto o Nota
            </label>
            <input
              type="text"
              value={editingNode.title}
              onChange={(e) => {
                onUpdateNodeData({ ...editingNode, title: e.target.value });
              }}
              className="w-full text-xs px-3 py-2 rounded-[6px] bg-[#FBFBFB] dark:bg-[#18181B] border border-[#E9E8E4] dark:border-[#27272A] text-[#18181B] dark:text-[#F4F4F5] outline-none focus:border-[#3B6D11] dark:focus:border-[#86EFAC] font-normal transition-colors"
              placeholder="Ej: Mitocondria, Principio de Pareto..."
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#787774] dark:text-[#A1A1AA] mb-1">
              Contenido / Definición / Cita
            </label>
            <textarea
              rows={4}
              value={editingNode.content}
              onChange={(e) => {
                onUpdateNodeData({ ...editingNode, content: e.target.value });
              }}
              className="w-full text-xs px-3 py-2 rounded-[6px] bg-[#FBFBFB] dark:bg-[#18181B] border border-[#E9E8E4] dark:border-[#27272A] text-[#18181B] dark:text-[#F4F4F5] outline-none focus:border-[#3B6D11] dark:focus:border-[#86EFAC] leading-relaxed resize-none font-normal transition-colors"
              placeholder="Explica el concepto o añade anotaciones clave..."
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#787774] dark:text-[#A1A1AA] mb-1">
              Color de la tarjeta
            </label>
            <div className="flex gap-2">
              {NODE_COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    onUpdateNodeData({ ...editingNode, color: c.id });
                  }}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    editingNode.color === c.id
                      ? 'border-[#18181B] dark:border-[#F4F4F5] scale-110'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c.header }}
                  title={c.id}
                />
              ))}
            </div>
          </div>

          {editingNode.sourceDocId && (
            <div className="p-2.5 rounded-[6px] bg-[#FBFBFB] dark:bg-[#18181B] border border-[#E9E8E4] dark:border-[#27272A] text-xs text-[#5A5A58] dark:text-[#A1A1AA] flex items-center justify-between">
              <div className="flex items-center gap-1.5 truncate">
                <FileText size={13} className="text-[#787774] dark:text-[#A1A1AA] shrink-0" />
                <span className="truncate font-normal">
                  Documento:{' '}
                  <strong className="text-[#18181B] dark:text-[#F4F4F5] font-medium">
                    {editingNode.sourceDocTitle}
                  </strong>
                </span>
              </div>
              {onOpenDoc && (
                <button
                  onClick={() => {
                    if (editingNode.sourceDocId) {
                      onOpenDoc(editingNode.sourceDocId);
                    }
                  }}
                  className="px-2 py-1 bg-[#EAEAEA] dark:bg-[#27272A] hover:bg-[#DFDFDF] dark:hover:bg-[#3F3F46] text-[#18181B] dark:text-[#F4F4F5] rounded-[5px] font-medium text-[10px] shrink-0 transition-colors"
                >
                  Abrir
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#E9E8E4] dark:border-[#222225]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-[6px] bg-[#1F2A17] dark:bg-[#2B3B20] hover:bg-[#2B3B20] dark:hover:bg-[#364929] text-white text-xs font-medium transition-colors border border-[#3B6D11]/30 dark:border-[#3B6D11]/50"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};

interface EdgeEditModalProps {
  editingEdge: CanvasEdge | null;
  edgeLabelDraft: string;
  edgeStyleDraft: 'solid' | 'dashed';
  onClose: () => void;
  onSetLabel: (label: string) => void;
  onSetStyle: (style: 'solid' | 'dashed') => void;
  onSave: () => void;
  onDeleteEdge: (id: string) => void;
}

export const EdgeEditModal: React.FC<EdgeEditModalProps> = ({
  editingEdge,
  edgeLabelDraft,
  edgeStyleDraft,
  onClose,
  onSetLabel,
  onSetStyle,
  onSave,
  onDeleteEdge,
}) => {
  if (!editingEdge) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#121214] rounded-[8px] max-w-sm w-full p-5 space-y-4 text-[#18181B] dark:text-[#F4F4F5] border border-[#E7E2D3] dark:border-[#27272A]"
        style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.18)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#E9E8E4] dark:border-[#222225] pb-2">
          <h3 className="text-sm font-semibold text-[#18181B] dark:text-[#F4F4F5] flex items-center gap-1.5">
            Editar Relación
          </h3>
          <button
            onClick={() => onDeleteEdge(editingEdge.id)}
            className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors"
          >
            <Trash2 size={13} /> Desconectar
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-[#787774] dark:text-[#A1A1AA] mb-1">
              Etiqueta de Enlace (ej: "causa", "contiene", "produce")
            </label>
            <input
              type="text"
              value={edgeLabelDraft}
              onChange={(e) => onSetLabel(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-[6px] bg-[#FBFBFB] dark:bg-[#18181B] border border-[#E9E8E4] dark:border-[#27272A] text-[#18181B] dark:text-[#F4F4F5] outline-none focus:border-[#3B6D11] dark:focus:border-[#86EFAC] transition-colors"
              placeholder="Escribe la relación..."
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#787774] dark:text-[#A1A1AA] mb-1">
              Estilo de línea
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => onSetStyle('solid')}
                className={`flex-1 py-1.5 px-3 rounded-[6px] text-xs font-medium border transition-colors ${
                  edgeStyleDraft === 'solid'
                    ? 'border-[#1F2A17] dark:border-[#86EFAC] bg-[#1F2A17] dark:bg-[#2B3B20] text-white'
                    : 'border-[#E9E8E4] dark:border-[#27272A] bg-white dark:bg-[#18181B] text-[#5A5A58] dark:text-[#A1A1AA] hover:bg-[#F4F3EF] dark:hover:bg-[#1C1C1F]'
                }`}
              >
                Sólida (Jerárquica)
              </button>
              <button
                onClick={() => onSetStyle('dashed')}
                className={`flex-1 py-1.5 px-3 rounded-[6px] text-xs font-medium border transition-colors ${
                  edgeStyleDraft === 'dashed'
                    ? 'border-[#1F2A17] dark:border-[#86EFAC] bg-[#1F2A17] dark:bg-[#2B3B20] text-white'
                    : 'border-[#E9E8E4] dark:border-[#27272A] bg-white dark:bg-[#18181B] text-[#5A5A58] dark:text-[#A1A1AA] hover:bg-[#F4F3EF] dark:hover:bg-[#1C1C1F]'
                }`}
              >
                Discontinua (Asociativa)
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#E9E8E4] dark:border-[#222225]">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-[6px] border border-[#E9E8E4] dark:border-[#27272A] hover:bg-[#F4F3EF] dark:hover:bg-[#1C1C1F] text-xs font-medium text-[#5A5A58] dark:text-[#A1A1AA] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            className="px-4 py-1.5 rounded-[6px] bg-[#1F2A17] dark:bg-[#2B3B20] hover:bg-[#2B3B20] dark:hover:bg-[#364929] text-white text-xs font-medium transition-colors border border-[#3B6D11]/30 dark:border-[#3B6D11]/50"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

interface InsertNoteModalProps {
  isOpen: boolean;
  notes: Note[];
  onClose: () => void;
  onInsertNote: (note: Note) => void;
}

export const InsertNoteModal: React.FC<InsertNoteModalProps> = ({
  isOpen,
  notes,
  onClose,
  onInsertNote,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');

  if (!isOpen) return null;

  const filteredNotes = notes.filter((n) =>
    (n.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (n.content || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#121214] rounded-[8px] max-w-md w-full p-5 space-y-3 text-[#18181B] dark:text-[#F4F4F5] border border-[#E7E2D3] dark:border-[#27272A]"
        style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.18)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#E9E8E4] dark:border-[#222225] pb-2">
          <h3 className="text-sm font-semibold text-[#18181B] dark:text-[#F4F4F5] flex items-center gap-1.5">
            Insertar Nota en Canvas
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-[#F4F3EF] dark:hover:bg-[#1C1C1F] rounded text-[#787774] dark:text-[#A1A1AA] transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9A97] dark:text-[#71717A]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar en tus notas..."
            className="w-full text-xs pl-8 pr-3 py-2 rounded-[6px] bg-[#FBFBFB] dark:bg-[#18181B] border border-[#E9E8E4] dark:border-[#27272A] text-[#18181B] dark:text-[#F4F4F5] outline-none focus:border-[#3B6D11] dark:focus:border-[#86EFAC] placeholder-[#A1A1AA] transition-colors"
            autoFocus
          />
        </div>

        <div className="max-h-60 overflow-y-auto divide-y divide-[#E9E8E4] dark:divide-[#222225]">
          {filteredNotes.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#9B9A97] dark:text-[#71717A]">
              No se encontraron notas para insertar.
            </div>
          ) : (
            filteredNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => onInsertNote(note)}
                className="w-full text-left py-2.5 px-2 hover:bg-[#F4F3EF] dark:hover:bg-[#1C1C1F] rounded transition-colors flex flex-col gap-0.5"
              >
                <span className="text-xs font-medium text-[#18181B] dark:text-[#F4F4F5] truncate">{note.title || 'Sin título'}</span>
                <span className="text-[11px] text-[#787774] dark:text-[#A1A1AA] line-clamp-1">
                  {note.content || 'Nota vacía'}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
