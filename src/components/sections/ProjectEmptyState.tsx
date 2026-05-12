'use client';

import { useState, useCallback } from 'react';
import { BookMarked } from 'lucide-react';
import { createProjectSectionAction } from '@/app/actions/sections';
import { showToast } from '@/lib/utils/toast';
import { useProjectSections } from '@/hooks/useProjectSections';
import { SECTION_OPTIONS } from './AddSectionButton';
import type { MaterialSection } from '@/lib/types';
import { cn } from '@/lib/utils/cn';

interface ProjectEmptyStateProps {
  projectId: string;
}

/**
 * Redesigned ProjectEmptyState for the Pure Black system.
 */
export function ProjectEmptyState({
  projectId,
}: ProjectEmptyStateProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSections, setSelectedSections] = useState<MaterialSection[]>([]);
  const { refetchSections } = useProjectSections(projectId);

  const handleSelectSection = useCallback((sectionType: MaterialSection) => {
    setSelectedSections((prev) =>
      prev.includes(sectionType)
        ? prev.filter(s => s !== sectionType)
        : [...prev, sectionType]
    );
  }, []);

  const handleStartResearch = useCallback(async () => {
    if (selectedSections.length === 0) return;

    try {
      setIsLoading(true);
      const results = await Promise.allSettled(
        selectedSections.map(sectionType =>
          createProjectSectionAction(projectId, sectionType)
        )
      );
      
      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        const errorMsg = failures.length === 1
          ? (failures[0] as PromiseRejectedResult).reason?.message || 'Failed to create section'
          : `Failed to create ${failures.length} sections`;
        showToast(errorMsg);
        setIsLoading(false);
        return;
      }
      
      showToast(`Successfully created ${selectedSections.length} sections`);
      await refetchSections();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create sections';
      showToast(errorMsg);
      setIsLoading(false);
    }
  }, [projectId, selectedSections, refetchSections]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-12 px-6 py-12 text-text-primary" style={{ background: 'var(--bg-base)' }}>
      {/* Title Area */}
      <div className="text-center space-y-4">
        <div className="inline-block p-5 rounded-2xl bg-bg-surface border border-border-subtle">
          <BookMarked className="w-10 h-10 text-accent-primary" />
        </div>
        
        <h1 className="text-4xl font-mono font-bold uppercase tracking-tight">Setup Workspace</h1>
        <p className="text-text-secondary text-sm font-medium uppercase tracking-widest max-w-md mx-auto">
          Step 1: Choose required research modules
        </p>
      </div>

      {/* Grid */}
      <div className="w-full max-w-5xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {SECTION_OPTIONS.map(({ type, label, description }) => {
            const isSelected = selectedSections.includes(type);
            return (
              <button
                key={type}
                onClick={() => handleSelectSection(type)}
                disabled={isLoading}
                className={cn(
                  'p-6 rounded-2xl border transition-all text-left flex flex-col gap-3 group',
                  isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]',
                  isSelected ? 'bg-bg-elevated border-accent-primary shadow-sm' : 'bg-bg-surface border-border-subtle hover:border-border-default'
                )}
              >
                <div className="text-2xl">{label.split(' ')[0]}</div>
                <div className="font-mono font-bold text-[11px] uppercase tracking-widest text-text-primary">
                  {label.split(' ').slice(1).join(' ')}
                </div>
                <div className="text-[11px] leading-relaxed text-text-secondary">
                  {description}
                </div>
                {isSelected && (
                  <div className="text-[10px] font-mono font-bold text-accent-primary pt-1">
                    [ SELECTED ]
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer / CTA */}
      <div className="flex flex-col items-center gap-6">
        <button
          onClick={handleStartResearch}
          disabled={selectedSections.length === 0 || isLoading}
          className={cn(
            "px-10 py-4 rounded-xl transition-all font-mono font-bold text-sm uppercase tracking-widest",
            selectedSections.length > 0 && !isLoading
              ? "bg-accent-primary text-white hover:opacity-90"
              : "bg-bg-elevated text-text-tertiary cursor-not-allowed border border-border-subtle"
          )}
        >
          {isLoading
            ? 'Initializing Modules...'
            : selectedSections.length === 0
            ? 'Select modules to continue'
            : `Initialize Research IDE [${selectedSections.length}]`}
        </button>

        {/* Tips */}
        <div className="p-6 rounded-2xl bg-bg-surface border border-border-subtle max-w-2xl font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
          <p className="font-bold text-text-secondary mb-3 tracking-[0.25em]">/ System Capabilities /</p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            <div>• References: PDF/BibTeX Upload</div>
            <div>• Drafts: Structured Outlining</div>
            <div>• Figures: Image Analysis</div>
            <div>• Tables: Dataset Grounding</div>
          </div>
        </div>
      </div>
    </div>
  );
}
