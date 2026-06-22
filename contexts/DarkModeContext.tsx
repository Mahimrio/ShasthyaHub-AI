'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface DarkModeContextType {
  dark: boolean
  toggle: () => void
}

const DarkModeContext = createContext<DarkModeContextType>({
  dark: false,
  toggle: () => {},
})

function getInitialDark(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const stored = localStorage.getItem('shasthya_theme')
    if (stored === 'dark') return true
    if (stored === 'light') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  } catch {
    return false
  }
}

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(getInitialDark)

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [dark])

  const toggle = useCallback(() => {
    setDark((prev) => {
      const next = !prev
      if (next) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('shasthya_theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('shasthya_theme', 'light')
      }
      return next
    })
  }, [])

  return (
    <DarkModeContext.Provider value={{ dark, toggle }}>
      {children}
    </DarkModeContext.Provider>
  )
}

export const useDarkMode = () => useContext(DarkModeContext)
