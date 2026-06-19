import { apiClient } from './apiClient';
import type { Conversation, Message } from '../types';

export async function listConversations(params?: { agent_id?: number; source?: string }): Promise<Conversation[]> {
  const { data } = await apiClient.get<Conversation[]>('/conversations', { params });
  return data;
}

export async function createConversation(
  agentId: number,
  title?: string,
  source: string = 'test'
): Promise<Conversation> {
  const { data } = await apiClient.post<Conversation>('/conversations', null, {
    params: { agent_id: agentId, title: title || '新对话', source },
  });
  return data;
}

export async function deleteConversation(convId: number): Promise<{ code: number; message: string }> {
  const { data } = await apiClient.delete(`/conversations/${convId}`);
  return data;
}

export async function listMessages(convId: number): Promise<Message[]> {
  const { data } = await apiClient.get<Message[]>(`/conversations/${convId}/messages`);
  return data;
}

export async function exportConversation(convId: number): Promise<{ code: number; data: unknown }> {
  const { data } = await apiClient.get(`/conversations/${convId}/export`);
  return data;
}

export async function exportAllMessages(params?: { agent_id?: number }): Promise<{ code: number; data: unknown }> {
  const { data } = await apiClient.get('/export/messages', { params });
  return data;
}
