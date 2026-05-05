'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, X, Copy } from 'lucide-react';

interface AIResponse {
  id: string;
  query: string;
  response: string;
  citations: string[];
}

interface ReportAISidebarProps {
  projectId?: string;
  cursorPosition: number;
  selectedPassage?: string;
  onInsertContent: (text: string) => void;
  onClose: () => void;
}

export function ReportAISidebar({
  projectId,
  selectedPassage = '',
  onInsertContent,
  onClose,
}: ReportAISidebarProps) {
  const [query, setQuery] = useState(selectedPassage
    ? `Regarding the passage: "${selectedPassage.slice(0, 120)}…"\n\n`
    : '');
  const [isLoading, setIsLoading] = useState(false);
  const [responses, setResponses] = useState<AIResponse[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Update query when selectedPassage changes (from text-selection popup)
  useEffect(() => {
    if (selectedPassage) {
      setQuery(`Regarding the passage: "${selectedPassage.slice(0, 120)}…"\n\n`);
    }
  }, [selectedPassage]);

  // Scroll to bottom when new responses arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [responses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !projectId) return;

    setIsLoading(true);
    setQuery('');

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          message: query,
          context: 'report_editor',
        }),
      });

      const data = await response.json();

      const aiResponse: AIResponse = {
        id: Date.now().toString(),
        query,
        response: data.response || 'No response',
        citations: data.citations || [],
      };

      setResponses((prev) => [...prev, aiResponse]);
    } catch (err) {
      console.error('Failed to get AI response:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="w-80 border-l flex flex-col overflow-hidden"
      style={{
        borderColor: 'var(--border-subtle)',
        background: 'var(--bg-surface)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
          AI Assistant
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-red-500/10 rounded transition-colors">
          <X size={16} style={{ color: 'var(--text-primary)' }} />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {responses.length === 0 ? (
          <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
            Ask Yumeo to generate content based on your uploaded references. Each response is grounded in your materials.
          </p>
        ) : (
          responses.map((resp) => (
            <div key={resp.id} className="space-y-2">
              {/* User Query */}
              <div className="flex justify-end">
                <div
                  className="max-w-xs px-3 py-2 rounded text-xs"
                  style={{
                    background: 'var(--accent-primary)',
                    color: 'white',
                  }}
                >
                  {resp.query}
                </div>
              </div>

              {/* AI Response */}
              <div className="space-y-2">
                <div
                  className="max-w-xs px-3 py-2 rounded text-xs leading-relaxed"
                  style={{
                    background: 'var(--bg-base)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {resp.response}
                </div>

                {/* Citations */}
                {resp.citations.length > 0 && (
                  <div className="max-w-xs space-y-1">
                    {resp.citations.map((cite, idx) => (
                      <span
                        key={idx}
                        className="text-xs inline-block px-1.5 py-0.5 rounded"
                        style={{
                          background: 'var(--bg-elevated)',
                          color: 'var(--text-accent)',
                          border: '1px solid var(--border-default)',
                        }}
                      >
                        {cite}
                      </span>
                    ))}
                  </div>
                )}

                {/* Insert Button */}
                <button
                  onClick={() => onInsertContent(resp.response)}
                  className="w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors"
                  style={{
                    background: 'var(--accent-primary)',
                    color: 'white',
                  }}
                >
                  <Copy size={12} />
                  Insert at cursor
                </button>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-center py-2">
            <div
              className="w-2 h-2 rounded-full animate-bounce"
              style={{ background: 'var(--accent-primary)' }}
            />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-3" style={{ borderColor: 'var(--border-subtle)' }}>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask Yumeo..."
            disabled={isLoading}
            className="flex-1 px-2 py-1.5 rounded text-xs border focus:outline-none focus:ring-2 disabled:opacity-50"
            style={{
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
              backgroundColor: 'var(--bg-base)',
              '--tw-ring-color': 'var(--accent-primary)',
            } as React.CSSProperties}
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="p-1.5 rounded transition-colors disabled:opacity-50"
            style={{
              background: 'var(--accent-primary)',
              color: 'white',
            }}
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
