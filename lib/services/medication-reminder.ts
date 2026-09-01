import type {
  MedicationSchedule,
  MedicationScheduleItem,
  UserReminderSettings,
  MealTimingType,
  SlotType,
} from '@/types'

// ── 1. Default Times & Meal Offsets ──────────────────────────

export function resolveSlotTimes(settings: UserReminderSettings) {
  return {
    morning: settings.breakfast_time || '08:00',
    afternoon: settings.lunch_time || '13:30',
    evening: '18:30',
    night: settings.dinner_time || '21:30',
  }
}

/**
 * Format 24-hour time "08:00" to 12-hour display "08:00 AM" / "০৮:০০ AM"
 */
export function formatTimeDisplay(timeStr: string, lang: 'en' | 'bn' = 'en'): string {
  if (!timeStr) return ''
  const [hStr, mStr] = timeStr.split(':')
  const h = parseInt(hStr, 10)
  const m = parseInt(mStr || '0', 10)
  if (isNaN(h)) return timeStr

  const period = h >= 12 ? 'PM' : 'AM'
  const periodBn = h >= 12 ? 'পিএম' : 'এএম'
  const displayH = h % 12 === 0 ? 12 : h % 12
  const formattedH = displayH.toString().padStart(2, '0')
  const formattedM = m.toString().padStart(2, '0')

  if (lang === 'bn') {
    const toBn = (str: string) =>
      str.replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[parseInt(d, 10)])
    return `${toBn(formattedH)}:${toBn(formattedM)} ${periodBn}`
  }
  return `${formattedH}:${formattedM} ${period}`
}

/**
 * Compute meal timing offset: e.g. "before_meal" subtracts 30 mins from meal time.
 */
export function applyMealOffset(timeStr: string, mealTiming: MealTimingType): string {
  if (!timeStr) return '08:00'
  const [hStr, mStr] = timeStr.split(':')
  let totalMinutes = parseInt(hStr, 10) * 60 + parseInt(mStr || '0', 10)

  if (mealTiming === 'before_meal' || mealTiming === 'empty_stomach') {
    totalMinutes = Math.max(0, totalMinutes - 30)
  }

  const newH = Math.floor(totalMinutes / 60) % 24
  const newM = totalMinutes % 60
  return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`
}

// ── 2. Convert ScriptGuard Schedule into MedicationScheduleItems ─

export function convertScriptGuardToScheduleItems(
  schedule: MedicationSchedule,
  userId: string,
  settings: UserReminderSettings,
  prescriptionId?: string
): MedicationScheduleItem[] {
  const slotTimes = resolveSlotTimes(settings)
  const items: MedicationScheduleItem[] = []
  const today = new Date().toISOString().split('T')[0]

  const slots: Array<{ key: SlotType; list: typeof schedule.morning }> = [
    { key: 'morning', list: schedule.morning || [] },
    { key: 'afternoon', list: schedule.afternoon || [] },
    { key: 'evening', list: schedule.evening || [] },
    { key: 'night', list: schedule.night || [] },
  ]

  for (const slot of slots) {
    for (const drug of slot.list) {
      // Determine meal timing from instructions
      const instLower = (drug.instructions_en || '').toLowerCase()
      const instBn = drug.instructions_bn || ''
      let mealTiming: MealTimingType = 'after_meal'

      if (
        instLower.includes('before') ||
        instBn.includes('আগে') ||
        instLower.includes('empty stomach') ||
        instBn.includes('খালি পেটে')
      ) {
        mealTiming = 'before_meal'
      } else if (instLower.includes('with food') || instBn.includes('সাথে')) {
        mealTiming = 'with_meal'
      }

      const baseTime = slotTimes[slot.key as keyof typeof slotTimes] || '08:00'
      const finalTime = applyMealOffset(baseTime, mealTiming)

      const id = `med-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

      items.push({
        id,
        user_id: userId,
        prescription_id: prescriptionId || null,
        drug_name_en: drug.drug_en,
        drug_name_bn: drug.drug_bn,
        dosage: drug.dosage || '1 unit',
        meal_timing: mealTiming,
        scheduled_time: finalTime,
        slot_type: slot.key,
        instructions_en: drug.instructions_en,
        instructions_bn: drug.instructions_bn,
        start_date: today,
        duration_days: schedule.duration_days || 7,
        is_active: true,
        created_at: new Date().toISOString(),
      })
    }
  }

  return items
}

// ── 3. Interval Gap Spacing Generator ─────────────────────────

export function calculateEqualIntervalTimes(
  dosesPerDay: number,
  firstDoseTime: string = '08:00'
): string[] {
  const [hStr, mStr] = firstDoseTime.split(':')
  const startMinutes = parseInt(hStr, 10) * 60 + parseInt(mStr || '0', 10)
  const intervalMinutes = Math.floor((24 * 60) / Math.max(1, dosesPerDay))

  const times: string[] = []
  for (let i = 0; i < dosesPerDay; i++) {
    const currentMins = (startMinutes + i * intervalMinutes) % (24 * 60)
    const h = Math.floor(currentMins / 60)
    const m = currentMins % 60
    times.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)
  }
  return times
}

// ── 4. Clinical Missed-Dose Advice Engine ─────────────────────

/**
 * 50% Dosing Interval Decision Algorithm + Pharmacological Category Guidance.
 */
export function generateMissedDoseAdvice(
  drugNameEn: string,
  scheduledTime: string,
  intervalHours: number = 8,
  elapsedMinutes: number
): {
  action: 'take_now' | 'skip' | 'consult'
  advice_en: string
  advice_bn: string
  reason_en: string
  reason_bn: string
} {
  const nameLower = drugNameEn.toLowerCase()
  const intervalMinutes = intervalHours * 60
  const halfInterval = intervalMinutes / 2
  const isPastHalfway = elapsedMinutes >= halfInterval

  // 1. Proton Pump Inhibitors (Omeprazole, Esomeprazole, Pantoprazole, Rabeprazole, Seclo, Sergel)
  if (
    nameLower.includes('prazole') ||
    nameLower.includes('seclo') ||
    nameLower.includes('sergel') ||
    nameLower.includes('pantodac') ||
    nameLower.includes('nexum')
  ) {
    return {
      action: 'take_now',
      advice_en:
        'Take it 30 minutes before your next upcoming meal on an empty stomach. Never double the dose.',
      advice_bn:
        'পরবর্তী খাবারের ৩০ মিনিট আগে খালি পেটে খেয়ে নিন। কখনোই একসাথে দুটি ক্যাপসুল খাবেন না।',
      reason_en:
        'Gastric acid inhibitors work best before meals to prevent reflux. Do not take after heavy meals.',
      reason_bn:
        'গ্যাস্ট্রিকের ওষুধ খাবারের আগে সবচেয়ে কার্যকর। ভারী খাবারের পর খেলে কার্যকারিতা কমে যায়।',
    }
  }

  // 2. Antidiabetics / Insulin (Metformin, Glimepiride, Gliclazide, Linagliptin)
  if (
    nameLower.includes('metformin') ||
    nameLower.includes('glim') ||
    nameLower.includes('gliclazide') ||
    nameLower.includes('gliptin') ||
    nameLower.includes('comprid') ||
    nameLower.includes('dianil')
  ) {
    if (isPastHalfway) {
      return {
        action: 'skip',
        advice_en:
          'Skip this missed dose and take your next dose with your regular meal. Do NOT take on an empty stomach.',
        advice_bn:
          'মিস হওয়া ডোজটি বাদ দিন এবং পরবর্তী খাবারের সাথে নিয়মিত ডোজ নিন। খালি পেটে কখনোই ডায়াবেটিসের ওষুধ খাবেন না।',
        reason_en:
          'Taking a delayed diabetes medication without adequate food can trigger acute hypoglycemia (low blood sugar).',
        reason_bn:
          'খাবার ছাড়া দেরিতে ডায়াবেটিসের ওষুধ খেলে রক্তে শর্করার মাত্রা বিপজ্জনকভাবে কমে যেতে পারে (হাইপোগ্লাইসেমিয়া)।',
      }
    }
    return {
      action: 'take_now',
      advice_en:
        'Take with a snack or small meal right now. Keep your next scheduled dose on time.',
      advice_bn:
        'এখনই হালকা কিছু খাবারের সাথে ওষুধটি খেয়ে নিন। পরবর্তী ডোজটি নির্ধারিত সময়েই খাবেন।',
      reason_en: 'Safe to take with food within the first half of the dosing interval.',
      reason_bn: 'ডোজের নির্ধারিত ব্যবধানের অর্ধেকের কম সময় অতিবাহিত হলে খাবারের সাথে খাওয়া নিরাপদ।',
    }
  }

  // 3. Antihypertensives / Blood Pressure (Amlodipine, Losartan, Bisoprolol, Telmisartan, Olmesartan)
  if (
    nameLower.includes('dipine') ||
    nameLower.includes('sartan') ||
    nameLower.includes('lol') ||
    nameLower.includes('camlos') ||
    nameLower.includes('angilock') ||
    nameLower.includes('cardibis')
  ) {
    if (isPastHalfway) {
      return {
        action: 'skip',
        advice_en:
          'Skip the missed dose and resume your regular schedule. NEVER take a double dose to make up for it.',
        advice_bn:
          'মিস হওয়া ডোজটি ছেড়ে দিন এবং পরবর্তী সময়ে নিয়মিত একটি ডোজ নিন। কখনোই দুটি বড়ি একসাথে খাবেন না।',
        reason_en:
          'Taking two doses close together can cause sudden low blood pressure, severe dizziness, or fainting.',
        reason_bn:
          'একসাথে দুটি প্রেসারের বড়ি খেলে হঠাৎ রক্তচাপ অস্বাভাবিক কমে মাথা ঘোরা বা অজ্ঞান হওয়ার ঝুঁকি থাকে।',
      }
    }
    return {
      action: 'take_now',
      advice_en:
        'Take the missed dose now. Continue with your regular next dose as scheduled.',
      advice_bn:
        'এখনই একটি বড়ি খেয়ে নিন। পরবর্তী ডোজটি স্বাভাবিক নিয়মে চালিয়ে যান।',
      reason_en: 'Maintains steady blood pressure within safe therapeutic concentrations.',
      reason_bn: 'রক্তচাপ নিয়ন্ত্রণে রাখতে সময়মতো ওষুধের মাত্রা বজায় রাখা প্রয়োজন।',
    }
  }

  // 4. Antibiotics (Azithromycin, Cefixime, Amoxicillin, Ciprofloxacin)
  if (
    nameLower.includes('mycin') ||
    nameLower.includes('cillin') ||
    nameLower.includes('cef') ||
    nameLower.includes('flox') ||
    nameLower.includes('zimax') ||
    nameLower.includes('ceftron')
  ) {
    return {
      action: isPastHalfway ? 'skip' : 'take_now',
      advice_en: isPastHalfway
        ? 'Skip the missed dose and take the next dose at normal time. Finish the complete course.'
        : 'Take immediately with water. Ensure at least a 4-hour gap before your next dose.',
      advice_bn: isPastHalfway
        ? 'মিস হওয়া ডোজটি বাদ দিয়ে পরবর্তী নির্ধারিত সময়ে ডোজ নিন। পুরো অ্যান্টিবায়োটিক কোর্সটি সম্পন্ন করুন।'
        : 'এখনই পর্যাপ্ত পানি দিয়ে খেয়ে নিন। পরবর্তী ডোজের মাঝে অন্তত ৪ ঘণ্টার ব্যবধান রাখুন।',
      reason_en:
        'Antibiotic resistance can develop if doses are skipped frequently, but doubling up causes gastrointestinal distress.',
      reason_bn:
        'অ্যান্টিবায়োটিক অনিয়মিত খেলে কার্যকারিতা নষ্ট হতে পারে, তবে একসাথে দুটি খেলে পেটের তীব্র সমস্যা হতে পারে।',
    }
  }

  // 5. General Medications (Analgesics, Antihistamines, Vitamins)
  if (isPastHalfway) {
    return {
      action: 'skip',
      advice_en:
        'It is close to your next dose. Skip the missed dose and resume your standard routine.',
      advice_bn:
        'পরবর্তী ডোজের সময় কাছাকাছি চলে এসেছে। মিস হওয়া ডোজটি ছেড়ে দিন এবং নিয়মিত রুটিন বজায় রাখুন।',
      reason_en:
        'Clinical 50% interval rule: prevents peak plasma concentration toxicity.',
      reason_bn:
        'ক্লিনিক্যাল ৫০% নিয়ম: অতিরিক্ত ওষুধ জমার ঝুঁকি এড়াতে পরবর্তী ডোজ পর্যন্ত অপেক্ষা করুন।',
    }
  }

  return {
    action: 'take_now',
    advice_en:
      'Take the medication as soon as you remember. Continue with your normal schedule.',
    advice_bn:
      'মনে পড়ার সাথে সাথেই ওষুধটি খেয়ে নিন। পরবর্তী সময়সূচি স্বাভাবিক রাখুন।',
    reason_en: 'Within safe therapeutic window.',
    reason_bn: 'নিরাপদ চিকিৎসা সময়ের মধ্যে রয়েছে।',
  }
}
