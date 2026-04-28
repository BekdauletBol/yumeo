'use client';

import { useUser } from '@clerk/nextjs';
import { useUIStore } from '@/stores/uiStore';
import { useMaterialsStore } from '@/stores/materialsStore';

export function EmptyState() {
  const { user } = useUser();
  const setRightPanelTab = useUIStore((s) => s.setRightPanelTab);
  const materials = useMaterialsStore((s) => s.materials);
  
  // To match user requirements:
  // [1 Upload your references] -> opens refs tab
  // [2 Write or generate a draft] -> disabled until 1 is done
  // [3 Export your report] -> disabled until 2 is done (we'll check drafts length)
  
  const hasReferences = materials.length > 0;
  const hasDrafts = materials.some(m => m.section === 'drafts');
  
  const timeOfDay = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening';
  const greeting = `Good ${timeOfDay}, ${user?.firstName || 'Researcher'}`;

  return (
    <div className="flex flex-col items-center justify-center h-full p-8" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-md w-full space-y-8">
        <div className="space-y-2 text-center">
          <h2 className="text-xl font-medium tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {greeting}
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Research starts here. Three steps:
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setRightPanelTab('references')}
            className="w-full flex items-center justify-between p-4 border rounded-lg transition-all hover:bg-white/5"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
          >
            <span className="text-sm font-medium">① Upload your references</span>
            <span className="text-xs px-2 py-1 rounded-full bg-white/10">Start</span>
          </button>

          <button
            disabled={!hasReferences}
            onClick={() => setRightPanelTab('templates')}
            className="w-full flex items-center justify-between p-4 border rounded-lg transition-all disabled:opacity-50"
            style={{ 
              borderColor: 'var(--border-subtle)', 
              color: hasReferences ? 'var(--text-primary)' : 'var(--text-tertiary)',
              cursor: hasReferences ? 'pointer' : 'not-allowed'
            }}
          >
            <span className="text-sm font-medium">② Write or generate a draft</span>
          </button>

          <button
            disabled={!hasDrafts}
            onClick={() => setRightPanelTab('drafts')}
            className="w-full flex items-center justify-between p-4 border rounded-lg transition-all disabled:opacity-50"
            style={{ 
              borderColor: 'var(--border-subtle)', 
              color: hasDrafts ? 'var(--text-primary)' : 'var(--text-tertiary)',
              cursor: hasDrafts ? 'pointer' : 'not-allowed'
            }}
          >
            <span className="text-sm font-medium">③ Export your report</span>
          </button>
        </div>
      </div>
    </div>
  );
}
