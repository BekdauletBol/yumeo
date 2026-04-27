'use client';

import { useEffect, useState, useCallback } from 'react';
import { getMaterials } from '@/lib/db/materials';
import { useMaterialsStore } from '@/stores/materialsStore';
import type { Material } from '@/lib/types';

interface UseMaterialsResult {
  materials: Material[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Fetches and subscribes to all materials for a given project.
 * Hydrates the Zustand store so the sidebar and chat panel stay in sync.
 */
export function useMaterials(projectId: string): UseMaterialsResult {
  const setMaterials = useMaterialsStore((s) => s.setMaterials);
  const materials    = useMaterialsStore((s) => s.materials);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [tick, setTick]         = useState(0);

  const reload = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getMaterials(projectId);
        if (!cancelled) {
          setMaterials(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load materials');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [projectId, tick, setMaterials]);

  return { materials, loading, error, reload };
}