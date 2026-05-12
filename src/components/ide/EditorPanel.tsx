'use client';

import { useProjectSectionsStore } from '@/stores/projectSectionsStore';
import { ReferencesSection } from '@/components/sections/ReferencesSection';
import { DraftsSection } from '@/components/sections/DraftsSection';
import { FiguresSection } from '@/components/sections/FiguresSection';

export function EditorPanel() {
  const { activeSectionId, sections } = useProjectSectionsStore();
  const activeSection = sections.find(s => s.id === activeSectionId);

  const renderSectionContent = () => {
    if (!activeSection) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
          <div className="w-10 h-10 rounded-full border border-dashed flex items-center justify-center"
            style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-tertiary)' }}
          >
            ?
          </div>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>
            select a section to begin
          </p>
        </div>
      );
    }

    switch (activeSection.sectionType) {
      case 'references':
        return <ReferencesSection />;
      case 'drafts':
        return <DraftsSection />;
      case 'figures':
        return <FiguresSection />;
      default:
        return (
          <div className="p-6">
            <p className="text-sm" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
              select a material or start writing.
            </p>
          </div>
        );
    }
  };

  return (
    <section className="ide-editor flex flex-col overflow-hidden"
      style={{ background: 'var(--bg-base)', borderLeft: '1px solid var(--border-subtle)' }}
    >
      {/* Tabs */}
      <div className="h-11 flex items-center px-4 md:px-5 gap-5 shrink-0"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <button className="text-xs font-medium h-full px-1"
          style={{ 
            color: 'var(--text-primary)', 
            borderBottom: '2px solid var(--accent-primary)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {activeSection?.name || 'context'}
        </button>
        <button className="text-xs font-medium h-full px-1 transition-colors hover:opacity-70"
          style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
        >
          history
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {renderSectionContent()}
      </div>
    </section>
  );
}
