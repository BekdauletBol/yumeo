'use client';

import { UserButton } from '@clerk/nextjs';
import { BookOpen, FileText, Keyboard } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { useMaterialsStore } from '@/stores/materialsStore';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils/cn';
import { PlanBadge } from '@/components/sections/PlanBadge';

interface TopBarProps {
  className?: string;
}

/**
 * 48px top bar with: Logo | Project name | Source counter | Plan badge | User
 */
export function TopBar({ className }: TopBarProps) {
  const activeProject = useProjectStore((s) => s.activeProject);
  const totalMaterials = useMaterialsStore((s) => s.materials.length);
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);

  return (
    <div
      className={cn('flex items-center px-4 gap-4 h-full border-b', className)}
      style={{ background: 'var(--bg-surface)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <BookOpen
          size={14}
          style={{ color: 'var(--text-secondary)' }}
          aria-hidden="true"
        />
        <span
          className="text-xs tracking-[0.22em] uppercase"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}
        >
          Yumeo
        </span>
      </div>

      {/* Divider */}
      <div
        className="h-3 w-px shrink-0"
        style={{ background: 'var(--border-default)' }}
        aria-hidden="true"
      />

      {/* Project name */}
      <div className="flex-1 min-w-0">
        {activeProject ? (
          <h1
            className="text-sm truncate"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}
            title={activeProject.name}
          >
            {activeProject.name}
          </h1>
        ) : (
          <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            No project open
          </span>
        )}
      </div>

      {/* Source counter */}
      {activeProject && (
        <button
          aria-label={`${totalMaterials} source files loaded`}
          className="flex items-center gap-1.5 px-2 py-1 text-xs border transition-colors"
          style={{
            background: 'var(--bg-elevated)',
            color: 'var(--text-secondary)',
            borderColor: 'var(--border-default)',
          }}
        >
          <FileText size={12} aria-hidden="true" />
          <span style={{ fontFamily: 'var(--font-mono)' }}>
            {totalMaterials} source{totalMaterials !== 1 ? 's' : ''}
          </span>
        </button>
      )}

      {/* Keyboard shortcut hint */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        aria-label="Open command palette (⌘K)"
        className="flex items-center gap-1 px-2 py-1 text-xs border transition-colors hover:opacity-80"
        style={{
          background: 'var(--bg-elevated)',
          color: 'var(--text-tertiary)',
          borderColor: 'var(--border-default)',
        }}
      >
        <Keyboard size={11} aria-hidden="true" />
        <kbd className="text-xs" style={{ fontFamily: 'var(--font-mono)' }}>⌘K</kbd>
      </button>

      {/* Plan badge */}
      <PlanBadge />

      {/* Clerk user button */}
      <UserButton
        afterSignOutUrl="/"
        appearance={{
          elements: {
            avatarBox: 'w-7 h-7',
          },
        }}
      />
    </div>
  );
}