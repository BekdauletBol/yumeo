'use client';

import { useState, useRef } from 'react';
import { X, Upload } from 'lucide-react';
import { createMaterialAction } from '@/app/actions/materials';
import { useMaterialsStore } from '@/stores/materialsStore';
import { useProjectStore } from '@/stores/projectStore';
import { useProjectSectionsStore } from '@/stores/projectSectionsStore';

interface AddFigureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddFigureModal({ isOpen, onClose }: AddFigureModalProps) {
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const addMaterial = useMaterialsStore((s) => s.addMaterial);
  const activeProject = useProjectStore((s) => s.activeProject);
  const sections = useProjectSectionsStore((s) => s.sections);
  const figuresSection = sections.find(s => s.sectionType === 'figures');

  if (!isOpen) return null;

  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    setImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image || !caption.trim() || !activeProject || !figuresSection) return;

    try {
      setIsLoading(true);
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.readAsDataURL(image);
      });

      const material = await createMaterialAction({
        projectId: activeProject.id,
        section: 'figures',
        sectionId: figuresSection.id,
        name: caption,
        content: base64,
        metadata: { 
          fileType: 'image',
          fileSize: image.size,
          caption,
        },
      });
      
      addMaterial(material);
      setCaption('');
      setImage(null);
      setPreview('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      onClose();
    } catch (err) {
      console.error('Failed to add figure:', err);
      alert(err instanceof Error ? err.message : 'Failed to add figure');
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
            <h2 className="text-xl font-semibold">Add Figure</h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              Upload an image (PNG, JPG, GIF, etc.)
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
          {/* Image upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Image</label>
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:opacity-80"
              style={{
                borderColor: 'var(--border-subtle)',
                background: 'var(--bg-secondary)',
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              {preview ? (
                <div className="relative w-full h-48">
                  <img
                    src={preview}
                    alt="preview"
                    className="max-w-full max-h-48 mx-auto rounded"
                  />
                </div>
              ) : (
                <div>
                  <Upload size={24} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Click or drag image here</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageSelect(file);
              }}
              hidden
            />
          </div>

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium mb-2">Caption</label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Describe the figure..."
              className="w-full px-3 py-2 rounded-lg border"
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
              disabled={!image || !caption.trim() || isLoading}
              className="px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'var(--accent-primary)',
                color: 'var(--text-on-accent)',
              }}
            >
              {isLoading ? 'Saving...' : 'Add Figure'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
