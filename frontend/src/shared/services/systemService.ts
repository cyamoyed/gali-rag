import { apiClient } from './apiClient';
import type { SystemResource } from '../types';

export async function getResources(): Promise<SystemResource> {
  const { data } = await apiClient.get<SystemResource>('/resources');
  return data;
}
