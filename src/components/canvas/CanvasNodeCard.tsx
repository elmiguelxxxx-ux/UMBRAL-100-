import React from 'react';
import {
  Edit2,
  Link as LinkIcon,
  FolderOpen,
  FileText,
  StickyNote,
  ExternalLink,
} from 'lucide-react';
import { CanvasNode } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { getNodeColor } from './canvasTypes';

interface CanvasNodeCardProps {
  node: CanvasNode;
  connectingFromId: string | null;
  onStartDrag: (e: React.MouseEvent<HTMLDivElement>, node: CanvasNode) => void;
  onStartConnect: (nodeId: string, e: React.MouseEvent) => void;
  onCompleteConnection: (fromId: string, toId: string) => void;
  onEditNode: (node: CanvasNode) => void;
  onSwitchBoard: (boardId: string) => void;
  onOpenDoc?: (docId: string) => void;
}

export const CanvasNodeCard: React.FC<CanvasNodeCardProps> = ({
  node,
  connectingFromId,
  onStartDrag,
  onStartConnect,
  onCompleteConnection,
  onEditNode,
  onSwitchBoard,
  onOpenDoc,
}) => {
  const { theme } = useSettings();
  const isDark = theme === 'dark';
  const colorStyle = getNodeColor(node.color, isDark);

  const isSourceConnecting = connectingFromId === node.id;
  const isTargetCandidate = connectingFromId && connectingFromId !== node.id;
  const isWhiteboardCard = node.type === 'whiteboard';

  const handleHandleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (connectingFromId && connectingFromId !== node.id) {
      onCompleteConnection(connectingFromId, node.id);
    } else {
      onStartConnect(node.id, e);
    }
  };

  return (
    <div
      onMouseDown={(e) => onStartDrag(e, node)}
      onDoubleClick={() => {
        if (isWhiteboardCard && node.targetBoardId) {
          onSwitchBoard(node.targetBoardId);
        } else {
          onEditNode(node);
        }
      }}
      className={`canvas-node group absolute w-[220px] rounded-[8px] select-none cursor-move transition-shadow ${
        isSourceConnecting
          ? 'ring-2 ring-[#18181B] dark:ring-[#F4F4F5] shadow-md'
          : isTargetCandidate
          ? 'hover:ring-2 hover:ring-[#18181B] dark:hover:ring-[#F4F4F5] hover:shadow-md cursor-pointer'
          : ''
      }`}
      style={{
        left: `${node.x}px`,
        top: `${node.y}px`,
        backgroundColor: colorStyle.bg,
        border: `1px solid ${colorStyle.border}`,
        boxShadow: isDark
          ? '0 8px 24px rgba(0, 0, 0, 0.65), 0 2px 6px rgba(0, 0, 0, 0.45)'
          : '0 4px 14px rgba(31, 42, 23, 0.06), 0 1px 3px rgba(31, 42, 23, 0.04)',
      }}
    >
      {/* Connection Handles (Top, Right, Bottom, Left) */}
      <div
        onClick={handleHandleClick}
        className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white dark:bg-[#27272A] border border-[#9B9A97] dark:border-[#52525B] hover:border-[#3B6D11] dark:hover:border-[#86EFAC] hover:bg-[#1F2A17] dark:hover:bg-[#86EFAC] cursor-crosshair z-30 transition-all ${
          isTargetCandidate || isSourceConnecting
            ? 'opacity-100 scale-110'
            : 'opacity-0 group-hover:opacity-100'
        }`}
      />
      <div
        onClick={handleHandleClick}
        className={`absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 rounded-full bg-white dark:bg-[#27272A] border border-[#9B9A97] dark:border-[#52525B] hover:border-[#3B6D11] dark:hover:border-[#86EFAC] hover:bg-[#1F2A17] dark:hover:bg-[#86EFAC] cursor-crosshair z-30 transition-all ${
          isTargetCandidate || isSourceConnecting
            ? 'opacity-100 scale-110'
            : 'opacity-0 group-hover:opacity-100'
        }`}
      />
      <div
        onClick={handleHandleClick}
        className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white dark:bg-[#27272A] border border-[#9B9A97] dark:border-[#52525B] hover:border-[#3B6D11] dark:hover:border-[#86EFAC] hover:bg-[#1F2A17] dark:hover:bg-[#86EFAC] cursor-crosshair z-30 transition-all ${
          isTargetCandidate || isSourceConnecting
            ? 'opacity-100 scale-110'
            : 'opacity-0 group-hover:opacity-100'
        }`}
      />
      <div
        onClick={handleHandleClick}
        className={`absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 rounded-full bg-white dark:bg-[#27272A] border border-[#9B9A97] dark:border-[#52525B] hover:border-[#3B6D11] dark:hover:border-[#86EFAC] hover:bg-[#1F2A17] dark:hover:bg-[#86EFAC] cursor-crosshair z-30 transition-all ${
          isTargetCandidate || isSourceConnecting
            ? 'opacity-100 scale-110'
            : 'opacity-0 group-hover:opacity-100'
        }`}
      />

      {/* Node Header */}
      <div className="px-3.5 pt-3 pb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {isWhiteboardCard ? (
            <FolderOpen size={13} className="text-purple-600 dark:text-purple-400 shrink-0" />
          ) : node.type === 'quote' ? (
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">"</span>
          ) : null}
          <span
            className="font-semibold text-xs truncate flex-1"
            style={{ color: colorStyle.text }}
          >
            {node.title || 'Sin título'}
          </span>
        </div>

        <div className="flex items-center gap-0.5 shrink-0 ml-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditNode(node);
            }}
            className="p-1 rounded hover:bg-[#ECE7D9] dark:hover:bg-white/10 text-[#9B9A97] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5] transition-colors"
            title="Editar nodo"
          >
            <Edit2 size={11} />
          </button>
          <button
            onClick={(e) => onStartConnect(node.id, e)}
            className={`p-1 rounded transition-colors ${
              isSourceConnecting
                ? 'bg-[#1F2A17] dark:bg-[#2B3B20] text-white'
                : 'hover:bg-[#ECE7D9] dark:hover:bg-white/10 text-[#9B9A97] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5]'
            }`}
            title="Conectar a otra nota"
          >
            <LinkIcon size={11} />
          </button>
        </div>
      </div>

      {/* Node Content Preview */}
      <div className="px-3.5 pb-3 text-xs text-[#5A5A58] dark:text-[#D4D4D8] leading-relaxed line-clamp-3 font-normal">
        {node.content || (
          <span className="italic text-[#9B9A97] dark:text-[#71717A]">Sin contenido</span>
        )}
      </div>

      {/* Special Nested Whiteboard drill-down action */}
      {isWhiteboardCard && node.targetBoardId && (
        <div className="px-3 pb-2.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSwitchBoard(node.targetBoardId!);
            }}
            className="w-full flex items-center justify-center gap-1 py-1 rounded-[5px] bg-[#FAF8FC] dark:bg-[#1E1035] hover:bg-[#F4EEF9] dark:hover:bg-[#2A164A] text-[#5D3B78] dark:text-[#D8B4FE] text-[11px] font-medium transition-colors border border-transparent dark:border-[#3C215E]/40"
          >
            <span>Abrir pizarra anidada</span>
            <ExternalLink size={10} />
          </button>
        </div>
      )}

      {/* Source reference (Document) */}
      {node.sourceDocId && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenDoc && node.sourceDocId) {
              onOpenDoc(node.sourceDocId);
            }
          }}
          className="mx-3 mb-2.5 px-2 py-1 rounded-[6px] bg-[#F3F0E7] dark:bg-[#18181B] text-[10px] text-[#787774] dark:text-[#D4D4D8] hover:text-[#18181B] dark:hover:text-[#F4F4F5] flex items-center gap-1 cursor-pointer hover:bg-[#ECE7D9] dark:hover:bg-[#27272A] border border-transparent dark:border-[#27272A] transition-colors"
          title="Haz clic para abrir el documento original"
        >
          <FileText size={11} className="text-[#9B9A97] dark:text-[#A1A1AA] shrink-0" />
          <span className="truncate flex-1">
            {node.sourceDocTitle || 'Ver en documento'}
          </span>
          <ExternalLink size={9} className="shrink-0 text-[#9B9A97] dark:text-[#A1A1AA]" />
        </div>
      )}

      {/* Source reference (Note) */}
      {node.sourceNoteId && (
        <div className="mx-3 mb-2.5 px-2 py-0.5 rounded-[4px] bg-[#F3F0E7] dark:bg-[#18181B] text-[9px] text-[#71717A] dark:text-[#A1A1AA] flex items-center gap-1 border border-transparent dark:border-[#27272A]">
          <StickyNote size={10} className="text-[#9B9A97] dark:text-[#A1A1AA] shrink-0" />
          <span className="truncate flex-1">Nota sincronizada</span>
        </div>
      )}
    </div>
  );
};
