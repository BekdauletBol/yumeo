'use client';

import { useEffect, useRef } from 'react';
import { IDELayout } from '@/components/ide/IDELayout';
import { TopBar } from '@/components/ide/TopBar';
import { Sidebar } from '@/components/ide/Sidebar';
import { ChatPanel } from '@/components/ide/ChatPanel';
import { EditorPanel } from '@/components/ide/EditorPanel';
import { useProjectStore } from '@/stores/projectStore';
import { useMaterialsStore } from '@/stores/materialsStore';
import type { Project, Material } from '@/lib/types';

interface WorkspaceClientProps {
  project: Project;
  initialMaterials: Material[];
}

/**
 * Client-side wrapper that hydrates Zustand stores from server data,
 * then renders the full 3-panel IDE layout.
 */
export function WorkspaceClient({ project, initialMaterials }: WorkspaceClientProps) {
  const setActiveProject = useProjectStore((s) => s.setActiveProject);
  const setMaterials = useMaterialsStore((s) => s.setMaterials);
  const seededProjectIdRef = useRef<string | null>(null);

  // Seed stores with server-fetched data on mount
  useEffect(() => {
    if (seededProjectIdRef.current === project.id) return;
    seededProjectIdRef.current = project.id;

    setActiveProject(project);
    setMaterials(initialMaterials);
  }, [project, initialMaterials, setActiveProject, setMaterials]);

  return (
    <IDELayout
      topBar={<TopBar />}
      sidebar={<Sidebar />}
      chat={<ChatPanel />}
      editor={<EditorPanel />}
    />
  );
}