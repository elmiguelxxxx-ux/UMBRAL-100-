import React from 'react';
import { AlertTriangle, Upload, StickyNote } from 'lucide-react';
import { Folder } from '../types';

interface ConfirmModalProps {
  modal: { title?: string; message: string; onConfirm: () => void } | null;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ modal, onClose }) => {
  if (!modal) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-xs p-5 space-y-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-2.5">
          <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-[#1F2328] leading-relaxed">{modal.message}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl text-xs font-medium bg-[#F4F3EF] hover:bg-[#EAE8E3] text-[#5A5A58]"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              modal.onConfirm();
              onClose();
            }}
            className="flex-1 py-2 rounded-xl text-xs font-semibold bg-red-500 hover:bg-red-600 text-white"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

interface ImportPickerModalProps {
  picker: { folderId: string } | null;
  folders: Folder[];
  onClose: () => void;
  onSelectAndChooseFile: (folderId: string) => void;
}

export const ImportPickerModal: React.FC<ImportPickerModalProps> = ({
  picker,
  folders,
  onClose,
  onSelectAndChooseFile,
}) => {
  const [selectedFolderId, setSelectedFolderId] = React.useState(picker?.folderId || 'root');

  React.useEffect(() => {
    if (picker) setSelectedFolderId(picker.folderId);
  }, [picker]);

  if (!picker) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-3 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-bold text-[#1F2328] flex items-center gap-1.5">
          <Upload size={15} /> Importar documento
        </h3>
        <p className="text-xs text-[#9B9A97]">
          Soporta PDF, Word (.docx) y presentaciones PowerPoint (.pptx con extracción real).
        </p>
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-[#787774] uppercase tracking-wide">
            Carpeta destino
          </label>
          <select
            value={selectedFolderId}
            onChange={(e) => setSelectedFolderId(e.target.value)}
            className="w-full text-xs p-2 rounded-lg border border-[#E9E8E4] outline-none bg-white"
          >
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                📁 {f.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-[7px] text-xs font-normal bg-[#F4F3EF] hover:bg-[#EAE8E3] text-[#5A5A58] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onSelectAndChooseFile(selectedFolderId);
            }}
            className="flex-1 py-2 rounded-[7px] text-xs font-medium bg-[#EAEAEA] hover:bg-[#DFDFDF] text-[#1F2328] text-center cursor-pointer select-none transition-colors"
          >
            Elegir archivo
          </button>
        </div>
      </div>
    </div>
  );
};

interface NoteFromHighlightModalProps {
  noteData: { text: string; folderId: string } | null;
  folders: Folder[];
  onClose: () => void;
  onConfirm: (text: string, folderId: string) => void;
}

export const NoteFromHighlightModal: React.FC<NoteFromHighlightModalProps> = ({
  noteData,
  folders,
  onClose,
  onConfirm,
}) => {
  const [targetFolderId, setTargetFolderId] = React.useState(noteData?.folderId || 'root');

  React.useEffect(() => {
    if (noteData) setTargetFolderId(noteData.folderId);
  }, [noteData]);

  if (!noteData) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[8px] w-full max-w-sm p-5 space-y-3"
        style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-[#1F2328] flex items-center gap-1.5">
          <StickyNote size={15} /> Crear nota desde fragmento
        </h3>
        <p className="text-xs text-[#5A5A58] italic bg-[#FBFBFB] rounded-[6px] p-2.5 leading-snug font-normal">
          "{noteData.text}"
        </p>
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-[#787774] uppercase tracking-wide">
            Guardar en
          </label>
          <select
            value={targetFolderId}
            onChange={(e) => setTargetFolderId(e.target.value)}
            className="w-full text-xs p-2 rounded-[6px] border border-[#E9E8E4] outline-none bg-white font-normal"
          >
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                📁 {f.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-[7px] text-xs font-normal bg-[#F4F3EF] hover:bg-[#EAE8E3] text-[#5A5A58] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(noteData.text, targetFolderId)}
            className="flex-1 py-2 rounded-[7px] text-xs font-medium bg-[#EAEAEA] hover:bg-[#DFDFDF] text-[#1F2328] transition-colors"
          >
            Crear nota
          </button>
        </div>
      </div>
    </div>
  );
};
