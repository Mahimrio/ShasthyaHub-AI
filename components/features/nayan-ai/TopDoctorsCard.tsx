'use client'

import { Clock, MapPin, Star } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import type { Doctor } from '@/hooks/useDoctors'

interface TopDoctorsCardProps {
  doctors: Doctor[]
  isLoading: boolean
}

function DoctorSkeleton() {
  return (
    <div className="flex items-start gap-4 py-4 animate-pulse">
      <div className="h-12 w-12 shrink-0 rounded-full bg-gray-200 dark:bg-gray-700" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-3 w-32 rounded bg-gray-100 dark:bg-gray-700" />
        <div className="h-3 w-48 rounded bg-gray-100 dark:bg-gray-700" />
      </div>
    </div>
  )
}

function getInitials(name: string): string {
  return name
    .replace(/^(Dr\.|Dr|ডা\.|ডা)\s*/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export function TopDoctorsCard({ doctors, isLoading }: TopDoctorsCardProps) {
  const { lang } = useLanguage()

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          {lang === 'bn' ? 'নিকটবর্তী বিশেষজ্ঞ' : 'Top Specialists Nearby'}
        </h3>
        <DoctorSkeleton />
        <DoctorSkeleton />
        <DoctorSkeleton />
      </div>
    )
  }

  if (doctors.length === 0) return null

  return (
    <div className="rounded-2xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="border-b border-gray-50 px-5 py-4 dark:border-gray-700/50">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          <Star className="h-4 w-4 text-amber-500" />
          {lang === 'bn' ? 'নিকটবর্তী বিশেষজ্ঞ' : 'Top Specialists Nearby'}
        </h3>
      </div>

      <div className="divide-y divide-gray-50 px-5 dark:divide-gray-700/50">
        {doctors.map((doctor) => (
          <div key={doctor.id} className="flex items-start gap-4 py-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-emerald-500">
              <span className="text-sm font-bold text-white">
                {getInitials(doctor.name)}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {doctor.name}
                  </p>
                  {doctor.name_bn && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {doctor.name_bn}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  {doctor.rating !== null && (
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                      {'★'} {doctor.rating.toFixed(1)}
                    </p>
                  )}
                  {doctor.experience_years !== null && (
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">
                      {doctor.experience_years} yrs
                    </p>
                  )}
                </div>
              </div>

              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {doctor.qualification}
              </p>

              <div className="mt-1 flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                <MapPin className="h-3 w-3 shrink-0 text-sky-500" />
                <span className="truncate">{doctor.hospital_name}</span>
              </div>

              <p className="text-xs text-gray-400 dark:text-gray-500">
                {doctor.area}
              </p>

              {doctor.visiting_hours && (
                <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="h-3 w-3 shrink-0 text-emerald-500" />
                  <span>{doctor.visiting_hours}</span>
                </div>
              )}

              {doctor.phone && (
                <button
                  onClick={() => window.open(`tel:${doctor.phone}`)}
                  className="mt-1.5 text-xs font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 transition-colors"
                >
                  📞 {lang === 'bn' ? 'কল করুন' : 'Call'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-50 px-5 py-3 dark:border-gray-700/50">
        <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">
          {lang === 'bn'
            ? 'ডাক্তার তালিকা যাচাইকৃত কিন্তু প্রাপ্যতা পরিবর্তন হতে পারে।'
            : 'Doctor list is curated and may not reflect current availability.'}
        </p>
      </div>
    </div>
  )
}
