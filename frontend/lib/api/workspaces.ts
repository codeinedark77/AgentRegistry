import { apiClient } from '../api-client'
import type { Workspace } from '@/types'

export async function getWorkspaces(skip = 0, limit = 50): Promise<Workspace[]> {
  const { data } = await apiClient.get<Workspace[]>('/workspaces/', { params: { skip, limit } })
  return data
}

export async function createWorkspace(payload: {
  name: string
  description?: string
}): Promise<Workspace> {
  const { data } = await apiClient.post<Workspace>('/workspaces/', payload)
  return data
}

export async function updateWorkspace(
  id: number,
  payload: { name?: string; description?: string },
): Promise<Workspace> {
  const { data } = await apiClient.patch<Workspace>(`/workspaces/${id}`, payload)
  return data
}

export async function deleteWorkspace(id: number): Promise<void> {
  await apiClient.delete(`/workspaces/${id}`)
}