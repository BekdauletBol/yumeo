import { create } from 'zustand';

interface UIState {
  rightPanelTab:
    | 'drafts'
    | 'references'
    | 'figures'
    | 'tables'
    | 'templates'
    | 'mermaid'
    | 'latex';
  isMobileSidebarOpen: boolean;
  isChatResizing: boolean;
  mobileTab: 'sidebar' | 'chat' | 'editor';
  highlightedMaterialId: string | null;
  mermaidSource: string;
  latexSource: string;

  // Citation Viewer
  citationViewer: {
    isOpen: boolean;
    materialId: string | null;
    pageNumber: number | null;
    highlightedText: string | null;
  };

  setRightPanelTab: (tab: UIState['rightPanelTab']) => void;
  setMobileSidebarOpen: (isOpen: boolean) => void;
  setChatResizing: (isResizing: boolean) => void;
  setHighlightedMaterialId: (id: string | null) => void;
  setMermaidSource: (source: string) => void;
  setLatexSource: (source: string) => void;
  setMobileTab: (tab: 'sidebar' | 'chat' | 'editor') => void;
  
  openCitationViewer: (materialId: string, pageNumber?: number, text?: string) => void;
  closeCitationViewer: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  rightPanelTab: 'references',
  isMobileSidebarOpen: false,
  isChatResizing: false,
  mobileTab: 'chat',
  highlightedMaterialId: null,
  mermaidSource: '',
  latexSource: '',
  
  citationViewer: {
    isOpen: false,
    materialId: null,
    pageNumber: null,
    highlightedText: null,
  },

  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
  setMobileSidebarOpen: (isOpen) => set({ isMobileSidebarOpen: isOpen }),
  setChatResizing: (isResizing) => set({ isChatResizing: isResizing }),
  setHighlightedMaterialId: (id) => set({ highlightedMaterialId: id }),
  setMermaidSource: (source) => set({ mermaidSource: source }),
  setLatexSource: (source) => set({ latexSource: source }),
  setMobileTab: (tab) => set({ mobileTab: tab }),

  openCitationViewer: (materialId, pageNumber, text) => set({
    citationViewer: {
      isOpen: true,
      materialId,
      pageNumber: pageNumber || 1,
      highlightedText: text || null,
    }
  }),
  closeCitationViewer: () => set((state) => ({
    citationViewer: { ...state.citationViewer, isOpen: false }
  })),
}));
