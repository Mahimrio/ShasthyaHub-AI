'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/types'
import type { User } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabaseRef = useRef<SupabaseClient | null>(null)

  useEffect(() => {
    let cancelled = false
    let subscription: { unsubscribe: () => void } | null = null

    const init = async () => {
      const { createClient } = await import('@/lib/supabase/client')
      supabaseRef.current = createClient()
      const supabase = supabaseRef.current

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (cancelled) return
      setUser(user)

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        if (!cancelled) setProfile(profile)
      }

      if (!cancelled) setIsLoading(false)

      const { data: sub } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          setUser(session?.user ?? null)

          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()
            setProfile(profile)
          } else {
            setProfile(null)
          }
        }
      )
      subscription = sub.subscription
    }

    init()

    return () => {
      cancelled = true
      subscription?.unsubscribe()
      supabaseRef.current = null
    }
  }, [])

  const signOut = async () => {
    if (!supabaseRef.current) return
    await supabaseRef.current.auth.signOut()
    setUser(null)
    setProfile(null)
    router.push('/login')
  }

  return { user, profile, isLoading, signOut }
}
