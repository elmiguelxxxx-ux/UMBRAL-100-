import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { ActivityResourceType } from '../activityLogService';

export interface MissionTargetAction {
  resourceType?: ActivityResourceType | 'biblioteca';
  resourceId?: string;
  resourceTitle?: string;
  route?: string;
  view?: string;
  pdfId?: string;
}

export interface ToastData {
  text: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NavigationContextType {
  activeView: string;
  setActiveView: (view: string) => void;
  selectedFolderId: string;
  setSelectedFolderId: (id: string) => void;
  openPdfId: string | null;
  setOpenPdfId: (id: string | null) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  isOverlayOpen: boolean;
  setIsOverlayOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toastMessage: ToastData | null;
  showToast: (text: string, action?: { label: string; onClick: () => void }) => void;
  clearToast: () => void;
  handleOpenPdf: (pdfId: string) => void;
  handleClosePdfEditor: (fallbackFolderId?: string) => void;
  handleMissionContinue: (target: MissionTargetAction) => void;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

interface NavigationProviderProps {
  onCanvasBoardSelect?: (boardId: string) => void;
  children: React.ReactNode;
}

export function NavigationProvider({
  onCanvasBoardSelect,
  children,
}: NavigationProviderProps) {
  // Cargar estado inicial desde localStorage
  const initialPdfId = typeof window !== 'undefined' ? localStorage.getItem('umbral-last-pdf') : null;
  const initialView = initialPdfId
    ? 'pdf-editor'
    : (typeof window !== 'undefined' ? localStorage.getItem('umbral-last-view') || 'inicio' : 'inicio');

  const [activeView, setActiveView] = useState<string>(initialView);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('root');
  const [openPdfId, setOpenPdfId] = useState<string | null>(initialPdfId);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState(true);
  const [toastMessage, setToastMessage] = useState<ToastData | null>(null);

  const lastActivityRef = useRef<number>(Date.now());

  const handleOpenPdf = useCallback((pdfId: string) => {
    setOpenPdfId(pdfId);
    try {
      localStorage.setItem('umbral-last-pdf', pdfId);
    } catch {}
    setActiveView('pdf-editor');
  }, []);

  // Persistir última vista activa
  useEffect(() => {
    if (activeView && activeView !== 'pdf-editor') {
      try {
        localStorage.setItem('umbral-last-view', activeView);
      } catch {}
    }
  }, [activeView]);

  const onCanvasBoardSelectRef = useRef(onCanvasBoardSelect);
  useEffect(() => {
    onCanvasBoardSelectRef.current = onCanvasBoardSelect;
  }, [onCanvasBoardSelect]);

  const activeViewRef = useRef(activeView);
  activeViewRef.current = activeView;
  const openPdfIdRef = useRef(openPdfId);
  openPdfIdRef.current = openPdfId;
  const selectedFolderIdRef = useRef(selectedFolderId);
  selectedFolderIdRef.current = selectedFolderId;

  // Manejo de deep-linking /biblioteca/{resource_type}/{resource_id}
  useEffect(() => {
    const handleUrlRoute = () => {
      if (typeof window === 'undefined') return;
      const pathname = window.location.pathname;
      const match = pathname.match(/^\/biblioteca\/([^/]+)\/([^/]+)/);
      if (match) {
        const [, rType, rId] = match;
        if (rType === 'pdf') {
          if (openPdfIdRef.current !== rId || activeViewRef.current !== 'pdf-editor') {
            handleOpenPdf(rId);
          }
        } else if (rType === 'flashcard_deck') {
          if (openPdfIdRef.current !== null) setOpenPdfId(null);
          if (rId !== 'all' && selectedFolderIdRef.current !== rId) setSelectedFolderId(rId);
          if (activeViewRef.current !== 'aprendizaje') setActiveView('aprendizaje');
        } else if (rType === 'canvas') {
          if (openPdfIdRef.current !== null) setOpenPdfId(null);
          if (rId && onCanvasBoardSelectRef.current) {
            onCanvasBoardSelectRef.current(rId);
          }
          if (activeViewRef.current !== 'canvas') setActiveView('canvas');
        }
      }
    };

    handleUrlRoute();
    window.addEventListener('popstate', handleUrlRoute);
    return () => window.removeEventListener('popstate', handleUrlRoute);
  }, [handleOpenPdf]);

  // Monitor de inactividad (5 minutos = 300,000 ms)
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, updateActivity, { passive: true }));

    const checkInactivity = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastActivityRef.current;
      if (elapsed >= 5 * 60 * 1000) {
        setIsOverlayOpen(true);
        lastActivityRef.current = Date.now();
      }
    }, 10000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, updateActivity));
      clearInterval(checkInactivity);
    };
  }, []);

  // Atajo de teclado (Cmd/Ctrl + M) para alternar el Mission Control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setIsOverlayOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClosePdfEditor = useCallback((fallbackFolderId?: string) => {
    if (fallbackFolderId) {
      setSelectedFolderId(fallbackFolderId);
    }
    setOpenPdfId(null);
    try {
      localStorage.removeItem('umbral-last-pdf');
    } catch {}
    setActiveView('biblioteca');
  }, []);

  const showToast = useCallback((text: string, action?: { label: string; onClick: () => void }) => {
    setToastMessage({ text, action });
  }, []);

  const clearToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  const handleMissionContinue = useCallback(
    (target: MissionTargetAction) => {
      setIsOverlayOpen(false);
      lastActivityRef.current = Date.now();

      const { resourceType, resourceId, route, pdfId, view } = target;

      if (route) {
        try {
          window.history.pushState(null, '', route);
        } catch {}
      } else if (resourceType && resourceId) {
        try {
          window.history.pushState(null, '', `/biblioteca/${resourceType}/${resourceId}`);
        } catch {}
      }

      if (resourceType === 'pdf' && (resourceId || pdfId)) {
        handleOpenPdf(resourceId || pdfId!);
      } else if (resourceType === 'flashcard_deck') {
        setOpenPdfId(null);
        if (resourceId && resourceId !== 'all') {
          setSelectedFolderId(resourceId);
        }
        setActiveView('aprendizaje');
      } else if (resourceType === 'canvas') {
        setOpenPdfId(null);
        if (resourceId && onCanvasBoardSelect) {
          onCanvasBoardSelect(resourceId);
        }
        setActiveView('canvas');
      } else if (pdfId) {
        handleOpenPdf(pdfId);
      } else if (view) {
        setOpenPdfId(null);
        setActiveView(view);
      } else {
        setOpenPdfId(null);
        setActiveView('biblioteca');
      }
    },
    [handleOpenPdf, onCanvasBoardSelect]
  );

  const value = useMemo(
    () => ({
      activeView,
      setActiveView,
      selectedFolderId,
      setSelectedFolderId,
      openPdfId,
      setOpenPdfId,
      isSidebarCollapsed,
      setIsSidebarCollapsed,
      isOverlayOpen,
      setIsOverlayOpen,
      toastMessage,
      showToast,
      clearToast,
      handleOpenPdf,
      handleClosePdfEditor,
      handleMissionContinue,
    }),
    [
      activeView,
      selectedFolderId,
      openPdfId,
      isSidebarCollapsed,
      isOverlayOpen,
      toastMessage,
      showToast,
      clearToast,
      handleOpenPdf,
      handleClosePdfEditor,
      handleMissionContinue,
    ]
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation debe ser usado dentro de un NavigationProvider');
  }
  return context;
}
