import { useEffect } from 'react';
import { useProjectSectionsStore } from '@/stores/projectSectionsStore';
import { useMaterialsStore } from '@/stores/materialsStore';
import { getProjectSectionsAction } from '@/app/actions/sections';

/**
 * Hook to load and manage project sections
 * Fetches sections from server and syncs with store
 */
export function useProjectSections(projectId: string | undefined) {
  const { setSections } = useProjectSectionsStore();

  useEffect(() => {
    if (!projectId) return;

    const loadSections = async () => {
      try {
        const sections = await getProjectSectionsAction(projectId);
        setSections(sections);
      } catch (err) {
        console.error('Failed to load project sections:', err);
      }
    };

    loadSections();
  }, [projectId, setSections]);
}

/**
 * Hook to get materials grouped by section
 */
export function useMaterialsBySection(projectId: string | undefined) {
  const sections = useProjectSectionsStore((s) => s.sections);
  const materials = useMaterialsStore((s) => s.materials);

  return materials
    .filter((m) => m.projectId === projectId)
    .sort((a, b) => {
      // Sort by section display order
      const secA = sections.find((s) => s.id === a.sectionId);
      const secB = sections.find((s) => s.id === b.sectionId);
      return (secA?.displayOrder ?? 0) - (secB?.displayOrder ?? 0);
    });
}
