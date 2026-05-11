'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import { useEffect } from 'react';
import { cn } from '@/lib/utils/cn';

interface TiptapEditorProps {
  content: string;
  onChange?: (content: string) => void;
  className?: string;
  placeholder?: string;
}

export function TiptapEditor({
  content,
  onChange,
  className,
  placeholder = 'Start writing your research...',
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      Typography,
      Image,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[400px] font-body leading-relaxed text-text-primary',
          'selection:bg-accent-primary/30 selection:text-white',
        ),
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          const src = URL.createObjectURL(file);
          const imageNode = view.state.schema.nodes.image;
          if (!imageNode) return false;
          view.dispatch(view.state.tr.replaceSelectionWith(imageNode.create({ src })));
          return true;
        }
        return false;
      },
    },
  });

  // Sync content if changed from outside
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Listen for insert events
  useEffect(() => {
    const handleInsert = (e: Event) => {
      const customEvent = e as CustomEvent<{ content: string }>;
      if (editor) {
        editor.commands.insertContent(customEvent.detail.content);
      }
    };
    window.addEventListener('insert-editor-content', handleInsert);
    return () => window.removeEventListener('insert-editor-content', handleInsert);
  }, [editor]);

  if (!editor) return null;

  return (
    <div className={cn('tiptap-container group', className)}>
      <EditorContent editor={editor} />
      
      <style jsx global>{`
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--text-tertiary);
          pointer-events: none;
          height: 0;
          font-family: var(--font-mono);
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.1em;
        }
        
        .tiptap h1 { font-family: var(--font-mono); font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.5rem; }
        .tiptap h2 { font-family: var(--font-mono); font-weight: bold; text-transform: uppercase; letter-spacing: 0.02em; margin-top: 2rem; }
        
        .tiptap blockquote {
          border-left: 3px solid var(--accent-primary);
          padding-left: 1.5rem;
          font-style: italic;
          color: var(--text-secondary);
        }
        
        .tiptap mark {
          background-color: rgba(232, 97, 26, 0.2);
          color: inherit;
          padding: 0 2px;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
