import React, { useState, useRef, useCallback, useEffect } from 'react';

interface UseCanvasViewportOptions {
  initialZoom?: number;
  initialPan?: { x: number; y: number };
}

export function useCanvasViewport({
  initialZoom = 1,
  initialPan = { x: 300, y: 150 },
}: UseCanvasViewportOptions = {}) {
  const [zoom, setZoom] = useState(initialZoom);
  const [pan, setPan] = useState(initialPan);
  const [isPanning, setIsPanning] = useState(false);
  const startPanRef = useRef({ x: 0, y: 0 });

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(2.5, Number((z + 0.15).toFixed(2))));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(0.25, Number((z - 0.15).toFixed(2))));
  }, []);

  const handleResetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 300, y: 150 });
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.05 : 0.95;
      setZoom((z) => Math.min(2.5, Math.max(0.25, Number((z * zoomFactor).toFixed(2)))));
    } else {
      setPan((p) => ({
        x: Math.round(p.x - e.deltaX),
        y: Math.round(p.y - e.deltaY),
      }));
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 1 || (e.button === 0 && e.altKey) || (e.target as HTMLElement).id === 'canvas-grid-bg') {
      setIsPanning(true);
      startPanRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  }, [pan]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isPanning) {
        setPan({
          x: Math.round(e.clientX - startPanRef.current.x),
          y: Math.round(e.clientY - startPanRef.current.y),
        });
      }
    },
    [isPanning]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  return {
    zoom,
    setZoom,
    pan,
    setPan,
    isPanning,
    handleZoomIn,
    handleZoomOut,
    handleResetView,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}
