'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { readLocalConversationIndex, removeLocalConversation } from './useScopedChat'
import type { ChatAgent, ScopedConversation } from '@/types'

const queryKeyFor = (uid: string | undefined, agent: ChatAgent) => ['scoped-chat-history', uid ?? 'anon', agent] as const

/**
 * Earlier conversations of one page composer: Supabase rows (grouped by the
 * history route) merged with this browser's local index for unsynced ones.
 */
export function useScopedConversations(agent: ChatAgent, enabled: boolean) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const queryKey = queryKeyFor(user?.id, agent)

  const query = useQuery<ScopedConversation[]>({
    queryKey,
    enabled: enabled && Boolean(user?.id),
    staleTime: 10_000,
    queryFn: async () => {
      let server: ScopedConversation[] = []
      try {
        const res = await fetch(`/api/chat/scoped/history?agent=${agent}`)
        const json = await res.json()
        if (res.ok && json.success) server = json.data.conversations
      } catch {
        // offline or route unavailable — local index still works
      }
      const seen = new Set(server.map((c) => c.contextId))
      const local = user?.id ? readLocalConversationIndex(user.id, agent).filter((c) => !seen.has(c.contextId)) : []
      return [...server, ...local].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    },
  })

  const remove = useMutation({
    mutationFn: async (contextId: string) => {
      if (!user?.id) return
      removeLocalConversation(user.id, agent, contextId)
      try {
        const { createClient } = await import('@/lib/supabase/client')
        await createClient().from('chat_messages').delete().eq('user_id', user.id).eq('scope', agent).eq('context_id', contextId)
      } catch {
        // table/columns missing — local removal is enough
      }
    },
    onMutate: async (contextId) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<ScopedConversation[]>(queryKey)
      queryClient.setQueryData<ScopedConversation[]>(queryKey, (old) => (old ?? []).filter((c) => c.contextId !== contextId))
      return { previous }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(queryKey, ctx.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })

  return {
    conversations: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    remove: remove.mutateAsync,
    invalidate: () => queryClient.invalidateQueries({ queryKey }),
  }
}
