import { useEffect, useRef } from 'react';
import { useMaterialsStore } from '@/stores/materialsStore';
import { getMaterialAction } from '@/app/actions/materials';

/**
 * Robust polling hook that checks for material status updates.
 * Only active when there are materials in 'processing' or 'uploading' state.
 */
export function useMaterialPolling() {
  const materials = useMaterialsStore((s) => s.materials);
  const updateMaterial = useMaterialsStore((s) => s.updateMaterial);
  
  // Track IDs we are already polling to avoid redundant requests
  const pollingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Find materials that need polling
    const processingIds = materials
      .filter(m => m.status === 'processing' || m.status === 'uploading')
      .map(m => m.id);
    
    if (processingIds.length === 0) {
      pollingRef.current.clear();
      return;
    }

    // Filter to only new IDs we haven't seen in this effect cycle
    const newIds = processingIds.filter(id => !pollingRef.current.has(id));
    if (newIds.length === 0 && pollingRef.current.size === processingIds.length) {
      // Already polling exactly these IDs
      return;
    }

    // Update the set of IDs we are tracking
    pollingRef.current = new Set(processingIds);

    const interval = setInterval(() => {
      // Re-read from store to get latest state during the tick
      const currentMaterials = useMaterialsStore.getState().materials;
      const stillProcessing = currentMaterials.filter(m => 
        pollingRef.current.has(m.id) && 
        (m.status === 'processing' || m.status === 'uploading')
      );

      if (stillProcessing.length === 0) {
        clearInterval(interval);
        return;
      }

      stillProcessing.forEach(async (material) => {
        try {
          const updated = await getMaterialAction(material.id);
          if (updated.status !== 'processing' && updated.status !== 'uploading') {
            updateMaterial(updated);
            // Remove from our active tracking set
            pollingRef.current.delete(updated.id);
          }
        } catch (err) {
          console.error(`[Polling] Error for material ${material.id}:`, err);
        }
      });
    }, 3000); // 3 seconds is a reasonable balance

    return () => clearInterval(interval);
  }, [materials.length, updateMaterial]); // Only re-run when count changes or store method changes
}
