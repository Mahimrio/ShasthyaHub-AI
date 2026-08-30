'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, Eye, FileText, Utensils, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

const navItems = [
  { href: '/', icon: Home, labelEn: 'Home', labelBn: 'শুরু' },
  { href: '/nayan-ai', icon: Eye, labelEn: 'NayanAI', labelBn: 'চোখের পরীক্ষা' },
  { href: '/scriptguard', icon: FileText, labelEn: 'ScriptGuard', labelBn: 'প্রেসক্রিপশন' },
  { href: '/glycovision', icon: Utensils, labelEn: 'GlycoVision', labelBn: 'খাদ্য বিশ্লেষণ' },
  { href: '/reports', icon: BarChart3, labelEn: 'Reports', labelBn: 'রিপোর্ট' },
]

export function BottomNav() {
  const pathname = usePathname()
  const { lang } = useLanguage()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 md:hidden z-40 pb-[env(safe-area-inset-bottom)] transition-colors">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center gap-0.5 py-1 px-3 min-w-[64px] transition-colors duration-200 active:scale-95',
                isActive ? 'text-sky-600 dark:text-sky-400' : 'text-gray-400 dark:text-gray-500'
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="bottomnav-indicator"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute -top-[1px] h-0.5 w-8 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500"
                />
              )}
              <Icon className={cn('h-5 w-5 transition-transform duration-200', isActive && '-translate-y-0.5 scale-110')} />
              <span className="text-[10px] font-medium leading-tight">
                {lang === 'bn' ? item.labelBn : item.labelEn}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
