import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/db/supabase';

export async function GET(req: NextRequest, { params }: { params: { chunkId: string } }) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
  }

  const apiKey = authHeader.split(' ')[1] || '';
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

  const supabase = createServiceClient();

  // Validate API key
  const { data: keyRecord, error: keyError } = await supabase
    .from('api_keys')
    .select('project_id')
    .eq('key_hash', keyHash)
    .single();

  if (keyError || !keyRecord) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  const { project_id } = keyRecord;
  const chunkId = params.chunkId;

  try {
    const { data: chunk, error: chunkError } = await supabase
      .from('chunks')
      .select('id, material_id, content, metadata, verified_by_human')
      .eq('id', chunkId)
      .eq('project_id', project_id)
      .single();

    if (chunkError || !chunk) {
      return NextResponse.json({ error: 'Chunk not found or unauthorized' }, { status: 404 });
    }

    const { data: material } = await supabase
      .from('materials')
      .select('name')
      .eq('id', chunk.material_id)
      .single();

    return NextResponse.json({
      id: chunk.id,
      content: chunk.content,
      verified_by_human: chunk.verified_by_human,
      metadata: {
        ...chunk.metadata,
        source_name: material?.name
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
