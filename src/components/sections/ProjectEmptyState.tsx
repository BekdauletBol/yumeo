'use client';

import { useState, useCallback } from 'react';
import { BookMarked } from 'lucide-react';
import { createProjectSectionAction } from '@/app/actions/sections';
import { showToast } from '@/lib/utils/toast';
import { SECTION_OPTIONS } from './AddSectionButton';
import type { MaterialSection } from '@/lib/types';

interface ProjectEmptyStateProps {
  projectId: string;
}

/**
 * Two-step section selection flow:
 * 1. User selects sections from grid
 * 2. User clicks "Start Research" to confirm selection
 */
export function ProjectEmptyState({
  projectId,
}: ProjectEmptyStateProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSections, setSelectedSections] = useState<MaterialSection[]>([]);

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
      // Create all selected sections in parallel
      const results = await Promise.allSettled(
        selectedSections.map(sectionType =>
          createProjectSectionAction(projectId, sectionType)
        )
      );
      
      // Check for failures
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
      // Empty state will close automatically when sections are populated
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create sections';
      console.error('Failed to create sections:', err);
      showToast(errorMsg);
      setIsLoading(false);
    }
  }, [projectId, selectedSections]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 px-6 py-12">
      {/* Step 1: Title */}
      <div className="text-center">
        <div className="inline-block p-4 rounded-full mb-4" style={{ background: 'var(--bg-secondary)' }}>
          <BookMarked className="w-8 h-8" style={{ color: 'var(--accent-refs)' }} />
        </div>
        
        <h1 className="text-3xl font-bold mb-3">Welcome to Yumeo</h1>
        <p className="text-base mb-2" style={{ color: 'var(--text-secondary)', maxWidth: '500px' }}>
          Step 1: Choose the sections you need for your research
        </p>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)', maxWidth: '500px' }}>
          You can add or remove sections anytime. Only the sections you select will appear in your workspace.
        </p>
      </div>

      {/* Step 2: Section grid */}
      <div className="w-full max-w-4xl">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {SECTION_OPTIONS.map(({ type, label, description }) => {
            const isSelected = selectedSections.includes(type);
            return (
              <button
                key={type}
                onClick={() => handleSelectSection(type)}
                disabled={isLoading}
                className={`p-4 rounded-lg border-2 transition-all text-left flex flex-col gap-2 ${
                  isLoading
                    ? 'opacity-50 cursor-not-allowed'
                    : isSelected
                    ? 'ring-2 ring-offset-2'
                    : 'hover:border-current cursor-pointer'
                }`}
                style={{
                  borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  background: isSelected ? 'var(--bg-elevated)' : 'var(--bg-secondary)',
                }}
              >
                <div className="text-xl">{label.split(' ')[0]}</div>
                <div className="font-medium text-sm">{label.split(' ').slice(1).join(' ')}</div>
                <div className="text-xs leading-tight" style={{ color: 'var(--text-secondary)' }}>
                  {description}
                </div>
                {isSelected && (
                  <div className="text-xs font-semibold pt-1" style={{ color: 'var(--accent-primary)' }}>
                    ✓ Selected
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 3: CTA Button */}
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={handleStartResearch}
          disabled={selectedSections.length === 0 || isLoading}
          className="px-8 py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base"
          style={{
            background: selectedSections.length > 0 ? 'var(--accent-primary)' : 'var(--bg-secondary)',
            color: selectedSections.length > 0 ? 'var(--text-on-accent)' : 'var(--text-tertiary)',
          }}
        >
          {isLoading
            ? 'Creating sections...'
            : selectedSections.length === 0
            ? 'Select at least one section to continue'
            : `Start Research with ${selectedSections.length} section${selectedSections.length !== 1 ? 's' : ''}`}
        </button>

        {/* Tips */}
        <div
          className="mt-4 p-4 rounded-lg max-w-xl"
          style={{ background: 'var(--bg-secondary)' }}
        >
          <p className="text-xs font-semibold mb-2">💡 Getting Started:</p>
          <ul className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
            <li>• <strong>References:</strong> Upload research papers and PDFs</li>
            <li>• <strong>Drafts:</strong> Write notes and outlines</li>
            <li>• <strong>Figures:</strong> Add charts, diagrams, and images</li>
            <li>• <strong>Tables:</strong> Upload datasets and spreadsheets</li>
            <li>• <strong>LaTeX & Diagrams:</strong> Code-based content</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
