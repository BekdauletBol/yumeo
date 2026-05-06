'use client';

import { useMemo, useState } from 'react';
import { FileUp, LayoutTemplate, Play, Plus, Trash2 } from 'lucide-react';
import { useMaterialsStore } from '@/stores/materialsStore';
import { TemplateEditor } from '@/components/template/TemplateEditor';
import { FileUploadZone } from '@/components/upload/FileUploadZone';
import { formatFileSize } from '@/lib/utils/truncate';

export function TemplatesSection() {
  const materials = useMaterialsStore((s) => s.materials);
  const templates = useMemo(
    () => materials.filter((m) => m.section === 'templates'),
    [materials],
  );
  const removeMaterial = useMaterialsStore((s) => s.removeMaterial);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  /** Controls whether to show the upload zone for file-based templates */
  const [showUploadZone, setShowUploadZone] = useState(false);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  // The first file-based template is the "active" template the AI will follow
  const activeFileTemplate = templates.find((t) => t.metadata.isFileTemplate);

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-section-label" style={{ color: 'var(--accent-template)' }}>
          Templates
          <span className="ml-2 text-xs" style={{ color: 'var(--text-tertiary)', textTransform: 'none', letterSpacing: 0, fontFamily: 'var(--font-mono)' }}>
            {templates.length}
          </span>
        </p>
        <div className="flex items-center gap-1">
          {/* Upload a template file */}
          <button
            onClick={() => { setShowUploadZone((v) => !v); setIsCreating(false); }}
            aria-label="Upload template file"
            title="Upload a DOCX, PDF, or TXT file as a template"
            className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors hover:opacity-80"
            style={{ color: 'var(--accent-template)', background: 'rgba(240,112,112,0.1)' }}
          >
            <FileUp size={11} aria-hidden="true" />
            Upload
          </button>
          {/* Create a text template */}
          <button
            onClick={() => { setIsCreating(true); setShowUploadZone(false); }}
            aria-label="Create new text template"
            className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors hover:opacity-80"
            style={{ color: 'var(--accent-template)', background: 'rgba(240,112,112,0.1)' }}
          >
            <Plus size={11} aria-hidden="true" />
            New
          </button>
        </div>
      </div>

      {/* Active file template status badge */}
      {activeFileTemplate ? (
        <div
          className="px-2.5 py-1.5 rounded-md text-xs"
          style={{
            background: 'rgba(240,112,112,0.08)',
            border: '1px solid rgba(240,112,112,0.25)',
            color: 'var(--text-secondary)',
          }}
        >
          <span style={{ color: 'var(--accent-template)' }}>✓ Template loaded:</span>{' '}
          <span style={{ fontFamily: 'var(--font-mono)' }}>{activeFileTemplate.name}</span>
          <br />
          <span style={{ color: 'var(--text-tertiary)' }}>AI will follow this structure and style.</span>
        </div>
      ) : (
        <div
          className="px-2.5 py-1.5 rounded-md text-xs"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px dashed var(--border-default)',
            color: 'var(--text-tertiary)',
          }}
        >
          ⚠ No template uploaded — AI will use standard academic structure.
        </div>
      )}

      {/* File upload zone */}
      {showUploadZone && (
        <div className="space-y-1">
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Upload a DOCX, PDF, or TXT file. AI will mimic its structure and style.
          </p>
          <FileUploadZone
            section="templates"
            compact
            onUploadComplete={() => setShowUploadZone(false)}
          />
        </div>
      )}

      {/* Template editor (create mode) */}
      {isCreating && (
        <TemplateEditor onClose={() => setIsCreating(false)} />
      )}

      {/* Template list */}
      {templates.length === 0 && !isCreating && !showUploadZone ? (
        <div>
          <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Create a template with {'{{ placeholder }}'} syntax. Yumeo fills it using your materials.
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
                {tmpl.metadata.isFileTemplate ? (
                  <FileUp size={12} className="shrink-0" style={{ color: 'var(--accent-template)' }} aria-hidden="true" />
                ) : (
                  <LayoutTemplate size={12} className="shrink-0" style={{ color: 'var(--accent-template)' }} aria-hidden="true" />
                )}
                <span className="flex-1 text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {tmpl.name}
                </span>
                {tmpl.metadata.fileSize && (
                  <span className="text-xs shrink-0" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                    {formatFileSize(tmpl.metadata.fileSize)}
                  </span>
                )}
                {!tmpl.metadata.isFileTemplate && (
                  <button
                    onClick={() => setSelectedTemplateId(tmpl.id)}
                    aria-label={`Run template: ${tmpl.name}`}
                    className="flex shrink-0 items-center gap-1 text-xs px-1.5 py-0.5 rounded hover:opacity-80"
                    style={{ color: 'var(--accent-template)', background: 'rgba(240,112,112,0.12)' }}
                  >
                    <Play size={10} aria-hidden="true" />
                    Run
                  </button>
                )}

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
