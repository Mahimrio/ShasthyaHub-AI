'use client'

import { Clock, MapPin, Phone, Star } from 'lucide-react'
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
      <div className="glass-card rounded-3xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
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
    <div className="glass-card rounded-3xl p-6 space-y-4 transition-all duration-300">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100/80 dark:border-gray-800/80">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
          <span>
            {lang === 'bn' ? 'প্রস্তাবিত বিশেষজ্ঞ চিকিৎসক ও হাসপাতাল' : 'Recommended Specialists & Eye Centers'}
          </span>
        </h3>
        {doctors.length === 0 && (
          <span className="text-[11px] font-medium text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 px-2.5 py-0.5 rounded-full border border-sky-200/60 dark:border-sky-800/50">
            {lang === 'bn' ? 'জাতীয় রেফারেল' : 'National Referral'}
          </span>
        )}
      </div>

      <div className="divide-y divide-gray-100/80 dark:divide-gray-800/80">
        {displayList.map((doctor) => (
          <div key={doctor.id} className="flex items-start gap-4 py-4 first:pt-1 last:pb-1">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-500 shadow-sm text-white font-bold text-sm">
              <span>{getInitials(doctor.name)}</span>
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {lang === 'bn' && doctor.name_bn ? doctor.name_bn : doctor.name}
                  </p>
                  {doctor.name_bn && lang !== 'bn' && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {doctor.name_bn}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  {doctor.rating !== null && (
                    <p className="flex items-center justify-end gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                      {doctor.rating.toFixed(1)}
                    </p>
                  )}
                  {doctor.experience_years !== null && (
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">
                      {doctor.experience_years} {lang === 'bn' ? 'বছর অভিজ্ঞতা' : 'yrs exp'}
                    </p>
                  )}
                </div>
              </div>

              <p className="text-xs font-normal text-sky-600 dark:text-sky-400">
                {doctor.qualification}
              </p>

              <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-sky-500" />
                <span className="truncate">{doctor.hospital_name}</span>
              </div>

              {doctor.visiting_hours && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  <span>{doctor.visiting_hours}</span>
                </div>
              )}

              {doctor.phone && (
                <div className="pt-1">
                  <a
                    href={`tel:${doctor.phone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 border border-sky-200/60 dark:border-sky-800/60 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors cursor-pointer"
                  >
                    <Phone className="h-3 w-3" />
                    <span>{lang === 'bn' ? `কল করুন (${doctor.phone})` : `Call (${doctor.phone})`}</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-gray-100/80 dark:border-gray-800/80 flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500">
        <p>
          {lang === 'bn'
            ? 'যেকোনো জরুরি স্বাস্থ্য তথ্যে সরকারি স্বাস্থ্য বাতায়ন ১৬২৬৩ নম্বরে কল করতে পারেন।'
            : 'For urgent assistance, dial national health helpline 16263.'}
        </p>
      </div>
    </div>
  )
}
