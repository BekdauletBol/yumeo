import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import { getProject } from '@/lib/db/projects';
import { getMaterials } from '@/lib/db/materials';
import { WorkspaceClient } from './WorkspaceClient';

interface ProjectPageProps {
  params: { projectId: string };
}

/**
 * Server component — fetches project + materials, then hands off to client.
 */
export default async function ProjectPage({ params }: ProjectPageProps) {
  const { userId } = auth();
  if (!userId) return null;

  let project;
  try {
    project = await getProject(params.projectId, userId);
  } catch {
    notFound();
  }

  const materials = await getMaterials(params.projectId);

  return <WorkspaceClient project={project} initialMaterials={materials} />;
}

export async function generateMetadata({ params }: ProjectPageProps) {
  const { userId } = auth();
  if (!userId) return {};
  try {
    const project = await getProject(params.projectId, userId);
    return { title: `${project.name} — Yumeo` };
  } catch {
    return { title: 'Project — Yumeo' };
  }
}