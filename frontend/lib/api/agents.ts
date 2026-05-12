import { apiClient } from '../api-client'
import type { AgentConfig, ExecutionLog } from '@/types'

export interface CreateAgentPayload {
  workspace_id: number
  model_name:   string
  system_prompt: string
  temperature:  number
}

export interface UpdateAgentPayload {
  model_name?:   string
  system_prompt?: string
  temperature?:  number
}

export async function getAgents(
  workspace_id: number,
  skip  = 0,
  limit = 50,
): Promise<AgentConfig[]> {
  const { data } = await apiClient.get<AgentConfig[]>('/agents/', {
    params: { workspace_id, skip, limit },
  })
  return data
}

export async function createAgent(payload: CreateAgentPayload): Promise<AgentConfig> {
  const { data } = await apiClient.post<AgentConfig>('/agents/', payload)
  return data
}

export async function updateAgent(
  id:      number,
  payload: UpdateAgentPayload,
): Promise<AgentConfig> {
  const { data } = await apiClient.patch<AgentConfig>(`/agents/${id}`, payload)
  return data
}

export async function deleteAgent(id: number): Promise<void> {
  await apiClient.delete(`/agents/${id}`)
}

export async function runAgent(
  agentId:    number,
  promptText: string,
): Promise<ExecutionLog> {
  const { data } = await apiClient.post<ExecutionLog>(`/agents/${agentId}/run`, {
    agent_id:    agentId,
    prompt_text: promptText,
  })
  return data
}