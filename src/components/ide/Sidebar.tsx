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
  X,
} from 'lucide-react';
import { useMaterialsStore } from '@/stores/materialsStore';
import { useProjectStore } from '@/stores/projectStore';
import { useProjectSectionsStore } from '@/stores/projectSectionsStore';
import { useSectionInputStore } from '@/stores/sectionInputStore';
import { useProjectSections } from '@/hooks/useProjectSections';
import { cn } from '@/lib/utils/cn';
import { AddSectionButton } from '@/components/sections/AddSectionButton';
import { createProjectSectionAction, deleteProjectSectionAction } from '@/app/actions/sections';
import type { MaterialSection } from '@/lib/types';
import { SECTION_ACCENT } from '@/lib/types/material';

// ─── Section icon map ─────────────────────────────────────────────────────────

const SECTION_ICONS: Record<MaterialSection, React.ElementType> = {
  references: BookMarked,
  drafts: FileText,
  figures: Image,
  tables: Table2,
  templates: LayoutTemplate,
  equations: Sigma,
  diagrams: Workflow,
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Sidebar() {
  const activeProject = useProjectStore((s) => s.activeProject);
  const { materials, selectedMaterialId, setSelectedMaterialId, removeMaterial } = useMaterialsStore();
  const { sections, activeSectionId, setActiveSection } = useProjectSectionsStore();
  const { openModal } = useSectionInputStore();

  // Load sections when project changes
  useProjectSections(activeProject?.id);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const toggleSection = useCallback((sectionId: string) => {
    setExpanded((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
    setActiveSection(sectionId);
  }, [setActiveSection]);

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('Delete this section and all its materials?')) return;
    try {
      setLoadingAction(sectionId);
      await deleteProjectSectionAction(sectionId);
    } catch (err) {
      console.error('Failed to delete section:', err);
      alert('Failed to delete section');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAddSection = async (sectionType: MaterialSection) => {
    if (!activeProject) return;
    try {
      setLoadingAction(`add-${sectionType}`);
      await createProjectSectionAction(activeProject.id, sectionType);
    } catch (err) {
      console.error('Failed to add section:', err);
      alert(err instanceof Error ? err.message : 'Failed to add section');
    } finally {
      setLoadingAction(null);
    }
  };

  const totalCount = materials.length;
  const activeSections = sections.filter((s) => s.isActive);

  // Group materials by section
  const sectionMaterialCounts: Record<string, number> = {};
  materials.forEach((m) => {
    if (m.sectionId) {
      sectionMaterialCounts[m.sectionId] = (sectionMaterialCounts[m.sectionId] ?? 0) + 1;
    }
  });

  // Filter to only show sections with materials
  const visibleSections = activeSections.filter(
    (s) => sectionMaterialCounts[s.id] ?? 0 > 0
  );

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
        {visibleSections.length === 0 ? (
          // Empty state: show all sections as placeholders to add content
          <div className="px-3 py-6">
            <p className="text-xs mb-4 text-center" style={{ color: 'var(--text-secondary)' }}>
              Add content to get started:
            </p>
            <div className="space-y-2">
              {activeSections.map((section) => {
                const Icon = SECTION_ICONS[section.sectionType];
                const accent = SECTION_ACCENT[section.sectionType];
                return (
                  <button
                    key={section.id}
                    onClick={() => openModal(section.sectionType)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors rounded"
                    style={{
                      color: accent,
                      background: 'var(--bg-secondary)',
                      borderLeft: `2px solid ${accent}`,
                    }}
                  >
                    <Icon size={14} />
                    <span className="text-xs font-medium flex-1">Add {section.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            <p className="px-3 pb-2 text-section-label" style={{ fontFamily: 'var(--font-mono)' }}>
              Materials ({visibleSections.length})
            </p>

            {/* Render sections with content only */}
            {visibleSections.map((section) => {
              const Icon = SECTION_ICONS[section.sectionType];
              const accent = SECTION_ACCENT[section.sectionType];
              const sectionMaterials = materials.filter((m) => m.sectionId === section.id);
              const isExpanded = expanded[section.id] ?? true;
              const isActive = activeSectionId === section.id;

              return (
                <div key={section.id}>
                  {/* Section header row */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    aria-expanded={isExpanded}
                    aria-label={`${section.name} section, ${sectionMaterials.length} items`}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-left transition-colors group',
                      isActive ? 'opacity-100' : 'opacity-70 hover:opacity-90',
                    )}
                    style={{
                      background: isActive ? 'var(--bg-elevated)' : 'transparent',
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
                      {section.name}
                    </span>

                    {/* Material count badge */}
                    {sectionMaterials.length > 0 && (
                      <span
                        className="text-xs px-1.5"
                        style={{
                          color: accent,
                          background: `${accent}18`,
                          fontFamily: 'var(--font-mono)',
                          borderRadius: '3px',
                        }}
                      >
                        {sectionMaterials.length}
                      </span>
                    )}

                    {/* Delete section button (hover) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSection(section.id);
                      }}
                      disabled={loadingAction === section.id}
                      className="opacity-0 group-hover:opacity-100 p-0.5 transition-opacity hover:text-red-400"
                      style={{ color: 'var(--text-tertiary)' }}
                      title="Delete section"
                    >
                      <X size={12} />
                    </button>

                    {/* Chevron */}
                    <ChevronRight
                      size={12}
                      className={cn('transition-transform', isExpanded && 'rotate-90')}
                      style={{ color: 'var(--text-tertiary)' }}
                      aria-hidden="true"
                    />
                  </button>

                  {/* Material list and add button */}
                  {isExpanded && (
                    <div className="pb-1">
                      {sectionMaterials.length === 0 ? (
                        <div
                          className="mx-3 my-1 px-3 py-2 text-xs text-center"
                          style={{
                            color: 'var(--text-tertiary)',
                            borderColor: 'var(--border-subtle)',
                          }}
                        >
                          No items yet
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
                                'group/item flex items-center gap-2 pl-8 pr-2 py-1.5 mx-1 cursor-pointer transition-colors rounded',
                              )}
                              style={{
                                background: isSelected ? 'var(--bg-overlay)' : 'transparent',
                                color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                              }}
                            >
                              <span className="flex-1 text-xs truncate font-medium">{material.name}</span>

                              {/* Delete material button (hover) */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeMaterial(material.id);
                                }}
                                aria-label={`Remove ${material.name}`}
                                className="opacity-0 group-hover/item:opacity-100 p-0.5 transition-opacity hover:text-red-400"
                                style={{ color: 'var(--text-tertiary)' }}
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          );
                        })
                      )}

                      {/* Add to section button */}
                      <button
                        onClick={() => openModal(section.sectionType)}
                        className="flex items-center gap-1.5 pl-8 pr-3 py-1.5 mx-1 w-full text-left transition-colors rounded hover:opacity-80"
                        style={{ color: 'var(--text-tertiary)' }}
                        title={`Add to ${section.name}`}
                      >
                        <Plus size={11} />
                        <span className="text-xs">Add</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Add Section button — always at bottom */}
      <div
        className="px-3 py-3 shrink-0 border-t"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <AddSectionButton
          onSelectSection={handleAddSection}
          disabledSections={sections.map((s) => s.sectionType)}
        />
      </div>

      {/* Footer stats */}
      <div
        className="px-3 py-2 shrink-0 border-t text-xs"
        style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-tertiary)' }}
      >
        {totalCount === 0
          ? 'No materials'
          : `${totalCount} material${totalCount !== 1 ? 's' : ''} loaded`}
      </div>
    </div>
  );
}