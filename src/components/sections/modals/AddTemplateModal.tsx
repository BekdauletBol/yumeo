'use client';

import { useState, useRef, useCallback } from 'react';
import { X, UploadCloud, Loader2 } from 'lucide-react';
import { createMaterialAction } from '@/app/actions/materials';
import { useMaterialsStore } from '@/stores/materialsStore';
import { useProjectStore } from '@/stores/projectStore';
import { useProjectSectionsStore } from '@/stores/projectSectionsStore';
import { parsePDF } from '@/lib/parsers/pdfParser';
import { parseDocx } from '@/lib/parsers/docxParser';

interface AddTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddTemplateModal({ isOpen, onClose }: AddTemplateModalProps) {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const addMaterial = useMaterialsStore((s) => s.addMaterial);
  const activeProject = useProjectStore((s) => s.activeProject);
  const sections = useProjectSectionsStore((s) => s.sections);
  const templatesSection = sections.find(s => s.sectionType === 'templates');

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsParsing(true);
      let text = '';
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const res = await parsePDF(file);
        text = res.text;
      } else if (file.name.toLowerCase().endsWith('.docx')) {
        const res = await parseDocx(file);
        text = res.text;
      } else {
        text = await file.text();
      }

      setContent(text);
      if (!name) {
        setName(file.name.split('.')[0] || 'Template');
      }
    } catch (err) {
      console.error('Failed to parse template file:', err);
      alert('Failed to parse template file');
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [name]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim() || !activeProject || !templatesSection) return;

    try {
      setIsLoading(true);
      const material = await createMaterialAction({
        projectId: activeProject.id,
        section: 'templates',
        sectionId: templatesSection.id,
        name,
        content,
        metadata: { fileType: 'text', fileSize: content.length },
      });
      
      addMaterial(material);
      setName('');
      setContent('');
      onClose();
    } catch (err) {
      console.error('Failed to add template:', err);
      alert(err instanceof Error ? err.message : 'Failed to add template');
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
            <h2 className="text-xl font-semibold">Add Template</h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              Upload a file or paste your structured outline
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

        {/* File Upload Trigger */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isParsing}
            className="w-full flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl transition-colors hover:opacity-80"
            style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-secondary)' }}
          >
            {isParsing ? (
              <Loader2 size={24} className="animate-spin" />
            ) : (
              <UploadCloud size={24} className="opacity-50" />
            )}
            <div className="text-center">
              <p className="text-sm font-medium">Click to upload template file</p>
              <p className="text-[10px] opacity-60">PDF, DOCX, TXT, or MD</p>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            accept=".pdf,.docx,.txt,.md"
            className="hidden"
          />
        </div>

        {/* Separator */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-[#1a1a1a] px-2 text-gray-500">Or paste manually</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Template Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Research Proposal Template"
              className="w-full px-3 py-2 rounded-lg border outline-none focus:ring-1 focus:ring-accent-primary"
              style={{
                borderColor: 'var(--border-subtle)',
                background: 'var(--bg-secondary)',
              }}
              disabled={isLoading || isParsing}
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium mb-2">Template Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your template structure here..."
              rows={8}
              className="w-full px-3 py-2 rounded-lg border resize-none outline-none focus:ring-1 focus:ring-accent-primary"
              style={{
                borderColor: 'var(--border-subtle)',
                background: 'var(--bg-secondary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
              }}
              disabled={isLoading || isParsing}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border-2 transition-colors"
              style={{ borderColor: 'var(--border-subtle)' }}
              disabled={isLoading || isParsing}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !content.trim() || isLoading || isParsing}
              className="px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'var(--accent-primary)',
                color: 'var(--text-on-accent)',
              }}
            >
              {isLoading ? 'Saving...' : 'Add Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
