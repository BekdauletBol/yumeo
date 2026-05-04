'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useState, useRef } from 'react';
import { ReportInlinePopup } from './ReportInlinePopup';

interface ReportDocumentProps {
  title: string;
  content: string;
  onContentChange: (content: string) => void;
  onCursorChange: (position: number) => void;
}

export function ReportDocument({
  content,
  onContentChange,
  onCursorChange,
}: ReportDocumentProps) {
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState({ top: 0, left: 0 });
  const [showPopup, setShowPopup] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content,
    onUpdate: ({ editor }) => {
      onContentChange(editor.getHTML());
    },
    onSelectionUpdate: ({ editor }) => {
      const { from } = editor.state.selection;
      onCursorChange(from);
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-invert max-w-2xl focus:outline-none px-8 py-6 min-h-[600px]',
        style:
          'color: var(--text-primary); font-family: var(--font-body); background: var(--bg-surface);',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  useEffect(() => {
    const handleMouseUp = () => {
      if (!editor) return;

      const selection = window.getSelection();
      if (!selection || selection.toString().length === 0) {
        setShowPopup(false);
        return;
      }

      const selected = selection.toString();
      setSelectedText(selected);

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const editorRect = editorRef.current?.getBoundingClientRect();

      if (editorRect) {
        setSelectionPosition({
          top: rect.top - editorRect.top - 60,
          left: rect.left - editorRect.left + rect.width / 2,
        });
        setShowPopup(true);
      }
    };

    const editorElement = editorRef.current?.querySelector('.ProseMirror');
    editorElement?.addEventListener('mouseup', handleMouseUp);

    return () => {
      editorElement?.removeEventListener('mouseup', handleMouseUp);
    };
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div
      ref={editorRef}
      className="relative h-full overflow-y-auto"
      style={{ background: 'var(--bg-base)' }}
    >
      <div className="mx-auto" style={{ maxWidth: '800px', paddingTop: '40px' }}>
        <EditorContent editor={editor} />
      </div>

      {/* Inline Selection Popup */}
      {showPopup && (
        <ReportInlinePopup
          selectedText={selectedText}
          position={selectionPosition}
          onClose={() => setShowPopup(false)}
          onAskYumeo={() => {
            console.log('Ask Yumeo about:', selectedText);
            setShowPopup(false);
          }}
          onRewrite={() => {
            console.log('Rewrite:', selectedText);
            setShowPopup(false);
          }}
          onExpand={() => {
            console.log('Expand:', selectedText);
            setShowPopup(false);
          }}
          onDelete={() => {
            editor.chain().focus().deleteSelection().run();
            setShowPopup(false);
          }}
        />
      )}
    </div>
  );
}
