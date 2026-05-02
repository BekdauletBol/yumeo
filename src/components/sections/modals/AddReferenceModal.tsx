'use client';

import { X } from 'lucide-react';
import { FileUploadZone } from '@/components/upload/FileUploadZone';
import { useProjectSectionsStore } from '@/stores/projectSectionsStore';

interface AddReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddReferenceModal({ isOpen, onClose }: AddReferenceModalProps) {
  const sections = useProjectSectionsStore((s) => s.sections);
  const referencesSection = sections.find(s => s.sectionType === 'references');

  if (!isOpen || !referencesSection) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xl mx-4"
        style={{ background: 'var(--bg-primary)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Add Reference</h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              Upload PDF, DOCX, or TXT files
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:opacity-70"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Upload zone */}
        <div className="mb-4">
          <FileUploadZone
            section="references"
            sectionId={referencesSection.id}
            onUploadComplete={onClose}
          />
        </div>

        {/* Close button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border-2 transition-colors"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
