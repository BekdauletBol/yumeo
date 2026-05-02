# 🔄 Modular Workspace Redesign - Complete File Changes

## Overview
Redesigned Yumeo to support **dynamic, user-created sections** instead of hardcoded ones. New projects start empty - users add only sections they need.

---

## 📋 Changed & New Files

### Database Layer

#### **Modified:**
- **[src/lib/db/schema.sql](src/lib/db/schema.sql)**
  - Added `project_sections` table to store user-created sections per project
  - Modified `materials` table: added `section_id` FK, made `section` optional (for backward compat)
  - Added indexes for `project_sections`
  - Added RLS policies for `project_sections`
  - Unique constraint: one section type per project

#### **New:**
- **[src/lib/db/migration-dynamic-sections.sql](src/lib/db/migration-dynamic-sections.sql)**
  - Migration script to create sections for existing projects
  - Populates `section_id` for existing materials
  - Ensures backward compatibility

---

### Type Definitions

#### **Modified:**
- **[src/lib/types/material.ts](src/lib/types/material.ts)**
  - Added `sectionId?: string` field to `Material` interface
  - Added new `ProjectSection` interface with fields: `id`, `projectId`, `name`, `sectionType`, `displayOrder`, `isActive`, timestamps
  - Added `CreateMaterialWithSectionInput` interface

---

### Server Actions

#### **New:**
- **[src/app/actions/sections.ts](src/app/actions/sections.ts)**
  - `getProjectSectionsAction()` - Get all sections for a project
  - `getActiveSectionsAction()` - Get only active sections
  - `createProjectSectionAction()` - Add new section to project
  - `deleteProjectSectionAction()` - Remove section and cascade materials
  - `toggleProjectSectionAction()` - Toggle section active/inactive
  - `reorderSectionsAction()` - Update section display order

#### **Modified:**
- **[src/app/actions/materials.ts](src/app/actions/materials.ts)**
  - Updated `createMaterialAction()` to accept and validate `sectionId`
  - Updated `rowToMaterial()` helper to include `sectionId`
  - Updated Material interface usage to include `sectionId`

---

### Zustand Stores

#### **New:**
- **[src/stores/projectSectionsStore.ts](src/stores/projectSectionsStore.ts)**
  - State management for project sections
  - Methods: `setSections`, `addSection`, `removeSection`, `toggleSection`, `setActiveSection`, `reorderSections`
  - Auto-selects first active section when none selected

#### **Modified:**
- **[src/stores/materialsStore.ts](src/stores/materialsStore.ts)**
  - Removed `activeSection: MaterialSection` field (now managed by sections store)
  - Removed `setActiveSection()` method
  - Added `getMaterialsBySection(sectionId)` helper method
  - Materials now filtered by `sectionId` instead of hardcoded `section` enum

---

### UI Components

#### **New:**
- **[src/components/sections/AddSectionButton.tsx](src/components/sections/AddSectionButton.tsx)**
  - `SectionSelectModal` - Modal dialog with 7 section options (References, Drafts, Figures, Tables, Templates, LaTeX, Diagrams)
  - `AddSectionButton` - Button that triggers the modal
  - Shows emojis + descriptions for each section type
  - Disables already-added sections

- **[src/components/sections/ProjectEmptyState.tsx](src/components/sections/ProjectEmptyState.tsx)**
  - Empty state shown when project has no sections
  - Prompts user to add sections
  - Shows helpful tips about which sections to start with
  - Includes `AddSectionButton` CTA

---

### AI Agent & RAG

#### **Modified:**
- **[src/lib/agent/buildSystemPrompt.ts](src/lib/agent/buildSystemPrompt.ts)**
  - Added optional `activeSections?: ProjectSection[]` parameter
  - Filters materials to only include those from active sections
  - If no sections provided, includes all materials (backward compat)
  - System prompt only mentions sections the user has enabled

---

## 🔄 Component Updates Needed

The following components need updates to use the new sections system (integration points):

### To Update:
- **[src/components/ide/Sidebar.tsx](src/components/ide/Sidebar.tsx)** - Replace hardcoded section iteration with dynamic sections from store
- **[src/hooks/useStreamingChat.ts](src/hooks/useStreamingChat.ts)** - Pass `activeSections` to `buildSystemPrompt()`
- **[src/components/ide/ChatPanel.tsx](src/components/ide/ChatPanel.tsx)** - Pass `activeSections` to `buildSystemPrompt()`
- **[src/components/ide/IDELayout.tsx](src/components/ide/IDELayout.tsx)** - Show `ProjectEmptyState` when no sections

---

## 📊 Database Migration Steps

### For Existing Users:
1. Run schema.sql updates (create `project_sections` table, etc.)
2. Run migration-dynamic-sections.sql script
3. This creates sections for all existing projects and links materials

### For New Users:
1. Projects start with empty `project_sections` table
2. User clicks "+ Add Section" to create sections as needed
3. No default sections created

---

## 🎯 User Flow

### Before (Old):
1. Create project → All 7 sections visible
2. User overwhelmed by unused sections
3. AI wastes tokens on irrelevant section context

### After (New):
1. Create project → See empty workspace with "+ Add Section"
2. User clicks button
3. Modal shows 7 section options
4. User selects "References" → Section appears in sidebar
5. User can add more sections later
6. AI system prompt only includes active sections

---

## ⚙️ Configuration

### Environment:
No new environment variables needed.

### Supabase:
- Add trigger for `project_sections` table `updated_at` (optional, for consistency)
- Existing RLS policies extended to `project_sections`

---

## 🧪 Testing Checklist

- [ ] New project starts empty (no sections visible)
- [ ] "+ Add Section" button opens modal with all 7 options
- [ ] Adding a section makes it visible in sidebar
- [ ] Adding same section type twice is blocked (unique constraint)
- [ ] Section can be toggled inactive (hides materials, removes from AI context)
- [ ] Section can be deleted (cascade removes materials and chunks)
- [ ] Existing projects show all sections by default (migration handles this)
- [ ] AI system prompt only includes active section materials
- [ ] Materials still associate correctly with sections
- [ ] RAG only indexes materials from active sections

---

## 🔗 Key Relationships

```
Project
  ├─ ProjectSection[] (users create these)
  │   ├─ id, name, sectionType, displayOrder, isActive
  │   └─ unique(projectId, sectionType)
  │
  └─ Material[] (upload to sections)
      ├─ sectionId → ProjectSection.id
      ├─ section → (legacy, for compat)
      └─ Chunk[] (from RAG pipeline)
```

---

## 📝 Notes

- **Backward Compatibility**: Materials can reference sections by `section_id` (new) or `section` enum (legacy). Migration handles existing data.
- **Unique Sections**: Only one "references" section per project. Users can't create duplicates.
- **Active/Inactive Toggle**: Sections can be marked inactive without deleting (preserved for future). Hidden from UI and AI context.
- **No Automatic Sections**: New projects don't auto-create sections - users have full control.

---

## 🎓 Summary

The modular workspace redesign reduces UI clutter, prevents AI hallucinations from unused contexts, and gives users fine-grained control over their research workspace. Each project is now tailored to the user's specific needs.
