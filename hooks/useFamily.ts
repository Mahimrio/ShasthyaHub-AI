'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import type {
  FamilyConnection,
  FamilyTreeNode,
  UserSearchResult,
  RelationType,
} from '@/types'

export const FAMILY_CONNECTIONS_KEY = ['family-connections'] as const
export const FAMILY_TREE_KEY = ['family-tree'] as const
export const PROFILE_USERNAME_KEY = ['profile-username'] as const
export const MEMBER_REPORTS_KEY = ['member-reports'] as const

// 1. Fetch user's username & profile status
export function useProfileUsername() {
  const { user } = useAuth()

  return useQuery<{ username: string | null; name: string | null }>({
    queryKey: [...PROFILE_USERNAME_KEY, user?.id ?? 'anon'],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const res = await fetch('/api/profile/username')
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to fetch username')
      }
      return json.data
    },
  })
}

// 2. Set username mutation
export function useSetProfileUsername() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (username: string) => {
      const res = await fetch('/api/profile/username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error_bn || json.error || 'Failed to set username')
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...PROFILE_USERNAME_KEY, user?.id ?? 'anon'] })
      queryClient.invalidateQueries({ queryKey: [...FAMILY_TREE_KEY, user?.id ?? 'anon'] })
    },
  })
}

// 3. Search users query
export function useSearchFamilyUsers(query: string) {
  const { user } = useAuth()
  const cleanQuery = query.trim()

  return useQuery<UserSearchResult[]>({
    queryKey: ['family-search', cleanQuery],
    enabled: !!user && cleanQuery.length >= 2,
    staleTime: 10_000,
    queryFn: async () => {
      const res = await fetch(`/api/family/search?q=${encodeURIComponent(cleanQuery)}`)
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to search users')
      }
      return json.data || []
    },
  })
}

// 4. Fetch all connections
export function useFamilyConnections(statusFilter?: 'pending' | 'accepted') {
  const { user } = useAuth()

  return useQuery<FamilyConnection[]>({
    queryKey: [...FAMILY_CONNECTIONS_KEY, user?.id ?? 'anon', statusFilter ?? 'all'],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async () => {
      const url = statusFilter
        ? `/api/family/connections?status=${statusFilter}`
        : '/api/family/connections'
      const res = await fetch(url)
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to fetch family connections')
      }
      return json.data || []
    },
  })
}

// 5. Fetch family tree data
export function useFamilyTree() {
  const { user } = useAuth()

  return useQuery<{
    self: FamilyTreeNode
    allNodes: FamilyTreeNode[]
    otherNodes: FamilyTreeNode[]
    generations: Record<string, FamilyTreeNode[]>
    totalMembers: number
  }>({
    queryKey: [...FAMILY_TREE_KEY, user?.id ?? 'anon'],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async () => {
      const res = await fetch('/api/family/tree')
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to fetch family tree')
      }
      return json.data
    },
  })
}

// 6. Send connection invitation mutation
export function useSendFamilyInvitation() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({
      target_id,
      relation_type,
      reverse_relation_type,
    }: {
      target_id: string
      relation_type: RelationType
      reverse_relation_type?: RelationType
    }) => {
      const res = await fetch('/api/family/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_id, relation_type, reverse_relation_type }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error_bn || json.error || 'Failed to send invitation')
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...FAMILY_CONNECTIONS_KEY, user?.id ?? 'anon'] })
      queryClient.invalidateQueries({ queryKey: ['family-search'] })
    },
  })
}

// 7. Respond to invitation (accept / reject)
export function useRespondFamilyInvitation() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({
      connectionId,
      action,
      reverse_relation_type,
    }: {
      connectionId: string
      action: 'accept' | 'reject'
      reverse_relation_type?: RelationType
    }) => {
      const res = await fetch(`/api/family/connections/${connectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reverse_relation_type }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error_bn || json.error || 'Failed to respond to invitation')
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...FAMILY_CONNECTIONS_KEY, user?.id ?? 'anon'] })
      queryClient.invalidateQueries({ queryKey: [...FAMILY_TREE_KEY, user?.id ?? 'anon'] })
    },
  })
}

// 8. Delete / Remove connection
export function useDeleteFamilyConnection() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (connectionId: string) => {
      const res = await fetch(`/api/family/connections/${connectionId}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete connection')
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...FAMILY_CONNECTIONS_KEY, user?.id ?? 'anon'] })
      queryClient.invalidateQueries({ queryKey: [...FAMILY_TREE_KEY, user?.id ?? 'anon'] })
    },
  })
}

// 9. Fetch specific member health reports
export function useMemberHealthReports(memberId: string | null) {
  const { user } = useAuth()

  return useQuery({
    queryKey: [...MEMBER_REPORTS_KEY, memberId ?? 'none'],
    enabled: !!user && !!memberId,
    staleTime: 60_000,
    queryFn: async () => {
      if (!memberId) return null
      const res = await fetch(`/api/family/member/${memberId}/reports`)
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error_bn || json.error || 'Failed to load member health data')
      }
      return json.data
    },
  })
}
