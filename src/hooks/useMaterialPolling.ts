import { useEffect } from 'react';
import { useMaterialsStore } from '@/stores/materialsStore';
import { getMaterialAction } from '@/app/actions/materials';

export function useMaterialPolling() {
  const materials = useMaterialsStore((s) => s.materials);
  const updateMaterial = useMaterialsStore((s) => s.updateMaterial);

  useEffect(() => {
    // Find materials that need polling
    const processingMaterials = materials.filter(m => m.status === 'processing');
    
    if (processingMaterials.length === 0) return;

    const interval = setInterval(() => {
      processingMaterials.forEach(async (material) => {
        try {
          const updated = await getMaterialAction(material.id);
          if (updated.status !== 'processing') {
            updateMaterial(updated);
          }
        } catch (err) {
          console.error('Error polling material status:', err);
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [materials, updateMaterial]);
}
