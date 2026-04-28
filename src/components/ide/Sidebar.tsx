'use client';

import { useState, useCallback } from 'react';
import {
  BookMarked,
  FileText,
  Image,
  Table2,
  LayoutTemplate,
  Sigma,
  Workflow,
  ChevronRight,
  Plus,
  Trash2,
} from 'lucide-react';
import { useMaterialsStore } from '@/stores/materialsStore';
import { useProjectStore } from '@/stores/projectStore';
import { cn } from '@/lib/utils/cn';
import { FileUploadZone } from '@/components/upload/FileUploadZone';
import type { MaterialSection } from '@/lib/types';
import { SECTION_LABELS } from '@/lib/types/material';

// ─── Section config ───────────────────────────────────────────────────────────

const SECTIONS: {
  key: MaterialSection;
  icon: React.ElementType;
  accent: string;
}[] = [
  { key: 'references', icon: BookMarked, accent: 'var(--accent-refs)' },
  { key: 'drafts',     icon: FileText,   accent: 'var(--accent-drafts)' },
  { key: 'figures',    icon: Image,      accent: 'var(--accent-figures)' },
  { key: 'tables',     icon: Table2,     accent: 'var(--accent-tables)' },
  { key: 'templates',  icon: LayoutTemplate, accent: 'var(--accent-template)' },
  { key: 'equations',  icon: Sigma,      accent: 'var(--accent-equations)' },
  { key: 'diagrams',   icon: Workflow,   accent: 'var(--accent-diagrams)' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function Sidebar() {
  const activeProject = useProjectStore((s) => s.activeProject);
  const { materials, activeSection, selectedMaterialId, setActiveSection, setSelectedMaterialId, removeMaterial } =
    useMaterialsStore();

  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    references: true,
    drafts: false,
    figures: false,
    tables: false,
    templates: false,
    equations: false,
    diagrams: false,
  });

  const [uploadingSection, setUploadingSection] = useState<MaterialSection | null>(null);

  const toggleSection = useCallback((key: MaterialSection) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
    setActiveSection(key);
  }, [setActiveSection]);

  const totalCount = materials.length;

  return (
    <div className="flex flex-col h-full select-none border-r" style={{ borderColor: 'var(--border-subtle)' }}>
      {/* Header */}
      <div
        className="px-3 py-3 shrink-0 border-b"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <p className="text-section-label" style={{ fontFamily: 'var(--font-mono)' }}>Projects</p>
        <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
          {activeProject?.name ?? 'No project'}
        </p>
      </div>

      {/* Section list */}
      <div className="flex-1 overflow-y-auto py-2">
        <p className="px-3 pb-2 text-section-label" style={{ fontFamily: 'var(--font-mono)' }}>
          References / Drafts / Figures / Templates
        </p>
        {SECTIONS.map(({ key, icon: Icon, accent }) => {
          const sectionMaterials = materials.filter((m) => m.section === key);
          const isExpanded = expanded[key] ?? false;
          const isActive = activeSection === key;

          return (
            <div key={key}>
              {/* Section header row */}
              <button
                onClick={() => toggleSection(key)}
                aria-expanded={isExpanded}
                aria-label={`${SECTION_LABELS[key]} section, ${sectionMaterials.length} files`}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-left transition-colors border-y',
                  isActive ? 'opacity-100' : 'opacity-70 hover:opacity-90',
                )}
                style={{
                  background: isActive ? 'var(--bg-elevated)' : 'transparent',
                  borderColor: isActive ? 'var(--border-default)' : 'transparent',
                }}
              >
                {/* Section color dot */}
                <span
                  className="w-1.5 h-1.5 shrink-0"
                  style={{ background: accent }}
                  aria-hidden="true"
                />

                {/* Icon */}
                <Icon size={13} style={{ color: accent }} aria-hidden="true" />

                {/* Label */}
                <span
                  className="flex-1 text-xs font-medium"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {SECTION_LABELS[key]}
                </span>

                {/* File count badge */}
                {sectionMaterials.length > 0 && (
                  <span
                  className="text-xs px-1"
                    style={{
                      color: accent,
                      background: `${accent}18`,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {sectionMaterials.length}
                  </span>
                )}

                {/* Chevron */}
                <ChevronRight
                  size={12}
                  className={cn('transition-transform', isExpanded && 'rotate-90')}
                  style={{ color: 'var(--text-tertiary)' }}
                  aria-hidden="true"
                />
              </button>

              {/* File list */}
              {isExpanded && (
                <div className="pb-1">
                  {sectionMaterials.length === 0 ? (
                    <div
                      className="mx-3 my-1 px-3 py-2 text-xs text-center border"
                      style={{
                        color: 'var(--text-tertiary)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      No {SECTION_LABELS[key].toLowerCase()} yet
                    </div>
                  ) : (
                    sectionMaterials.map((material) => {
                      const isSelected = selectedMaterialId === material.id;
                      return (
                        <div
                          key={material.id}
                          role="option"
                          tabIndex={0}
                          aria-selected={isSelected}
                          aria-label={material.name}
                          onClick={() => setSelectedMaterialId(material.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              setSelectedMaterialId(material.id);
                            }
                          }}
                          className={cn(
                            'group flex items-center gap-2 pl-8 pr-2 py-1.5 mx-1 cursor-pointer transition-colors',
                          )}
                          style={{
                            background: isSelected ? 'var(--bg-overlay)' : 'transparent',
                            color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                          }}
                        >
                          <span className="flex-1 text-xs truncate">{material.name}</span>

                          {/* Delete button (hover only) */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeMaterial(material.id);
                            }}
                            aria-label={`Remove ${material.name}`}
                            className="opacity-0 group-hover:opacity-100 p-0.5 transition-opacity hover:text-red-400"
                            style={{ color: 'var(--text-tertiary)' }}
                          >
                            <Trash2 size={11} aria-hidden="true" />
                          </button>
                        </div>
                      );
                    })
                  )}

                  {/* Upload trigger for this section */}
                  <button
                    onClick={() => setUploadingSection(uploadingSection === key ? null : key)}
                    aria-label={`Add file to ${SECTION_LABELS[key]}`}
                    className="flex items-center gap-1.5 pl-8 pr-3 py-1.5 mx-1 w-full text-left transition-colors hover:opacity-80 border"
                    style={{ color: 'var(--text-tertiary)', borderColor: 'var(--border-subtle)' }}
                  >
                    <Plus size={11} aria-hidden="true" />
                    <span className="text-xs">Add file</span>
                  </button>

                  {/* Inline upload zone */}
                  {uploadingSection === key && (
                    <div className="mx-3 my-1">
                      <FileUploadZone
                        section={key}
                        compact
                        onUploadComplete={() => setUploadingSection(null)}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Workspace Tools and Integrations removed — live in right panel tabs & Settings page */}
      </div>

      {/* Footer: total count */}
      <div
        className="px-3 py-2 shrink-0 border-t text-xs"
        style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-tertiary)' }}
      >
        {totalCount === 0
          ? '0 materials — upload a reference to begin'
          : `${totalCount} material${totalCount !== 1 ? 's' : ''} loaded`}
      </div>
    </div>
  );
}