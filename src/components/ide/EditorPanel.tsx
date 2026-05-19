'use client';

import { useProjectSectionsStore } from '@/stores/projectSectionsStore';
import { ReferencesSection } from '@/components/sections/ReferencesSection';
import { DraftsSection } from '@/components/sections/DraftsSection';
import { FiguresSection } from '@/components/sections/FiguresSection';
import { TablesSection } from '@/components/sections/TablesSection';
import { TemplatesSection } from '@/components/sections/TemplatesSection';
import dynamic from 'next/dynamic';

const LatexSection = dynamic(() => import('@/components/sections/LatexSection').then(mod => mod.LatexSection), {
  ssr: false,
  loading: () => <div className="p-6 text-xs animate-pulse">Loading Equations Editor...</div>
});

const MermaidSection = dynamic(() => import('@/components/sections/MermaidSection').then(mod => mod.MermaidSection), {
  ssr: false,
  loading: () => <div className="p-6 text-xs animate-pulse">Loading Diagrams Editor...</div>
});

export function EditorPanel() {
  const { activeSectionId, sections } = useProjectSectionsStore();
  const activeSection = sections.find(s => s.id === activeSectionId);

  const renderSectionContent = () => {
    if (!activeSection) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 px-6">
          <div className="w-12 h-12 rounded-2xl border border-dashed flex items-center justify-center bg-[var(--bg-surface)]"
            style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-tertiary)' }}
          >
            ?
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Select a module
            </p>
            <p className="text-xs max-w-[200px]" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>
              Choose a section from the sidebar to start organizing your research.
            </p>
          </div>
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
      case 'tables':
        return <TablesSection />;
      case 'templates':
        return <TemplatesSection />;
      case 'equations':
        return <LatexSection />;
      case 'diagrams':
        return <MermaidSection />;
      default:
        return (
          <div className="p-6">
            <p className="text-sm" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
              This section type is not yet supported.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Tabs */}
      <div className="h-11 flex items-center px-4 md:px-5 gap-5 shrink-0"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <button className="text-xs font-bold uppercase tracking-widest h-full px-1 relative flex items-center"
          style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}
        >
          {activeSection?.name || 'context'}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-primary)]" />
        </button>
        <button className="text-xs font-bold uppercase tracking-widest h-full px-1 transition-colors hover:opacity-70 flex items-center"
          style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
        >
          history
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {renderSectionContent()}
      </div>
    </div>
  );
}
