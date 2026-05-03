# Yumeo Section Enhancements - Implementation Guide

## Current Status: FOUNDATION READY ✅

Core infrastructure is in place:
- ✅ `src/stores/addToReportStore.ts` - Manages "Add to Report" queue
- ✅ `src/lib/utils/insertContentIntoDraft.ts` - Formats content for insertion
- ✅ `src/components/ui/SectionActionButtons.tsx` - Reusable action button component
- ✅ `src/components/sections/ReferencesSection.tsx` - "Add to Report" button added

## Implementation Checklist

### PHASE 1: Add "Add to Report" Buttons to All Sections

#### Figures Section
- [ ] Import useAddToReportStore and showToast
- [ ] Import SectionActionButtons component
- [ ] Add handleAddToReport function
- [ ] Calculate figureNumber = index + 1
- [ ] Replace Trash2 button with SectionActionButtons
- [ ] Show "Add to Report" and Delete buttons on hover

**Location:** `src/components/sections/FiguresSection.tsx`
**Lines to modify:** Imports (1-10), handleCaptionChange (63-71), Delete button area (around line 145-160)

#### Tables Section
- [ ] Add handleAddToReport with tableNumber calculation
- [ ] Replace delete button with SectionActionButtons
- [ ] Show "Add to Report", "Download", Delete buttons

**Location:** `src/components/sections/TablesSection.tsx`

#### LaTeX Section (Equations)
- [ ] Add Copy button (copy equation code)
- [ ] Add Download .tex button
- [ ] Add "Add to Report" button
- [ ] Use SectionActionButtons for all three

**Location:** `src/components/sections/LatexSection.tsx`

#### Diagrams (Mermaid) Section
- [ ] Add Download PNG button (render mermaid to PNG)
- [ ] Add "Add to Report" button
- [ ] Use SectionActionButtons

**Location:** `src/components/sections/MermaidSection.tsx`

#### Templates Section
- [ ] Add "Use this template" button (sets template in Drafts)
- [ ] Add Delete button

**Location:** `src/components/sections/TemplatesSection.tsx`

---

### PHASE 2: Core Features Implementation

#### Drafts Auto-Save
- [ ] Add auto-save interval (30 seconds) to TiptapEditor
- [ ] Track unsaved changes with state
- [ ] Show "Saving..." indicator
- [ ] Show "Saved" indicator briefly

**Location:** `src/components/sections/DraftsSection.tsx`, `src/components/editor/TiptapEditor.tsx`

#### Add to Report - Insert Mechanism
- [ ] Listen to pendingInsertions in DraftsSection
- [ ] When editing a draft, watch for queue changes
- [ ] Insert content at cursor position
- [ ] Clear queue after insertion
- [ ] Show toast confirmation

**Location:** `src/components/sections/DraftsSection.tsx`

#### Figures: Drag to Reorder + Auto-Numbering
- Already implemented! Just verify figures update numbers after drag

#### Figures: Download
- [ ] Add button to download image from storage_url
- [ ] Or create canvas from rendered image

**Location:** `src/components/sections/FiguresSection.tsx`

#### Tables: CSV Paste
- [ ] Add textarea/modal for pasting CSV
- [ ] Parse CSV and preview in table format
- [ ] Save as material

**Location:** `src/components/sections/TablesSection.tsx`

---

### PHASE 3: Advanced Features

#### DOCX Export for Drafts
- [ ] Use docx library to create .docx file
- [ ] Include formatted content from draft
- [ ] Add metadata (title, author, date)
- [ ] Download generated file

**Location:** `src/components/sections/DraftsSection.tsx`

#### Diagrams: PNG Download
- [ ] Render Mermaid diagram to SVG
- [ ] Convert SVG to PNG
- [ ] Download PNG file

**Location:** `src/components/sections/MermaidSection.tsx`

#### LaTeX: Download .tex file
- [ ] Create .tex file with equation
- [ ] Add standard LaTeX preamble
- [ ] Download .tex file

**Location:** `src/components/sections/LatexSection.tsx`

#### Templates: Preview + Use
- [ ] Show template structure preview
- [ ] "Use this template" → Set as Drafts content
- [ ] Populate metadata fields

**Location:** `src/components/sections/TemplatesSection.tsx`

---

## Quick Implementation Example

### Adding "Add to Report" to a Section

```typescript
import { useAddToReportStore } from '@/stores/addToReportStore';
import { showToast } from '@/lib/utils/toast';
import { SectionActionButtons } from '@/components/ui/SectionActionButtons';

// In component
const queueInsertion = useAddToReportStore((s) => s.queueInsertion);

const handleAddToReport = (item: typeof items[0]) => {
  const itemNumber = items.findIndex(i => i.id === item.id) + 1;
  queueInsertion({
    type: 'figure', // or 'table', 'equation', 'diagram'
    title: item.name,
    content: item.content,
    caption: item.metadata.caption,
    figureNumber: itemNumber,
  });
  showToast(`Added "${item.name}" to report`);
};

// In JSX button area
<SectionActionButtons
  onAddToReport={() => handleAddToReport(item)}
  onDelete={() => removeMaterial(item.id)}
  showAddToReport
  showDelete
/>
```

---

## Files Modified So Far ✅

1. `src/components/sections/ReferencesSection.tsx` - Added "Add to Report"
2. `src/stores/addToReportStore.ts` - NEW
3. `src/lib/utils/insertContentIntoDraft.ts` - NEW
4. `src/components/ui/SectionActionButtons.tsx` - NEW

---

## Testing Checklist

- [ ] References: Hover shows + and delete buttons
- [ ] Add to Report queues item correctly
- [ ] Drafts editor shows pending insertions
- [ ] Content inserts at correct position
- [ ] All sections have consistent UI/UX
- [ ] Toast notifications show correctly
- [ ] No console errors

---

## Dependencies Needed

```json
{
  "docx": "^8.5.0",  // For DOCX export
  "html2canvas": "^1.4.1",  // For PNG export
  "papaparse": "^5.4.1"  // For CSV parsing
}
```

---

## Notes

- Dark theme already applied via CSS variables
- All data auto-saves to Supabase
- Each section follows same pattern
- Toast notifications use existing showToast() function
- Zustand stores for state management
