import { create } from 'zustand';

interface ReportEditorStore {
  isOpen: boolean;
  /** Array of HTML strings, one for each page */
  pages: string[];
  initialTitle: string;
  draftId: string | undefined;
  activePageIndex: number;

  /** Open the editor with a pre-filled content string (split into pages if needed) */
  openWithContent: (content: string, title?: string) => void;
  /** Open the editor pointing to an existing draft material id */
  openWithDraft: (draftId: string) => void;
  
  setPages: (pages: string[]) => void;
  updatePage: (index: number, content: string) => void;
  addPage: (afterIndex?: number) => void;
  removePage: (index: number) => void;
  setActivePage: (index: number) => void;
  
  close: () => void;
}

export const useReportEditorStore = create<ReportEditorStore>((set) => ({
  isOpen: false,
  pages: [''],
  initialTitle: 'Untitled Report',
  draftId: undefined,
  activePageIndex: 0,

  openWithContent: (content, title = 'Generated Report') => {
    // Basic logic to split by logical breaks if present, or just start with one page
    const splitPages = content.includes('<!-- PAGE_BREAK -->') 
      ? content.split('<!-- PAGE_BREAK -->') 
      : [content];
    
    set({ 
      isOpen: true, 
      pages: splitPages.length > 0 ? splitPages : [''], 
      initialTitle: title, 
      draftId: undefined,
      activePageIndex: 0
    });
  },

  openWithDraft: (draftId) =>
    set({ isOpen: true, draftId, pages: [''], initialTitle: 'Untitled Report', activePageIndex: 0 }),

  setPages: (pages) => set({ pages }),

  updatePage: (index, content) =>
    set((state) => {
      const newPages = [...state.pages];
      newPages[index] = content;
      return { pages: newPages };
    }),

  addPage: (afterIndex) =>
    set((state) => {
      const insertIdx = afterIndex !== undefined ? afterIndex + 1 : state.pages.length;
      const newPages = [...state.pages];
      newPages.splice(insertIdx, 0, '');
      return { pages: newPages, activePageIndex: insertIdx };
    }),

  removePage: (index) =>
    set((state) => {
      if (state.pages.length <= 1) return state; // Keep at least one page
      const newPages = state.pages.filter((_, i) => i !== index);
      const newActive = Math.min(state.activePageIndex, newPages.length - 1);
      return { pages: newPages, activePageIndex: newActive };
    }),

  setActivePage: (index) => set({ activePageIndex: index }),

  close: () =>
    set({ isOpen: false, pages: [''], initialTitle: 'Untitled Report', draftId: undefined, activePageIndex: 0 }),
}));
