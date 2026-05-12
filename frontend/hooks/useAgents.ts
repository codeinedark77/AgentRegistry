'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createAgent,
  deleteAgent,
  getAgents,
  updateAgent,
} from '@/lib/api/agents'
import type { UpdateAgentPayload, CreateAgentPayload } from '@/lib/api/agents'

export const AGENTS_KEY = 'agents'

export function useAgents(workspaceId: number | null) {
  return useQuery({
    queryKey: [AGENTS_KEY, workspaceId],
    queryFn:  () => getAgents(workspaceId!),
    enabled:  workspaceId !== null,
    staleTime: 30_000,
  })
}

export function useCreateAgent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateAgentPayload) => createAgent(payload),
    onSuccess:  (agent) =>
      qc.invalidateQueries({ queryKey: [AGENTS_KEY, agent.workspace_id] }),
  })
}

export function useUpdateAgent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateAgentPayload }) =>
      updateAgent(id, payload),
    onSuccess: (agent) =>
      qc.invalidateQueries({ queryKey: [AGENTS_KEY, agent.workspace_id] }),
  })
}

export function useDeleteAgent(workspaceId: number | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteAgent,
    onSuccess:  () =>
      qc.invalidateQueries({ queryKey: [AGENTS_KEY, workspaceId] }),
  })
}