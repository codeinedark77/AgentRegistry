import { apiClient } from '../api-client'
import type { ModelAnalyticsReport } from '@/types'

export async function getModelAnalyticsReport(
  workspace_id?: number,
): Promise<ModelAnalyticsReport[]> {
  const { data } = await apiClient.get<ModelAnalyticsReport[]>(
    '/analytics/model-report',
    { params: workspace_id !== undefined ? { workspace_id } : {} },
  )
  return data
}