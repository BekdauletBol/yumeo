import { createServiceClient } from '@/lib/db/supabase';
import OpenAI from 'openai';
import type { Material } from '@/lib/types';

// We use OpenAI for embeddings, or fallback to a dummy embedding if no key is present for MVP purposes
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key',
});

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

export function chunkText(text: string): string[] {
  // Basic recursive character text splitter
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + CHUNK_SIZE, text.length);
    let chunk = text.slice(i, end);
    
    // Try to break at a newline or period if not at the end
    if (end < text.length) {
      const lastNewline = chunk.lastIndexOf('\n');
      const lastPeriod = chunk.lastIndexOf('. ');
      const breakPoint = Math.max(lastNewline, lastPeriod);
      
      if (breakPoint > CHUNK_SIZE / 2) {
        chunk = chunk.slice(0, breakPoint + 1);
        i += breakPoint + 1;
        continue;
      }
    }
    
    chunks.push(chunk);
    i += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  if (process.env.OPENAI_API_KEY) {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    });
    const first = response.data[0];
    if (!first) throw new Error('No embedding returned');
    return first.embedding;
  } else {
    // Dummy embedding for local testing if no API key
    return Array.from({ length: 1536 }, () => Math.random() - 0.5);
  }
}

export async function chunkAndEmbedMaterial(material: Material) {
  if (!material.content || material.content.trim() === '') return;
  
  const chunks = chunkText(material.content);
  const supabase = createServiceClient();
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (!chunk || chunk.trim().length < 10) continue;
    
    const embedding = await generateEmbedding(chunk);
    
    await supabase.from('chunks').insert({
      material_id: material.id,
      project_id: material.projectId,
      content: chunk,
      embedding,
      metadata: { ...material.metadata, chunkIndex: i }
    });
  }
}

export async function retrieveRelevantChunks(projectId: string, query: string, topK: number = 10) {
  const embedding = await generateEmbedding(query);
  const supabase = createServiceClient();
  
  // We use the rpc call for pgvector similarity search
  const { data, error } = await supabase.rpc('match_chunks', {
    query_embedding: embedding,
    match_threshold: 0.5,
    match_count: topK,
    p_project_id: projectId
  });
  
  if (error) {
    console.error('Error retrieving chunks:', error);
    return [];
  }
  
  return data || [];
}
