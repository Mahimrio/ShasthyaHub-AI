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

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('shasthya_theme')
    if (stored === 'dark') {
      setDark(true)
      document.documentElement.classList.add('dark')
    } else if (stored === 'light') {
      setDark(false)
      document.documentElement.classList.remove('dark')
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        setDark(true)
        document.documentElement.classList.add('dark')
      }
    }
  }, [])

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

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <DarkModeContext.Provider value={{ dark, toggle }}>
      {children}
    </DarkModeContext.Provider>
  )
}

export const useDarkMode = () => useContext(DarkModeContext)
