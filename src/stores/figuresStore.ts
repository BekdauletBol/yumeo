import { create } from 'zustand';
import type { Figure } from '@/lib/types';

interface FiguresState {
  figures: Figure[];
  setFigures: (figures: Figure[]) => void;
  addFigure: (figure: Figure) => void;
  updateFigure: (figure: Figure) => void;
  removeFigure: (id: string) => void;
}

export const useFiguresStore = create<FiguresState>((set) => ({
  figures: [],
  setFigures: (figures) => set({ figures }),
  addFigure: (figure) => set((state) => ({ figures: [...state.figures, figure] })),
  updateFigure: (updated) => set((state) => ({ figures: state.figures.map(f => f.id === updated.id ? updated : f) })),
  removeFigure: (id) => set((state) => ({ figures: state.figures.filter(f => f.id !== id) })),
}));
