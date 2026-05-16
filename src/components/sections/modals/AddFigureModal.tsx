'use client';

import { useState, useRef } from 'react';
import { X, Upload } from 'lucide-react';
import { createFigureAction } from '@/app/actions/figures';
import { useFiguresStore } from '@/stores/figuresStore';
import { useProjectStore } from '@/stores/projectStore';
import { showToast } from '@/lib/utils/toast';

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
  
  const addFigure = useFiguresStore((s) => s.addFigure);
  const activeProject = useProjectStore((s) => s.activeProject);

  if (!isOpen) return null;

  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file');
      return;
    }
    setImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image || !caption.trim() || !activeProject) return;

    try {
      setIsLoading(true);
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const res = ev.target?.result as string;
          resolve(res.split(',')[1] || res);
        };
        reader.onerror = reject;
        reader.readAsDataURL(image);
      });

      const newFigure = await createFigureAction({
        projectId: activeProject.id,
        imageBase64: base64,
        caption,
      });
      
      addFigure(newFigure);
      showToast('Figure added successfully');
      setCaption('');
      setImage(null);
      setPreview('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      onClose();
    } catch (err) {
      console.error('Failed to add figure:', err);
      showToast(err instanceof Error ? err.message : 'Failed to add figure');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="rounded-2xl border border-[var(--border-subtle)] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{ background: 'var(--bg-surface)' }}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Add Figure</h2>
            <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-widest font-medium mt-0.5">
              Upload image or diagram
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--bg-elevated)] transition-colors text-[var(--text-tertiary)]"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Image upload */}
          <div>
            <div
              className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all hover:bg-[var(--bg-elevated)] hover:border-[var(--accent-primary)] group"
              style={{
                borderColor: preview ? 'transparent' : 'var(--border-subtle)',
                background: preview ? 'transparent' : 'var(--bg-elevated)',
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              {preview ? (
                <div className="relative w-full aspect-video">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="preview"
                    className="w-full h-full object-contain rounded-lg shadow-sm"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                    <p className="text-xs font-bold text-white uppercase tracking-widest">Change Image</p>
                  </div>
                </div>
              ) : (
                <div className="py-4">
                  <Upload size={32} className="mx-auto mb-3 text-[var(--text-tertiary)] group-hover:text-[var(--accent-primary)] transition-colors" />
                  <p className="text-sm font-medium text-[var(--text-primary)]">Drop image here or click to browse</p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">Supports PNG, JPG, GIF up to 10MB</p>
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
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-tertiary)] px-1">Caption</label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="e.g. Correlation between carbon and heat"
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-sm outline-none focus:border-[var(--accent-primary)] transition-all"
              disabled={isLoading}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!image || !caption.trim() || isLoading}
              className="px-6 py-2.5 rounded-xl transition-all font-bold text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'var(--accent-primary)',
                color: 'white',
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
