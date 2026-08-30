'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { Language } from '@/types'

import '@/lib/i18n'

const LANG_KEY = 'shasthya_lang'

interface LanguageContextType {
  lang: Language
  setLang: (l: Language) => void
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'bn',
  setLang: () => {},
})

function persistLang(l: Language) {
  try {
    localStorage.setItem(LANG_KEY, l)
  } catch {
    // storage unavailable (private mode)
  }
  document.cookie = `${LANG_KEY}=${l}; path=/; max-age=31536000; SameSite=Lax`
}

export function LanguageProvider({
  children,
  initialLang = 'bn',
}: {
  children: React.ReactNode
  initialLang?: Language
}) {
  const [lang, setLangState] = useState<Language>(initialLang)
  const { i18n } = useTranslation()

  // One-time migration: users from before the cookie existed have their
  // preference only in localStorage — adopt it and write the cookie.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LANG_KEY) as Language | null
      if (stored === 'bn' || stored === 'en') {
        if (stored !== lang) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from pre-cookie localStorage preference
          setLangState(stored)
        }
        persistLang(stored)
      }
    } catch {
      // storage unavailable
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cross-tab sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LANG_KEY && (e.newValue === 'bn' || e.newValue === 'en')) {
        setLangState(e.newValue)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
    i18n.changeLanguage(lang)
  }, [lang, i18n])

  const setLang = useCallback(async (l: Language) => {
    setLangState(l)
    persistLang(l)
    document.documentElement.lang = l
    i18n.changeLanguage(l)

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('profiles')
          .update({ preferred_language: l })
          .eq('id', user.id)
      }
    } catch {
      // Supabase client not available (e.g. during prerendering)
    }
  }, [i18n])

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      <div className={lang === 'bn' ? 'font-bengali leading-bengali' : 'font-sans'}>
        {children}
      </div>
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
