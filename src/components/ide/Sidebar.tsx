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
import { useState } from 'react';
import { useProjectSectionsStore } from '@/stores/projectSectionsStore';
import { useProjectStore } from '@/stores/projectStore';
import { createProjectSectionAction } from '@/app/actions/sections';
import { SectionSelectModal } from '@/components/sections/AddSectionButton';
import { showToast } from '@/lib/utils/toast';
import { cn } from '@/lib/utils/cn';
import type { MaterialSection } from '@/lib/types';

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
  const { sections, activeSectionId, setActiveSection: setActiveSectionId, addSection } = useProjectSectionsStore();
  const { activeProject } = useProjectStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleAddSection = async (type: MaterialSection) => {
    if (!activeProject) return;
    
    try {
      setIsCreating(true);
      const newSection = await createProjectSectionAction(activeProject.id, type);
      addSection(newSection);
      setActiveSectionId(newSection.id);
      showToast(`Module '${type}' added`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to add module');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden"
      style={{ background: 'var(--bg-surface)' }}
    >
      <div className="p-4 md:p-5 flex flex-col flex-1 gap-6 overflow-y-auto scrollbar-thin">
        {/* Sections */}
        <div>
          <div className="flex items-center justify-between mb-3 px-2">
            <h3 className="text-xs font-bold uppercase tracking-[0.15em]"
              style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
            >
              sections
            </h3>
            <button 
              onClick={() => setIsModalOpen(true)}
              disabled={isCreating}
              style={{ color: 'var(--text-tertiary)' }} 
              className="hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
            >
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
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
              style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
            >
              knowledge base
            </p>
            <div className="flex items-end justify-between">
              <span className="text-lg font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>{sections.length * 2 + 4}</span>
              <span className="text-xs font-medium uppercase tracking-tighter" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>indexed</span>
            </div>
          </div>
        </div>
      </div>

      <SectionSelectModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectSection={handleAddSection}
        disabledSections={sections.map(s => s.sectionType)}
      />
    </div>
  );
}
