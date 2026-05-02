'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { createMaterialAction } from '@/app/actions/materials';
import { useMaterialsStore } from '@/stores/materialsStore';
import { useProjectStore } from '@/stores/projectStore';
import { useProjectSectionsStore } from '@/stores/projectSectionsStore';

interface AddDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddDraftModal({ isOpen, onClose }: AddDraftModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const addMaterial = useMaterialsStore((s) => s.addMaterial);
  const activeProject = useProjectStore((s) => s.activeProject);
  const sections = useProjectSectionsStore((s) => s.sections);
  const draftsSection = sections.find(s => s.sectionType === 'drafts');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !activeProject || !draftsSection) return;

    try {
      setIsLoading(true);
      const material = await createMaterialAction({
        projectId: activeProject.id,
        section: 'drafts',
        sectionId: draftsSection.id,
        name: title,
        content,
        metadata: {
          fileType: 'markdown',
          fileSize: content.length,
        },
      });
      
      addMaterial(material);
      setTitle('');
      setContent('');
      onClose();
    } catch (err) {
      console.error('Failed to add draft:', err);
      alert(err instanceof Error ? err.message : 'Failed to add draft');
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
            <h2 className="text-xl font-semibold">Add Draft</h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              Add a writing note, outline, or snippet
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
          {/* Title input */}
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Research Notes on ML"
              className="w-full px-3 py-2 rounded-lg border"
              style={{
                borderColor: 'var(--border-subtle)',
                background: 'var(--bg-secondary)',
              }}
              disabled={isLoading}
            />
          </div>

          {/* Content input */}
          <div>
            <label className="block text-sm font-medium mb-2">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your draft here..."
              rows={8}
              className="w-full px-3 py-2 rounded-lg border resize-none"
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
              disabled={!title.trim() || !content.trim() || isLoading}
              className="px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'var(--accent-primary)',
                color: 'var(--text-on-accent)',
              }}
            >
              {isLoading ? 'Saving...' : 'Add Draft'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
