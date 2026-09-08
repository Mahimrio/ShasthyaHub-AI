'use client'

import { Clock, MapPin, Phone, Star } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import type { Doctor } from '@/hooks/useDoctors'

interface TopDoctorsCardProps {
  doctors: Doctor[]
  isLoading: boolean
  layout?: 'column' | 'full'
  className?: string
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

export function TopDoctorsCard({ doctors, isLoading, layout = 'column', className = '' }: TopDoctorsCardProps) {
  const { lang } = useLanguage()

  if (isLoading) {
    return (
      <div className={`glass-card rounded-3xl p-6 space-y-4 ${className}`}>
        <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">
          {lang === 'bn' ? 'নিকটবর্তী বিশেষজ্ঞ চিকিৎসক' : 'Top Specialists Nearby'}
        </h3>
        <DoctorSkeleton />
        <DoctorSkeleton />
      </div>
    )
  }

  // Fallback verified Bangladesh ophthalmology centers if no district doctors match
  const fallbackCenters = [
    {
      id: 'nioh-dhaka',
      name: 'National Institute of Ophthalmology & Hospital',
      name_bn: 'জাতীয় চক্ষু বিজ্ঞান ইনস্টিটিউট ও হাসপাতাল',
      qualification: 'Government Specialized Eye Hospital',
      specialty: 'Ophthalmology',
      hospital_name: 'Sher-e-Bangla Nagar, Dhaka',
      area: 'Dhaka',
      phone: '+88029118334',
      rating: 4.8,
      experience_years: 25,
      visiting_hours: '8:00 AM - 2:30 PM (Outpatient)',
    },
    {
      id: 'islamia-dhaka',
      name: 'Ispahani Islamia Eye Hospital',
      name_bn: 'ইস্পাহানী ইসলামিয়া চক্ষু হাসপাতাল',
      qualification: 'Specialized Tertiary Eye Care',
      specialty: 'Ophthalmology & Retina',
      hospital_name: 'Farmgate, Dhaka',
      area: 'Dhaka',
      phone: '+8809610998888',
      rating: 4.9,
      experience_years: 60,
      visiting_hours: '8:00 AM - 8:00 PM',
    },
  ]

  const displayList = doctors.length > 0 ? doctors : fallbackCenters

  return (
    <div className={`glass-card rounded-3xl p-5 sm:p-6 space-y-4 transition-all duration-300 ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-gray-100/80 dark:border-gray-800/80">
        <h3 className="flex items-center gap-2 text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">
          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
          <span>
            {lang === 'bn' ? 'প্রস্তাবিত বিশেষজ্ঞ চিকিৎসক ও হাসপাতাল' : 'Recommended Specialists & Eye Centers'}
          </span>
        </h3>
        {doctors.length === 0 && (
          <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 px-2.5 py-0.5 rounded-full border border-sky-200/60 dark:border-sky-800/50">
            {lang === 'bn' ? 'জাতীয় রেফারেল' : 'National Referral'}
          </span>
        )}
      </div>

      <div
        className={
          layout === 'column'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3.5 pt-1'
            : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1'
        }
      >
        {displayList.map((doctor) => (
          <div
            key={doctor.id}
            className="rounded-2xl p-4 bg-white/70 dark:bg-gray-800/50 border border-gray-100/90 dark:border-gray-800/80 shadow-2xs flex flex-col justify-between gap-3 hover:border-sky-300/80 dark:hover:border-sky-700/80 hover:shadow-xs transition-all group"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-500 shadow-2xs text-white font-bold text-xs sm:text-sm">
                <span>{getInitials(doctor.name)}</span>
              </div>

              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-start justify-between gap-1.5">
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                    {lang === 'bn' && doctor.name_bn ? doctor.name_bn : doctor.name}
                  </p>
                  {doctor.rating !== null && (
                    <p className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 shrink-0">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                      {doctor.rating.toFixed(1)}
                    </p>
                  )}
                </div>

                <p className="text-xs font-semibold text-sky-700 dark:text-sky-400 truncate">
                  {doctor.qualification}
                </p>

                {doctor.experience_years !== null && (
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                    {doctor.experience_years} {lang === 'bn' ? 'বছর অভিজ্ঞতা' : 'yrs exp'}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-gray-100/80 dark:border-gray-800/60 text-xs text-gray-700 dark:text-gray-300 font-medium">
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-sky-500" />
                <span className="truncate">{doctor.hospital_name}</span>
              </div>
              {doctor.visiting_hours && (
                <div className="flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-400 truncate">
                  <Clock className="h-3 w-3 shrink-0 text-emerald-500" />
                  <span className="truncate">{doctor.visiting_hours}</span>
                </div>
              )}
            </div>

            {doctor.phone && (
              <div className="pt-1">
                <a
                  href={`tel:${doctor.phone}`}
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-xs sm:text-sm font-bold text-sky-800 dark:text-sky-200 bg-sky-50/90 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-800/80 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors cursor-pointer shadow-2xs"
                >
                  <Phone className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                  <span>{lang === 'bn' ? `কল করুন (${doctor.phone})` : `Call (${doctor.phone})`}</span>
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-gray-100/80 dark:border-gray-800/80 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 font-medium">
        <p>
          {lang === 'bn'
            ? 'যেকোনো জরুরি স্বাস্থ্য তথ্যে সরকারি স্বাস্থ্য বাতায়ন ১৬২৬৩ নম্বরে কল করতে পারেন।'
            : 'For urgent assistance, dial national health helpline 16263.'}
        </p>
      </div>
    </div>
  )
}
