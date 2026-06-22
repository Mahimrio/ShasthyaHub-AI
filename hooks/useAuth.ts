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
    const init = async () => {
      const { createClient } = await import('@/lib/supabase/client')
      supabaseRef.current = createClient()
      const supabase = supabaseRef.current

      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(profile)
      }

      setIsLoading(false)
    }

    init()

    return () => {
      supabaseRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!supabaseRef.current) return
    const supabase = supabaseRef.current

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
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
    })

    return () => {
      subscription.unsubscribe()
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
