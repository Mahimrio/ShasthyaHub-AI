'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Eye, FileText, Utensils, BarChart3, LogOut, Menu, X, ChevronRight, Bug } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageToggle } from '@/components/shared/LanguageToggle'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { BottomNav } from '@/components/layout/BottomNav'
import { Skeleton } from '@/components/shared/skeletons/Skeleton'
import { useState } from 'react'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

const sidebarLinks = [
  { href: '/', icon: Home, labelEn: 'Home', labelBn: 'শুরু' },
  { href: '/nayan-ai', icon: Eye, labelEn: 'Nayan AI', labelBn: 'নয়ান AI' },
  { href: '/scriptguard', icon: FileText, labelEn: 'ScriptGuard', labelBn: 'স্ক্রিপ্টগার্ড' },
  { href: '/glycovision', icon: Utensils, labelEn: 'GlycoVision', labelBn: 'গ্লাইকোভিশন' },
  { href: '/reports', icon: BarChart3, labelEn: 'Reports', labelBn: 'রিপোর্ট' },
  { href: '/debug-offline', icon: Bug, labelEn: 'Debug', labelBn: 'ডিবাগ' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { lang } = useLanguage()
  const { profile, isLoading, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isOnline } = useNetworkStatus()

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
          <Link prefetch={false} href="/" className="flex items-center gap-2">
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
          'fixed top-0 left-0 z-50 h-full w-66 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
            <Link prefetch={false} href="/" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md shadow-sky-500/10 dark:shadow-sky-400/10">
                <span className="text-white text-xs font-black">S</span>
              </div>
              <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-500 dark:from-sky-400 dark:via-cyan-400 dark:to-emerald-400 tracking-tight text-sm">
                ShasthyaHub
              </span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Mobile Drawer Nav Links */}
          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
            {sidebarLinks.map((link) => {
              const isActive = pathname === link.href
              const Icon = link.icon
              return (
                <Link
                  prefetch={false}
                  key={link.href}
                  href={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-sky-500/10 to-transparent text-sky-600 dark:from-sky-500/20 dark:text-sky-400 font-bold'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/50 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800/40'
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-md bg-gradient-to-b from-sky-500 to-cyan-500" />
                  )}
                  <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-sky-500 dark:text-sky-400' : 'text-gray-400 dark:text-gray-500')} />
                  <span>{lang === 'bn' ? link.labelBn : link.labelEn}</span>
                  {isActive && (
                    <ChevronRight className="h-4 w-4 ml-auto text-sky-400 dark:text-sky-500" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Mobile Drawer Account Footer */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-950/20">
            <div className="bg-white/80 dark:bg-gray-900/60 rounded-2xl border border-gray-150 dark:border-gray-800/80 p-3 space-y-3 shadow-sm">
              {isLoading ? (
                <Skeleton className="h-10 w-full rounded-xl" />
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-sky-400 via-cyan-400 to-emerald-400 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 shadow-md">
                    {profile?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                      {profile?.name || (lang === 'bn' ? 'ব্যবহারকারী' : 'User')}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium truncate">
                      {profile?.district || (lang === 'bn' ? 'জেলা নির্ধারণ করা নেই' : 'No District Set')}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-2.5 border-t border-gray-100 dark:border-gray-800/80">
                <div className="flex-1 flex justify-center items-center">
                  <LanguageToggle />
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all border border-transparent hover:border-red-200/50 dark:hover:border-red-900/30"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>{lang === 'bn' ? 'সাইন আউট' : 'Sign Out'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 xl:w-64 md:fixed md:inset-y-0 md:flex-col bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 z-30 transition-colors">
        {/* Desktop Sidebar Logo Header */}
        <div className="flex items-center justify-between gap-2 p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-500 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-sky-500/10 dark:shadow-sky-400/10">
              <span className="text-white font-black text-sm">S</span>
            </div>
            <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-500 dark:from-sky-400 dark:via-cyan-400 dark:to-emerald-400 tracking-tight text-base">
              ShasthyaHub
            </span>
          </div>
          <ThemeToggle />
        </div>

        {/* Desktop Sidebar Nav Links */}
        <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href
            const Icon = link.icon
            return (
                <Link
                  prefetch={false}
                  key={link.href}
                  href={link.href}
                  className={cn(
                  'relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-sky-500/10 to-transparent text-sky-600 dark:from-sky-500/20 dark:text-sky-400 font-bold'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/50 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800/40'
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-md bg-gradient-to-b from-sky-500 to-cyan-500" />
                )}
                <Icon className={cn('h-5 w-5 shrink-0 transition-colors', isActive ? 'text-sky-500 dark:text-sky-400' : 'text-gray-400 dark:text-gray-500')} />
                <span>{lang === 'bn' ? link.labelBn : link.labelEn}</span>
              </Link>
            )
          })}
        </nav>

        {/* Desktop Sidebar Account Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <div className="bg-gray-50/50 dark:bg-gray-950/40 rounded-2xl border border-gray-100 dark:border-gray-800/80 p-3.5 space-y-3 shadow-sm">
            {isLoading ? (
              <Skeleton className="h-10 w-full rounded-xl" />
            ) : (
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8.5 h-8.5 bg-gradient-to-br from-sky-400 via-cyan-400 to-emerald-400 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 shadow-md">
                  {profile?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                    {profile?.name || (lang === 'bn' ? 'ব্যবহারকারী' : 'User')}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium truncate">
                    {profile?.district || (lang === 'bn' ? 'জেলা নির্ধারণ করা নেই' : 'No District Set')}
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2.5 border-t border-gray-100 dark:border-gray-800/80">
              <div className="flex-1 flex justify-center items-center">
                <LanguageToggle />
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all border border-transparent hover:border-red-200/50 dark:hover:border-red-900/30"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>{lang === 'bn' ? 'সাইন আউট' : 'Sign Out'}</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Offline banner */}
      {!isOnline && (
        <div className="md:pl-60 xl:pl-64">
          <div className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-1.5 text-[11px] font-medium text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            {lang === 'bn' ? 'আপনি অফলাইনে আছেন — ফলাফল প্রাথমিক' : 'You are offline — results are preliminary'}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="md:pl-60 xl:pl-64 md:pb-0 pb-20">
        {children}
      </main>

      <BottomNav />
    </div>
  )
}
