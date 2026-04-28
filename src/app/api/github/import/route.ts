import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { fetchGitHubRepoFiles } from '@/lib/github/client';
import { getProject } from '@/lib/db/projects';
import { createMaterial } from '@/lib/db/materials';
import { chunkAndEmbedMaterial } from '@/lib/agent/rag';
import type { Material } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { repo, projectId } = await req.json();
    if (!repo || !projectId) {
      return NextResponse.json({ error: 'Missing repo or projectId' }, { status: 400 });
    }

    // Verify project ownership
    await getProject(projectId, userId);

    // Fetch repository files
    const files = await fetchGitHubRepoFiles(repo);

    const createdMaterials: Material[] = [];

    // Create materials for each file and chunk/embed them
    for (const file of files) {
      const material = await createMaterial({
        projectId,
        name: `[GitHub] ${file.path}`,
        section: 'references',
        content: file.content,
        metadata: {
          fileType: 'text',
          fileSize: file.content.length,
          repoUrl: `https://github.com/${repo}`,
        },
      });

      // Background chunking
      await chunkAndEmbedMaterial(material);
      createdMaterials.push(material);
    }

    return NextResponse.json({ materials: createdMaterials });
  } catch (error) {
    console.error('GitHub import error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import repository' },
      { status: 500 }
    );
  }
}
