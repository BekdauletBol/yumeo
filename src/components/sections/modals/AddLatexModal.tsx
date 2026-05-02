'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { createMaterialAction } from '@/app/actions/materials';
import { useMaterialsStore } from '@/stores/materialsStore';
import { useProjectStore } from '@/stores/projectStore';
import { useProjectSectionsStore } from '@/stores/projectSectionsStore';

interface AddLatexModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddLatexModal({ isOpen, onClose }: AddLatexModalProps) {
  const [name, setName] = useState('');
  const [equation, setEquation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const addMaterial = useMaterialsStore((s) => s.addMaterial);
  const activeProject = useProjectStore((s) => s.activeProject);
  const sections = useProjectSectionsStore((s) => s.sections);
  const equationsSection = sections.find(s => s.sectionType === 'equations');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !equation.trim() || !activeProject || !equationsSection) return;

    try {
      setIsLoading(true);
      const material = await createMaterialAction({
        projectId: activeProject.id,
        section: 'equations',
        sectionId: equationsSection.id,
        name,
        content: equation,
        metadata: { fileType: 'latex', fileSize: equation.length },
      });
      
      addMaterial(material);
      setName('');
      setEquation('');
      onClose();
    } catch (err) {
      console.error('Failed to add equation:', err);
      alert(err instanceof Error ? err.message : 'Failed to add equation');
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
            <h2 className="text-xl font-semibold">Add LaTeX Equation</h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              Add mathematical equations or formulas
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
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Equation Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pythagorean Theorem"
              className="w-full px-3 py-2 rounded-lg border"
              style={{
                borderColor: 'var(--border-subtle)',
                background: 'var(--bg-secondary)',
              }}
              disabled={isLoading}
            />
          </div>

          {/* LaTeX equation */}
          <div>
            <label className="block text-sm font-medium mb-2">LaTeX Code</label>
            <textarea
              value={equation}
              onChange={(e) => setEquation(e.target.value)}
              placeholder="E.g. E = mc^2 or \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}"
              rows={6}
              className="w-full px-3 py-2 rounded-lg border resize-none font-mono text-sm"
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
              disabled={!name.trim() || !equation.trim() || isLoading}
              className="px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'var(--accent-primary)',
                color: 'var(--text-on-accent)',
              }}
            >
              {isLoading ? 'Saving...' : 'Add Equation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
