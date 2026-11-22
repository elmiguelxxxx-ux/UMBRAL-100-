import React from 'react';
import { CanvasEdge, CanvasNode, OrganizerMode } from '../../types';
import { useSettings } from '../../context/SettingsContext';

interface CanvasEdgeLayerProps {
  edges: CanvasEdge[];
  nodes: CanvasNode[];
  currentMode: OrganizerMode;
  connectingFromId: string | null;
  cursorCanvasPos: { x: number; y: number } | null;
  onSelectEdge: (edge: CanvasEdge) => void;
}

const NODE_WIDTH = 210;
const NODE_APPROX_HEIGHT = 80;

export const CanvasEdgeLayer: React.FC<CanvasEdgeLayerProps> = ({
  edges,
  nodes,
  currentMode,
  connectingFromId,
  cursorCanvasPos,
  onSelectEdge,
}) => {
  const { theme } = useSettings();
  const isDark = theme === 'dark';

  const renderEdge = (edge: CanvasEdge) => {
    const fromNode = nodes.find((n) => n.id === edge.from);
    const toNode = nodes.find((n) => n.id === edge.to);
    if (!fromNode || !toNode) return null;

    const fromCenter = {
      x: fromNode.x + NODE_WIDTH / 2,
      y: fromNode.y + NODE_APPROX_HEIGHT / 2,
    };
    const toCenter = {
      x: toNode.x + NODE_WIDTH / 2,
      y: toNode.y + NODE_APPROX_HEIGHT / 2,
    };

    const dx = toCenter.x - fromCenter.x;
    const dy = toCenter.y - fromCenter.y;

    let startX = fromCenter.x;
    let startY = fromCenter.y;
    let endX = toCenter.x;
    let endY = toCenter.y;
    let pathD = '';
    let midX = (startX + endX) / 2;
    let midY = (startY + endY) / 2;

    if (currentMode === 'llaves') {
      startX = fromNode.x + NODE_WIDTH;
      startY = fromCenter.y;
      endX = toNode.x;
      endY = toCenter.y;
      midX = (startX + endX) / 2;
      midY = (startY + endY) / 2;
      pathD = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
    } else {
      if (Math.abs(dx) >= Math.abs(dy)) {
        if (dx >= 0) {
          startX = fromNode.x + NODE_WIDTH;
          startY = fromCenter.y;
          endX = toNode.x;
          endY = toCenter.y;
        } else {
          startX = fromNode.x;
          startY = fromCenter.y;
          endX = toNode.x + NODE_WIDTH;
          endY = toCenter.y;
        }
        midX = (startX + endX) / 2;
        midY = (startY + endY) / 2;
        const curveOffset = Math.max(30, Math.abs(endX - startX) * 0.45);
        const cp1X = dx >= 0 ? startX + curveOffset : startX - curveOffset;
        const cp2X = dx >= 0 ? endX - curveOffset : endX + curveOffset;
        pathD = `M ${startX} ${startY} C ${cp1X} ${startY}, ${cp2X} ${endY}, ${endX} ${endY}`;
      } else {
        if (dy >= 0) {
          startX = fromCenter.x;
          startY = fromNode.y + NODE_APPROX_HEIGHT;
          endX = toCenter.x;
          endY = toNode.y;
        } else {
          startX = fromCenter.x;
          startY = fromNode.y;
          endX = toCenter.x;
          endY = toNode.y + NODE_APPROX_HEIGHT;
        }
        midX = (startX + endX) / 2;
        midY = (startY + endY) / 2;
        const curveOffset = Math.max(30, Math.abs(endY - startY) * 0.45);
        const cp1Y = dy >= 0 ? startY + curveOffset : startY - curveOffset;
        const cp2Y = dy >= 0 ? endY - curveOffset : endY + curveOffset;
        pathD = `M ${startX} ${startY} C ${startX} ${cp1Y}, ${endX} ${cp2Y}, ${endX} ${endY}`;
      }
    }

    const isDashed = edge.style === 'dashed';

    return (
      <g
        key={edge.id}
        className="cursor-pointer group"
        style={{ pointerEvents: 'auto' }}
        onClick={(e) => {
          e.stopPropagation();
          onSelectEdge(edge);
        }}
      >
        <path
          d={pathD}
          fill="none"
          stroke="transparent"
          strokeWidth="18"
          strokeLinecap="round"
        />

        <path
          d={pathD}
          fill="none"
          className="canvas-edge transition-colors"
          stroke={isDark ? '#52525B' : '#9B9A97'}
          strokeWidth="1.75"
          strokeDasharray={isDashed ? '5,5' : undefined}
          strokeLinecap="round"
          markerEnd={isDark ? 'url(#canvas-arrow-dark)' : 'url(#canvas-arrow)'}
        />

        {edge.label && (
          <g transform={`translate(${midX}, ${midY})`}>
            <rect
              x={-(edge.label.length * 3.8 + 10)}
              y="-10"
              width={edge.label.length * 7.6 + 20}
              height="20"
              rx="10"
              fill={isDark ? '#18181B' : '#FFFDF8'}
              stroke={isDark ? '#3F3F46' : '#E7E2D3'}
              strokeWidth="1"
              className="transition-colors"
            />
            <text
              x="0"
              y="3.5"
              textAnchor="middle"
              className="text-[10px] font-sans font-medium select-none pointer-events-none transition-colors"
              fill={isDark ? '#D4D4D8' : '#787774'}
            >
              {edge.label}
            </text>
          </g>
        )}
      </g>
    );
  };

  const renderConnectingPreview = () => {
    if (!connectingFromId || !cursorCanvasPos) return null;
    const fromNode = nodes.find((n) => n.id === connectingFromId);
    if (!fromNode) return null;

    const startX = fromNode.x + 105;
    const startY = fromNode.y + 40;
    const endX = cursorCanvasPos.x;
    const endY = cursorCanvasPos.y;
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const pathD = `M ${startX} ${startY} Q ${midX} ${startY}, ${endX} ${endY}`;

    return (
      <path
        d={pathD}
        fill="none"
        className="canvas-edge"
        stroke={isDark ? '#86EFAC' : '#1F2A17'}
        strokeWidth="2"
        strokeDasharray="4,4"
        markerEnd={isDark ? 'url(#canvas-arrow-hover-dark)' : 'url(#canvas-arrow-hover)'}
      />
    );
  };

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'visible',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      <defs>
        <marker
          id="canvas-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#9B9A97" />
        </marker>
        <marker
          id="canvas-arrow-dark"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#71717A" />
        </marker>
        <marker
          id="canvas-arrow-hover"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#1F2A17" />
        </marker>
        <marker
          id="canvas-arrow-hover-dark"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#86EFAC" />
        </marker>
      </defs>

      {edges.map(renderEdge)}
      {renderConnectingPreview()}
    </svg>
  );
};
