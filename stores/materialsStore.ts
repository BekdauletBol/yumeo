import { create } from 'zustand';
import type { Material, MaterialSection } from '@/lib/types';

interface MaterialsState {
  materials: Material[];
  activeSection: MaterialSection;
  selectedMaterialId: string | null;

  setMaterials: (materials: Material[]) => void;
  addMaterial: (material: Material) => void;
  updateMaterial: (material: Material) => void;
  removeMaterial: (id: string) => void;
  setActiveSection: (section: MaterialSection) => void;
  setSelectedMaterialId: (id: string | null) => void;

}

export const useMaterialsStore = create<MaterialsState>((set) => ({
  materials: [],
  activeSection: 'references',
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

  setActiveSection: (section) => set({ activeSection: section }),
  setSelectedMaterialId: (id) => set({ selectedMaterialId: id }),
}));