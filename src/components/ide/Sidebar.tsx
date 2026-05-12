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
    <aside className="ide-sidebar flex flex-col overflow-hidden"
      style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border-subtle)' }}
    >
      <div className="p-4 md:p-5 flex flex-col flex-1 gap-6 overflow-y-auto scrollbar-thin">
        {/* Sections */}
        <div>
          <div className="flex items-center justify-between mb-3 px-2">
            <h3 className="text-xs font-medium"
              style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
            >
              sections
            </h3>
            <button style={{ color: 'var(--text-tertiary)' }} className="hover:opacity-70 transition-opacity">
              <Plus size={14} />
            </button>
          </div>
          
          <div className="space-y-0.5">
            {sections.map((section) => {
              const Icon = ICON_MAP[section.sectionType as keyof typeof ICON_MAP] || Box;
              const isActive = activeSectionId === section.id;
              
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSectionId(section.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 group',
                    isActive 
                      ? 'shadow-sm' 
                      : 'hover:opacity-80'
                  )}
                  style={{
                    background: isActive ? 'var(--bg-elevated)' : 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    border: isActive ? '1px solid var(--border-subtle)' : '1px solid transparent',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  <Icon 
                    size={15} 
                    className="shrink-0 transition-colors"
                    style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}
                  />
                  <span className="flex-1 text-left truncate text-[13px] font-medium capitalize">
                    {section.name}
                  </span>
                  {isActive && <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Knowledge Base Info */}
        <div className="mt-auto">
          <div className="p-3.5 rounded-xl"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
          >
            <p className="text-xs font-medium mb-1"
              style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
            >
              knowledge base
            </p>
            <div className="flex items-end justify-between">
              <span className="text-lg font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>12</span>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>items</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
