'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { createMaterialAction } from '@/app/actions/materials';
import { useMaterialsStore } from '@/stores/materialsStore';
import { useProjectStore } from '@/stores/projectStore';
import { useProjectSectionsStore } from '@/stores/projectSectionsStore';

interface AddTableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddTableModal({ isOpen, onClose }: AddTableModalProps) {
  const [caption, setCaption] = useState('');
  const [csvContent, setCsvContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const addMaterial = useMaterialsStore((s) => s.addMaterial);
  const activeProject = useProjectStore((s) => s.activeProject);
  const sections = useProjectSectionsStore((s) => s.sections);
  const tablesSection = sections.find(s => s.sectionType === 'tables');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim() || !csvContent.trim() || !activeProject || !tablesSection) return;

    try {
      setIsLoading(true);
      const material = await createMaterialAction({
        projectId: activeProject.id,
        section: 'tables',
        sectionId: tablesSection.id,
        name: caption,
        content: csvContent,
        metadata: { fileType: 'text', fileSize: csvContent.length },
      });
      
      addMaterial(material);
      setCaption('');
      setCsvContent('');
      onClose();
    } catch (err) {
      console.error('Failed to add table:', err);
      alert(err instanceof Error ? err.message : 'Failed to add table');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--bg-primary)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Add Table</h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              Paste CSV data or upload a file
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Caption */}
          <div>
            <label className="block text-sm font-medium mb-2">Table Title</label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="e.g. Research Results Summary"
              className="w-full px-3 py-2 rounded-lg border"
              style={{
                borderColor: 'var(--border-subtle)',
                background: 'var(--bg-secondary)',
              }}
              disabled={isLoading}
            />
          </div>

          {/* CSV input */}
          <div>
            <label className="block text-sm font-medium mb-2">CSV Data</label>
            <textarea
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder="Name,Value,Status
Item A,100,Active
Item B,200,Inactive"
              rows={8}
              className="w-full px-3 py-2 rounded-lg border resize-none font-mono text-xs"
              style={{
                borderColor: 'var(--border-subtle)',
                background: 'var(--bg-secondary)',
              }}
              disabled={isLoading}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border-2 transition-colors"
              style={{ borderColor: 'var(--border-subtle)' }}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!caption.trim() || !csvContent.trim() || isLoading}
              className="px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'var(--accent-primary)',
                color: 'var(--text-on-accent)',
              }}
            >
              {isLoading ? 'Saving...' : 'Add Table'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
