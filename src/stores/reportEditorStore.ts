import { create } from 'zustand';

interface ReportEditorStore {
  isOpen: boolean;
  initialContent: string;
  initialTitle: string;
  draftId: string | undefined;

  /** Open the editor with a pre-filled content string (e.g., from AI generation) */
  openWithContent: (content: string, title?: string) => void;
  /** Open the editor pointing to an existing draft material id */
  openWithDraft: (draftId: string) => void;
  close: () => void;
}

export const useReportEditorStore = create<ReportEditorStore>((set) => ({
  isOpen: false,
  initialContent: '',
  initialTitle: 'Untitled Report',
  draftId: undefined,

  openWithContent: (content, title = 'Generated Report') =>
    set({ isOpen: true, initialContent: content, initialTitle: title, draftId: undefined }),

  openWithDraft: (draftId) =>
    set({ isOpen: true, draftId, initialContent: '', initialTitle: 'Untitled Report' }),

  close: () =>
    set({ isOpen: false, initialContent: '', initialTitle: 'Untitled Report', draftId: undefined }),
}));
