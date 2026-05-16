'use client';

import { useState } from 'react';
import {
  BookMarked,
  FileText,
  Image,
  Table2,
  LayoutTemplate,
  Sigma,
  Workflow,
  Plus,
  X
} from 'lucide-react';
import type { MaterialSection } from '@/lib/types';
import { cn } from '@/lib/utils/cn';

interface SectionSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSection: (sectionType: MaterialSection) => void;
  disabledSections?: MaterialSection[];  // Already added sections
}

export const SECTION_OPTIONS: {
  type: MaterialSection;
  icon: React.ElementType;
  label: string;
  description: string;
}[] = [
  {
    type: 'references',
    icon: BookMarked,
    label: 'References',
    description: 'PDFs, papers, articles',
  },
  {
    type: 'drafts',
    icon: FileText,
    label: 'Drafts',
    description: 'Notes, outlines, snippets',
  },
  {
    type: 'figures',
    icon: Image,
    label: 'Figures',
    description: 'Charts, images, diagrams',
  },
  {
    type: 'tables',
    icon: Table2,
    label: 'Tables',
    description: 'Data tables, datasets',
  },
  {
    type: 'templates',
    icon: LayoutTemplate,
    label: 'Templates',
    description: 'Structured outlines',
  },
  {
    type: 'equations',
    icon: Sigma,
    label: 'LaTeX',
    description: 'Math formulas',
  },
  {
    type: 'diagrams',
    icon: Workflow,
    label: 'Diagrams',
    description: 'Mermaid flowcharts',
  },
];

export function SectionSelectModal({
  isOpen,
  onClose,
  onSelectSection,
  disabledSections = [],
}: SectionSelectModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="rounded-2xl border border-[var(--border-subtle)] shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{ background: 'var(--bg-surface)' }}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Add Module</h2>
            <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-widest font-medium mt-0.5">
              Extend your research workspace
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--bg-elevated)] transition-colors text-[var(--text-tertiary)]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
            {SECTION_OPTIONS.map(({ type, icon: Icon, label, description }) => {
              const isDisabled = disabledSections.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => {
                    if (!isDisabled) {
                      onSelectSection(type);
                      onClose();
                    }
                  }}
                  disabled={isDisabled}
                  className={cn(
                    "p-4 rounded-xl border transition-all text-left flex items-start gap-4 group relative overflow-hidden",
                    isDisabled 
                      ? "opacity-40 cursor-not-allowed grayscale bg-[var(--bg-elevated)] border-transparent" 
                      : "bg-[var(--bg-elevated)] border-[var(--border-subtle)] hover:border-[var(--accent-primary)] hover:scale-[1.01] cursor-pointer"
                  )}
                >
                  <div className={cn(
                    "p-2.5 rounded-lg shrink-0",
                    isDisabled ? "bg-[var(--bg-surface)]" : "bg-[var(--bg-surface)] group-hover:bg-[var(--accent-primary)]/10 transition-colors"
                  )}>
                    <Icon size={18} className={isDisabled ? "text-[var(--text-tertiary)]" : "text-[var(--accent-primary)]"} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-[var(--text-primary)]">{label}</div>
                    <div className="text-[11px] text-[var(--text-tertiary)] leading-snug mt-0.5">
                      {description}
                    </div>
                  </div>

                  {isDisabled && (
                    <div className="absolute top-2 right-2 text-[8px] font-bold uppercase tracking-tighter text-[var(--text-tertiary)] opacity-50">
                      Added
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[var(--bg-elevated)]/50 border-t border-[var(--border-subtle)] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Button that opens section selector
 */
export function AddSectionButton({
  onSelectSection,
  disabledSections,
}: {
  onSelectSection: (sectionType: MaterialSection) => void;
  disabledSections?: MaterialSection[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed transition-all hover:bg-[var(--bg-elevated)]"
        style={{
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-tertiary)',
        }}
      >
        <Plus size={16} />
        <span className="text-xs font-bold uppercase tracking-widest">Add Module</span>
      </button>

      <SectionSelectModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSelectSection={onSelectSection}
        disabledSections={disabledSections}
      />
    </>
  );
}
