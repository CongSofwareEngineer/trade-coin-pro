import { DiscussionListData, KnowledgeData } from '@/types/economy'

// Client side wrapper. Everything goes to our own /api/economy proxy, never to Google directly.
const request = async <T>(path: string, method: string, body?: unknown): Promise<T> => {
  const response = await fetch(`/api/economy/${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const result = await response.json().catch(() => null)

  if (!response.ok) throw new Error(result?.error || `Request failed (${response.status})`)

  return result?.data as T
}

class EconomyApi {
  static getDiscussions = () => request<DiscussionListData>('discussions', 'GET')

  static createDiscussion = (values: Record<string, string>) => request<boolean>('discussions', 'POST', { values })

  static updateDiscussion = (row: number, values: Record<string, string>) => request<boolean>('discussions', 'PUT', { row, values })

  static deleteDiscussion = (row: number) => request<boolean>('discussions', 'DELETE', { row })

  static getKnowledge = () => request<KnowledgeData>('knowledge', 'GET')

  static createSection = (payload: { title: string; text: string; level?: number; revisionId?: string }) =>
    request<boolean>('knowledge', 'POST', payload)

  static updateSection = (payload: { startIndex: number; endIndex: number; title: string; text: string; level?: number; revisionId?: string }) =>
    request<boolean>('knowledge', 'PUT', payload)

  static deleteSection = (payload: { startIndex: number; endIndex: number; revisionId?: string }) => request<boolean>('knowledge', 'DELETE', payload)
}

export default EconomyApi
