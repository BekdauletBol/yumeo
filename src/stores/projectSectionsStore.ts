import { create } from 'zustand';
import type { ProjectSection } from '@/lib/types';

interface ProjectSectionsState {
  sections: ProjectSection[];
  activeSectionId: string | null;

  setSections: (sections: ProjectSection[]) => void;
  addSection: (section: ProjectSection) => void;
  removeSection: (id: string) => void;
  toggleSection: (id: string) => void;  // Toggle active/inactive
  setActiveSection: (id: string | null) => void;
  reorderSections: (newOrder: ProjectSection[]) => void;
}

export const useProjectSectionsStore = create<ProjectSectionsState>((set) => ({
  sections: [],
  activeSectionId: null,

  setSections: (sections) => {
    set({ sections });
    // Auto-select first active section if none selected
    if (!sections.some(s => s.id === useProjectSectionsStore.getState().activeSectionId)) {
      const firstActive = sections.find(s => s.isActive);
      set({ activeSectionId: firstActive?.id ?? null });
    }
  },

  addSection: (section) =>
    set((state) => ({
      sections: [...state.sections, section].sort((a, b) => a.displayOrder - b.displayOrder),
      activeSectionId: state.activeSectionId ?? section.id,
    })),

  removeSection: (id) =>
    set((state) => {
      const newSections = state.sections.filter((s) => s.id !== id);
      return {
        sections: newSections,
        activeSectionId: state.activeSectionId === id ? (newSections[0]?.id ?? null) : state.activeSectionId,
      };
    }),

  toggleSection: (id) =>
    set((state) => ({
      sections: state.sections.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s)),
    })),

  setActiveSection: (id) => set({ activeSectionId: id }),

  reorderSections: (newOrder) => set({ sections: newOrder }),
}));
