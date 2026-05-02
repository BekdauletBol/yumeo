'use client';

import { useEffect, useRef } from 'react';
import { IDELayout } from '@/components/ide/IDELayout';
import { TopBar } from '@/components/ide/TopBar';
import { Sidebar } from '@/components/ide/Sidebar';
import { ChatPanel } from '@/components/ide/ChatPanel';
import { EditorPanel } from '@/components/ide/EditorPanel';
import { SectionInputModals } from '@/components/sections/SectionInputModals';
import { useProjectStore } from '@/stores/projectStore';
import { useMaterialsStore } from '@/stores/materialsStore';
import { useProjectSectionsStore } from '@/stores/projectSectionsStore';
import { useProjectSections } from '@/hooks/useProjectSections';
import { ProjectEmptyState } from '@/components/sections/ProjectEmptyState';
import type { Project, Material } from '@/lib/types';

interface WorkspaceClientProps {
  project: Project;
  initialMaterials: Material[];
}

/**
 * Client-side wrapper that hydrates Zustand stores from server data,
 * then renders the full 3-panel IDE layout or empty state.
 *
 * Empty state is shown when: user has created sections but has no materials yet.
 * Allows user to add content to each section.
 */
export function WorkspaceClient({ project, initialMaterials }: WorkspaceClientProps) {
  const setActiveProject = useProjectStore((s) => s.setActiveProject);
  const setMaterials = useMaterialsStore((s) => s.setMaterials);
  const sections = useProjectSectionsStore((s) => s.sections);
  const seededProjectIdRef = useRef<string | null>(null);

  // Load project sections
  useProjectSections(project.id);

  // Seed stores with server-fetched data on mount
  useEffect(() => {
    if (seededProjectIdRef.current === project.id) return;
    seededProjectIdRef.current = project.id;

    setActiveProject(project);
    setMaterials(initialMaterials);
  }, [project, initialMaterials, setActiveProject, setMaterials]);

  // Show empty state only if no sections exist yet (Step 1 of flow)
  if (sections.length === 0) {
    return <ProjectEmptyState projectId={project.id} />;
  }

  return (
    <>
      <IDELayout
        topBar={<TopBar />}
        sidebar={<Sidebar />}
        chat={<ChatPanel />}
        editor={<EditorPanel />}
      />
      {/* Modals for adding content to each section */}
      <SectionInputModals />
    </>
  );
}