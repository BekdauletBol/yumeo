'use client';

import { useSectionInputStore } from '@/stores/sectionInputStore';
import { AddReferenceModal } from './modals/AddReferenceModal';
import { AddDraftModal } from './modals/AddDraftModal';
import { AddFigureModal } from './modals/AddFigureModal';
import { AddTableModal } from './modals/AddTableModal';
import { AddTemplateModal } from './modals/AddTemplateModal';
import { AddLatexModal } from './modals/AddLatexModal';
import { AddDiagramModal } from './modals/AddDiagramModal';

/**
 * Container for all section input modals
 * Controlled by sectionInputStore
 */
export function SectionInputModals() {
  const openSection = useSectionInputStore((s) => s.openSection);
  const closeModal = useSectionInputStore((s) => s.closeModal);

  return (
    <>
      <AddReferenceModal isOpen={openSection === 'references'} onClose={closeModal} />
      <AddDraftModal isOpen={openSection === 'drafts'} onClose={closeModal} />
      <AddFigureModal isOpen={openSection === 'figures'} onClose={closeModal} />
      <AddTableModal isOpen={openSection === 'tables'} onClose={closeModal} />
      <AddTemplateModal isOpen={openSection === 'templates'} onClose={closeModal} />
      <AddLatexModal isOpen={openSection === 'equations'} onClose={closeModal} />
      <AddDiagramModal isOpen={openSection === 'diagrams'} onClose={closeModal} />
    </>
  );
}
