import { create } from 'zustand';
import type { Material } from '@/lib/types';

interface MaterialsState {
  materials: Material[];
  selectedMaterialId: string | null;

  setMaterials: (materials: Material[]) => void;
  addMaterial: (material: Material) => void;
  updateMaterial: (material: Material) => void;
  removeMaterial: (id: string) => void;
  setSelectedMaterialId: (id: string | null) => void;
  
  // Helper: get materials for a specific section
  getMaterialsBySection: (sectionId: string) => Material[];
}

export const useMaterialsStore = create<MaterialsState>((set, get) => ({
  materials: [],
  selectedMaterialId: null,

  setMaterials: (materials) => set({ materials }),

  addMaterial: (material) =>
    set((state) => ({ materials: [...state.materials, material] })),

  updateMaterial: (updated) =>
    set((state) => ({
      materials: state.materials.map((m) => (m.id === updated.id ? updated : m)),
    })),

  removeMaterial: (id) =>
    set((state) => ({
      materials: state.materials.filter((m) => m.id !== id),
      selectedMaterialId:
        state.selectedMaterialId === id ? null : state.selectedMaterialId,
    })),

  setSelectedMaterialId: (id) => set({ selectedMaterialId: id }),

  getMaterialsBySection: (sectionId: string) => {
    const { materials } = get();
    return materials.filter((m) => m.sectionId === sectionId);
  },
}));