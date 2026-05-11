'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  ChevronLeft, 
  Settings, 
  Search,
  ExternalLink
} from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';

export function TopBar() {
  const activeProject = useProjectStore((s) => s.activeProject);

  return (
    <header className="ide-topbar flex items-center justify-between px-6 bg-black border-b border-border-subtle shrink-0">
      <div className="flex items-center gap-4">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors group"
        >
          <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
          <span className="font-mono font-bold text-sm tracking-tighter">YUMEO</span>
        </Link>
        
        <div className="h-4 w-px bg-border-subtle" />
        
        <h1 className="text-sm font-mono font-bold text-text-primary uppercase tracking-tight truncate max-w-[200px]">
          {activeProject?.name || 'Loading...'}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <button className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-bg-surface">
          <Search size={16} />
        </button>
        <button className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-bg-surface">
          <Settings size={16} />
        </button>
        
        <button className="flex items-center gap-2 px-4 py-1.5 bg-accent-primary text-white text-[11px] font-mono font-bold rounded-xl transition-all hover:opacity-90 ml-2 uppercase">
          Open in Yuport <ExternalLink size={12} />
        </button>
      </div>
    </header>
  );
}
