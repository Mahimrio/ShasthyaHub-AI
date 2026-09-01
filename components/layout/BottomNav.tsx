'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, Eye, FileText, BarChart3, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

const navItems = [
  { href: '/', icon: Home, labelEn: 'Home', labelBn: 'শুরু' },
  { href: '/nayan-ai', icon: Eye, labelEn: 'NayanAI', labelBn: 'চোখ' },
  { href: '/scriptguard', icon: FileText, labelEn: 'RxGuard', labelBn: 'ওষুধ' },
  { href: '/family', icon: Users, labelEn: 'Poribar', labelBn: 'পরিবার' },
  { href: '/reports', icon: BarChart3, labelEn: 'Reports', labelBn: 'রিপোর্ট' },
]

export function BottomNav() {
  const pathname = usePathname()
  const { lang } = useLanguage()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-100 dark:border-gray-800 md:hidden z-40 pb-[env(safe-area-inset-bottom)] transition-colors">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center gap-0.5 py-1.5 px-2 min-w-[64px] transition-colors duration-200 active:scale-95',
                isActive ? 'text-sky-600 dark:text-sky-400' : 'text-gray-400 dark:text-gray-500'
              )}
            >
              <span className="relative flex h-7 w-13 items-center justify-center">
                {isActive && (
                  <motion.span
                    layoutId="bottomnav-indicator"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-500/15 to-cyan-500/15 dark:from-sky-500/25 dark:to-cyan-500/25"
                  />
                )}
                <Icon className={cn('relative z-10 h-5 w-5 transition-transform duration-200', isActive && 'scale-110')} />
              </span>
              <span className={cn('text-[10px] leading-tight', isActive ? 'font-bold' : 'font-medium')}>
                {lang === 'bn' ? item.labelBn : item.labelEn}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
