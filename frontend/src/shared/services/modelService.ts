import { apiClient } from './apiClient';
import type { AIModel, AIModelCreate, AIModelUpdate } from '../types';

export async function listModels(params?: { model_type?: string }): Promise<AIModel[]> {
  const { data } = await apiClient.get<AIModel[]>('/models', { params });
  return data;
}

export async function getModel(modelId: number): Promise<AIModel> {
  const { data } = await apiClient.get<AIModel>(`/models/${modelId}`);
  return data;
}

export async function createModel(payload: AIModelCreate): Promise<AIModel> {
  const { data } = await apiClient.post<AIModel>('/models', payload);
  return data;
}

export async function updateModel(modelId: number, payload: AIModelUpdate): Promise<AIModel> {
  const { data } = await apiClient.put<AIModel>(`/models/${modelId}`, payload);
  return data;
}

export async function deleteModel(modelId: number): Promise<{ code: number; message: string }> {
  const { data } = await apiClient.delete(`/models/${modelId}`);
  return data;
}

export async function setDefaultModel(modelId: number): Promise<{ code: number; message: string }> {
  const { data } = await apiClient.post(`/models/${modelId}/set-default`);
  return data;
}

export async function testModel(modelId: number): Promise<{ code: number; data: { success: boolean; error?: string } }> {
  const { data } = await apiClient.post(`/models/${modelId}/test`);
  return data;
}
