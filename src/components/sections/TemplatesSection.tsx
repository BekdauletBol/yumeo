'use client';

import { useMemo, useState, useRef, useCallback } from 'react';
import { LayoutTemplate, Play, Plus, Trash2, UploadCloud, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useMaterialsStore } from '@/stores/materialsStore';
import { TemplateEditor } from '@/components/template/TemplateEditor';
import { formatFileSize } from '@/lib/utils/truncate';
import { parsePDF } from '@/lib/parsers/pdfParser';
import { parseDocx } from '@/lib/parsers/docxParser';
import { useProjectStore } from '@/stores/projectStore';
import { useProjectSectionsStore } from '@/stores/projectSectionsStore';
import { createMaterialAction } from '@/app/actions/materials';

export function TemplatesSection() {
  const materials = useMaterialsStore((s) => s.materials);
  const activeProject = useProjectStore((s) => s.activeProject);
  const sections = useProjectSectionsStore((s) => s.sections);
  const templatesSection = sections.find(s => s.sectionType === 'templates');

  const templates = useMemo(
    () => materials.filter((m) => m.section === 'templates'),
    [materials],
  );
  const addMaterial = useMaterialsStore((s) => s.addMaterial);
  const removeMaterial = useMaterialsStore((s) => s.removeMaterial);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const activeTemplate = templates[0]; // Currently we use the first one as active for generation

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeProject || !templatesSection) return;

    try {
      setIsUploading(true);
      let content = '';
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const res = await parsePDF(file);
        content = res.text;
      } else if (file.name.toLowerCase().endsWith('.docx')) {
        const res = await parseDocx(file);
        content = res.text;
      } else {
        content = await file.text();
      }

      const ext = file.name.split('.').pop()?.toLowerCase();
      let fileType: 'pdf' | 'text' | 'markdown' = 'text';
      
      if (ext === 'pdf') fileType = 'pdf';
      else if (ext === 'md' || ext === 'markdown') fileType = 'markdown';

      const material = await createMaterialAction({
        projectId: activeProject.id,
        section: 'templates',
        sectionId: templatesSection.id,
        name: file.name,
        content,
        metadata: { fileType, fileSize: file.size },
      });
      
      addMaterial(material);
    } catch (err) {
      console.error('Failed to upload template:', err);
      alert('Failed to upload template file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [activeProject, templatesSection, addMaterial]);

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-section-label" style={{ color: 'var(--accent-template)' }}>
          Templates
          <span className="ml-2 text-xs" style={{ color: 'var(--text-tertiary)', textTransform: 'none', letterSpacing: 0, fontFamily: 'var(--font-mono)' }}>
            {templates.length}
          </span>
        </p>
        <div className="flex gap-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            aria-label="Upload template"
            className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors hover:opacity-80 disabled:opacity-50"
            style={{ color: 'var(--accent-template)', background: 'rgba(240,112,112,0.1)' }}
          >
            {isUploading ? <Loader2 size={11} className="animate-spin" /> : <UploadCloud size={11} />}
            Upload
          </button>
          <button
            onClick={() => setIsCreating(true)}
            aria-label="Create new template"
            className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors hover:opacity-80"
            style={{ color: 'var(--accent-template)', background: 'rgba(240,112,112,0.1)' }}
          >
            <Plus size={11} aria-hidden="true" />
            New
          </button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".pdf,.docx,.txt,.md"
          className="hidden"
        />
      </div>

      {/* Template status banner */}
      {activeTemplate ? (
        <div className="px-2.5 py-2 rounded-md border flex items-center gap-2" style={{ background: 'rgba(34, 197, 94, 0.05)', borderColor: 'rgba(34, 197, 94, 0.2)' }}>
          <CheckCircle2 size={12} className="text-green-500 shrink-0" />
          <p className="text-[10px] font-medium text-green-600 truncate">
            Template loaded: {activeTemplate.name}. AI will write in this format.
          </p>
        </div>
      ) : (
        <div className="px-2.5 py-2 rounded-md border flex items-center gap-2" style={{ background: 'rgba(245, 158, 11, 0.05)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
          <AlertCircle size={12} className="text-amber-500 shrink-0" />
          <p className="text-[10px] font-medium text-amber-600">
            No template loaded. AI will use standard academic structure.
          </p>
        </div>
      )}

      {/* Template editor (create mode) */}
      {isCreating && (
        <TemplateEditor onClose={() => setIsCreating(false)} />
      )}

      {/* Template list */}
      {templates.length === 0 && !isCreating ? (
        <div>
          <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Upload a template or create one with {'{{ placeholder }}'} syntax.
          </p>
          <div className="space-y-2">
            {STARTER_TEMPLATES.map((t) => (
              <button
                key={t.name}
                className="w-full text-left p-2.5 rounded-md text-xs transition-colors hover:opacity-80"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px dashed var(--border-default)',
                  color: 'var(--text-secondary)',
                }}
                onClick={() => setIsCreating(true)}
              >
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{t.name}</p>
                <p className="mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{t.description}</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="p-2.5 rounded-md"
              style={{
                background: selectedTemplateId === tmpl.id ? 'rgba(240,112,112,0.08)' : 'var(--bg-elevated)',
                border: `1px solid ${selectedTemplateId === tmpl.id ? 'rgba(240,112,112,0.35)' : 'var(--border-subtle)'}`,
              }}
            >
              <div className="flex items-center gap-2 relative group pr-6">
                <LayoutTemplate size={12} className="shrink-0" style={{ color: 'var(--accent-template)' }} aria-hidden="true" />
                <span className="flex-1 text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {tmpl.name}
                </span>
                {tmpl.metadata.fileSize && (
                  <span className="text-xs shrink-0" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                    {formatFileSize(tmpl.metadata.fileSize)}
                  </span>
                )}
                <button
                  onClick={() => setSelectedTemplateId(tmpl.id)}
                  aria-label={`Run template: ${tmpl.name}`}
                  className="flex shrink-0 items-center gap-1 text-xs px-1.5 py-0.5 rounded hover:opacity-80"
                  style={{ color: 'var(--accent-template)', background: 'rgba(240,112,112,0.12)' }}
                >
                  <Play size={10} aria-hidden="true" />
                  Run
                </button>

                {/* Delete button (visible on hover) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeMaterial(tmpl.id);
                  }}
                  className="absolute right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-white/10"
                  style={{ color: 'var(--text-tertiary)' }}
                  aria-label={`Delete template`}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected template output */}
      {selectedTemplate && (
        <TemplateEditor
          existingMaterial={selectedTemplate}
          onClose={() => setSelectedTemplateId(null)}
        />
      )}
    </div>
  );
}

const STARTER_TEMPLATES = [
  { name: 'Abstract', description: 'Auto-generate an abstract from your materials' },
  { name: 'Literature Review', description: 'Structured review of your references' },
  { name: 'Methodology', description: 'Draft a methodology section' },
] as const;