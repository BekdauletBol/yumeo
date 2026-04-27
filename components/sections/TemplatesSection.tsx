'use client';

import { useMemo, useState } from 'react';
import { LayoutTemplate, Play, Plus } from 'lucide-react';
import { useMaterialsStore } from '@/stores/materialsStore';
import { FileUploadZone } from '@/components/upload/FileUploadZone';
import { TemplateEditor } from '@/components/template/TemplateEditor';

export function TemplatesSection() {
  const materials = useMaterialsStore((s) => s.materials);
  const templates = useMemo(
    () => materials.filter((m) => m.section === 'templates'),
    [materials],
  );
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-section-label" style={{ color: 'var(--accent-template)' }}>
          Templates
          <span className="ml-2 text-xs" style={{ color: 'var(--text-tertiary)', textTransform: 'none', letterSpacing: 0, fontFamily: 'var(--font-mono)' }}>
            {templates.length}
          </span>
        </p>
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

      {/* Template editor (create mode) */}
      {isCreating && (
        <TemplateEditor onClose={() => setIsCreating(false)} />
      )}

      {/* Template list */}
      {templates.length === 0 && !isCreating ? (
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
              <div className="flex items-center gap-2">
                <LayoutTemplate size={12} style={{ color: 'var(--accent-template)' }} aria-hidden="true" />
                <span className="flex-1 text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {tmpl.name}
                </span>
                <button
                  onClick={() => setSelectedTemplateId(tmpl.id)}
                  aria-label={`Run template: ${tmpl.name}`}
                  className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded hover:opacity-80"
                  style={{ color: 'var(--accent-template)', background: 'rgba(240,112,112,0.12)' }}
                >
                  <Play size={10} aria-hidden="true" />
                  Run
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