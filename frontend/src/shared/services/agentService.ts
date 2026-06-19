import { apiClient } from './apiClient';
import type {
  Agent,
  AgentCreate,
  AgentUpdate,
  ChatRequest,
  Conversation,
} from '../types';

export async function listAgents(params?: { status?: string }): Promise<Agent[]> {
  const { data } = await apiClient.get<Agent[]>('/agents', { params });
  return data;
}

export async function getAgent(agentId: number): Promise<Agent> {
  const { data } = await apiClient.get<Agent>(`/agents/${agentId}`);
  return data;
}

export async function createAgent(payload: AgentCreate): Promise<Agent> {
  const { data } = await apiClient.post<Agent>('/agents', payload);
  return data;
}

export async function updateAgent(agentId: number, payload: AgentUpdate): Promise<Agent> {
  const { data } = await apiClient.put<Agent>(`/agents/${agentId}`, payload);
  return data;
}

export async function deleteAgent(agentId: number): Promise<{ code: number; message: string }> {
  const { data } = await apiClient.delete(`/agents/${agentId}`);
  return data;
}

export async function publishAgent(agentId: number): Promise<{ code: number; message: string; data: { api_key: string } }> {
  const { data } = await apiClient.post(`/agents/${agentId}/publish`);
  return data;
}

export async function unpublishAgent(agentId: number): Promise<{ code: number; message: string }> {
  const { data } = await apiClient.post(`/agents/${agentId}/unpublish`);
  return data;
}

export async function regenerateApiKey(agentId: number): Promise<{ code: number; data: { api_key: string } }> {
  const { data } = await apiClient.post(`/agents/${agentId}/regenerate-key`);
  return data;
}

export function agentChatStream(
  agentId: number,
  payload: ChatRequest,
  onMessage: (event: { type: string; content?: string; conversation_id?: number; cited_sources?: unknown[]; conflict_info?: unknown; latency_ms?: number }) => void,
  onError?: (error: Error) => void
): () => void {
  const controller = new AbortController();
  const apiKey = localStorage.getItem('api_key');

  fetch(`${apiClient.defaults.baseURL}/agents/${agentId}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'X-API-Key': apiKey } : {}),
    },
    body: JSON.stringify({ ...payload, stream: true }),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const reader = response.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6));
              onMessage(event);
            } catch {
              // skip malformed events
            }
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        onError?.(err);
      }
    });

  return () => controller.abort();
}

export async function listAgentConversations(agentId: number): Promise<Conversation[]> {
  const { data } = await apiClient.get<Conversation[]>(`/agents/${agentId}/conversations`);
  return data;
}
