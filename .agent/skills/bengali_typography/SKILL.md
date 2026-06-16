# Bengali Typography Setup

## Font Loading (app/layout.tsx)

```typescript
import { Inter } from 'next/font/google'
import { Hind_Siliguri } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const hindSiliguri = Hind_Siliguri({
  weight: ['400', '500', '600', '700'],
  subsets: ['bengali', 'latin'],
  variable: '--font-bengali',
  display: 'swap',
})

export default function RootLayout({ children }: Props) {
  return (
    <html lang="bn" className={`${inter.variable} ${hindSiliguri.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
```

## CSS Variables Setup (globals.css)

```css
:root {
  --font-inter: 'Inter', sans-serif;
  --font-bengali: 'Hind Siliguri', sans-serif;
}

/* Bengali text class */
.text-bengali {
  font-family: var(--font-bengali);
  line-height: 1.8;        /* Critical: Bengali diacritics extend above and below */
  letter-spacing: 0.01em;  /* Slight spacing improves Bengali readability */
  font-weight: 400;         /* Medium weight (500) can look heavy in Bengali */
}

/* Bengali heading */
.heading-bengali {
  font-family: var(--font-bengali);
  font-weight: 700;
  line-height: 1.5;         /* Tighter for headings, but still more than Latin */
}
```

## Tailwind Config for Bengali

```typescript
// tailwind.config.ts
fontFamily: {
  sans:    ['var(--font-inter)', 'sans-serif'],
  bengali: ['var(--font-bengali)', 'Hind Siliguri', 'sans-serif'],
},
lineHeight: {
  bengali:         '1.8',  // Body text
  'bengali-tight': '1.5',  // Headings
},
```

## Component Pattern

```typescript
// components/shared/BengaliText.tsx
export function BengaliText({ children, className, as: Tag = 'span' }: Props) {
  return (
    <Tag className={cn('font-bengali leading-bengali', className)}>
      {children}
    </Tag>
  )
}

// Usage
<BengaliText as="p" className="text-gray-600">
  আপনার চোখের পরীক্ষার ফলাফল
</BengaliText>
```

## Mixed Bengali + English (common in ShasthyaHub)

```typescript
// When mixing scripts, apply Bengali font to the whole container
// Bengali characters auto-render in Bengali; Latin stays Inter-like
<p className="font-bengali leading-bengali">
  NayanAI দিয়ে আপনার চোখ পরীক্ষা করুন। {/* Mixed — works fine */}
</p>

// For pure English sections within a Bengali page:
<span className="font-sans">{diagnosis.english}</span>
<span className="font-bengali ml-1">/ {diagnosis.bengali}</span>
```

## i18n Language Switch Pattern

```typescript
// contexts/LanguageContext.tsx
'use client'
import { createContext, useContext, useState, useEffect } from 'react'

type Lang = 'bn' | 'en'
const LanguageContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>
  ({ lang: 'bn', setLang: () => {} })

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('bn') // Bengali default

  useEffect(() => {
    const stored = localStorage.getItem('shasthya_lang') as Lang | null
    if (stored) setLangState(stored)
  }, [])

  function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem('shasthya_lang', l)
    document.documentElement.lang = l
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      <div className={lang === 'bn' ? 'font-bengali' : 'font-sans'}>
        {children}
      </div>
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
```

## Text Direction Note

Bengali script is LEFT-TO-RIGHT (same as English). DO NOT add dir="rtl".
The html lang attribute should be lang="bn" (not lang="bn-BD" — browser handles it).