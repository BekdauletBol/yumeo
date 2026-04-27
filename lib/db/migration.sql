ALTER TABLE materials DROP CONSTRAINT IF EXISTS materials_section_check;
ALTER TABLE materials ADD CONSTRAINT materials_section_check CHECK (section in ('references','drafts','figures','tables','templates','equations','diagrams'));
