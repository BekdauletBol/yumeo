'use client';

import React from 'react';
import { Library, MessageSquare, PenTool } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useUIStore } from '@/stores/uiStore';
import { ReferencesSection } from '@/components/sections/ReferencesSection';
import { CitationViewer } from './CitationViewer';

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
 * On mobile (<768px): Uses a bottom navigation bar to switch between panels.
 */
export function IDELayout({ topBar, sidebar, chat, editor, className }: IDELayoutProps) {
  const mobileTab = useUIStore((s) => s.mobileTab);
  const setMobileTab = useUIStore((s) => s.setMobileTab);

  return (
    <div className={cn('ide-layout workspace-theme', className)}>
      {/* Top bar spans all columns */}
      <header className="ide-topbar border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        {topBar}
      </header>

      {/* Sidebar / Library Panel */}
      <aside
        className={cn("ide-sidebar overflow-hidden border-r flex flex-col", mobileTab === 'sidebar' && 'mobile-active')}
        style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}
      >
        {/* On mobile, Library tab shows References directly as requested. On desktop, shows full Sidebar (section list). */}
        <div className="hidden md:block h-full">{sidebar}</div>
        <div className="md:hidden h-full overflow-y-auto">
          <ReferencesSection />
        </div>
      </aside>

      {/* Chat panel — main interaction area */}
      <main
        className={cn("ide-chat overflow-hidden flex flex-col", mobileTab === 'chat' && 'mobile-active')}
        style={{ background: 'var(--bg-base)' }}
      >
        {chat}
      </main>

      {/* Right editor / materials panel */}
      <aside
        className={cn("ide-editor overflow-hidden border-l flex flex-col", mobileTab === 'editor' && 'mobile-active')}
        style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}
      >
        {editor}
      </aside>

      {/* Citation viewer side panel */}
      <CitationViewer />

      {/* Mobile Bottom Navigation */}
      <nav 
        className="ide-bottomnav border-t flex items-center justify-around h-[64px]" 
        style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}
      >
        <button 
          onClick={() => setMobileTab('sidebar')}
          className={cn("flex flex-col items-center justify-center w-full h-full gap-1 transition-colors min-h-[44px]", mobileTab === 'sidebar' ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]")}
        >
          <Library size={22} />
          <span className="text-[10px] font-medium" style={{ fontFamily: 'var(--font-mono)' }}>Library</span>
        </button>
        <button 
          onClick={() => setMobileTab('chat')}
          className={cn("flex flex-col items-center justify-center w-full h-full gap-1 transition-colors min-h-[44px]", mobileTab === 'chat' ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]")}
        >
          <MessageSquare size={22} />
          <span className="text-[10px] font-medium" style={{ fontFamily: 'var(--font-mono)' }}>Chat</span>
        </button>
        <button 
          onClick={() => setMobileTab('editor')}
          className={cn("flex flex-col items-center justify-center w-full h-full gap-1 transition-colors min-h-[44px]", mobileTab === 'editor' ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]")}
        >
          <PenTool size={22} />
          <span className="text-[10px] font-medium" style={{ fontFamily: 'var(--font-mono)' }}>Editor</span>
        </button>
      </nav>
    </div>
  );
}
