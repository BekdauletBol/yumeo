import { auth } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/db/supabase';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health/diagnostics
 * 
 * Returns diagnostic information about the AI agent setup.
 * Helps debug why RAG retrieval or AI responses aren't working.
 */
export async function GET() {
  try {
    const { userId } = auth();
    
    const diagnostics = {
      timestamp: new Date().toISOString(),
      auth: {
        authenticated: !!userId,
        userId: userId ? '✅ (hidden)' : '❌ Not authenticated',
      },
      environment: {
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        hasGithubModelsToken: !!process.env.GITHUB_MODELS_TOKEN,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
      issues: [] as string[],
      recommendations: [] as string[],
    };

    // Check for configuration issues
    if (!diagnostics.environment.hasGithubModelsToken) {
      diagnostics.issues.push('❌ GITHUB_MODELS_TOKEN not configured - embeddings and AI responses will fail');
      diagnostics.recommendations.push('Set GITHUB_MODELS_TOKEN for both embeddings and LLM calls');
    }

    if (diagnostics.environment.hasGithubModelsToken && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      diagnostics.recommendations.push('If materials are not being embedded, ensure chunks table exists in Supabase and pgvector extension is enabled');
    }

    if (!diagnostics.environment.hasSupabaseUrl) {
      diagnostics.issues.push('❌ NEXT_PUBLIC_SUPABASE_URL not configured');
      diagnostics.recommendations.push('Set NEXT_PUBLIC_SUPABASE_URL in environment');
    }

    if (!diagnostics.environment.hasServiceKey) {
      diagnostics.issues.push('❌ SUPABASE_SERVICE_ROLE_KEY not configured');
      diagnostics.recommendations.push('Set SUPABASE_SERVICE_ROLE_KEY in environment');
    }

    // If authenticated, check database connectivity
    if (userId) {
      try {
        const supabase = createServiceClient();
        
        // Test database connection
        const { error: chunksError } = await supabase
          .from('chunks')
          .select('id')
          .limit(1);

        if (chunksError) {
          diagnostics.issues.push(`❌ Database error: ${chunksError.message}`);
        } else {
          diagnostics.recommendations.push('✅ Database connected successfully');
        }

        // Check if user has any materials
        const { data: materials, error: materialsError } = await supabase
          .from('materials')
          .select('id, name, section')
          .limit(10);

        if (!materialsError && materials) {
          if (materials.length === 0) {
            diagnostics.issues.push('⚠️  No materials uploaded - upload references to enable RAG');
            diagnostics.recommendations.push('Upload PDF/DOC files to your project');
          } else {
            diagnostics.recommendations.push(`✅ ${materials.length} materials found`);
            diagnostics.recommendations.push(
              `Materials: ${materials.map(m => `${m.name} (${m.section})`).join(', ')}`
            );
          }
        }

        // Check if any chunks exist
        const { data: chunksData, error: chunksCountError } = await supabase
          .from('chunks')
          .select('count', { count: 'exact' });

        if (!chunksCountError && chunksData) {
          if (chunksData.length === 0) {
            diagnostics.issues.push('⚠️  No chunks found in database - materials may not be embedded');
            diagnostics.recommendations.push('Re-upload materials after setting OPENAI_API_KEY');
          } else {
            diagnostics.recommendations.push(`✅ ${chunksData.length} chunks indexed`);
          }
        }
      } catch (err) {
        diagnostics.issues.push(`❌ Database check failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    // Overall status
    const hasErrors = diagnostics.issues.filter(i => i.includes('❌')).length > 0;
    const status = hasErrors ? 'ERROR' : diagnostics.issues.length > 0 ? 'WARNING' : 'OK';

    return NextResponse.json({
      status,
      ...diagnostics,
    });
  } catch (error) {
    console.error('Diagnostics error:', error);
    return NextResponse.json(
      { error: 'Failed to generate diagnostics', status: 'ERROR' },
      { status: 500 }
    );
  }
}
