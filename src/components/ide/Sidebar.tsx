'use client';

import { 
  BookOpen, 
  FileText, 
  Image as ImageIcon, 
  Table as TableIcon, 
  Layout, 
  ChevronRight,
  Plus,
  Box,
  Sigma,
  GitGraph
} from 'lucide-react';
import { useProjectSectionsStore } from '@/stores/projectSectionsStore';
import { cn } from '@/lib/utils/cn';

const ICON_MAP = {
  references: BookOpen,
  drafts: FileText,
  figures: ImageIcon,
  tables: TableIcon,
  templates: Layout,
  equations: Sigma,
  diagrams: GitGraph,
};

export function Sidebar() {
  const { sections, activeSectionId, setActiveSection: setActiveSectionId } = useProjectSectionsStore();

  return (
    <aside className="ide-sidebar flex flex-col bg-black border-r border-border-subtle">
      <div className="p-6 flex flex-col flex-1 gap-8 overflow-y-auto scrollbar-thin">
        {/* Sections */}
        <div>
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-[10px] font-mono font-bold text-text-tertiary uppercase tracking-[0.2em]">Sections</h3>
            <button className="text-text-tertiary hover:text-text-primary transition-colors">
              <Plus size={14} />
            </button>
          </div>
          
          <div className="space-y-1">
            {sections.map((section) => {
              const Icon = ICON_MAP[section.sectionType as keyof typeof ICON_MAP] || Box;
              const isActive = activeSectionId === section.id;
              
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSectionId(section.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                    isActive 
                      ? 'bg-bg-surface text-text-primary shadow-sm border border-border-subtle' 
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface/50'
                  )}
                >
                  <Icon 
                    size={16} 
                    className={cn(
                      'shrink-0 transition-colors',
                      isActive ? 'text-accent-primary' : 'text-text-tertiary group-hover:text-text-secondary'
                    )} 
                  />
                  <span className="flex-1 text-left truncate font-mono uppercase text-[11px] tracking-tight">{section.name}</span>
                  {isActive && <ChevronRight size={14} className="text-text-tertiary" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Knowledge Base Info */}
        <div className="mt-auto">
          <div className="p-4 rounded-2xl bg-bg-surface border border-border-subtle">
            <p className="text-[10px] font-mono font-bold text-text-secondary uppercase tracking-widest mb-1">Knowledge Base</p>
            <div className="flex items-end justify-between">
              <span className="text-lg font-mono font-bold text-text-primary">12</span>
              <span className="text-[10px] font-mono text-text-tertiary uppercase">Items</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
