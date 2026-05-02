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
} from 'lucide-react';
import type { MaterialSection } from '@/lib/types';

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
    label: '📄 References',
    description: 'Research papers, PDFs, articles',
  },
  {
    type: 'drafts',
    icon: FileText,
    label: '✏️ Drafts',
    description: 'Writing notes, outlines, snippets',
  },
  {
    type: 'figures',
    icon: Image,
    label: '🖼️ Figures',
    description: 'Charts, diagrams, images',
  },
  {
    type: 'tables',
    icon: Table2,
    label: '📊 Tables',
    description: 'Data tables, datasets',
  },
  {
    type: 'templates',
    icon: LayoutTemplate,
    label: '🔷 Templates',
    description: 'Structured outlines, forms',
  },
  {
    type: 'equations',
    icon: Sigma,
    label: '📐 LaTeX',
    description: 'Math equations, formulas',
  },
  {
    type: 'diagrams',
    icon: Workflow,
    label: '🔷 Diagrams',
    description: 'Mermaid flowcharts, diagrams',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4"
        style={{ background: 'var(--bg-primary)' }}
      >
        <h2 className="text-xl font-semibold mb-4">Add a Section</h2>
        <p
          className="text-sm mb-6"
          style={{ color: 'var(--text-secondary)' }}
        >
          Choose what type of material you want to organize
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {SECTION_OPTIONS.map(({ type, icon: Icon, label, description }) => {
            const isDisabled = disabledSections.includes(type);
            return (
              <button
                key={type}
                onClick={() => {
                  onSelectSection(type);
                  onClose();
                }}
                disabled={isDisabled}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  isDisabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:border-blue-500 hover:bg-blue-50 cursor-pointer'
                }`}
                style={{
                  borderColor: isDisabled
                    ? 'var(--border-subtle)'
                    : 'var(--border-subtle)',
                  background: isDisabled
                    ? 'var(--bg-disabled)'
                    : 'var(--bg-secondary)',
                }}
              >
                <div className="flex items-start gap-2">
                  <Icon className="w-5 h-5 mt-0.5" />
                  <div>
                    <div className="font-medium">{label}</div>
                    <div
                      className="text-xs"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {description}
                    </div>
                  </div>
                </div>
                {isDisabled && (
                  <div
                    className="text-xs mt-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    ✓ Already added
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border-2"
            style={{ borderColor: 'var(--border-subtle)' }}
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
        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors"
        style={{
          background: 'var(--accent-primary)',
          color: 'var(--text-on-accent)',
        }}
      >
        <Plus className="w-4 h-4" />
        <span>Add Section</span>
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
