'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

interface IDELayoutProps {
  topBar: React.ReactNode;
  sidebar: React.ReactNode;
  chat: React.ReactNode;
  editor: React.ReactNode;
  className?: string;
}

/**
 * Three-panel Research IDE layout.
 *
 * Columns: 220px sidebar | 1fr chat (min 420px) | 300px editor panel
 * Row:     48px topbar | 1fr content
 *
 * On mobile (<768px): stacks vertically, editor hidden.
 */
export function IDELayout({ topBar, sidebar, chat, editor, className }: IDELayoutProps) {
  return (
    <div className={cn('ide-layout', className)}>
      {/* Top bar spans all columns */}
      <header className="ide-topbar border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        {topBar}
      </header>

      {/* Sidebar */}
      <aside
        className="ide-sidebar overflow-hidden border-r flex flex-col"
        style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}
      >
        {sidebar}
      </aside>

      {/* Chat panel — main interaction area */}
      <main
        className="ide-chat overflow-hidden flex flex-col"
        style={{ background: 'var(--bg-base)' }}
      >
        {chat}
      </main>

      {/* Right editor / materials panel */}
      <aside
        className="ide-editor overflow-hidden border-l flex flex-col"
        style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}
      >
        {editor}
      </aside>
    </div>
  );
}