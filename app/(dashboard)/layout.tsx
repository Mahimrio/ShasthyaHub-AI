'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Eye, FileText, Utensils, BarChart3, LogOut, Menu, X, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageToggle } from '@/components/shared/LanguageToggle'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { BottomNav } from '@/components/layout/BottomNav'
import { Skeleton } from '@/components/shared/skeletons/Skeleton'
import { useState } from 'react'

const sidebarLinks = [
  { href: '/', icon: Home, labelEn: 'Home', labelBn: 'শুরু' },
  { href: '/nayan-ai', icon: Eye, labelEn: 'Nayan AI', labelBn: 'নয়ান AI' },
  { href: '/scriptguard', icon: FileText, labelEn: 'ScriptGuard', labelBn: 'স্ক্রিপ্টগার্ড' },
  { href: '/glycovision', icon: Utensils, labelEn: 'GlycoVision', labelBn: 'গ্লাইকোভিশন' },
  { href: '/reports', icon: BarChart3, labelEn: 'Reports', labelBn: 'রিপোর্ট' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { lang } = useLanguage()
  const { profile, isLoading, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Mobile header */}
      <header className="sticky top-0 z-30 md:hidden bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 transition-colors">
        <div className="flex items-center justify-between h-14 px-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {sidebarOpen ? (
              <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <Menu className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-sky-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">S</span>
            </div>
            <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">ShasthyaHub</span>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 dark:bg-black/60 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-900 shadow-xl dark:shadow-2xl transform transition-transform duration-200 md:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
            <Link href="/" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-sm font-bold">S</span>
              </div>
              <span className="font-semibold text-gray-800 dark:text-gray-100">ShasthyaHub</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {sidebarLinks.map((link) => {
              const isActive = pathname === link.href
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200'
                  )}
                >
                  <Icon className={cn('h-5 w-5', isActive ? 'text-sky-600 dark:text-sky-400' : 'text-gray-400 dark:text-gray-500')} />
                  <span>{lang === 'bn' ? link.labelBn : link.labelEn}</span>
                  {isActive && (
                    <ChevronRight className="h-4 w-4 ml-auto text-sky-400 dark:text-sky-500" />
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
            {isLoading ? (
              <Skeleton className="h-10 w-full rounded-xl" />
            ) : (
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-emerald-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {profile?.name?.[0] || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                    {profile?.name || (lang === 'bn' ? 'ব্যবহারকারী' : 'User')}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                    {profile?.district || ''}
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>{lang === 'bn' ? 'সাইন আউট' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 xl:w-64 md:fixed md:inset-y-0 md:flex-col bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 z-30 transition-colors">
        <div className="flex items-center justify-between gap-2 p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-sky-500 to-emerald-500 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-white font-bold">S</span>
            </div>
            <span className="font-semibold text-gray-800 dark:text-gray-100 text-base">ShasthyaHub</span>
          </div>
          <ThemeToggle />
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200'
                )}
              >
                <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-sky-600 dark:text-sky-400' : 'text-gray-400 dark:text-gray-500')} />
                <span>{lang === 'bn' ? link.labelBn : link.labelEn}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
          <div className="flex items-center justify-between px-3 py-2">
            {isLoading ? (
              <Skeleton className="h-8 w-full rounded-lg" />
            ) : (
              <>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 bg-gradient-to-br from-sky-400 to-emerald-400 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                    {profile?.name?.[0] || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                      {profile?.name || (lang === 'bn' ? 'ব্যবহারকারী' : 'User')}
                    </p>
                  </div>
                </div>
                <LanguageToggle />
              </>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>{lang === 'bn' ? 'সাইন আউট' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="md:pl-60 xl:pl-64 md:pb-0 pb-20">
        {children}
      </main>
    </div>
  )
}
