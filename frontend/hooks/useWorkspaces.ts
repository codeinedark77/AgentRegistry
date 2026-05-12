'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createWorkspace,
  deleteWorkspace,
  getWorkspaces,
} from '@/lib/api/workspaces'

export const WS_KEY = 'workspaces'

export function useWorkspaces() {
  return useQuery({
    queryKey: [WS_KEY],
    queryFn:  () => getWorkspaces(),
    staleTime: 60_000,
  })
}

export function useCreateWorkspace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createWorkspace,
    onSuccess:  () => qc.invalidateQueries({ queryKey: [WS_KEY] }),
  })
}

export function useDeleteWorkspace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteWorkspace,
    onSuccess:  () => qc.invalidateQueries({ queryKey: [WS_KEY] }),
  })
}