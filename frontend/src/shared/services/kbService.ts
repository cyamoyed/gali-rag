import { apiClient } from './apiClient';
import type {
  KnowledgeBase,
  KBCreate,
  KBUpdate,
  Document,
  ChunkConfig,
  HitTestResult,
  PaginatedResponse,
} from '../types';

export async function listKnowledgeBases(params?: {
  category_id?: number;
  kb_type?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<KnowledgeBase>> {
  const { data } = await apiClient.get<PaginatedResponse<KnowledgeBase>>('/knowledge-bases', { params });
  return data;
}

export async function getKnowledgeBase(kbId: number): Promise<KnowledgeBase> {
  const { data } = await apiClient.get<KnowledgeBase>(`/knowledge-bases/${kbId}`);
  return data;
}

export async function createKnowledgeBase(payload: KBCreate): Promise<KnowledgeBase> {
  const { data } = await apiClient.post<KnowledgeBase>('/knowledge-bases', payload);
  return data;
}

export async function updateKnowledgeBase(
  kbId: number,
  payload: KBUpdate
): Promise<KnowledgeBase> {
  const { data } = await apiClient.put<KnowledgeBase>(`/knowledge-bases/${kbId}`, payload);
  return data;
}

export async function deleteKnowledgeBase(kbId: number): Promise<{ code: number; message: string }> {
  const { data } = await apiClient.delete(`/knowledge-bases/${kbId}`);
  return data;
}

export async function uploadDocuments(
  kbId: number,
  files: File[]
): Promise<{ code: number; message: string; data: unknown[] }> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  const { data } = await apiClient.post(
    `/knowledge-bases/${kbId}/documents/upload`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return data;
}

export async function listDocuments(kbId: number, params?: {
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<Document>> {
  const { data } = await apiClient.get<PaginatedResponse<Document>>(`/knowledge-bases/${kbId}/documents`, { params });
  return data;
}

export async function deleteDocument(docId: number): Promise<{ code: number; message: string }> {
  const { data } = await apiClient.delete(`/documents/${docId}`);
  return data;
}

export async function batchDeleteDocuments(docIds: number[]): Promise<{ code: number; message: string }> {
  const { data } = await apiClient.post('/documents/batch-delete', docIds);
  return data;
}

export async function reprocessDocument(docId: number): Promise<{ code: number; message: string; data: unknown }> {
  const { data } = await apiClient.post(`/documents/${docId}/reprocess`);
  return data;
}

export async function generateSummary(docId: number): Promise<{ code: number; data: { summary: string } }> {
  const { data } = await apiClient.post(`/documents/${docId}/summary`);
  return data;
}

export async function downloadDocument(docId: number, filename?: string): Promise<void> {
  const apiKey = localStorage.getItem('api_key') || '';
  const baseURL = apiClient.defaults.baseURL;
  const url = `${baseURL}/documents/${docId}/download${apiKey ? `?api_key=${encodeURIComponent(apiKey)}` : ''}`;
  const a = document.createElement('a');
  a.href = url;
  if (filename) a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export async function previewDocument(docId: number): Promise<{
  content: string;
  filename: string;
  file_type: string;
}> {
  const { data } = await apiClient.get(`/documents/${docId}/preview`);
  return data.data;
}

export async function previewDocumentAsBlob(docId: number): Promise<Blob> {
  const response = await apiClient.get(`/documents/${docId}/preview`, {
    responseType: 'blob',
  });
  return response.data;
}

export async function cleanVectors(kbId: number): Promise<{ code: number; message: string }> {
  const { data } = await apiClient.post(`/knowledge-bases/${kbId}/clean-vectors`);
  return data;
}

export async function clearVectors(kbId: number): Promise<{ code: number; message: string }> {
  const { data } = await apiClient.post(`/knowledge-bases/${kbId}/clear-vectors`);
  return data;
}

export async function updateChunkConfig(
  kbId: number,
  config: ChunkConfig
): Promise<{ code: number; message: string }> {
  const { data } = await apiClient.put(`/knowledge-bases/${kbId}/chunk-config`, config);
  return data;
}

export async function crawlWebContent(kbId: number): Promise<{ code: number; message: string; data: unknown }> {
  const { data } = await apiClient.post(`/knowledge-bases/${kbId}/crawl`);
  return data;
}

export async function getDocumentChunks(docId: number, params?: {
  page?: number;
  page_size?: number;
}): Promise<{ items: Array<{ id: number; doc_id: number; chunk_index: number; content: string; token_count: number; created_at: string | null }>; total: number; page: number; page_size: number; total_pages: number }> {
  const { data } = await apiClient.get(`/documents/${docId}/chunks`, { params });
  return data;
}

export async function hitTest(
  kbId: number,
  params: { query: string; top_k?: number; similarity_threshold?: number }
): Promise<{ code: number; data: HitTestResult }> {
  const { data } = await apiClient.post(`/knowledge-bases/${kbId}/hit-test`, undefined, {
    params,
  });
  return data;
}
