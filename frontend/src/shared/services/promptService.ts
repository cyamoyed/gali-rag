import { apiClient } from './apiClient';
import type { PromptTemplate, PromptCreate, PromptUpdate, PromptPreset, PresetBrief, PresetCreate } from '../types';

// ── Preset API ──

export async function listPresets(): Promise<PresetBrief[]> {
  const { data } = await apiClient.get<PresetBrief[]>('/presets');
  return data;
}

export async function getPreset(presetId: number): Promise<PromptPreset> {
  const { data } = await apiClient.get<PromptPreset>(`/presets/${presetId}`);
  return data;
}

export async function createPreset(payload: PresetCreate): Promise<PromptPreset> {
  const { data } = await apiClient.post<PromptPreset>('/presets', payload);
  return data;
}

export async function activatePreset(presetId: number): Promise<PresetBrief> {
  const { data } = await apiClient.post<PresetBrief>(`/presets/${presetId}/activate`);
  return data;
}

export async function duplicatePreset(presetId: number, newName: string): Promise<PromptPreset> {
  const { data } = await apiClient.post<PromptPreset>(`/presets/${presetId}/duplicate`, null, { params: { new_name: newName } });
  return data;
}

export async function deletePreset(presetId: number): Promise<{ code: number; message: string }> {
  const { data } = await apiClient.delete(`/presets/${presetId}`);
  return data;
}

// ── Single Prompt API ──

export async function listPrompts(params?: { category?: string; preset_id?: number }): Promise<PromptTemplate[]> {
  const { data } = await apiClient.get<PromptTemplate[]>('/prompts', { params });
  return data;
}

export async function getPrompt(promptId: number): Promise<PromptTemplate> {
  const { data } = await apiClient.get<PromptTemplate>(`/prompts/${promptId}`);
  return data;
}

export async function createPrompt(payload: PromptCreate): Promise<PromptTemplate> {
  const { data } = await apiClient.post<PromptTemplate>('/prompts', payload);
  return data;
}

export async function updatePrompt(promptId: number, payload: PromptUpdate): Promise<PromptTemplate> {
  const { data } = await apiClient.put<PromptTemplate>(`/prompts/${promptId}`, payload);
  return data;
}

export async function deletePrompt(promptId: number): Promise<{ code: number; message: string }> {
  const { data } = await apiClient.delete(`/prompts/${promptId}`);
  return data;
}

export async function resetPrompt(promptId: number): Promise<{ code: number; message: string }> {
  const { data } = await apiClient.post(`/prompts/${promptId}/reset`);
  return data;
}

export async function setDefaultPrompt(promptId: number): Promise<{ code: number; message: string }> {
  const { data } = await apiClient.post(`/prompts/${promptId}/set-default`);
  return data;
}
