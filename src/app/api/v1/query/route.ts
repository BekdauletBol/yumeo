import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/db/supabase';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
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
  const body = await req.json();
  const { query } = body;

  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
  }

  try {
    const openai = new OpenAI();
    // Generate embedding for query
    const embedRes = await openai.embeddings.create({
      input: query,
      model: 'text-embedding-3-small',
    });
    const embedding = embedRes.data[0]?.embedding;

    // Retrieve chunks
    const { data: chunks, error: matchError } = await supabase.rpc('match_chunks', {
      query_embedding: embedding,
      match_threshold: 0.6,
      match_count: 5,
      p_project_id: project_id
    });

    if (matchError) throw matchError;

    const contextText = chunks?.map((c: any, i: number) => `[Source ${i + 1} (Chunk ${c.id})]: ${c.content}`).join('\n\n') || '';

    // LLM synthesis
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: `You are a helpful assistant. Synthesize an answer to the user's query based ONLY on the provided context. Cite sources using [Source X].\n\nContext:\n${contextText}` },
        { role: 'user', content: query }
      ]
    });

    return NextResponse.json({
      answer: completion.choices[0]?.message?.content || 'No answer generated.',
      sources: chunks?.map((c: any, i: number) => ({
        id: c.id,
        index: i + 1,
        material_id: c.material_id,
        similarity: c.similarity
      })) || []
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
