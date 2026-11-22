import React, { useState, useRef } from 'react';
import { CanvasSection, CanvasNode } from '../types';
import { Trash2, Edit2, Check, Move } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface CanvasSectionItemProps {
  section: CanvasSection;
  zoom: number;
  onUpdateSection: (updated: CanvasSection) => void;
  onDeleteSection: (sectionId: string) => void;
  onMoveSectionAndNodes: (sectionId: string, deltaX: number, deltaY: number) => void;
}

const SECTION_COLORS: Record<
  string,
  {
    bg: string;
    border: string;
    text: string;
    header: string;
    darkBg: string;
    darkBorder: string;
    darkText: string;
    darkHeader: string;
  }
> = {
  slate: {
    bg: 'rgba(244, 244, 245, 0.65)',
    border: '#E4E4E7',
    text: '#18181B',
    header: '#F4F4F5',
    darkBg: 'rgba(24, 24, 27, 0.55)',
    darkBorder: '#3F3F46',
    darkText: '#F4F4F5',
    darkHeader: 'rgba(39, 39, 42, 0.85)',
  },
  blue: {
    bg: 'rgba(239, 246, 255, 0.65)',
    border: '#BFDBFE',
    text: '#1E40AF',
    header: '#DBEAFE',
    darkBg: 'rgba(15, 26, 46, 0.55)',
    darkBorder: '#2563EB',
    darkText: '#93C5FD',
    darkHeader: 'rgba(30, 58, 138, 0.7)',
  },
  emerald: {
    bg: 'rgba(236, 253, 245, 0.65)',
    border: '#A7F3D0',
    text: '#065F46',
    header: '#D1FAE5',
    darkBg: 'rgba(9, 33, 19, 0.55)',
    darkBorder: '#059669',
    darkText: '#86EFAC',
    darkHeader: 'rgba(6, 78, 59, 0.7)',
  },
  amber: {
    bg: 'rgba(254, 243, 199, 0.65)',
    border: '#FDE68A',
    text: '#92400E',
    header: '#FEF3C7',
    darkBg: 'rgba(35, 24, 6, 0.55)',
    darkBorder: '#D97706',
    darkText: '#FDE047',
    darkHeader: 'rgba(120, 53, 15, 0.7)',
  },
  purple: {
    bg: 'rgba(250, 245, 255, 0.65)',
    border: '#E9D5FF',
    text: '#6B21A8',
    header: '#F3E8FF',
    darkBg: 'rgba(26, 16, 42, 0.55)',
    darkBorder: '#9333EA',
    darkText: '#D8B4FE',
    darkHeader: 'rgba(88, 28, 135, 0.7)',
  },
  rose: {
    bg: 'rgba(255, 241, 242, 0.65)',
    border: '#FECDD3',
    text: '#9F1239',
    header: '#FFE4E6',
    darkBg: 'rgba(36, 12, 16, 0.55)',
    darkBorder: '#E11D48',
    darkText: '#FDA4AF',
    darkHeader: 'rgba(136, 19, 55, 0.7)',
  },
};

export const CanvasSectionItem: React.FC<CanvasSectionItemProps> = ({
  section,
  zoom,
  onUpdateSection,
  onDeleteSection,
  onMoveSectionAndNodes,
}) => {
  const { theme } = useSettings();
  const isDark = theme === 'dark';
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(section.title);

  // Dragging section state
  const isDraggingRef = useRef(false);
  const startDragPosRef = useRef({ x: 0, y: 0 });

  // Resizing state
  const isResizingRef = useRef(false);
  const startResizeRef = useRef({ mouseX: 0, mouseY: 0, width: 0, height: 0 });

  const rawMeta = SECTION_COLORS[section.color || 'slate'] || SECTION_COLORS.slate;
  const colorMeta = {
    bg: isDark ? rawMeta.darkBg : rawMeta.bg,
    border: isDark ? rawMeta.darkBorder : rawMeta.border,
    text: isDark ? rawMeta.darkText : rawMeta.text,
    header: isDark ? rawMeta.darkHeader : rawMeta.header,
  };

  // Header Drag Start
  const handleStartHeaderDrag = (e: React.MouseEvent) => {
    e.stopPropagation();
    isDraggingRef.current = true;
    startDragPosRef.current = { x: e.clientX, y: e.clientY };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaScreenX = moveEvent.clientX - startDragPosRef.current.x;
      const deltaScreenY = moveEvent.clientY - startDragPosRef.current.y;
      const deltaCanvasX = Math.round(deltaScreenX / zoom);
      const deltaCanvasY = Math.round(deltaScreenY / zoom);

      if (deltaCanvasX !== 0 || deltaCanvasY !== 0) {
        onMoveSectionAndNodes(section.id, deltaCanvasX, deltaCanvasY);
        startDragPosRef.current = { x: moveEvent.clientX, y: moveEvent.clientY };
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Resize Handle Start
  const handleStartResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    isResizingRef.current = true;
    startResizeRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      width: section.width,
      height: section.height,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingRef.current) return;
      const deltaX = (moveEvent.clientX - startResizeRef.current.mouseX) / zoom;
      const deltaY = (moveEvent.clientY - startResizeRef.current.mouseY) / zoom;

      const newWidth = Math.max(260, Math.round(startResizeRef.current.width + deltaX));
      const newHeight = Math.max(160, Math.round(startResizeRef.current.height + deltaY));

      onUpdateSection({
        ...section,
        width: newWidth,
        height: newHeight,
      });
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleSaveTitle = () => {
    onUpdateSection({ ...section, title: titleDraft.trim() || 'Sección' });
    setIsEditingTitle(false);
  };

  return (
    <div
      className="canvas-section absolute rounded-[12px] group select-none pointer-events-auto transition-colors"
      style={{
        left: `${section.x}px`,
        top: `${section.y}px`,
        width: `${section.width}px`,
        height: `${section.height}px`,
        backgroundColor: colorMeta.bg,
        border: `1.5px dashed ${colorMeta.border}`,
        zIndex: 0,
      }}
    >
      {/* Header bar */}
      <div
        onMouseDown={handleStartHeaderDrag}
        className="px-3 py-2 flex items-center justify-between cursor-move rounded-t-[10px] transition-colors border-b border-transparent group-hover:border-black/5 dark:group-hover:border-white/10"
        style={{ backgroundColor: colorMeta.header }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Move size={12} className="text-[#71717A] dark:text-[#A1A1AA] shrink-0 opacity-60 group-hover:opacity-100" />
          {isEditingTitle ? (
            <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') setIsEditingTitle(false);
                }}
                className="text-xs font-semibold px-1.5 py-0.5 rounded bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#3F3F46] outline-none text-[#18181B] dark:text-[#F4F4F5] w-full max-w-[200px]"
                autoFocus
              />
              <button
                onClick={handleSaveTitle}
                className="p-1 rounded bg-white dark:bg-[#27272A] text-[#18181B] dark:text-[#F4F4F5] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]"
              >
                <Check size={12} />
              </button>
            </div>
          ) : (
            <span
              onDoubleClick={() => setIsEditingTitle(true)}
              className="text-xs font-semibold truncate tracking-tight flex-1"
              style={{ color: colorMeta.text }}
            >
              {section.title}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
          {/* Color pill switcher */}
          <div className="flex items-center gap-1 bg-white/80 dark:bg-black/70 px-1 py-0.5 rounded-[4px] shadow-2xs border border-black/5 dark:border-white/10">
            {(['slate', 'blue', 'emerald', 'amber', 'rose'] as const).map((c) => (
              <button
                key={c}
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateSection({ ...section, color: c });
                }}
                className={`w-2.5 h-2.5 rounded-full border border-black/10 dark:border-white/20 transition-transform ${
                  section.color === c ? 'scale-125 ring-1 ring-[#18181B] dark:ring-[#F4F4F5]' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: isDark ? SECTION_COLORS[c].darkBorder : SECTION_COLORS[c].border }}
                title={`Color ${c}`}
              />
            ))}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingTitle(true);
            }}
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5]"
            title="Renombrar sección"
          >
            <Edit2 size={11} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteSection(section.id);
            }}
            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/40 text-[#71717A] dark:text-[#A1A1AA] hover:text-red-600 dark:hover:text-red-400"
            title="Eliminar sección"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {/* Resize Handle at Bottom-Right */}
      <div
        onMouseDown={handleStartResize}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize flex items-center justify-center opacity-0 group-hover:opacity-80 transition-opacity"
        title="Arrastra para cambiar el tamaño de la sección"
      >
        <div className="w-1.5 h-1.5 border-r-2 border-b-2 border-[#71717A]" />
      </div>
    </div>
  );
};
