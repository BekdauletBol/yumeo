import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/db/supabase';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { sentence, projectId } = body;

  if (!sentence || !projectId) {
    return NextResponse.json({ error: 'Missing sentence or projectId' }, { status: 400 });
  }

  try {
    const openai = new OpenAI();
    const supabase = createServiceClient();
    
    // Embed sentence
    const embedRes = await openai.embeddings.create({
      input: sentence,
      model: 'text-embedding-3-small',
    });
    const embedding = embedRes.data[0]?.embedding;

    if (!embedding) {
      throw new Error('Failed to generate embedding');
    }

    // Call vector match
    const { data: chunks, error } = await supabase.rpc('match_chunks', {
      query_embedding: embedding,
      match_threshold: 0.75, // 0.75 similarity threshold
      match_count: 1,
      p_project_id: projectId
    });

    if (error) {
      throw new Error(error.message);
    }

    if (chunks && chunks.length > 0) {
      const topMatch = chunks[0];
      
      // Get material name
      const { data: material } = await supabase.from('materials').select('name').eq('id', topMatch.material_id).single();
      
      return NextResponse.json({
        verified: true,
        score: topMatch.similarity,
        source: material?.name || 'Unknown source',
        page: topMatch.metadata?.page || 1,
      });
    }

    return NextResponse.json({
      verified: false,
      score: 0,
      source: '',
      page: 0,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
