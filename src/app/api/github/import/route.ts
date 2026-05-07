import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { fetchGitHubRepoFiles } from '@/lib/github/client';
import { getProject } from '@/lib/db/projects';
import { createMaterial } from '@/lib/db/materials';
import { chunkAndEmbedMaterial } from '@/lib/agent/rag';
import { createServiceClient } from '@/lib/db/supabase';
import type { Material } from '@/lib/types';

export const maxDuration = 60; // Extend timeout for GitHub import

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
    const supabase = createServiceClient();

    // Create materials for each file
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
      createdMaterials.push(material);
    }

    // Process chunking/embedding in parallel with a concurrency limit
    const CONCURRENCY = 3;
    const processBatch = async (materials: Material[]) => {
      await Promise.all(
        materials.map(async (m) => {
          try {
            await chunkAndEmbedMaterial(m);
            await supabase.from('materials').update({ status: 'ready' }).eq('id', m.id);
          } catch (err) {
            console.error(`Failed to process GitHub material ${m.name}:`, err);
            await supabase.from('materials').update({ status: 'error' }).eq('id', m.id);
          }
        })
      );
    };

    for (let i = 0; i < createdMaterials.length; i += CONCURRENCY) {
      const batch = createdMaterials.slice(i, i + CONCURRENCY);
      await processBatch(batch);
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
