import type { MaterialSection } from './material';

/** A single source citation extracted from an AI message */
export interface Citation {
  /** REF index (1-based, as appears in [REF:n]) */
  refIndex: number;
  materialId: string;
  materialName: string;
  section: MaterialSection;
  /** Relevant excerpt from the source material */
  excerpt: string;
}

/** A message in the Yumeo research chat */
export interface ChatMessage {
  id: string;
  projectId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations: Citation[];
  timestamp: Date;
  /** True while the AI is still streaming this message */
  isStreaming?: boolean;
  /** Model used to generate this message */
  model?: string;
}

/** Anthropic API message shape (subset) */
export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}