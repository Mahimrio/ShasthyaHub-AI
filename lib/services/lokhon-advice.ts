import { callGroq } from '@/lib/ai/groq'
import type { RiskBand, LokhonAdvice } from '@/types'

const ADVICE_CACHE = new Map<string, LokhonAdvice>()

function cacheKey(diseaseSlug: string, riskBand: RiskBand, topSymptoms: string): string {
  return `${diseaseSlug}:${riskBand}:${topSymptoms.slice(0, 80)}`
}

const SYSTEM_PROMPT = `You are a cautious health assistant for rural Bangladeshi users. Given a disease name, a risk band (Low/Moderate/High/Urgent), and top flagged symptoms, respond in BOTH Bengali and English with:
1. One sentence of general self-care advice (non-prescriptive, no medication names/doses).
2. One sentence naming the type of doctor to see and urgency.
Never state a diagnosis. Never suggest specific drug names or dosages. Keep total output under 60 words per language. Return JSON only: { "advice_en": "", "advice_bn": "", "doctor_type_en": "", "doctor_type_bn": "", "urgency": "" }`

interface HardcodedAdviceEntry {
  advice_en: string
  advice_bn: string
  doctor_type_en: string
  doctor_type_bn: string
  urgency: string
}

const HARDCODED_ADVICE: Record<string, Record<string, HardcodedAdviceEntry>> = {
  heart: {
    Low: {
      advice_en: 'Maintain a heart-healthy diet with less salt and oil. Walk for 30 minutes daily.',
      advice_bn: 'লবণ ও তেল কমিয়ে হৃদ-স্বাস্থ্যকর খাদ্যাভ্যাস বজায় রাখুন। প্রতিদিন ৩০ মিনিট হাঁটুন।',
      doctor_type_en: 'General Physician for a routine checkup',
      doctor_type_bn: 'সাধারণ চিকিৎসক — রুটিন চেকআপের জন্য',
      urgency: 'Routine',
    },
    Moderate: {
      advice_en: 'Monitor your blood pressure and reduce physical strain. Avoid heavy meals at night.',
      advice_bn: 'রক্তচাপ মনিটর করুন এবং শারীরিক পরিশ্রম কমান। রাতে ভারী খাবার এড়িয়ে চলুন।',
      doctor_type_en: 'Cardiologist — schedule an appointment within 2 weeks',
      doctor_type_bn: 'হৃদরোগ বিশেষজ্ঞ — ২ সপ্তাহের মধ্যে অ্যাপয়েন্টমেন্ট নিন',
      urgency: 'Soon',
    },
    High: {
      advice_en: 'Avoid strenuous activity immediately. Rest and monitor your symptoms closely.',
      advice_bn: 'অবিলম্বে কঠোর কার্যকলাপ বন্ধ করুন। বিশ্রাম নিন এবং লক্ষণগুলি নিবিড়ভাবে পর্যবেক্ষণ করুন।',
      doctor_type_en: 'Cardiologist — seek medical attention within a few days',
      doctor_type_bn: 'হৃদরোগ বিশেষজ্ঞ — কয়েক দিনের মধ্যে চিকিৎসা নিন',
      urgency: 'Urgent',
    },
    Urgent: {
      advice_en: 'Do not wait. Chest pain with breathlessness is a medical emergency. Go to the nearest hospital now.',
      advice_bn: 'অপেক্ষা করবেন না। বুকে ব্যথা ও শ্বাসকষ্ট জরুরি অবস্থা। এখনই নিকটস্থ হাসপাতালে যান।',
      doctor_type_en: 'Emergency Room immediately',
      doctor_type_bn: 'জরুরি বিভাগ — এখনই',
      urgency: 'Emergency',
    },
  },
  diabetes: {
    Low: {
      advice_en: 'Limit sugar and sweet foods. Stay physically active and maintain a healthy weight.',
      advice_bn: 'চিনি ও মিষ্টি খাবার সীমিত করুন। শারীরিকভাবে সক্রিয় থাকুন এবং স্বাস্থ্যকর ওজন বজায় রাখুন।',
      doctor_type_en: 'General Physician for a routine blood sugar check',
      doctor_type_bn: 'সাধারণ চিকিৎসক — রুটিন ব্লাড সুগার পরীক্ষার জন্য',
      urgency: 'Routine',
    },
    Moderate: {
      advice_en: 'Reduce white rice and sugary drinks. Walk after meals to help control blood sugar.',
      advice_bn: 'সাদা ভাত ও চিনিযুক্ত পানীয় কমান। খাবারের পর হাঁটুন — রক্তে শর্করা নিয়ন্ত্রণে সাহায্য করে।',
      doctor_type_en: 'General Physician — get your fasting blood sugar tested within 2 weeks',
      doctor_type_bn: 'সাধারণ চিকিৎসক — ২ সপ্তাহের মধ্যে উপবাসের রক্তে শর্করা পরীক্ষা করান',
      urgency: 'Soon',
    },
    High: {
      advice_en: 'Check your blood sugar if you have a monitor. Drink water and avoid all sugary foods.',
      advice_bn: 'যদি মনিটর থাকে তবে রক্তে শর্করা পরীক্ষা করুন। পানি পান করুন এবং সব চিনিযুক্ত খাবার এড়িয়ে চলুন।',
      doctor_type_en: 'Endocrinologist or Diabetes specialist — consult within a week',
      doctor_type_bn: 'এন্ডোক্রিনোলজিস্ট বা ডায়াবেটিস বিশেষজ্ঞ — এক সপ্তাহের মধ্যে পরামর্শ নিন',
      urgency: 'Urgent',
    },
    Urgent: {
      advice_en: 'Unexplained weight loss with extreme thirst needs immediate medical evaluation.',
      advice_bn: 'অস্বাভাবিক ওজন হ্রাস ও অতিরিক্ত তৃষ্ণা — জরুরি চিকিৎসা মূল্যায়ন প্রয়োজন।',
      doctor_type_en: 'Emergency Room or physician — go today',
      doctor_type_bn: 'জরুরি বিভাগ বা চিকিৎসক — আজই যান',
      urgency: 'Emergency',
    },
  },
  kidney: {
    Low: {
      advice_en: 'Drink adequate water (6-8 glasses daily) and avoid excessive salt and painkillers.',
      advice_bn: 'পর্যাপ্ত পানি পান করুন (দৈনিক ৬-৮ গ্লাস) এবং অতিরিক্ত লবণ ও ব্যথানাশক এড়িয়ে চলুন।',
      doctor_type_en: 'General Physician for routine kidney function check',
      doctor_type_bn: 'সাধারণ চিকিৎসক — রুটিন কিডনি ফাংশন পরীক্ষার জন্য',
      urgency: 'Routine',
    },
    Moderate: {
      advice_en: 'Reduce salt intake and avoid packaged/processed foods. Monitor your urine output.',
      advice_bn: 'লবণ কমান ও প্রক্রিয়াজাত খাবার এড়িয়ে চলুন। আপনার প্রস্রাবের পরিমাণ পর্যবেক্ষণ করুন।',
      doctor_type_en: 'Nephrologist — book an appointment within 2 weeks',
      doctor_type_bn: 'কিডনি বিশেষজ্ঞ — ২ সপ্তাহের মধ্যে অ্যাপয়েন্টমেন্ট নিন',
      urgency: 'Soon',
    },
    High: {
      advice_en: 'Rest and avoid dehydration. Track your urine output and any swelling changes.',
      advice_bn: 'বিশ্রাম নিন এবং পানিশূন্যতা এড়িয়ে চলুন। প্রস্রাব ও ফোলা পরিবর্তন পর্যবেক্ষণ করুন।',
      doctor_type_en: 'Nephrologist — seek medical attention within a week',
      doctor_type_bn: 'কিডনি বিশেষজ্ঞ — এক সপ্তাহের মধ্যে চিকিৎসা নিন',
      urgency: 'Urgent',
    },
    Urgent: {
      advice_en: 'Swelling with reduced urination is a serious sign. Go to the nearest hospital immediately.',
      advice_bn: 'ফোলা ও প্রস্রাব কমে যাওয়া গুরুতর লক্ষণ। এখনই নিকটস্থ হাসপাতালে যান।',
      doctor_type_en: 'Emergency Room — go immediately',
      doctor_type_bn: 'জরুরি বিভাগ — এখনই যান',
      urgency: 'Emergency',
    },
  },
  hypertension: {
    Low: {
      advice_en: 'Reduce salt intake and exercise 30 minutes daily. Avoid stress and get adequate sleep.',
      advice_bn: 'লবণ কমান ও প্রতিদিন ৩০ মিনিট ব্যায়াম করুন। মানসিক চাপ এড়িয়ে পর্যাপ্ত ঘুমান।',
      doctor_type_en: 'General Physician for a routine blood pressure check',
      doctor_type_bn: 'সাধারণ চিকিৎসক — রুটিন রক্তচাপ পরীক্ষার জন্য',
      urgency: 'Routine',
    },
    Moderate: {
      advice_en: 'Monitor your blood pressure at home if possible. Cut back on salty and fried foods.',
      advice_bn: 'সম্ভব হলে বাড়িতে রক্তচাপ মনিটর করুন। নোনতা ও ভাজাপোড়া খাবার কমিয়ে দিন।',
      doctor_type_en: 'General Physician or Cardiologist — consult within 2 weeks',
      doctor_type_bn: 'সাধারণ চিকিৎসক বা হৃদরোগ বিশেষজ্ঞ — ২ সপ্তাহের মধ্যে পরামর্শ নিন',
      urgency: 'Soon',
    },
    High: {
      advice_en: 'Rest and avoid sudden movements. Measure your blood pressure and keep a record.',
      advice_bn: 'বিশ্রাম নিন এবং হঠাৎ নড়াচড়া এড়িয়ে চলুন। রক্তচাপ মাপুন এবং রেকর্ড রাখুন।',
      doctor_type_en: 'Cardiologist — seek treatment within a week',
      doctor_type_bn: 'হৃদরোগ বিশেষজ্ঞ — এক সপ্তাহের মধ্যে চিকিৎসা নিন',
      urgency: 'Urgent',
    },
    Urgent: {
      advice_en: 'Blurred vision or chest discomfort with high BP requires emergency care. Go to hospital now.',
      advice_bn: 'উচ্চ রক্তচাপের সাথে ঝাপসা দৃষ্টি বা বুকে অস্বস্তি জরুরি যত্ন প্রয়োজন। এখনই হাসপাতালে যান।',
      doctor_type_en: 'Emergency Room — go immediately',
      doctor_type_bn: 'জরুরি বিভাগ — এখনই যান',
      urgency: 'Emergency',
    },
  },
  asthma: {
    Low: {
      advice_en: 'Avoid smoking and dusty environments. Keep your living area clean and well-ventilated.',
      advice_bn: 'ধূমপান ও ধুলাবালি এড়িয়ে চলুন। থাকার জায়গা পরিষ্কার ও বাতাস চলাচল করে এমন রাখুন।',
      doctor_type_en: 'General Physician for a routine respiratory checkup',
      doctor_type_bn: 'সাধারণ চিকিৎসক — রুটিন শ্বাসযন্ত্র পরীক্ষার জন্য',
      urgency: 'Routine',
    },
    Moderate: {
      advice_en: 'Use a face mask in dusty or cold weather. Avoid triggers like smoke and strong smells.',
      advice_bn: 'ধুলাবালি বা ঠান্ডা আবহাওয়ায় মুখোশ ব্যবহার করুন। ধোঁয়া ও তীব্র গন্ধের মতো ট্রিগার এড়িয়ে চলুন।',
      doctor_type_en: 'Pulmonologist or General Physician — consult within 2 weeks',
      doctor_type_bn: 'শ্বাসযন্ত্র বিশেষজ্ঞ বা সাধারণ চিকিৎসক — ২ সপ্তাহের মধ্যে পরামর্শ নিন',
      urgency: 'Soon',
    },
    High: {
      advice_en: 'Sit upright and try slow breathing. Keep emergency inhaler if prescribed.',
      advice_bn: 'সোজা হয়ে বসুন ও ধীরে শ্বাস নেওয়ার চেষ্টা করুন। প্রেসক্রাইব করা থাকলে জরুরি ইনহেলার রাখুন।',
      doctor_type_en: 'Pulmonologist — seek treatment within a few days',
      doctor_type_bn: 'শ্বাসযন্ত্র বিশেষজ্ঞ — কয়েক দিনের মধ্যে চিকিৎসা নিন',
      urgency: 'Urgent',
    },
    Urgent: {
      advice_en: 'Severe breathlessness or wheezing is an emergency. Go to the nearest hospital immediately.',
      advice_bn: 'তীব্র শ্বাসকষ্ট বা ঘড়ঘড় শব্দ জরুরি অবস্থা। এখনই নিকটস্থ হাসপাতালে যান।',
      doctor_type_en: 'Emergency Room — go immediately',
      doctor_type_bn: 'জরুরি বিভাগ — এখনই যান',
      urgency: 'Emergency',
    },
  },
  fever: {
    Low: {
      advice_en: 'Rest, drink plenty of fluids (water, ORS, coconut water), and use a damp cloth to reduce temperature.',
      advice_bn: 'বিশ্রাম নিন, প্রচুর তরল পান করুন (পানি, ORS, ডাবের পানি), এবং তাপমাত্রা কমানোর জন্য ভেজা কাপড় ব্যবহার করুন।',
      doctor_type_en: 'General Physician if fever persists beyond 3 days',
      doctor_type_bn: 'সাধারণ চিকিৎসক — যদি জ্বর ৩ দিনের বেশি থাকে',
      urgency: 'Routine',
    },
    Moderate: {
      advice_en: 'Take paracetamol as directed for fever. Monitor temperature every 4-6 hours.',
      advice_bn: 'জ্বরের জন্য নির্দেশমতো প্যারাসিটামল খান। প্রতি ৪-৬ ঘণ্টায় তাপমাত্রা মাপুন।',
      doctor_type_en: 'General Physician — consult within 2 days',
      doctor_type_bn: 'সাধারণ চিকিৎসক — ২ দিনের মধ্যে পরামর্শ নিন',
      urgency: 'Soon',
    },
    High: {
      advice_en: 'Rest in bed and stay hydrated. Look out for any bleeding or severe abdominal pain.',
      advice_bn: 'বিছানায় বিশ্রাম নিন ও হাইড্রেটেড থাকুন। কোনো রক্তপাত বা তীব্র পেটে ব্যথার দিকে লক্ষ্য রাখুন।',
      doctor_type_en: 'General Physician or Medicine specialist — see a doctor today',
      doctor_type_bn: 'সাধারণ চিকিৎসক বা মেডিসিন বিশেষজ্ঞ — আজই ডাক্তার দেখান',
      urgency: 'Urgent',
    },
    Urgent: {
      advice_en: 'High fever with bleeding signs or severe pain is a medical emergency. Go to hospital immediately.',
      advice_bn: 'রক্তপাত বা তীব্র ব্যথা সহ উচ্চ জ্বর জরুরি অবস্থা। এখনই হাসপাতালে যান।',
      doctor_type_en: 'Emergency Room — go immediately',
      doctor_type_bn: 'জরুরি বিভাগ — এখনই যান',
      urgency: 'Emergency',
    },
  },
  depression: {
    Low: {
      advice_en: 'Talk to someone you trust about how you feel. Regular exercise and sleep routine can help.',
      advice_bn: 'আপনার অনুভূতি সম্পর্কে বিশ্বস্ত কারো সাথে কথা বলুন। নিয়মিত ব্যায়াম ও ঘুমের রুটিন সাহায্য করতে পারে।',
      doctor_type_en: 'Counselor or General Physician for a mental health check',
      doctor_type_bn: 'কাউন্সেলর বা সাধারণ চিকিৎসক — মানসিক স্বাস্থ্য পরীক্ষার জন্য',
      urgency: 'Routine',
    },
    Moderate: {
      advice_en: 'Try to maintain a daily routine and reach out to friends or family. Avoid isolating yourself.',
      advice_bn: 'দৈনন্দিন রুটিন বজায় রাখার চেষ্টা করুন এবং বন্ধু বা পরিবারের সাথে যোগাযোগ করুন। নিজেকে বিচ্ছিন্ন করবেন না।',
      doctor_type_en: 'Psychologist or Counselor — schedule a session within 2 weeks',
      doctor_type_bn: 'মনোবিজ্ঞানী বা কাউন্সেলর — ২ সপ্তাহের মধ্যে সেশন নির্ধারণ করুন',
      urgency: 'Soon',
    },
    High: {
      advice_en: 'You deserve support. Please speak with a mental health professional — you do not have to go through this alone.',
      advice_bn: 'আপনার সমর্থন প্রয়োজন। একজন মানসিক স্বাস্থ্য পেশাদারের সাথে কথা বলুন — আপনি একা এই পথ পাড়ি দিতে বাধ্য নন।',
      doctor_type_en: 'Psychiatrist or Psychologist — seek help within a week',
      doctor_type_bn: 'মনোরোগ বিশেষজ্ঞ বা মনোবিজ্ঞানী — এক সপ্তাহের মধ্যে সাহায্য নিন',
      urgency: 'Urgent',
    },
    Urgent: {
      advice_en: 'If you are having thoughts of harming yourself, please call the national helpline (Shuchona Foundation: 16463) or go to the nearest hospital immediately. You are not alone.',
      advice_bn: 'যদি নিজের ক্ষতি করার চিন্তা আসে, অনুগ্রহ করে জাতীয় হেল্পলাইনে (সুচোনা ফাউন্ডেশন: ১৬৪৬৩) কল করুন বা এখনই নিকটস্থ হাসপাতালে যান। আপনি একা নন।',
      doctor_type_en: 'Emergency Room or Crisis Helpline (16463) — immediately',
      doctor_type_bn: 'জরুরি বিভাগ বা ক্রাইসিস হেল্পলাইন (১৬৪৬৩) — এখনই',
      urgency: 'Emergency',
    },
  },
}

function getHardcodedAdvice(diseaseSlug: string, riskBand: RiskBand): LokhonAdvice {
  const diseaseAdvice = HARDCODED_ADVICE[diseaseSlug]
  if (!diseaseAdvice) {
    return {
      advice_en: 'Please consult a doctor for proper evaluation.',
      advice_bn: 'সঠিক মূল্যায়নের জন্য একজন ডাক্তারের পরামর্শ নিন।',
      doctor_type_en: 'General Physician',
      doctor_type_bn: 'সাধারণ চিকিৎসক',
      urgency: 'Routine',
    }
  }
  const advice = diseaseAdvice[riskBand] ?? diseaseAdvice.Low
  return {
    advice_en: advice.advice_en,
    advice_bn: advice.advice_bn,
    doctor_type_en: advice.doctor_type_en,
    doctor_type_bn: advice.doctor_type_bn,
    urgency: advice.urgency,
  }
}

export async function generateAdvice(
  diseaseSlug: string,
  diseaseNameEn: string,
  diseaseNameBn: string,
  riskBand: RiskBand,
  topSymptoms: { text_en: string; text_bn: string; value: number }[]
): Promise<LokhonAdvice> {
  const symptomsKey = topSymptoms.map((s) => s.text_en).join(', ')
  const key = cacheKey(diseaseSlug, riskBand, symptomsKey)

  const cached = ADVICE_CACHE.get(key)
  if (cached) return cached

  if (symptomsKey.length === 0) {
    const fallback = getHardcodedAdvice(diseaseSlug, riskBand)
    ADVICE_CACHE.set(key, fallback)
    return fallback
  }

  try {
    const userContent = JSON.stringify({
      disease_name: diseaseNameEn,
      disease_name_bn: diseaseNameBn,
      risk_band: riskBand,
      top_symptoms: topSymptoms.map((s) => ({ en: s.text_en, bn: s.text_bn })),
    })

    const raw = await callGroq(userContent, SYSTEM_PROMPT)

    const o = (raw ?? {}) as Record<string, unknown>
    const result: LokhonAdvice = {
      advice_en: typeof o.advice_en === 'string' ? o.advice_en : '',
      advice_bn: typeof o.advice_bn === 'string' ? o.advice_bn : '',
      doctor_type_en: typeof o.doctor_type_en === 'string' ? o.doctor_type_en : '',
      doctor_type_bn: typeof o.doctor_type_bn === 'string' ? o.doctor_type_bn : '',
      urgency: typeof o.urgency === 'string' ? o.urgency : 'Routine',
    }

    const hasContent = result.advice_en || result.advice_bn
    if (!hasContent) {
      throw new Error('Groq returned empty advice')
    }

    ADVICE_CACHE.set(key, result)
    return result
  } catch {
    const fallback = getHardcodedAdvice(diseaseSlug, riskBand)
    ADVICE_CACHE.set(key, fallback)
    return fallback
  }
}
