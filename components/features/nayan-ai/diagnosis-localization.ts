/**
 * Localization dictionary and helper functions for Nayan AI diagnostic results.
 * Maps English clinical terms produced by the AI models into fluent, natural Bengali.
 */

interface DiagnosisTranslation {
  bn: string
  medicalTerm: string
}

const DIAGNOSIS_MAP: Array<{ pattern: RegExp; translation: DiagnosisTranslation }> = [
  {
    pattern: /pinguecula.*episcleritis|episcleritis.*pinguecula/i,
    translation: {
      bn: 'পিংগুয়েকুলা বা চোখের মৃদু প্রদাহ',
      medicalTerm: 'Pinguecula / Episcleritis',
    },
  },
  {
    pattern: /pinguecula/i,
    translation: {
      bn: 'পিংগুয়েকুলা (চোখের সাদা অংশে হালকা পিণ্ড)',
      medicalTerm: 'Pinguecula',
    },
  },
  {
    pattern: /pterygium/i,
    translation: {
      bn: 'টেরিজিয়াম (চোখে মাংস বৃদ্ধি)',
      medicalTerm: 'Pterygium',
    },
  },
  {
    pattern: /proliferative diabetic retinopathy|pdr/i,
    translation: {
      bn: 'প্রলিফারেটিভ ডায়াবেটিক রেটিনোপ্যাথি (উন্নত পর্যায়)',
      medicalTerm: 'Proliferative Diabetic Retinopathy',
    },
  },
  {
    pattern: /non-proliferative diabetic retinopathy|npdr/i,
    translation: {
      bn: 'নন-প্রলিফারেটিভ ডায়াবেটিক রেটিনোপ্যাথি',
      medicalTerm: 'Non-Proliferative Diabetic Retinopathy',
    },
  },
  {
    pattern: /diabetic retinopathy/i,
    translation: {
      bn: 'ডায়াবেটিক রেটিনোপ্যাথি (চোখের রেটিনার ক্ষতি)',
      medicalTerm: 'Diabetic Retinopathy',
    },
  },
  {
    pattern: /cataract/i,
    translation: {
      bn: 'চোখের ছানি (ক্যাটারাক্ট)',
      medicalTerm: 'Cataract',
    },
  },
  {
    pattern: /glaucoma/i,
    translation: {
      bn: 'গ্লুকোমা (অক্ষিচাপজনিত চোখের ক্ষতি)',
      medicalTerm: 'Glaucoma',
    },
  },
  {
    pattern: /conjunctivitis|pink eye/i,
    translation: {
      bn: 'কনজাঙ্কটিভাইটিস (চোখ ওঠা বা লাল হওয়া)',
      medicalTerm: 'Conjunctivitis',
    },
  },
  {
    pattern: /corneal ulcer/i,
    translation: {
      bn: 'কর্নিয়াল আলসার (চোখের মণিতে ক্ষত)',
      medicalTerm: 'Corneal Ulcer',
    },
  },
  {
    pattern: /dry eye/i,
    translation: {
      bn: 'ড্রাই আই সিন্ড্রোম (চোখের শুষ্কতা)',
      medicalTerm: 'Dry Eye Syndrome',
    },
  },
  {
    pattern: /subconjunctival h[ae]morrhage/i,
    translation: {
      bn: 'সাবকনজাঙ্কটিভাল রক্তক্ষরণ (চোখে রক্তজমা)',
      medicalTerm: 'Subconjunctival Hemorrhage',
    },
  },
  {
    pattern: /blepharitis/i,
    translation: {
      bn: 'ব্লেফারাইটিস (চোখের পাতার প্রদাহ)',
      medicalTerm: 'Blepharitis',
    },
  },
  {
    pattern: /normal|healthy|no apparent/i,
    translation: {
      bn: 'সুস্থ ও স্বাভাবিক চোখ',
      medicalTerm: 'Normal / Healthy Eye',
    },
  },
]

export function localizeDiagnosis(
  diagnosis: string,
  lang: 'en' | 'bn'
): { title: string; medicalBadge?: string } {
  if (!diagnosis) {
    return { title: lang === 'bn' ? 'অজ্ঞাত ফলাফল' : 'Unknown' }
  }

  for (const item of DIAGNOSIS_MAP) {
    if (item.pattern.test(diagnosis)) {
      if (lang === 'bn') {
        return {
          title: item.translation.bn,
          medicalBadge: item.translation.medicalTerm,
        }
      }
      return {
        title: diagnosis,
        medicalBadge: item.translation.medicalTerm,
      }
    }
  }

  // Fallback: If no regex matches
  return {
    title: diagnosis,
    medicalBadge: diagnosis.length > 25 ? 'Ocular Finding' : diagnosis,
  }
}

const STEP_TRANSLATIONS: Array<{ pattern: RegExp; bn: string }> = [
  {
    pattern: /schedule.*(ophthalmolog|appointment|check-?up|eye doctor|doctor)|consult.*(ophthalmolog|doctor|specialist)|see.*(ophthalmolog|doctor|specialist)|visit.*eye/i,
    bn: 'দ্রুত একজন নিবন্ধিত চক্ষু বিশেষজ্ঞের কাছে চোখ বিশদ পরীক্ষা করান',
  },
  {
    pattern: /lubricating.*(drop|tear)|artificial tear|dry.*drop|eye drop/i,
    bn: 'চোখ শুষ্ক বা খসখসে লাগলে চিকিৎসকের পরামর্শে লুব্রিকেটিং ড্রপ ব্যবহার করুন',
  },
  {
    pattern: /avoid.*rubbing|do not rub|rub.*eye|stop rubbing/i,
    bn: 'হাত দিয়ে চোখ ঘষাঘষি করা বা চাপ দেওয়া থেকে সম্পূর্ণ বিরত থাকুন',
  },
  {
    pattern: /protect.*(wind|dust|sun|light|uv)|wear.*sunglass/i,
    bn: 'ধুলোবালি, কড়া রোদ ও বাতাস থেকে চোখ রক্ষা করতে সানগ্লাস ব্যবহার করুন',
  },
  {
    pattern: /blood sugar|diabetes|glucose/i,
    bn: 'ডায়াবেটিস ও রক্তের শর্করা কঠোর নিয়ন্ত্রণে রাখুন এবং নিয়মিত মাপুন',
  },
  {
    pattern: /clean water|wash.*eye|flush.*eye/i,
    bn: 'চোখ পরিষ্কার ও ঠান্ডা পানি দিয়ে দিনে কয়েকবার আলতো করে ধুয়ে নিন',
  },
  {
    pattern: /monitor.*vision|vision.*change|blur|worsen/i,
    bn: 'দৃষ্টিশক্তি ঝাপসা হওয়া বা কোনো তীব্র ব্যথা লক্ষ্য করলে তাৎক্ষণিক হাসপাতালে যান',
  },
  {
    pattern: /rest.*eye|screen time|strain/i,
    bn: 'টানা মোবাইল বা কম্পিউটার স্ক্রিনের দিকে তাকিয়ে না থেকে চোখকে পর্যাপ্ত বিশ্রাম দিন',
  },
  {
    pattern: /contact lens|wear lens/i,
    bn: 'চোখের অস্বস্তি বা সংক্রমণ সেরে না ওঠা পর্যন্ত কন্টাক্ট লেন্স পরা থেকে বিরত থাকুন',
  },
]

export function localizeNextStep(step: string, lang: 'en' | 'bn'): string {
  if (lang === 'en') return step

  for (const item of STEP_TRANSLATIONS) {
    if (item.pattern.test(step)) {
      return item.bn
    }
  }

  return step
}

export function localizeSpecialist(specialist: string, lang: 'en' | 'bn'): string {
  if (lang === 'en') return specialist

  const lower = specialist.toLowerCase()
  if (lower.includes('ophthalmologist')) return 'চক্ষু বিশেষজ্ঞ (Ophthalmologist)'
  if (lower.includes('retina')) return 'রেটিনা বিশেষজ্ঞ (Retina Specialist)'
  if (lower.includes('cornea')) return 'কর্নিয়া বিশেষজ্ঞ (Cornea Specialist)'
  if (lower.includes('glaucoma')) return 'গ্লুকোমা বিশেষজ্ঞ (Glaucoma Specialist)'
  if (lower.includes('pediatric')) return 'শিশু চক্ষু বিশেষজ্ঞ (Pediatric Ophthalmologist)'
  if (lower.includes('doctor') || lower.includes('physician')) return 'সাধারণ চিকিৎসক (General Physician)'

  return specialist
}
