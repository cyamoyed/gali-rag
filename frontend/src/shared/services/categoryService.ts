import { apiClient } from './apiClient';
import type { Category, CategoryTree } from '../types';

export async function listCategories(params?: { parent_id?: number }): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>('/categories', { params });
  return data;
}

export async function getCategoryTree(): Promise<CategoryTree[]> {
  const { data } = await apiClient.get<CategoryTree[]>('/categories/tree');
  return data;
}

export async function getCategory(catId: number): Promise<Category> {
  const { data } = await apiClient.get<Category>(`/categories/${catId}`);
  return data;
}

export async function createCategory(payload: {
  name: string;
  parent_id?: number | null;
  description?: string;
  sort_order?: number;
}): Promise<Category> {
  const { data } = await apiClient.post<Category>('/categories', payload);
  return data;
}

export async function updateCategory(
  catId: number,
  payload: {
    name?: string;
    parent_id?: number | null;
    description?: string;
    sort_order?: number;
  }
): Promise<Category> {
  const { data } = await apiClient.put<Category>(`/categories/${catId}`, payload);
  return data;
}

export async function deleteCategory(catId: number): Promise<{ code: number; message: string }> {
  const { data } = await apiClient.delete(`/categories/${catId}`);
  return data;
}
