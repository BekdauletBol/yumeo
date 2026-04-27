import { create } from 'zustand';
import type { ChatMessage } from '@/lib/types';

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;

  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  clearMessages: () => void;

  setIsStreaming: (streaming: boolean) => void;
  appendStreamingContent: (chunk: string) => void;
  finalizeStreamingMessage: (messageId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isStreaming: false,
  streamingContent: '',

  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),

  clearMessages: () => set({ messages: [], streamingContent: '', isStreaming: false }),

  setIsStreaming: (isStreaming) => set({ isStreaming }),

  appendStreamingContent: (chunk) =>
    set((state) => ({ streamingContent: state.streamingContent + chunk })),

  finalizeStreamingMessage: (messageId) => {
    const { streamingContent, messages } = get();
    set({
      messages: messages.map((m) =>
        m.id === messageId
          ? { ...m, content: streamingContent, isStreaming: false }
          : m,
      ),
      streamingContent: '',
      isStreaming: false,
    });
  },
}));