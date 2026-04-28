'use client';

import { useEffect, useState } from 'react';
import { getProject } from '@/lib/db/projects';
import { getMaterials } from '@/lib/db/materials';
import { useProjectStore } from '@/stores/projectStore';
import { useMaterialsStore } from '@/stores/materialsStore';
import type { Project, Material } from '@/lib/types';

// ─── useProject ───────────────────────────────────────────────────────────────

interface UseProjectResult {
  project: Project | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetch and subscribe to a single project.
 * Populates the project store on success.
 */
export function useProject(projectId: string, userId: string): UseProjectResult {
  const setActiveProject = useProjectStore((s) => s.setActiveProject);
  const [state, setState] = useState<UseProjectResult>({
    project: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState({ project: null, loading: true, error: null });
      try {
        const p = await getProject(projectId, userId);
        if (cancelled) return;
        setActiveProject(p);
        setState({ project: p, loading: false, error: null });
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Failed to load project';
        setState({ project: null, loading: false, error: msg });
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [projectId, userId, setActiveProject]);

  return state;
}

// ─── useMaterials ─────────────────────────────────────────────────────────────

interface UseMaterialsResult {
  materials: Material[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Fetch all materials for a project.
 * Populates the materials store on success.
 */
export function useMaterials(projectId: string): UseMaterialsResult {
  const setMaterials = useMaterialsStore((s) => s.setMaterials);
  const materials = useMaterialsStore((s) => s.materials);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const m = await getMaterials(projectId);
        if (cancelled) return;
        setMaterials(m);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load materials');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [projectId, version, setMaterials]);

  return {
    materials,
    loading,
    error,
    reload: () => setVersion((v) => v + 1),
  };
}