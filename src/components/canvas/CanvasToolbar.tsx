import React from 'react';
import {
  Plus,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  StickyNote,
  Columns,
  FolderOpen,
  ChevronDown,
  CornerDownRight,
  ArrowLeft,
  LayoutGrid,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import { Whiteboard, OrganizerMode } from '../../types';
import { MODE_DESCRIPTIONS } from './canvasTypes';

interface CanvasToolbarProps {
  activeBoard: Whiteboard;
  parentBoard: Whiteboard | null;
  boards: Whiteboard[];
  zoom: number;
  currentMode: OrganizerMode;
  isBoardDropdownOpen: boolean;
  isMoreMenuOpen: boolean;
  isCreatingBoard: boolean;
  newBoardTitleDraft: string;
  onSetNewBoardTitleDraft: (val: string) => void;
  onSetIsCreatingBoard: (val: boolean) => void;
  onToggleBoardDropdown: () => void;
  onToggleMoreMenu: () => void;
  onSwitchBoard: (boardId: string) => void;
  onCreateNewBoard: (parentId?: string | null, title?: string) => void;
  onSelectBoardPendingDelete: (boardId: string) => void;
  onAddNestedWhiteboard: () => void;
  onAddNode: () => void;
  onAddSection: () => void;
  onOpenInsertNote: () => void;
  onOpenSplitView: () => void;
  onSwitchOrganizerMode: (mode: OrganizerMode) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  activeBoard,
  parentBoard,
  boards,
  zoom,
  currentMode,
  isBoardDropdownOpen,
  isMoreMenuOpen,
  isCreatingBoard,
  newBoardTitleDraft,
  onSetNewBoardTitleDraft,
  onSetIsCreatingBoard,
  onToggleBoardDropdown,
  onToggleMoreMenu,
  onSwitchBoard,
  onCreateNewBoard,
  onSelectBoardPendingDelete,
  onAddNestedWhiteboard,
  onAddNode,
  onAddSection,
  onOpenInsertNote,
  onOpenSplitView,
  onSwitchOrganizerMode,
  onZoomIn,
  onZoomOut,
  onResetView,
}) => {
  return (
    <>
      {/* Top Floating Bar */}
      <div className="absolute top-4 left-4 z-40 flex items-center gap-2">
        {/* Whiteboard Switcher Dropdown */}
        <div className="relative">
          <div className="flex items-center gap-1 bg-white border border-[#E9E8E4] rounded-[8px] px-2.5 py-1.5 shadow-sm text-xs">
            {parentBoard && (
              <button
                onClick={() => onSwitchBoard(parentBoard.id)}
                className="p-1 hover:bg-[#F4F3EF] rounded text-[#787774] hover:text-[#18181B] transition-colors flex items-center gap-1 mr-1"
                title={`Volver a ${parentBoard.title}`}
              >
                <ArrowLeft size={13} />
                <span className="hidden sm:inline text-[11px] font-normal text-[#9B9A97]">
                  {parentBoard.title}
                </span>
              </button>
            )}

            <button
              onClick={onToggleBoardDropdown}
              className="flex items-center gap-1.5 font-medium text-[#18181B] hover:text-[#787774] transition-colors"
            >
              <LayoutGrid size={13} className="text-[#787774]" />
              <span className="max-w-[140px] truncate">{activeBoard.title}</span>
              <ChevronDown size={12} className="text-[#9B9A97]" />
            </button>
          </div>

          {isBoardDropdownOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-64 bg-white border border-[#E9E8E4] rounded-[8px] shadow-lg z-50 p-2 text-xs space-y-2">
              <div className="text-[11px] font-medium text-[#787774] px-1.5 py-0.5 border-b border-[#E9E8E4]">
                Pizarras & Sub-pizarras
              </div>

              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {boards.map((b) => (
                  <div
                    key={b.id}
                    className={`flex items-center justify-between px-2 py-1.5 rounded-[6px] transition-colors ${
                      b.id === activeBoard.id
                        ? 'bg-[#18181B] text-white font-medium'
                        : 'hover:bg-[#F4F3EF] text-[#18181B]'
                    }`}
                  >
                    <button
                      onClick={() => onSwitchBoard(b.id)}
                      className="flex-1 text-left truncate flex items-center gap-1.5"
                    >
                      {b.parentId && (
                        <CornerDownRight
                          size={11}
                          className={b.id === activeBoard.id ? 'text-zinc-400' : 'text-[#9B9A97]'}
                        />
                      )}
                      <span className="truncate">{b.title}</span>
                    </button>

                    {boards.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectBoardPendingDelete(b.id);
                        }}
                        className={`p-1 rounded opacity-60 hover:opacity-100 ${
                          b.id === activeBoard.id
                            ? 'hover:bg-zinc-800 text-rose-300'
                            : 'hover:bg-rose-50 text-rose-600'
                        }`}
                        title="Eliminar pizarra"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-1.5 border-t border-[#E9E8E4]">
                {isCreatingBoard ? (
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={newBoardTitleDraft}
                      onChange={(e) => onSetNewBoardTitleDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') onCreateNewBoard(null);
                        if (e.key === 'Escape') onSetIsCreatingBoard(false);
                      }}
                      placeholder="Nombre de la pizarra..."
                      className="flex-1 text-xs px-2 py-1 bg-[#FBFBFB] border border-[#E9E8E4] rounded outline-none focus:border-[#18181B]"
                      autoFocus
                    />
                    <button
                      onClick={() => onCreateNewBoard(null)}
                      className="px-2 py-1 bg-[#18181B] text-white rounded font-medium text-xs hover:bg-[#27272A]"
                    >
                      Crear
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => onSetIsCreatingBoard(true)}
                    className="w-full flex items-center justify-center gap-1 py-1.5 px-2 text-xs font-medium text-[#18181B] hover:bg-[#F4F3EF] rounded-[6px] border border-dashed border-[#E9E8E4] transition-colors"
                  >
                    <Plus size={12} /> Nueva Pizarra
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Organizer Mode Pill Select */}
        <div className="flex items-center gap-1 bg-white border border-[#E9E8E4] rounded-[8px] p-1 shadow-sm text-xs">
          {(Object.keys(MODE_DESCRIPTIONS) as OrganizerMode[]).map((modeKey) => {
            const info = MODE_DESCRIPTIONS[modeKey];
            const isSelected = currentMode === modeKey;
            return (
              <button
                key={modeKey}
                onClick={() => onSwitchOrganizerMode(modeKey)}
                className={`px-2.5 py-1 rounded-[6px] text-xs font-medium transition-colors flex items-center gap-1 ${
                  isSelected
                    ? 'bg-[#1F2A17] text-white'
                    : 'text-[#5A5A58] hover:bg-[#F4F3EF] hover:text-[#18181B]'
                }`}
                title={info.desc}
              >
                <span>{info.icon}</span>
                <span className="hidden md:inline">{info.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Canvas Action Dock (Bottom Center) */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 bg-white border border-[#E7E2D3] p-1.5 rounded-[10px] shadow-md text-xs">
        <button
          onClick={onAddNode}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] bg-[#1F2A17] hover:bg-[#2B3B20] text-white font-medium transition-colors shadow-sm"
        >
          <Plus size={13} />
          <span>Tarjeta</span>
        </button>

        <button
          onClick={onAddSection}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[7px] hover:bg-[#F4F3EF] text-[#18181B] font-medium transition-colors"
          title="Crear sección o marco agrupador"
        >
          <Layers size={13} className="text-[#787774]" />
          <span className="hidden sm:inline">Sección</span>
        </button>

        <button
          onClick={onAddNestedWhiteboard}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[7px] hover:bg-[#F4F3EF] text-[#18181B] font-medium transition-colors"
          title="Crear una sub-pizarra anidada dentro de este lienzo"
        >
          <FolderOpen size={13} className="text-purple-600" />
          <span className="hidden sm:inline">Sub-pizarra</span>
        </button>

        <button
          onClick={onOpenInsertNote}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[7px] hover:bg-[#F4F3EF] text-[#18181B] font-medium transition-colors"
          title="Insertar nota existente"
        >
          <StickyNote size={13} className="text-[#787774]" />
          <span className="hidden sm:inline">Nota</span>
        </button>

        <div className="w-[1px] h-4 bg-[#E9E8E4] mx-1" />

        <button
          onClick={onOpenSplitView}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[7px] hover:bg-[#F4F3EF] text-[#18181B] font-medium transition-colors"
          title="Pantalla dividida con documentos y notas"
        >
          <Columns size={13} className="text-[#787774]" />
          <span className="hidden sm:inline">Dividir</span>
        </button>
      </div>

      {/* Floating Zoom & Controls (Bottom Right) */}
      <div className="absolute bottom-5 right-5 z-40 flex items-center gap-1 bg-white border border-[#E9E8E4] p-1 rounded-[8px] shadow-sm text-xs">
        <button
          onClick={onZoomOut}
          className="p-1.5 hover:bg-[#F4F3EF] rounded text-[#5A5A58] hover:text-[#18181B] transition-colors"
          title="Alejar"
        >
          <ZoomOut size={13} />
        </button>

        <span className="text-[11px] font-mono px-1.5 text-[#787774]">
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={onZoomIn}
          className="p-1.5 hover:bg-[#F4F3EF] rounded text-[#5A5A58] hover:text-[#18181B] transition-colors"
          title="Acercar"
        >
          <ZoomIn size={13} />
        </button>

        <div className="w-[1px] h-3 bg-[#E9E8E4] mx-0.5" />

        <button
          onClick={onResetView}
          className="p-1.5 hover:bg-[#F4F3EF] rounded text-[#5A5A58] hover:text-[#18181B] transition-colors"
          title="Centrar vista"
        >
          <RotateCcw size={12} />
        </button>
      </div>
    </>
  );
};
