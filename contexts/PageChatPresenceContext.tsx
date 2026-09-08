'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

interface PageChatPresence {
  /** True while at least one page-scoped composer is mounted. */
  hasPageChat: boolean
  register: () => () => void
}

const PageChatPresenceContext = createContext<PageChatPresence>({
  hasPageChat: false,
  register: () => () => {},
})

/** Lets the global Shasthya Bondhu widget step aside while a page-scoped composer is on screen. */
export function PageChatPresenceProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0)

  const register = useCallback(() => {
    setCount((c) => c + 1)
    return () => setCount((c) => Math.max(0, c - 1))
  }, [])

  const value = useMemo(() => ({ hasPageChat: count > 0, register }), [count, register])
  return <PageChatPresenceContext.Provider value={value}>{children}</PageChatPresenceContext.Provider>
}

export function usePageChatPresence() {
  return useContext(PageChatPresenceContext)
}

/** Call from a page-scoped composer; registers for the component's lifetime. */
export function useRegisterPageChat() {
  const { register } = usePageChatPresence()
  useEffect(() => register(), [register])
}
