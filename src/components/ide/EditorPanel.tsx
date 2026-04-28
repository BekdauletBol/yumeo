'use client';

import { useUIStore } from '@/stores/uiStore';
import { useMaterialsStore } from '@/stores/materialsStore';
import { cn } from '@/lib/utils/cn';
import { ReferencesSection } from '@/components/sections/ReferencesSection';
import { FiguresSection } from '@/components/sections/FiguresSection';
import { TablesSection } from '@/components/sections/TablesSection';
import { TemplatesSection } from '@/components/sections/TemplatesSection';
import { MermaidSection } from '@/components/sections/MermaidSection';
import { LatexSection } from '@/components/sections/LatexSection';

const TABS = [
  { key: 'references' as const, label: 'Refs', accent: 'var(--accent-refs)', sectionKey: 'references' },
  { key: 'figures'    as const, label: 'Figs', accent: 'var(--accent-figures)', sectionKey: 'figures' },
  { key: 'tables'     as const, label: 'Tables', accent: 'var(--accent-tables)', sectionKey: 'tables' },
  { key: 'templates'  as const, label: 'Template', accent: 'var(--accent-template)', sectionKey: 'templates' },
  { key: 'mermaid'    as const, label: 'Mermaid', accent: 'var(--text-secondary)', sectionKey: 'diagrams' },
  { key: 'latex'      as const, label: 'LaTeX', accent: 'var(--text-secondary)', sectionKey: 'equations' },
] as const;

/**
 * Right panel with tab switcher for References, Figures, Tables, Templates.
 */
export function EditorPanel() {
  const { rightPanelTab, setRightPanelTab } = useUIStore();
  const materials = useMaterialsStore((s) => s.materials);

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div
        className="flex border-b shrink-0"
        role="tablist"
        aria-label="Right panel sections"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        {TABS.map((tab) => {
          const count = materials.filter((m) => m.section === tab.sectionKey).length;
          const isActive = rightPanelTab === tab.key;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.key}`}
              onClick={() => setRightPanelTab(tab.key)}
              className="flex-1 py-2.5 text-xs font-medium transition-colors relative"
              style={{
                color: isActive ? tab.accent : 'var(--text-tertiary)',
                background: isActive ? 'var(--bg-elevated)' : 'transparent',
              }}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className="ml-1 text-xs"
                  style={{ color: tab.accent, fontFamily: 'var(--font-mono)' }}
                >
                  {count}
                </span>
              )}
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-px"
                  style={{ background: tab.accent }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto">
        <div
          role="tabpanel"
          id={`panel-${rightPanelTab}`}
          aria-label={rightPanelTab}
        >
          {rightPanelTab === 'references' && <ReferencesSection />}
          {rightPanelTab === 'figures'    && <FiguresSection />}
          {rightPanelTab === 'tables'     && <TablesSection />}
          {rightPanelTab === 'templates'  && <TemplatesSection />}
          {rightPanelTab === 'mermaid'    && <MermaidSection />}
          {rightPanelTab === 'latex'      && <LatexSection />}
        </div>
      </div>
    </div>
  );
}