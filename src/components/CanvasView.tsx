import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  CanvasData,
  CanvasNode,
  CanvasEdge,
  CanvasSection,
  Whiteboard,
  OrganizerMode,
  Note,
  DocumentItem,
  AiConfig,
} from '../types';
import {
  Plus,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Layers,
  Columns,
  FolderOpen,
  ChevronDown,
  ArrowLeft,
  LayoutGrid,
  MoreHorizontal,
  Link as LinkIcon,
  X,
  Trash2,
  Check,
} from 'lucide-react';
import { CanvasSplitView } from './CanvasSplitView';
import { CanvasSectionItem } from './CanvasSectionItem';
import { CanvasNodeCard } from './canvas/CanvasNodeCard';
import { CanvasEdgeLayer } from './canvas/CanvasEdgeLayer';
import { NodeEditModal, EdgeEditModal, InsertNoteModal } from './canvas/CanvasModals';
import { MODE_DESCRIPTIONS } from './canvas/canvasTypes';
import { useActivityTracker } from '../activityLogService';
import { useSettings } from '../context/SettingsContext';
import { reviewConceptMap } from '../lib/aiClient';

interface CanvasViewProps {
  canvasData: CanvasData;
  notes?: Note[];
  documents?: DocumentItem[];
  onUpdateCanvas: (next: CanvasData) => void;
  onUpdateNote?: (note: Note) => void;
  onOpenDoc?: (docId: string) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const CanvasView: React.FC<CanvasViewProps> = ({
  canvasData,
  notes = [],
  documents = [],
  onUpdateCanvas,
  onUpdateNote,
  onOpenDoc,
}) => {
  const { theme } = useSettings();
  const isDark = theme === 'dark';
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 300, y: 150 });
  const [isPanning, setIsPanning] = useState(false);
  const startPanRef = useRef({ x: 0, y: 0 });

  // Dragging node
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragStartOffsetRef = useRef({ x: 0, y: 0 });

  // Connecting nodes (linking)
  const [connectingFromId, setConnectingFromId] = useState<string | null>(null);
  const [cursorCanvasPos, setCursorCanvasPos] = useState<{ x: number; y: number } | null>(null);

  // Edit node modal / drawer
  const [editingNode, setEditingNode] = useState<CanvasNode | null>(null);
  const [editingEdge, setEditingEdge] = useState<CanvasEdge | null>(null);

  // Edge edit draft
  const [edgeLabelDraft, setEdgeLabelDraft] = useState('');
  const [edgeStyleDraft, setEdgeStyleDraft] = useState<'solid' | 'dashed'>('solid');

  // Insert Note Modal
  const [isInsertNoteOpen, setIsInsertNoteOpen] = useState(false);

  // Split View drawer
  const [isSplitViewOpen, setIsSplitViewOpen] = useState(false);

  // Board switcher dropdown state
  const [isBoardDropdownOpen, setIsBoardDropdownOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [newBoardTitleDraft, setNewBoardTitleDraft] = useState('');
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [boardPendingDelete, setBoardPendingDelete] = useState<string | null>(null);

  // Initialize multiple whiteboards structure seamlessly
  const boards: Whiteboard[] = useMemo(() => {
    if (canvasData.boards && canvasData.boards.length > 0) {
      return canvasData.boards;
    }
    return [
      {
        id: 'main',
        title: 'Pizarra Principal',
        parentId: null,
        nodes: canvasData.nodes || [],
        edges: canvasData.edges || [],
        sections: canvasData.sections || [],
        mode: canvasData.mode || 'libre',
        createdAt: Date.now(),
      },
    ];
  }, [canvasData]);

  const activeBoardId = canvasData.activeBoardId || boards[0]?.id || 'main';
  const activeBoard = boards.find((b) => b.id === activeBoardId) || boards[0];

  // Hook que hace upsert en activity_log cada vez que se abre o modifica este canvas/pizarra
  useActivityTracker({
    resourceType: 'canvas',
    resourceId: activeBoard?.id || 'main',
    resourceTitle: activeBoard?.title || 'Lienzo Infinito',
    status: 'in_progress',
    progressPct: (activeBoard?.nodes?.length || 0) > 0 ? 50 : 10,
    dependencyKey: `${activeBoard?.id}:${activeBoard?.title}:${activeBoard?.nodes?.length}:${activeBoard?.edges?.length}`,
  });

  // Active board parent (if nested)
  const parentBoard = activeBoard?.parentId
    ? boards.find((b) => b.id === activeBoard.parentId)
    : null;

  // Active items for current whiteboard
  const currentNodes = activeBoard?.nodes || canvasData.nodes || [];
  const currentEdges = activeBoard?.edges || canvasData.edges || [];
  const currentSections = activeBoard?.sections || canvasData.sections || [];
  const currentMode = activeBoard?.mode || canvasData.mode || 'libre';

  // Revisar mi mapa (cuestionamiento con IA o respaldo cuando >= 5 nodos)
  const [isReviewingMap, setIsReviewingMap] = useState(false);
  const [reviewQuestions, setReviewQuestions] = useState<string[] | null>(null);

  const handleReviewMap = async () => {
    if (currentNodes.length < 5) return;
    setIsReviewingMap(true);
    try {
      const nodeTitles = currentNodes.map((n) => n.title || n.content);
      const edgeLabels = currentEdges.map((e) => e.label ? `${e.label}` : 'conexión directa');
      const questions = await reviewConceptMap(nodeTitles, edgeLabels);
      setReviewQuestions(questions);
    } catch {
      setReviewQuestions([
        '¿Cómo se conectan los conceptos más periféricos con el núcleo central?',
        '¿Existe alguna relación de causa o jerarquía que aún no hayas enlazado?',
      ]);
    } finally {
      setIsReviewingMap(false);
    }
  };

  // Helper to persist changes to current board and sync top-level canvasData
  const updateCurrentBoard = useCallback(
    (updates: {
      nodes?: CanvasNode[];
      edges?: CanvasEdge[];
      sections?: CanvasSection[];
      mode?: OrganizerMode;
      title?: string;
    }) => {
      const nextNodes = updates.nodes !== undefined ? updates.nodes : currentNodes;
      const nextEdges = updates.edges !== undefined ? updates.edges : currentEdges;
      const nextSections = updates.sections !== undefined ? updates.sections : currentSections;
      const nextMode = updates.mode !== undefined ? updates.mode : currentMode;

      const updatedBoards = boards.map((b) =>
        b.id === activeBoard.id
          ? {
              ...b,
              ...updates,
              nodes: nextNodes,
              edges: nextEdges,
              sections: nextSections,
              mode: nextMode,
            }
          : b
      );

      onUpdateCanvas({
        ...canvasData,
        boards: updatedBoards,
        activeBoardId: activeBoard.id,
        nodes: nextNodes,
        edges: nextEdges,
        sections: nextSections,
        mode: nextMode,
      });
    },
    [activeBoard, boards, canvasData, currentEdges, currentMode, currentNodes, currentSections, onUpdateCanvas]
  );

  // Switch to another board
  const handleSwitchBoard = (boardId: string) => {
    const target = boards.find((b) => b.id === boardId);
    if (!target) return;

    onUpdateCanvas({
      ...canvasData,
      boards,
      activeBoardId: target.id,
      nodes: target.nodes || [],
      edges: target.edges || [],
      sections: target.sections || [],
      mode: target.mode || 'libre',
    });
    setIsBoardDropdownOpen(false);
    setPan({ x: 300, y: 150 });
    setZoom(1);
  };

  // Create new whiteboard
  const handleCreateNewBoard = (parentId: string | null = null, initialTitle?: string) => {
    const title = initialTitle || newBoardTitleDraft.trim() || `Pizarra ${boards.length + 1}`;
    const newBoardId = uid();
    const newBoard: Whiteboard = {
      id: newBoardId,
      title,
      parentId,
      nodes: [],
      edges: [],
      sections: [],
      mode: 'libre',
      createdAt: Date.now(),
    };

    const updatedBoards = [...boards, newBoard];

    onUpdateCanvas({
      ...canvasData,
      boards: updatedBoards,
      activeBoardId: newBoard.id,
      nodes: [],
      edges: [],
      sections: [],
      mode: 'libre',
    });

    setNewBoardTitleDraft('');
    setIsCreatingBoard(false);
    setIsBoardDropdownOpen(false);
    setPan({ x: 300, y: 150 });
    setZoom(1);
    return newBoard;
  };

  const boardsToDelete = useMemo(() => {
    if (!boardPendingDelete) return [];
    const ids = new Set<string>([boardPendingDelete]);
    let changed = true;
    while (changed) {
      changed = false;
      boards.forEach((board) => {
        if (board.parentId && ids.has(board.parentId) && !ids.has(board.id)) {
          ids.add(board.id);
          changed = true;
        }
      });
    }
    return boards.filter((board) => ids.has(board.id));
  }, [boardPendingDelete, boards]);

  const handleConfirmDeleteBoard = () => {
    if (!boardPendingDelete || boards.length <= 1) return;
    const deletedIds = new Set(boardsToDelete.map((board) => board.id));
    const remainingBoards = boards
      .filter((board) => !deletedIds.has(board.id))
      .map((board) => ({
        ...board,
        nodes: (board.nodes || []).filter((node) => !node.targetBoardId || !deletedIds.has(node.targetBoardId)),
      }));
    const fallback = remainingBoards.find((board) => board.parentId === null) || remainingBoards[0];
    if (!fallback) return;
    onUpdateCanvas({
      ...canvasData,
      boards: remainingBoards,
      activeBoardId: fallback.id,
      nodes: fallback.nodes || [],
      edges: fallback.edges || [],
      sections: fallback.sections || [],
      mode: fallback.mode || 'libre',
    });
    setBoardPendingDelete(null);
    setIsBoardDropdownOpen(false);
    setPan({ x: 300, y: 150 });
    setZoom(1);
  };

  // Create nested whiteboard card on current canvas
  const handleAddNestedWhiteboard = () => {
    const centerCanvasX = Math.round((-pan.x + 400) / zoom);
    const centerCanvasY = Math.round((-pan.y + 250) / zoom);
    const childBoardId = uid();
    const childTitle = `Sub-pizarra ${currentNodes.filter((n) => n.type === 'whiteboard').length + 1}`;

    const childBoard: Whiteboard = {
      id: childBoardId,
      title: childTitle,
      parentId: activeBoard.id,
      nodes: [],
      edges: [],
      sections: [],
      mode: 'libre',
      createdAt: Date.now(),
    };

    const newNestedNode: CanvasNode = {
      id: uid(),
      x: centerCanvasX,
      y: centerCanvasY,
      title: childTitle,
      content: 'Haz doble clic o pulsa "Abrir" para entrar en esta pizarra anidada.',
      type: 'whiteboard',
      color: 'purple',
      targetBoardId: childBoardId,
    };

    const updatedBoards = [...boards, childBoard];

    onUpdateCanvas({
      ...canvasData,
      boards: updatedBoards.map((b) =>
        b.id === activeBoard.id
          ? { ...b, nodes: [...currentNodes, newNestedNode] }
          : b
      ),
      nodes: [...currentNodes, newNestedNode],
    });
  };

  // Cancel connecting with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (connectingFromId) {
          setConnectingFromId(null);
          setCursorCanvasPos(null);
        }
        if (isInsertNoteOpen) {
          setIsInsertNoteOpen(false);
        }
        if (isBoardDropdownOpen) {
          setIsBoardDropdownOpen(false);
        }
        if (isMoreMenuOpen) {
          setIsMoreMenuOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [connectingFromId, isInsertNoteOpen, isBoardDropdownOpen, isMoreMenuOpen]);

  // Handle Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (connectingFromId && !(e.target as HTMLElement).closest('.canvas-node')) {
      setConnectingFromId(null);
      setCursorCanvasPos(null);
      return;
    }

    if (
      (e.target as HTMLElement).closest('.canvas-node') ||
      (e.target as HTMLElement).closest('.canvas-section')
    ) {
      return;
    }
    setIsPanning(true);
    startPanRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const canvasX = (e.clientX - pan.x) / zoom;
      const canvasY = (e.clientY - pan.y) / zoom;

      if (connectingFromId) {
        setCursorCanvasPos({ x: Math.round(canvasX), y: Math.round(canvasY) });
      }

      if (isPanning) {
        setPan({
          x: e.clientX - startPanRef.current.x,
          y: e.clientY - startPanRef.current.y,
        });
      } else if (draggingNodeId) {
        const targetX = canvasX - dragStartOffsetRef.current.x;
        const targetY = canvasY - dragStartOffsetRef.current.y;

        updateCurrentBoard({
          nodes: currentNodes.map((n) =>
            n.id === draggingNodeId
              ? { ...n, x: Math.round(targetX), y: Math.round(targetY) }
              : n
          ),
        });
      }
    },
    [isPanning, draggingNodeId, pan, zoom, currentNodes, connectingFromId, updateCurrentBoard]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setDraggingNodeId(null);
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const nextZoom = Math.min(2.5, Math.max(0.3, zoom * zoomFactor));
    setZoom(nextZoom);
  };

  const handleStartConnect = (nodeId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setConnectingFromId(nodeId);
  };

  const handleCompleteConnection = (fromId: string, toId: string) => {
    if (fromId === toId) {
      setConnectingFromId(null);
      setCursorCanvasPos(null);
      return;
    }

    const exists = currentEdges.some(
      (ed) =>
        (ed.from === fromId && ed.to === toId) ||
        (ed.from === toId && ed.to === fromId)
    );

    if (!exists) {
      const defaultLabel =
        currentMode === 'conceptual'
          ? 'se vincula con'
          : currentMode === 'llaves'
          ? 'comprende'
          : '';

      const newEdge: CanvasEdge = {
        id: uid(),
        from: fromId,
        to: toId,
        label: defaultLabel,
        style: 'solid',
      };

      updateCurrentBoard({
        edges: [...currentEdges, newEdge],
      });
    }

    setConnectingFromId(null);
    setCursorCanvasPos(null);
  };

  const handleStartDragNode = (e: React.MouseEvent, node: CanvasNode) => {
    e.stopPropagation();

    if (connectingFromId) {
      handleCompleteConnection(connectingFromId, node.id);
      return;
    }

    setDraggingNodeId(node.id);
    dragStartOffsetRef.current = {
      x: (e.clientX - pan.x) / zoom - node.x,
      y: (e.clientY - pan.y) / zoom - node.y,
    };
  };

  const handleAddNode = () => {
    const centerCanvasX = Math.round((-pan.x + 400) / zoom);
    const centerCanvasY = Math.round((-pan.y + 250) / zoom);
    const newNode: CanvasNode = {
      id: uid(),
      x: centerCanvasX + (Math.random() * 40 - 20),
      y: centerCanvasY + (Math.random() * 40 - 20),
      title: 'Nuevo concepto',
      content: 'Escribe aquí la definición o relación de este nodo...',
      type: 'concept',
      color: 'slate',
    };
    updateCurrentBoard({
      nodes: [...currentNodes, newNode],
    });
    setEditingNode(newNode);
  };

  const handleAddSection = () => {
    const centerCanvasX = Math.round((-pan.x + 350) / zoom);
    const centerCanvasY = Math.round((-pan.y + 200) / zoom);
    const newSection: CanvasSection = {
      id: uid(),
      title: `Sección ${currentSections.length + 1}`,
      x: centerCanvasX,
      y: centerCanvasY,
      width: 480,
      height: 320,
      color: 'slate',
    };
    updateCurrentBoard({
      sections: [...currentSections, newSection],
    });
  };

  const handleMoveSectionAndNodes = (sectionId: string, deltaX: number, deltaY: number) => {
    const sec = currentSections.find((s) => s.id === sectionId);
    if (!sec) return;

    const enclosedNodeIds = new Set(
      currentNodes
        .filter(
          (n) =>
            n.x >= sec.x &&
            n.x <= sec.x + sec.width &&
            n.y >= sec.y &&
            n.y <= sec.y + sec.height
        )
        .map((n) => n.id)
    );

    const updatedSections = currentSections.map((s) =>
      s.id === sectionId ? { ...s, x: s.x + deltaX, y: s.y + deltaY } : s
    );

    const updatedNodes = currentNodes.map((n) =>
      enclosedNodeIds.has(n.id)
        ? { ...n, x: n.x + deltaX, y: n.y + deltaY }
        : n
    );

    updateCurrentBoard({
      sections: updatedSections,
      nodes: updatedNodes,
    });
  };

  const handleInsertNoteToCanvas = (note: Note) => {
    const existingNode = currentNodes.find((n) => n.sourceNoteId === note.id);
    if (existingNode) {
      setPan({
        x: 400 - existingNode.x * zoom,
        y: 280 - existingNode.y * zoom,
      });
      setIsInsertNoteOpen(false);
      return;
    }

    const centerCanvasX = Math.round((-pan.x + 350) / zoom);
    const centerCanvasY = Math.round((-pan.y + 200) / zoom);
    const newNode: CanvasNode = {
      id: uid(),
      x: centerCanvasX + (Math.random() * 40 - 20),
      y: centerCanvasY + (Math.random() * 40 - 20),
      title: note.title || 'Nota',
      content: note.content || '',
      type: 'note',
      color: 'blue',
      sourceNoteId: note.id,
    };

    updateCurrentBoard({
      nodes: [...currentNodes, newNode],
    });
    setIsInsertNoteOpen(false);
  };

  const handleInsertQuoteFromSplit = (quote: string, docTitle?: string, docId?: string) => {
    const centerCanvasX = Math.round((-pan.x + 350) / zoom);
    const centerCanvasY = Math.round((-pan.y + 200) / zoom);
    const newNode: CanvasNode = {
      id: uid(),
      x: centerCanvasX + (Math.random() * 40 - 20),
      y: centerCanvasY + (Math.random() * 40 - 20),
      title: docTitle ? `Cita: ${docTitle}` : 'Cita extraída',
      content: quote,
      type: 'quote',
      color: 'amber',
      sourceDocId: docId,
      sourceDocTitle: docTitle,
    };

    updateCurrentBoard({
      nodes: [...currentNodes, newNode],
    });
  };

  const handleDeleteNode = (nodeId: string) => {
    updateCurrentBoard({
      nodes: currentNodes.filter((n) => n.id !== nodeId),
      edges: currentEdges.filter((e) => e.from !== nodeId && e.to !== nodeId),
    });
    if (editingNode?.id === nodeId) setEditingNode(null);
  };

  const handleCenterView = () => {
    if (currentNodes.length === 0) {
      setPan({ x: 300, y: 200 });
      setZoom(1);
      return;
    }
    const xs = currentNodes.map((n) => n.x);
    const ys = currentNodes.map((n) => n.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    setPan({
      x: 400 - midX * zoom,
      y: 280 - midY * zoom,
    });
  };

  const applyAutoLayout = (mode: OrganizerMode) => {
    const nodes = [...currentNodes];
    if (nodes.length === 0) return;

    if (mode === 'conceptual') {
      const inDegree: Record<string, number> = {};
      nodes.forEach((n) => (inDegree[n.id] = 0));
      currentEdges.forEach((e) => {
        if (inDegree[e.to] !== undefined) inDegree[e.to]++;
      });

      const levels: string[][] = [];
      let currentLevel = nodes.filter((n) => inDegree[n.id] === 0).map((n) => n.id);
      if (currentLevel.length === 0) currentLevel = [nodes[0].id];
      const visited = new Set<string>(currentLevel);
      levels.push(currentLevel);

      while (visited.size < nodes.length) {
        const nextLevel: string[] = [];
        const prevLevel = levels[levels.length - 1];
        prevLevel.forEach((parentId) => {
          currentEdges
            .filter((e) => e.from === parentId)
            .forEach((e) => {
              if (!visited.has(e.to)) {
                visited.add(e.to);
                nextLevel.push(e.to);
              }
            });
        });
        if (nextLevel.length === 0) {
          const unvisited = nodes.filter((n) => !visited.has(n.id));
          if (unvisited.length > 0) {
            nextLevel.push(unvisited[0].id);
            visited.add(unvisited[0].id);
          } else {
            break;
          }
        }
        levels.push(nextLevel);
      }

      const LEVEL_HEIGHT = 160;
      const NODE_WIDTH_SPACE = 260;
      const nodeMap = new Map(nodes.map((n) => [n.id, { ...n }]));

      levels.forEach((lvl, lvlIdx) => {
        const totalWidth = lvl.length * NODE_WIDTH_SPACE;
        const startX = -totalWidth / 2 + 100;
        lvl.forEach((id, colIdx) => {
          const node = nodeMap.get(id);
          if (node) {
            node.x = Math.round(startX + colIdx * NODE_WIDTH_SPACE);
            node.y = Math.round(lvlIdx * LEVEL_HEIGHT + 40);
          }
        });
      });

      updateCurrentBoard({
        mode,
        nodes: Array.from(nodeMap.values()),
      });
    } else if (mode === 'llaves') {
      const inDegree: Record<string, number> = {};
      nodes.forEach((n) => (inDegree[n.id] = 0));
      currentEdges.forEach((e) => {
        if (inDegree[e.to] !== undefined) inDegree[e.to]++;
      });

      const rootNodes = nodes.filter((n) => inDegree[n.id] === 0);
      const rootId = rootNodes.length > 0 ? rootNodes[0].id : nodes[0].id;

      const columnMap: Record<string, number> = {};
      columnMap[rootId] = 0;
      const queue = [rootId];
      while (queue.length > 0) {
        const curr = queue.shift()!;
        const currCol = columnMap[curr];
        currentEdges
          .filter((e) => e.from === curr)
          .forEach((e) => {
            if (columnMap[e.to] === undefined) {
              columnMap[e.to] = currCol + 1;
              queue.push(e.to);
            }
          });
      }

      nodes.forEach((n) => {
        if (columnMap[n.id] === undefined) columnMap[n.id] = 1;
      });

      const columns: CanvasNode[][] = [];
      nodes.forEach((n) => {
        const col = columnMap[n.id];
        if (!columns[col]) columns[col] = [];
        columns[col].push(n);
      });

      const COL_WIDTH = 270;
      const ROW_HEIGHT = 130;

      columns.forEach((colNodes, cIdx) => {
        const totalHeight = colNodes.length * ROW_HEIGHT;
        const startY = -totalHeight / 2 + 100;
        colNodes.forEach((node, rIdx) => {
          node.x = Math.round(cIdx * COL_WIDTH + 60);
          node.y = Math.round(startY + rIdx * ROW_HEIGHT);
        });
      });

      updateCurrentBoard({
        mode,
        nodes,
      });
    } else if (mode === 'mental') {
      const centerNode = nodes[0];
      centerNode.x = 250;
      centerNode.y = 200;

      const otherNodes = nodes.slice(1);
      const RADIUS = 260;
      const angleStep = (2 * Math.PI) / Math.max(1, otherNodes.length);

      otherNodes.forEach((n, i) => {
        const angle = i * angleStep;
        n.x = Math.round(centerNode.x + RADIUS * Math.cos(angle));
        n.y = Math.round(centerNode.y + RADIUS * Math.sin(angle));
      });

      const edges = [...currentEdges];
      otherNodes.forEach((n) => {
        const hasEdge = edges.some(
          (e) =>
            (e.from === centerNode.id && e.to === n.id) ||
            (e.to === centerNode.id && e.from === n.id)
        );
        if (!hasEdge) {
          edges.push({
            id: uid(),
            from: centerNode.id,
            to: n.id,
            label: '',
            style: 'solid',
          });
        }
      });

      updateCurrentBoard({
        mode,
        nodes,
        edges,
      });
    } else {
      updateCurrentBoard({
        mode: 'libre',
      });
    }
  };

  const handleSelectEdge = (edge: CanvasEdge) => {
    setEditingEdge(edge);
    setEdgeLabelDraft(edge.label || '');
    setEdgeStyleDraft(edge.style === 'dashed' ? 'dashed' : 'solid');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none bg-[#F8F5EE] dark:bg-[#0D0D10]">
      {/* Top Toolbar */}
      <div className="h-14 border-b border-[#E7E2D3] dark:border-[#222225] px-5 flex items-center bg-[#F8F5EE] dark:bg-[#121214] z-10 shrink-0 relative transition-colors">
        {/* Left side: identity & switchers */}
        <div className="flex items-center gap-1 flex-1 min-w-0">
          {parentBoard && (
            <button
              onClick={() => handleSwitchBoard(parentBoard.id)}
              className="flex items-center gap-1 px-2 py-1 rounded-[6px] text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5] hover:bg-[#ECE7D9] dark:hover:bg-[#1C1C1F] transition-colors shrink-0"
              title={`Volver a ${parentBoard.title}`}
            >
              <ArrowLeft size={13} />
              <span className="truncate max-w-[120px]">{parentBoard.title}</span>
              <span className="text-[#A1A1AA] dark:text-[#71717A]">/</span>
            </button>
          )}

          {/* Whiteboard Switcher Dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => setIsBoardDropdownOpen((v) => !v)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] hover:bg-[#ECE7D9] dark:hover:bg-[#1C1C1F] text-xs font-semibold text-[#18181B] dark:text-[#F4F4F5] transition-colors"
            >
              <LayoutGrid size={14} className="text-[#18181B] dark:text-[#F4F4F5]" />
              <span className="truncate max-w-[160px]">{activeBoard.title}</span>
              <ChevronDown size={12} className="text-[#71717A] dark:text-[#A1A1AA]" />
            </button>

            {isBoardDropdownOpen && (
              <div
                className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-[#121214] rounded-[8px] border border-[#E7E2D3] dark:border-[#222225] shadow-lg p-2 z-50 animate-in fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#A1A1AA] dark:text-[#71717A] px-2 py-1">
                  Pizarras ({boards.length})
                </div>

                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {boards.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => handleSwitchBoard(b.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-xs text-left transition-colors ${
                        b.id === activeBoard.id
                          ? 'bg-[#ECE7D9] dark:bg-[#1C1C1F] font-semibold text-[#18181B] dark:text-[#F4F4F5]'
                          : 'hover:bg-[#FAFAF9] dark:hover:bg-[#1C1C1F]/60 text-[#71717A] dark:text-[#A1A1AA]'
                      }`}
                    >
                      <span className="truncate flex-1">
                        {b.parentId ? '↳ ' : ''}{b.title}
                      </span>
                      <span className="text-[10px] text-[#A1A1AA] dark:text-[#71717A] ml-2">
                        {b.nodes?.length || 0}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="border-t border-[#E7E2D3] dark:border-[#222225] mt-1.5 pt-1.5">
                  {isCreatingBoard ? (
                    <div className="flex items-center gap-1 p-1">
                      <input
                        type="text"
                        value={newBoardTitleDraft}
                        onChange={(e) => setNewBoardTitleDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateNewBoard();
                          if (e.key === 'Escape') setIsCreatingBoard(false);
                        }}
                        placeholder="Nombre de la pizarra..."
                        className="w-full text-xs px-2 py-1 rounded bg-[#F8F5EE] dark:bg-[#1C1C1F] border border-[#E7E2D3] dark:border-[#27272A] outline-none text-[#18181B] dark:text-[#F4F4F5]"
                        autoFocus
                      />
                      <button
                        onClick={() => handleCreateNewBoard()}
                        className="p-1 rounded bg-[#1F2A17] dark:bg-[#2B3B20] text-white hover:bg-[#2B3B20] dark:hover:bg-[#364929]"
                      >
                        <Check size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsCreatingBoard(true)}
                      className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5] hover:bg-[#ECE7D9] dark:hover:bg-[#1C1C1F] transition-colors"
                    >
                      <Plus size={12} />
                      <span>Nueva Pizarra</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* More options menu */}
          <div className="relative shrink-0">
            <button
              onClick={() => setIsMoreMenuOpen((v) => !v)}
              className={`p-1.5 rounded-[6px] transition-colors ${
                isMoreMenuOpen
                  ? 'bg-[#ECE7D9] dark:bg-[#1C1C1F] text-[#18181B] dark:text-[#F4F4F5]'
                  : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5] hover:bg-[#ECE7D9] dark:hover:bg-[#1C1C1F]'
              }`}
              title="Más opciones"
            >
              <MoreHorizontal size={15} />
            </button>

            {isMoreMenuOpen && (
              <div
                className="absolute top-full left-0 mt-1 w-52 bg-white dark:bg-[#121214] rounded-[8px] border border-[#E7E2D3] dark:border-[#222225] shadow-lg p-1 z-50 animate-in fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => { applyAutoLayout(currentMode); setIsMoreMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] text-xs font-medium text-[#3F3F46] dark:text-[#D4D4D8] hover:bg-[#ECE7D9] dark:hover:bg-[#1C1C1F] transition-colors"
                  title={`Organizar automáticamente como ${MODE_DESCRIPTIONS[currentMode].label}`}
                >
                  <Sparkles size={13} className="text-[#9B9A97] dark:text-[#71717A]" />
                  <span>Auto-organizar</span>
                </button>
                <div className="h-px bg-[#E7E2D3] dark:bg-[#222225] my-1" />
                <button
                  onClick={() => { setIsSplitViewOpen((v) => !v); setIsMoreMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] text-xs font-medium text-[#3F3F46] dark:text-[#D4D4D8] hover:bg-[#ECE7D9] dark:hover:bg-[#1C1C1F] transition-colors"
                  title="Abrir o cerrar lector de documentos y notas al lado"
                >
                  <Columns size={13} className="text-[#9B9A97] dark:text-[#71717A]" />
                  <span>{isSplitViewOpen ? 'Cerrar lector split' : 'Abrir lector split'}</span>
                </button>
                <button
                  onClick={() => { handleAddNestedWhiteboard(); setIsMoreMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] text-xs font-medium text-[#3F3F46] dark:text-[#D4D4D8] hover:bg-[#ECE7D9] dark:hover:bg-[#1C1C1F] transition-colors"
                  title="Crear tarjeta de sub-pizarra anidada"
                >
                  <FolderOpen size={13} className="text-[#9B9A97] dark:text-[#71717A]" />
                  <span>Sub-pizarra</span>
                </button>
                <button
                  onClick={() => { setIsInsertNoteOpen(true); setIsMoreMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] text-xs font-medium text-[#3F3F46] dark:text-[#D4D4D8] hover:bg-[#ECE7D9] dark:hover:bg-[#1C1C1F] transition-colors"
                  title="Añadir una nota de tu biblioteca al lienzo"
                >
                  <Plus size={13} className="text-[#9B9A97] dark:text-[#71717A]" />
                  <span>Nota</span>
                </button>
                <div className="h-px bg-[#E7E2D3] dark:bg-[#222225] my-1" />
                <button
                  onClick={() => { setBoardPendingDelete(activeBoard.id); setIsMoreMenuOpen(false); }}
                  disabled={boards.length <= 1}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  title={boards.length <= 1 ? 'Debe existir al menos una pizarra' : 'Eliminar esta pizarra'}
                >
                  <Trash2 size={13} />
                  <span>Eliminar pizarra</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center: organizer modes */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-5">
          {(['conceptual', 'llaves', 'mental', 'libre'] as OrganizerMode[]).map((mode) => {
            const active = currentMode === mode;
            const meta = MODE_DESCRIPTIONS[mode];
            return (
              <button
                key={mode}
                onClick={() => updateCurrentBoard({ mode })}
                className={`text-xs transition-colors ${
                  active
                    ? 'text-[#18181B] dark:text-[#F4F4F5] font-semibold'
                    : 'text-[#71717A] dark:text-[#71717A] font-normal hover:text-[#18181B] dark:hover:text-[#F4F4F5]'
                }`}
                title={meta.desc}
              >
                {meta.label}
              </button>
            );
          })}
        </div>

        {/* Right side: actions */}
        <div className="flex items-center gap-1 flex-1 min-w-0 justify-end">
          {connectingFromId && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-[6px] bg-[#1F2A17] dark:bg-[#2B3B20] text-white text-xs font-normal animate-in fade-in">
              <LinkIcon size={12} className="text-white shrink-0" />
              <span>Haz clic en otro nodo para enlazar</span>
              <button
                onClick={() => {
                  setConnectingFromId(null);
                  setCursorCanvasPos(null);
                }}
                className="ml-1 p-0.5 rounded hover:bg-white/20 text-white/80 hover:text-white"
                title="Cancelar enlace"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {currentNodes.length >= 5 && (
            <button
              onClick={handleReviewMap}
              disabled={isReviewingMap}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-mono border border-[var(--fig-line)] hover:border-[var(--fig-ink)] text-[var(--fig-ink)] transition-colors cursor-pointer"
              title="Formula preguntas socráticas sobre conexiones que falten"
            >
              <span>{isReviewingMap ? 'Revisando...' : 'Revisar mi mapa'}</span>
            </button>
          )}

          <button
            onClick={handleAddSection}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-[6px] text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5] hover:bg-[#ECE7D9] dark:hover:bg-[#1C1C1F] transition-colors"
            title="Crear recuadro de sección para agrupar tarjetas"
          >
            <Plus size={12} />
            <span>Sección</span>
          </button>

          <button
            onClick={handleAddNode}
            className="flex items-center gap-1.5 px-4 py-2 rounded-[7px] text-xs font-semibold bg-[#1F2A17] dark:bg-[#2B3B20] hover:bg-[#2B3B20] dark:hover:bg-[#364929] text-white transition-colors ml-1 shadow-xs border border-[#3B6D11]/30 dark:border-[#3B6D11]/50"
          >
            <Plus size={14} />
            <span>Nodo</span>
          </button>

          <div className="flex items-center gap-0.5 ml-2 pl-2 border-l border-[#E7E2D3] dark:border-[#222225]">
            <button
              onClick={() => setZoom((z) => Math.max(0.3, z - 0.15))}
              className="p-1.5 rounded-[6px] hover:bg-[#ECE7D9] dark:hover:bg-[#1C1C1F] text-[#787774] dark:text-[#A1A1AA] transition-colors"
              title="Alejar"
            >
              <ZoomOut size={13} />
            </button>
            <span className="text-[10px] font-mono text-[#787774] dark:text-[#A1A1AA] px-1 min-w-[32px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
              className="p-1.5 rounded-[6px] hover:bg-[#ECE7D9] dark:hover:bg-[#1C1C1F] text-[#787774] dark:text-[#A1A1AA] transition-colors"
              title="Acercar"
            >
              <ZoomIn size={13} />
            </button>
            <button
              onClick={handleCenterView}
              className="p-1.5 rounded-[6px] hover:bg-[#ECE7D9] dark:hover:bg-[#1C1C1F] text-[#787774] dark:text-[#A1A1AA] transition-colors"
              title="Centrar vista"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Work Area */}
      <div className="flex-1 flex overflow-hidden relative bg-[#F8F5EE] dark:bg-[#0D0D10]">
        {reviewQuestions && (
          <div className="absolute top-4 right-4 z-50 max-w-sm p-4 border border-[var(--fig-line)] bg-[var(--bg-card)] shadow-lg space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[var(--fig-mute)] font-semibold">
                Revisión de mapa (Preguntas de conexión)
              </span>
              <button
                onClick={() => setReviewQuestions(null)}
                className="text-[var(--fig-mute)] hover:text-[var(--fig-ink)] text-xs cursor-pointer p-0.5"
              >
                ✕
              </button>
            </div>
            <ul className="space-y-1.5 text-xs text-[var(--fig-ink)] list-disc list-inside">
              {reviewQuestions.map((q, idx) => (
                <li key={idx} className="leading-relaxed italic">
                  "{q}"
                </li>
              ))}
            </ul>
          </div>
        )}

        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          className={`flex-1 relative cursor-${isPanning ? 'grabbing' : 'grab'} overflow-hidden bg-[#F8F5EE] dark:bg-[#0D0D10]`}
          style={{
            backgroundImage: isDark
              ? 'radial-gradient(#27272A 1.15px, transparent 1.15px)'
              : 'radial-gradient(#D6D1C4 1.15px, transparent 1.15px)',
            backgroundSize: '24px 24px',
            backgroundPosition: `${pan.x}px ${pan.y}px`,
          }}
        >
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          >
            {/* Sections layer */}
            <div style={{ pointerEvents: 'auto' }}>
              {currentSections.map((sec) => (
                <CanvasSectionItem
                  key={sec.id}
                  section={sec}
                  zoom={zoom}
                  onUpdateSection={(updated) =>
                    updateCurrentBoard({
                      sections: currentSections.map((s) =>
                        s.id === updated.id ? updated : s
                      ),
                    })
                  }
                  onDeleteSection={(secId) =>
                    updateCurrentBoard({
                      sections: currentSections.filter((s) => s.id !== secId),
                    })
                  }
                  onMoveSectionAndNodes={handleMoveSectionAndNodes}
                />
              ))}
            </div>

            {/* SVG Edges Layer */}
            <CanvasEdgeLayer
              edges={currentEdges}
              nodes={currentNodes}
              currentMode={currentMode}
              connectingFromId={connectingFromId}
              cursorCanvasPos={cursorCanvasPos}
              onSelectEdge={handleSelectEdge}
            />

            {/* HTML Nodes layer */}
            <div style={{ pointerEvents: 'auto', zIndex: 2, position: 'relative' }}>
              {currentNodes.map((node) => (
                <CanvasNodeCard
                  key={node.id}
                  node={node}
                  connectingFromId={connectingFromId}
                  onStartDrag={handleStartDragNode}
                  onStartConnect={handleStartConnect}
                  onCompleteConnection={handleCompleteConnection}
                  onEditNode={setEditingNode}
                  onSwitchBoard={handleSwitchBoard}
                  onOpenDoc={onOpenDoc}
                />
              ))}
            </div>
          </div>

          {/* Empty Canvas Prompt */}
          {currentNodes.length === 0 && currentSections.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div
                className="bg-white dark:bg-[#121214] p-6 rounded-[8px] max-w-sm text-center pointer-events-auto space-y-3 border border-[#E7E2D3] dark:border-[#27272A]"
                style={{
                  boxShadow: isDark
                    ? '0 8px 30px rgba(0, 0, 0, 0.5)'
                    : '0 4px 14px rgba(31, 42, 23, 0.06)',
                }}
              >
                <div className="w-10 h-10 rounded-full bg-[#F4F4F5] dark:bg-[#1C1C1F] text-[#18181B] dark:text-[#F4F4F5] flex items-center justify-center mx-auto">
                  <Layers size={18} />
                </div>
                <h3 className="text-sm font-semibold text-[#18181B] dark:text-[#F4F4F5]">{activeBoard.title}</h3>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed font-normal">
                  Crea conceptos, agrupa con secciones o abre el <strong>Lector Split</strong> para
                  extraer citas de tus lecturas directamente a esta pizarra.
                </p>
                <div className="flex flex-wrap gap-2 justify-center pt-1">
                  <button
                    onClick={() => setIsSplitViewOpen(true)}
                    className="px-3 py-1.5 rounded-[6px] bg-[#F4F4F5] dark:bg-[#1C1C1F] hover:bg-[#E4E4E7] dark:hover:bg-[#27272A] text-[#3F3F46] dark:text-[#D4D4D8] text-xs font-medium flex items-center gap-1.5 transition-colors border border-transparent dark:border-[#27272A]"
                  >
                    <Columns size={12} /> Lector Split
                  </button>
                  <button
                    onClick={handleAddSection}
                    className="px-3 py-1.5 rounded-[6px] bg-[#F4F4F5] dark:bg-[#1C1C1F] hover:bg-[#E4E4E7] dark:hover:bg-[#27272A] text-[#3F3F46] dark:text-[#D4D4D8] text-xs font-medium flex items-center gap-1.5 transition-colors border border-transparent dark:border-[#27272A]"
                  >
                    <Plus size={12} /> Sección
                  </button>
                  <button
                    onClick={handleAddNode}
                    className="px-3.5 py-1.5 rounded-[6px] bg-[#1F2A17] dark:bg-[#2B3B20] hover:bg-[#2B3B20] dark:hover:bg-[#364929] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-[#3B6D11]/30 dark:border-[#3B6D11]/50"
                  >
                    <Plus size={12} /> Crear nodo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Split View Drawer at right */}
        {isSplitViewOpen && (
          <CanvasSplitView
            documents={documents}
            notes={notes}
            onClose={() => setIsSplitViewOpen(false)}
            onInsertQuoteToCanvas={handleInsertQuoteFromSplit}
            onInsertNoteToCanvas={handleInsertNoteToCanvas}
            onOpenFullDoc={onOpenDoc}
          />
        )}
      </div>

      {/* Insert Note Modal */}
      <InsertNoteModal
        isOpen={isInsertNoteOpen}
        notes={notes}
        onClose={() => setIsInsertNoteOpen(false)}
        onInsertNote={handleInsertNoteToCanvas}
      />

      {/* Node Edit Modal */}
      <NodeEditModal
        editingNode={editingNode}
        onClose={() => setEditingNode(null)}
        onDeleteNode={handleDeleteNode}
        onUpdateNodeData={(updatedNode) => {
          setEditingNode(updatedNode);
          updateCurrentBoard({
            nodes: currentNodes.map((n) =>
              n.id === updatedNode.id ? updatedNode : n
            ),
          });
          if (updatedNode.sourceNoteId && onUpdateNote) {
            const linked = notes.find((n) => n.id === updatedNode.sourceNoteId);
            if (linked) {
              onUpdateNote({ ...linked, title: updatedNode.title, content: updatedNode.content });
            }
          }
        }}
        onOpenDoc={onOpenDoc}
      />

      {/* Edge Edit Modal */}
      <EdgeEditModal
        editingEdge={editingEdge}
        edgeLabelDraft={edgeLabelDraft}
        edgeStyleDraft={edgeStyleDraft}
        onClose={() => setEditingEdge(null)}
        onSetLabel={setEdgeLabelDraft}
        onSetStyle={setEdgeStyleDraft}
        onSave={() => {
          if (editingEdge) {
            updateCurrentBoard({
              edges: currentEdges.map((e) =>
                e.id === editingEdge.id
                  ? { ...e, label: edgeLabelDraft, style: edgeStyleDraft }
                  : e
              ),
            });
          }
          setEditingEdge(null);
        }}
        onDeleteEdge={(edgeId) => {
          updateCurrentBoard({
            edges: currentEdges.filter((e) => e.id !== edgeId),
          });
          setEditingEdge(null);
        }}
      />

      {/* Confirm Delete Whiteboard Modal */}
      {boardPendingDelete && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
          onClick={() => setBoardPendingDelete(null)}
        >
          <div
            className="bg-white dark:bg-[#121214] rounded-[8px] max-w-sm w-full p-5 space-y-3 text-[#18181B] dark:text-[#F4F4F5] border border-[#E7E2D3] dark:border-[#27272A]"
            style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.25)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <Trash2 size={15} /> ¿Eliminar Pizarra?
            </h3>
            <p className="text-xs text-[#787774] dark:text-[#A1A1AA] leading-relaxed">
              Esta acción eliminará la pizarra actual y sus tarjetas. No se puede deshacer.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#E9E8E4] dark:border-[#222225]">
              <button
                onClick={() => setBoardPendingDelete(null)}
                className="px-3 py-1.5 rounded-[6px] border border-[#E9E8E4] dark:border-[#27272A] hover:bg-[#F4F3EF] dark:hover:bg-[#1C1C1F] text-xs font-medium text-[#5A5A58] dark:text-[#A1A1AA] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeleteBoard}
                className="px-3 py-1.5 rounded-[6px] bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium transition-colors"
              >
                Confirmar eliminación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
