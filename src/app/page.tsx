import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, ArrowRight } from 'lucide-react';
import { getProjects } from '@/lib/db/projects';
import type { Project } from '@/lib/types';

export default async function HomePage() {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  let projects: Project[] = [];
  try {
    projects = await getProjects(userId);
  } catch {
    // Supabase not configured yet — show empty state
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      <header
        className="h-12 flex items-center justify-between px-6 border-b"
        style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}
      >
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Yumeo logo"
            width={24}
            height={24}
            style={{ filter: 'invert(1)', objectFit: 'contain' }}
            priority
          />
          <span
            className="font-medium"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            Yumeo
          </span>
        </div>
        <nav className="flex items-center gap-4">
          <Link
            href="/docs"
            className="text-xs transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}
          >
            Docs
          </Link>
          <Link
            href="/pricing"
            className="text-xs transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}
          >
            Pricing
          </Link>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1
            className="text-3xl font-medium mb-2"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            Your Research Projects
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Every AI response grounded exclusively in your uploaded materials.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/projects/new"
            className="group flex flex-col items-center justify-center gap-3 p-8 rounded-xl transition-all hover:opacity-90"
            style={{
              background: 'var(--bg-surface)',
              border: '2px dashed var(--border-default)',
              color: 'var(--text-tertiary)',
              minHeight: 160,
            }}
            aria-label="Create new research project"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: 'var(--bg-elevated)' }}
            >
              <Plus size={20} aria-hidden="true" />
            </div>
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              New Project
            </span>
          </Link>

          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/${project.id}`}
              className="group flex flex-col justify-between p-5 rounded-xl transition-all hover:opacity-90"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                minHeight: 160,
              }}
              aria-label={`Open project: ${project.name}`}
            >
              <div>
                <h2
                  className="font-medium text-base mb-1 truncate"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
                >
                  {project.name}
                </h2>
                {project.description && (
                  <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                    {project.description}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between mt-4">
                <time
                  className="text-xs"
                  style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}
                  dateTime={project.updatedAt.toISOString()}
                >
                  {project.updatedAt.toLocaleDateString()}
                </time>
                <ArrowRight
                  size={14}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--text-accent)' }}
                  aria-hidden="true"
                />
              </div>
            </Link>
          ))}
        </div>

        {projects.length === 0 && (
          <div
            className="mt-8 p-8 rounded-xl text-center"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
          >
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Create your first research project to start grounding AI in your materials.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}