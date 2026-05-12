'use client';

import Link from 'next/link';
import { 
  ChevronLeft, 
  Settings, 
  Search,
  ExternalLink,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useProjectStore } from '@/stores/projectStore';
import { useReportEditorStore } from '@/stores/reportEditorStore';
import { SettingsDialog } from './SettingsDialog';
import { useState } from 'react';

export function TopBar() {
  const activeProject = useProjectStore((s) => s.activeProject);
  const openEditor = useReportEditorStore((s) => s.openWithContent);
  const { theme, setTheme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <>
      <header className="ide-topbar flex items-center justify-between px-4 md:px-6 shrink-0"
        style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <Link 
            href="/" 
            className="flex items-center gap-1.5 md:gap-2 transition-colors group shrink-0"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
            <span className="text-sm font-semibold hidden sm:inline" style={{ fontFamily: 'var(--font-body)' }}>yumeo</span>
          </Link>
          
          <div className="h-4 w-px hidden sm:block" style={{ background: 'var(--border-subtle)' }} />
          
          <h1 className="text-sm font-medium truncate max-w-[120px] md:max-w-[200px]"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}
          >
            {activeProject?.name || 'Loading...'}
          </h1>
        </div>

        <div className="flex items-center gap-1 md:gap-3">
          <button 
            onClick={toggleTheme}
            className="p-2 transition-colors rounded-lg hover:bg-[var(--bg-surface)]"
            style={{ color: 'var(--text-secondary)' }}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button 
            className="p-2 transition-colors rounded-lg hover:bg-[var(--bg-surface)] hidden md:flex"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Search size={16} />
          </button>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 transition-colors rounded-lg hover:bg-[var(--bg-surface)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Settings size={16} />
          </button>
          
          <button 
            onClick={() => openEditor('', 'Yuport Report')}
            className="hidden sm:flex items-center gap-2 px-3 md:px-4 py-1.5 text-white text-xs font-medium rounded-lg transition-all hover:opacity-90 ml-1 md:ml-2"
            style={{ background: 'var(--accent-primary)', fontFamily: 'var(--font-body)' }}
          >
            open in yuport <ExternalLink size={12} />
          </button>
        </div>
      </header>

      {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} />}
    </>
  );
}
