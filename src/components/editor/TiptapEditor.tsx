import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { useEffect, useRef, useCallback } from 'react';
import { useMaterialsStore } from '@/stores/materialsStore';

interface TiptapEditorProps {
  initialContent: string;
  onSave: (content: string) => void;
  placeholder?: string;
}

export function TiptapEditor({ initialContent, onSave }: TiptapEditorProps) {
  const materials = useMaterialsStore((s) => s.materials);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const processFigureTags = useCallback((content: string) => {
    return content.replace(/\[FIGURE:\s*([^,]+),\s*([^\]]+)\]/g, (match, filename, figureId) => {
      const cleanFilename = filename.trim();
      const cleanFigId = figureId.trim().replace(/^Figure\s+/i, '');
      
      const material = materials.find(m => 
        m.section === 'figures' && 
        (m.name.toLowerCase().includes(cleanFilename.toLowerCase())) &&
        (m.metadata.figureNumber === cleanFigId || m.name.toLowerCase().includes(`figure ${cleanFigId}`))
      );

      if (material?.storageUrl) {
        // Return HTML for the image
        return `<img src="${material.storageUrl}" alt="${cleanFilename} - Figure ${cleanFigId}" data-figure-tag="${match}" />`;
      }
      return match;
    });
  }, [materials]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg border shadow-sm max-w-full h-auto my-4',
        },
      }),
    ],
    content: processFigureTags(initialContent),
    onUpdate: ({ editor }) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        onSave(editor.getHTML());
      }, 1000);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[300px] p-8 text-sm leading-relaxed',
        style: 'color: var(--text-primary); font-family: var(--font-sans);',
      },
      handleDrop: (view, event, _slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const src = e.target?.result as string;
              view.dispatch(view.state.tr.replaceSelectionWith(view.state.schema.nodes.image.create({ src })));
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      editor.commands.setContent(processFigureTags(initialContent));
    }
  }, [editor, initialContent, processFigureTags]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-base)' }}>
      <div className="flex items-center gap-1 p-1.5 border-b bg-muted/30" style={{ borderColor: 'var(--border-subtle)' }}>
        <button 
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1 rounded text-xs ${editor.isActive('bold') ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}`}
        >
          B
        </button>
        <button 
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1 rounded text-xs italic ${editor.isActive('italic') ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}`}
        >
          I
        </button>
        <button 
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1 rounded text-xs ${editor.isActive('heading', { level: 2 }) ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}`}
        >
          H2
        </button>
        <button 
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1 rounded text-xs ${editor.isActive('bulletList') ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}`}
        >
          List
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
