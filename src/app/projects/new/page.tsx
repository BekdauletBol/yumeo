'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { createProject } from '@/lib/db/projects';
import type { ProjectSettings } from '@/lib/types';

const DEFAULT_SETTINGS: ProjectSettings = {
  agentModel: 'openai/gpt-4o',
  strictGrounding: true,
  language: 'en',
  exportFormat: 'markdown',
};

export default function NewProjectPage() {
  const router          = useRouter();
  const { user }        = useUser();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating]   = useState(false);
  const [error, setError]             = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !name.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      const project = await createProject(user.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        settings: DEFAULT_SETTINGS,
      });
      router.push(`/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
      setIsCreating(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col px-6 py-12"
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      <div className="max-w-lg mx-auto w-full">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm mb-8 hover:opacity-70 transition-opacity"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft size={14} aria-hidden="true" />
          All projects
        </Link>

        <h1
          className="text-2xl font-medium mb-1"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          New Research Project
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
          Give your project a name — you can change it any time.
        </p>

        <form onSubmit={(e) => void handleCreate(e)} noValidate>
          {/* Name */}
          <div className="mb-4">
            <label
              htmlFor="project-name"
              className="text-section-label mb-1.5 block"
            >
              Project Name *
            </label>
            <input
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              maxLength={100}
              placeholder="e.g. Dissertation Chapter 3"
              aria-required="true"
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
              }}
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label
              htmlFor="project-desc"
              className="text-section-label mb-1.5 block"
            >
              Description (optional)
            </label>
            <textarea
              id="project-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="What are you researching?"
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none transition-colors"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm mb-4" style={{ color: 'var(--status-error)' }} role="alert">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isCreating || !name.trim()}
            aria-label="Create project"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
            style={{
              background: 'var(--text-accent)',
              color: '#000',
              cursor: isCreating ? 'not-allowed' : 'pointer',
            }}
          >
            {isCreating ? (
              <>
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                Creating…
              </>
            ) : (
              'Create Project'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}