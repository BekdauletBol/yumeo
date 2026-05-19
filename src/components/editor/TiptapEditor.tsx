'use client';

import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { GhostText } from './extensions/GhostText';
import { useYuportAI } from '@/hooks/useYuportAI';
import { useAddToReportStore } from '@/stores/addToReportStore';
import { formatContentForInsertion } from '@/lib/utils/insertContentIntoDraft';
import {
  Loader2, Sparkles,
  Bold, Italic, Underline as UnderlineIcon,
  Heading1, Heading2, Heading3,
  List, ListOrdered,
} from 'lucide-react';

interface TiptapEditorProps {
  initialContent: string;
  onChange?: (content: string) => void;
  className?: string;
  placeholder?: string;
  isActive?: boolean;
}

export function TiptapEditor({
  initialContent,
  onChange,
  className,
  placeholder = 'Start writing your research here…',
  isActive = true,
}: TiptapEditorProps) {
  const [aiOpen, setAiOpen] = useState(false);
  const [aiText, setAiText] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      Typography,
      Underline,
      Image.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder }),
      GhostText.configure({
        onAccept: (text: string) => {
          editor?.commands.insertContent(text);
        },
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[900px]',
        style: [
          'font-family: Georgia, "Times New Roman", serif',
          'font-size: 16px',
          'line-height: 1.8',
          'color: #1a1a1a',
        ].join(';'),
      },
    },
  });

  const { isGenerating, ghostText, generateContinuation, applyEdit, setGhostText } = useYuportAI(editor);
  const shiftQueue = useAddToReportStore((s) => s.shiftQueue);

  // Handle pending insertions from the queue
  useEffect(() => {
    if (!editor || !isActive) return;
    const interval = setInterval(() => {
      const pending = shiftQueue();
      if (pending) {
        const formatted = formatContentForInsertion(pending);
        editor.commands.insertContent(formatted);
        editor.commands.focus();
      }
    }, 500);
    return () => clearInterval(interval);
  }, [editor, isActive, shiftQueue]);

  // Sync ghost text to extension storage
  useEffect(() => {
    if (editor) {
      editor.storage.ghostText.ghostText = ghostText;
      editor.view.dispatch(editor.state.tr);
    }
  }, [ghostText, editor]);

  // Keyboard Shortcuts
  useEffect(() => {
    if (!editor) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive) return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setAiOpen(true);
      }
      if (e.key === ' ' && editor.state.selection.empty) {
        const textBefore = editor.state.doc.textBetween(
          Math.max(0, editor.state.selection.from - 50),
          editor.state.selection.from,
        );
        if (textBefore.endsWith('.') || textBefore.endsWith('?') || textBefore.endsWith('!')) {
          if (!ghostText) void generateContinuation();
        }
      }
      if (e.key === 'Backspace') setGhostText(null);
      if (e.key === 'Escape') {
        setGhostText(null);
        setAiOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, isActive, ghostText, generateContinuation, setGhostText]);

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiText.trim()) return;
    await applyEdit(aiText);
    setAiText('');
    setAiOpen(false);
  };

  if (!editor) return null;

  // Floating toolbar button
  function ToolbarBtn({
    onClick,
    active,
    title,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    title: string;
    children: React.ReactNode;
  }) {
    return (
      <button
        onMouseDown={(e) => { e.preventDefault(); onClick(); }}
        title={title}
        className={cn(
          'p-1.5 rounded transition-all',
          active
            ? 'bg-orange-500 text-white'
            : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900',
        )}
      >
        {children}
      </button>
    );
  }

  return (
    <div
      className={cn(
        'relative mx-auto transition-all duration-300',
        isActive ? 'opacity-100' : 'opacity-50 pointer-events-none',
        className,
      )}
      style={{
        maxWidth: '794px',
        minHeight: '1123px',
        background: '#FFFFFF',
        boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
        borderRadius: '2px',
        padding: '64px',
      }}
    >
      {/* FEATURE 2: Floating format toolbar — appears on text selection */}
      <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 150, placement: 'top', offset: [0, 8] }}
        className="flex items-center gap-0.5 px-2 py-1.5 rounded-xl shadow-xl"
      >
        <div
          className="flex items-center gap-0.5"
          style={{
            background: '#FFFFFF',
            border: '1px solid #E8E3DD',
            borderRadius: '12px',
            padding: '4px 8px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }}
        >
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold"
        >
          <Bold size={13} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic"
        >
          <Italic size={13} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="Underline"
        >
          <UnderlineIcon size={13} />
        </ToolbarBtn>

        <div className="w-px h-4 mx-1 bg-stone-200" />

        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 size={13} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 size={13} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 size={13} />
        </ToolbarBtn>

        <div className="w-px h-4 mx-1 bg-stone-200" />

        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List size={13} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered size={13} />
        </ToolbarBtn>
        </div>
      </BubbleMenu>

      <EditorContent editor={editor} />

      {/* CMD+K AI Edit Panel */}
      {aiOpen && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md animate-in zoom-in-95 duration-200" style={{ padding: '0 24px' }}>
          <form
            onSubmit={handleAiSubmit}
            className="rounded-2xl p-5 shadow-2xl"
            style={{
              background: '#FAF8F5',
              border: '1px solid #E8E3DD',
              boxShadow: '0 16px 48px rgba(0,0,0,0.15)',
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-orange-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                Yuport AI Editor
              </span>
            </div>
            <input
              autoFocus
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              placeholder="e.g. 'Rewrite to be more academic' or 'Add an abstract'"
              className="w-full rounded-xl px-4 py-3 text-sm transition-all outline-none"
              style={{
                background: '#FFFFFF',
                border: '1px solid #E8E3DD',
                color: '#1a1a1a',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#E8611A'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E8E3DD'; }}
            />
            <div className="flex justify-between items-center mt-4">
              <p className="text-[9px] text-stone-400 uppercase font-mono">ESC to cancel</p>
              <button
                type="submit"
                disabled={isGenerating}
                className="text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
                style={{ background: '#E8611A' }}
              >
                {isGenerating ? <Loader2 size={12} className="animate-spin" /> : 'Apply Edit'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* AI indicator */}
      <div
        className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded select-none"
        style={{ background: '#F5F2EE', border: '1px solid #EDE9E4' }}
      >
        <span className="text-[9px] font-mono font-bold uppercase tracking-tighter text-stone-400">
          AI-Enabled
        </span>
        {isGenerating && <Loader2 size={9} className="text-orange-500 animate-spin" />}
      </div>

      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #C8C0B8;
          pointer-events: none;
          height: 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 16px;
          font-style: italic;
        }
        .ProseMirror h1 {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 26px;
          font-weight: bold;
          line-height: 1.3;
          margin-bottom: 1rem;
          margin-top: 0.5rem;
          color: #111;
          border-bottom: 1px solid #EDE9E4;
          padding-bottom: 0.5rem;
        }
        .ProseMirror h2 {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 21px;
          font-weight: bold;
          line-height: 1.4;
          margin-top: 2.5rem;
          margin-bottom: 0.75rem;
          color: #1a1a1a;
        }
        .ProseMirror h3 {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 17px;
          font-weight: bold;
          font-style: italic;
          line-height: 1.4;
          margin-top: 1.75rem;
          margin-bottom: 0.5rem;
          color: #2a2a2a;
        }
        .ProseMirror p {
          margin-bottom: 1.1em;
          text-align: left;
        }
        .ProseMirror blockquote {
          border-left: 3px solid #E8611A;
          padding-left: 1.5rem;
          font-style: italic;
          color: #666;
          margin: 1.5rem 0;
        }
        .ProseMirror mark {
          background-color: rgba(232, 97, 26, 0.15);
          color: inherit;
          padding: 0 2px;
          border-radius: 2px;
        }
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 1em;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-bottom: 1em;
        }
        .ProseMirror li { margin-bottom: 0.3em; }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          margin: 1.5rem auto;
          display: block;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }
        .ProseMirror u { text-decoration: underline; text-underline-offset: 3px; }
        .ProseMirror strong { font-weight: 700; color: #111; }
        .ProseMirror em { font-style: italic; color: #333; }
        .ghost-text {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 16px;
          line-height: 1.8;
          color: #C0B8B0;
        }
      `}</style>
    </div>
  );
}
