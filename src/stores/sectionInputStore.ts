import { create } from 'zustand';
import type { MaterialSection } from '@/lib/types';

interface SectionInputState {
  openSection: MaterialSection | null;
  openModal: (section: MaterialSection) => void;
  closeModal: () => void;
}

export const useSectionInputStore = create<SectionInputState>((set) => ({
  openSection: null,
  openModal: (section: MaterialSection) => set({ openSection: section }),
  closeModal: () => set({ openSection: null }),
}));
