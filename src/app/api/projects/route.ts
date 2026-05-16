import { auth } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/db/supabase';
import { NextResponse } from 'next/server';
import type { Project } from '@/lib/types';

function rowToProject(row: Record<string, unknown>): Project {
  if (!row) throw new Error('Invalid project data');
  
  return {
    id: (row['id'] as string) || '',
    userId: (row['user_id'] as string) || '',
    name: (row['name'] as string) || 'Untitled Project',
    description: (row['description'] as string | null) ?? undefined,
    settings: (row['settings'] as Project['settings']) || {
      agentModel: 'openai/gpt-4o',
      strictGrounding: true,
      language: 'en',
      exportFormat: 'markdown',
    },
    createdAt: row['created_at'] ? new Date(row['created_at'] as string) : new Date(),
    updatedAt: row['updated_at'] ? new Date(row['updated_at'] as string) : new Date(),
  };
}

const CONFIG_ERROR_MSG = 'Database configuration is incomplete. Please ensure Supabase environment variables are set.';

export async function GET() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let supabase;
    try {
      supabase = createServiceClient();
    } catch (e) {
      return NextResponse.json(
        { error: CONFIG_ERROR_MSG },
        { status: 503 }
      );
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      // If table doesn't exist, error.code is '42P01'
      if (error.code === '42P01') {
        return NextResponse.json(
          { error: 'Projects database is not initialized. Please run the schema.sql migration in Supabase.' },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: 'Unable to fetch projects from database' },
        { status: 500 }
      );
    }

    const projects = (data ?? []).map(rowToProject);
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Projects API GET Error:', error);
    return NextResponse.json(
      { error: 'A server error occurred while fetching projects' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, description, settings } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    let supabase;
    try {
      supabase = createServiceClient();
    } catch (e) {
      return NextResponse.json(
        { error: CONFIG_ERROR_MSG },
        { status: 503 }
      );
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        name,
        description: description ?? null,
        settings: settings ?? {
          agentModel: 'gpt-4o',
          strictGrounding: true,
          language: 'en',
          exportFormat: 'markdown',
        },
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to save project to database' },
        { status: 500 }
      );
    }

    return NextResponse.json(rowToProject(data), { status: 201 });
  } catch (error) {
    console.error('Projects API POST Error:', error);
    return NextResponse.json(
      { error: 'A server error occurred while creating the project' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('id');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    let supabase;
    try {
      supabase = createServiceClient();
    } catch (e) {
      return NextResponse.json(
        { error: CONFIG_ERROR_MSG },
        { status: 503 }
      );
    }
    
    // Verify project belongs to user
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Delete project (cascade delete will handle materials and messages)
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Supabase delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete project from database' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Projects API DELETE Error:', error);
    return NextResponse.json(
      { error: 'A server error occurred while deleting the project' },
      { status: 500 }
    );
  }
}

