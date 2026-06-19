import { create } from 'zustand';
import type {
  Agent,
  AgentCreate,
  AgentUpdate,
  ChatRequest,
  Conversation,
  Message,
} from '../types';
import {
  agentService,
  conversationService,
} from '../services';

interface AgentState {
  agents: Agent[];
  selectedAgent: Agent | null;
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
  loading: boolean;
  error: string | null;

  fetchAgents: (params?: { status?: string }) => Promise<void>;
  fetchAgent: (agentId: number) => Promise<void>;
  createAgent: (payload: AgentCreate) => Promise<Agent>;
  updateAgent: (agentId: number, payload: AgentUpdate) => Promise<Agent>;
  deleteAgent: (agentId: number) => Promise<void>;
  setSelectedAgent: (agent: Agent | null) => void;
  publishAgent: (agentId: number) => Promise<string>;
  unpublishAgent: (agentId: number) => Promise<void>;
  regenerateApiKey: (agentId: number) => Promise<string>;

  fetchConversations: (agentId: number) => Promise<void>;
  createConversation: (agentId: number, title?: string) => Promise<Conversation>;
  deleteConversation: (convId: number) => Promise<void>;
  setCurrentConversation: (conv: Conversation | null) => void;

  fetchMessages: (convId: number) => Promise<void>;
  sendStreamMessage: (
    agentId: number,
    payload: ChatRequest,
    onMessage: (event: { type: string; content?: string; conversation_id?: number }) => void
  ) => () => void;
  clearChat: () => void;

  clearError: () => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  agents: [],
  selectedAgent: null,
  conversations: [],
  currentConversation: null,
  messages: [],
  isStreaming: false,
  streamingContent: '',
  loading: false,
  error: null,

  fetchAgents: async (params) => {
    set({ loading: true, error: null });
    try {
      const agents = await agentService.listAgents(params);
      set({ agents, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchAgent: async (agentId) => {
    set({ loading: true, error: null });
    try {
      const selectedAgent = await agentService.getAgent(agentId);
      set({ selectedAgent, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createAgent: async (payload) => {
    set({ loading: true, error: null });
    try {
      const agent = await agentService.createAgent(payload);
      set((state) => ({
        agents: [...state.agents, agent],
        loading: false,
      }));
      return agent;
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  updateAgent: async (agentId, payload) => {
    set({ loading: true, error: null });
    try {
      const updated = await agentService.updateAgent(agentId, payload);
      set((state) => ({
        agents: state.agents.map((a) => (a.id === agentId ? updated : a)),
        selectedAgent: state.selectedAgent?.id === agentId ? updated : state.selectedAgent,
        loading: false,
      }));
      return updated;
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  deleteAgent: async (agentId) => {
    set({ loading: true, error: null });
    try {
      await agentService.deleteAgent(agentId);
      set((state) => ({
        agents: state.agents.filter((a) => a.id !== agentId),
        selectedAgent: state.selectedAgent?.id === agentId ? null : state.selectedAgent,
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  setSelectedAgent: (agent) => set({ selectedAgent: agent }),

  publishAgent: async (agentId) => {
    set({ loading: true, error: null });
    try {
      const result = await agentService.publishAgent(agentId);
      const apiKey = result.data.api_key;
      set((state) => ({
        agents: state.agents.map((a) =>
          a.id === agentId ? { ...a, status: 'published' as const, api_key: apiKey } : a
        ),
        selectedAgent:
          state.selectedAgent?.id === agentId
            ? { ...state.selectedAgent, status: 'published' as const, api_key: apiKey }
            : state.selectedAgent,
        loading: false,
      }));
      return apiKey;
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  unpublishAgent: async (agentId) => {
    set({ loading: true, error: null });
    try {
      await agentService.unpublishAgent(agentId);
      set((state) => ({
        agents: state.agents.map((a) =>
          a.id === agentId ? { ...a, status: 'draft' as const } : a
        ),
        selectedAgent:
          state.selectedAgent?.id === agentId
            ? { ...state.selectedAgent, status: 'draft' as const }
            : state.selectedAgent,
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  regenerateApiKey: async (agentId) => {
    set({ loading: true, error: null });
    try {
      const result = await agentService.regenerateApiKey(agentId);
      const apiKey = result.data.api_key;
      set((state) => ({
        agents: state.agents.map((a) =>
          a.id === agentId ? { ...a, api_key: apiKey } : a
        ),
        selectedAgent:
          state.selectedAgent?.id === agentId
            ? { ...state.selectedAgent, api_key: apiKey }
            : state.selectedAgent,
        loading: false,
      }));
      return apiKey;
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  fetchConversations: async (agentId) => {
    set({ loading: true, error: null });
    try {
      const conversations = await agentService.listAgentConversations(agentId);
      set({ conversations, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createConversation: async (agentId, title) => {
    set({ loading: true, error: null });
    try {
      const conv = await conversationService.createConversation(agentId, title);
      set((state) => ({
        conversations: [conv, ...state.conversations],
        currentConversation: conv,
        messages: [],
        loading: false,
      }));
      return conv;
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  deleteConversation: async (convId) => {
    set({ loading: true, error: null });
    try {
      await conversationService.deleteConversation(convId);
      set((state) => ({
        conversations: state.conversations.filter((c) => c.id !== convId),
        currentConversation:
          state.currentConversation?.id === convId ? null : state.currentConversation,
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  setCurrentConversation: (conv) => set({ currentConversation: conv, messages: [] }),

  fetchMessages: async (convId) => {
    set({ loading: true, error: null });
    try {
      const messages = await conversationService.listMessages(convId);
      set({ messages, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  sendStreamMessage: (agentId, payload, onMessage) => {
    set({ isStreaming: true, streamingContent: '', error: null });
    return agentService.agentChatStream(
      agentId,
      payload,
      (event) => {
        if (event.type === 'token' && event.content) {
          set((state) => ({
            streamingContent: state.streamingContent + event.content,
          }));
        }
        if (event.type === 'end') {
          set((state) => {
            const assistantMsg: Message = {
              id: Date.now(),
              conversation_id: state.currentConversation?.id ?? 0,
              role: 'assistant',
              content: state.streamingContent,
              cited_sources: '',
              conflict_info: '',
              latency_ms: 0,
              created_at: new Date().toISOString(),
            };
            return {
              messages: [...state.messages, assistantMsg],
              isStreaming: false,
              streamingContent: '',
            };
          });
        }
        if (event.type === 'error' && event.content) {
          set({ error: event.content, isStreaming: false });
        }
        onMessage(event);
      },
      (err) => {
        set({ error: err.message, isStreaming: false });
      }
    );
  },

  clearChat: () =>
    set({
      messages: [],
      streamingContent: '',
      isStreaming: false,
    }),

  clearError: () => set({ error: null }),
}));
