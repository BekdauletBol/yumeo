'use server';

import { auth } from '@clerk/nextjs/server';
import { uploadMaterialFile, createMaterial } from '@/lib/db/materials';
import { checkMaterialLimitAction } from './plans';
import type { MaterialSection } from '@/lib/types';

export async function uploadMaterialAction(formData: FormData) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');

  const file = formData.get('file') as File;
  const projectId = formData.get('projectId') as string;
  const section = formData.get('section') as MaterialSection;
  const sectionId = formData.get('sectionId') as string | undefined;
  const content = formData.get('content') as string;
  const metadataStr = formData.get('metadata') as string;
  const metadata = JSON.parse(metadataStr);

  if (!file || !projectId || !section) {
    throw new Error('Missing required fields');
  }

  // 1. Check usage limits
  const limitCheck = await checkMaterialLimitAction(projectId);
  if (!limitCheck.allowed) {
    throw new Error(limitCheck.message);
  }

  // 2. Create material placeholder to get ID
  const material = await createMaterial({
    projectId,
    section,
    sectionId,
    name: file.name,
    content: content || '',
    metadata,
    status: 'processing',
  });

  // 3. Upload file to storage with RLS-compliant path
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const storageUrl = await uploadMaterialFile(
      userId,
      projectId,
      material.id,
      buffer,
      file.name
    );

    // 4. Update material with storage URL
    const { updateMaterial } = await import('@/lib/db/materials');
    return await updateMaterial(material.id, { storageUrl });
  } catch (err) {
    // Cleanup if upload fails
    const { deleteMaterial } = await import('@/lib/db/materials');
    await deleteMaterial(material.id);
    throw err;
  }
}
