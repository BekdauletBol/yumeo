import { create } from 'zustand';

interface UIState {
  rightPanelTab:
    | 'references'
    | 'figures'
    | 'tables'
    | 'templates'
    | 'mermaid'
    | 'latex';
  isMobileSidebarOpen: boolean;
  isCommandPaletteOpen: boolean;
  highlightedMaterialId: string | null;
  mermaidSource: string;
  latexSource: string;

  setRightPanelTab: (tab: UIState['rightPanelTab']) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setHighlightedMaterialId: (id: string | null) => void;
  setMermaidSource: (source: string) => void;
  setLatexSource: (source: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  rightPanelTab: 'references',
  isMobileSidebarOpen: false,
  isCommandPaletteOpen: false,
  highlightedMaterialId: null,
  mermaidSource: `graph TD
  A[Upload Materials] --> B[Ask Question]
  B --> C[Grounded Answer]
  C --> D[Iterate Faster]`,
  latexSource: `# LaTeX Editor

Inline math example: $E = mc^2$

Block math example:
$$
\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}
$$`,

  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
  setMobileSidebarOpen: (open) => set({ isMobileSidebarOpen: open }),
  toggleMobileSidebar: () =>
    set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  setHighlightedMaterialId: (id) => set({ highlightedMaterialId: id }),
  setMermaidSource: (source) => set({ mermaidSource: source }),
  setLatexSource: (source) => set({ latexSource: source }),
}));