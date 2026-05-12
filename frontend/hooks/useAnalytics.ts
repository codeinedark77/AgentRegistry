'use client'

import { useQuery } from '@tanstack/react-query'
import { getModelAnalyticsReport } from '@/lib/api/analytics'

export const ANALYTICS_KEY = 'analytics'

export function useModelAnalytics(workspaceId?: number) {
  return useQuery({
    queryKey: [ANALYTICS_KEY, 'model-report', workspaceId],
    queryFn:  () => getModelAnalyticsReport(workspaceId),
    staleTime: 60_000,
  })
}