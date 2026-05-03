import { create } from 'zustand';
import type { ContentToInsert } from '@/lib/utils/insertContentIntoDraft';

interface AddToReportStore {
  // Track which draft is active for insertion
  activeDraftId: string | null;
  setActiveDraftId: (id: string | null) => void;

  // Queue of items to insert
  pendingInsertions: ContentToInsert[];
  queueInsertion: (item: ContentToInsert) => void;
  clearQueue: () => void;
  shiftQueue: () => ContentToInsert | null;
}

export const useAddToReportStore = create<AddToReportStore>((set, get) => ({
  activeDraftId: null,
  setActiveDraftId: (id) => set({ activeDraftId: id }),

  pendingInsertions: [],
  queueInsertion: (item) => set((state) => ({
    pendingInsertions: [...state.pendingInsertions, item],
  })),
  clearQueue: () => set({ pendingInsertions: [] }),
  shiftQueue: () => {
    const state = get();
    if (state.pendingInsertions.length === 0) return null;
    const [first, ...rest] = state.pendingInsertions;
    set({ pendingInsertions: rest });
    return first || null;
  },
}));
