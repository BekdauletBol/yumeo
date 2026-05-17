'use client';

import { useState, useCallback, useRef } from 'react';
import { useMaterialsStore } from '@/stores/materialsStore';
import { useProjectStore } from '@/stores/projectStore';
import { buildSystemPrompt } from '@/lib/agent/buildSystemPrompt';
import type { Editor } from '@tiptap/react';
import { showToast } from '@/lib/utils/toast';
import DOMPurify from 'dompurify';

export function useYuportAI(editor: Editor | null) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [ghostText, setGhostText] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const materials = useMaterialsStore((s) => s.materials);
  const activeProject = useProjectStore((s) => s.activeProject);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  }, []);

  const generateContinuation = useCallback(async () => {
    if (!editor || !activeProject || isGenerating) return;

    const currentText = editor.getText();
    const cursorPosition = editor.state.selection.from;
    const textBefore = currentText.slice(0, cursorPosition);
    
    // Context: Last 1000 chars
    const contextText = textBefore.slice(-1000);

    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    try {
      const systemPrompt = buildSystemPrompt(materials, activeProject.settings);
      
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `Continue writing based on this context: "${contextText}"` }],
          systemPrompt,
          projectId: activeProject.id,
          userQuery: 'continue writing',
          model: activeProject.settings.agentModel,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error('AI request failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContinuation = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullContinuation += chunk;
          
          // Show first few words as ghost text
          if (fullContinuation.length > 0) {
            setGhostText(fullContinuation);
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error('Yuport AI Error:', err);
      showToast('AI Error: Could not generate continuation');
    } finally {
      setIsGenerating(false);
    }
  }, [editor, activeProject, isGenerating, materials]);

  const applyEdit = useCallback(async (instruction: string) => {
    if (!editor || !activeProject || isGenerating) return;

    const selection = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(selection.from, selection.to, ' ');
    const fullContent = editor.getHTML();

    setIsGenerating(true);
    
    try {
      const systemPrompt = buildSystemPrompt(materials, activeProject.settings);
      const userPrompt = selection.empty 
        ? `Insert content at current position based on instruction: "${instruction}". Existing context: ${editor.getText().slice(-500)}`
        : `Rewrite the following selected text based on instruction: "${instruction}". Selected text: "${selectedText}"`;

      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userPrompt }],
          systemPrompt: systemPrompt + '\n\nIMPORTANT: Return ONLY the raw text to be inserted/replaced. Do not add headers or explanations.',
          projectId: activeProject.id,
          userQuery: instruction,
        }),
      });

      if (!response.ok) throw new Error('Operational edit failed');

      const result = await response.text();
      const sanitized = DOMPurify.sanitize(result);

      if (selection.empty) {
        editor.commands.insertContent(sanitized);
      } else {
        editor.commands.insertContentAt({ from: selection.from, to: selection.to }, sanitized);
      }
      
      showToast('AI edit applied');
    } catch (err) {
      console.error('Yuport Edit Error:', err);
      showToast('AI Edit failed');
    } finally {
      setIsGenerating(false);
    }
  }, [editor, activeProject, isGenerating, materials]);

  const acceptGhostText = useCallback(() => {
    if (editor && ghostText) {
      editor.commands.insertContent(ghostText);
      setGhostText(null);
    }
  }, [editor, ghostText]);

  return {
    isGenerating,
    ghostText,
    generateContinuation,
    applyEdit,
    acceptGhostText,
    setGhostText,
    stopGeneration
  };
}
