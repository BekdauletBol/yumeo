import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useRef } from 'react';

interface TiptapEditorProps {
  initialContent: string;
  onSave: (content: string) => void;
  placeholder?: string;
}

export function TiptapEditor({ initialContent, onSave }: TiptapEditorProps) {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
    onUpdate: ({ editor }) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        onSave(editor.getHTML());
      }, 1000);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[300px] p-4 text-sm leading-relaxed',
        style: 'color: var(--text-primary); font-family: var(--font-sans);',
      },
    },
  });

  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

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
