'use client'

import { createContext, useContext, useEffect, useCallback, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import type { Language } from '@/types'

import '@/lib/i18n'

interface LanguageContextType {
  lang: Language
  setLang: (l: Language) => void
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'bn',
  setLang: () => {},
})

function getServerSnapshot(): Language {
  return 'bn'
}

function getSnapshot(): Language {
  try {
    return (localStorage.getItem('shasthya_lang') as Language) || 'bn'
  } catch {
    return 'bn'
  }
}

function subscribe(callback: () => void): () => void {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const { i18n } = useTranslation()

  useEffect(() => {
    document.documentElement.lang = lang
    i18n.changeLanguage(lang)
  }, [lang, i18n])

  const setLang = useCallback(async (l: Language) => {
    localStorage.setItem('shasthya_lang', l)
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
