-- ─── Migration: Add Dynamic Sections to Existing Projects ──────────────────
-- Run this AFTER updating schema.sql
-- This script migrates existing projects to use dynamic sections

-- Step 1: For each project with existing materials, create default sections
insert into project_sections (project_id, name, section_type, display_order, is_active)
select distinct
  m.project_id,
  case m.section
    when 'references' then 'References'
    when 'drafts' then 'Drafts'
    when 'figures' then 'Figures'
    when 'tables' then 'Tables'
    when 'templates' then 'Templates'
    when 'equations' then 'LaTeX Equations'
    when 'diagrams' then 'Mermaid Diagrams'
  end as name,
  m.section,
  case m.section
    when 'references' then 0
    when 'drafts' then 1
    when 'figures' then 2
    when 'tables' then 3
    when 'templates' then 4
    when 'equations' then 5
    when 'diagrams' then 6
  end as display_order,
  true as is_active
from materials m
where not exists (
  select 1 from project_sections ps
  where ps.project_id = m.project_id and ps.section_type = m.section
)
order by m.project_id, m.section;

-- Step 2: Populate section_id for existing materials
update materials m
set section_id = ps.id
from project_sections ps
where ps.project_id = m.project_id
  and ps.section_type = m.section
  and m.section_id is null;

-- Step 3: Verify data integrity (optional - check this)
-- select 
--   count(*) as total_materials,
--   count(case when section_id is null then 1 end) as unlinked_materials,
--   count(distinct section_id) as unique_sections
-- from materials;
