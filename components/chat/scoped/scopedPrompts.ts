import type { ChatAgent } from '@/types'

export type ScopedChatMode = 'idle' | 'result'

interface Prompt {
  en: string
  bn: string
}

const PROMPTS: Record<ChatAgent, Record<ScopedChatMode, Prompt[]>> = {
  nayan: {
    idle: [
      { en: 'Which eye conditions can Nayan AI detect?', bn: 'নয়ন AI কোন কোন চোখের সমস্যা শনাক্ত করতে পারে?' },
      { en: 'How do I take a clear eye photo?', bn: 'চোখের স্পষ্ট ছবি কীভাবে তুলব?' },
      { en: 'Is this a real eye examination?', bn: 'এটা কি আসল চোখের পরীক্ষা?' },
      { en: 'What are early signs of cataract?', bn: 'ছানির প্রাথমিক লক্ষণ কী কী?' },
      { en: 'How does diabetes affect the eyes?', bn: 'ডায়াবেটিস চোখে কীভাবে প্রভাব ফেলে?' },
      { en: 'How often should I get my eyes checked?', bn: 'কত দিন পর পর চোখ পরীক্ষা করানো উচিত?' },
    ],
    result: [
      { en: 'Explain this result in simple words', bn: 'এই ফলাফল সহজ ভাষায় বুঝিয়ে দাও' },
      { en: 'How soon should I see a doctor, and which one?', bn: 'কত তাড়াতাড়ি কোন ডাক্তার দেখাব?' },
      { en: 'What can I do to protect my eyes now?', bn: 'এখন চোখ সুরক্ষায় কী করতে পারি?' },
      { en: 'How sure is this screening?', bn: 'এই পরীক্ষা কতটা নিশ্চিত?' },
      { en: 'What will the eye specialist likely do?', bn: 'চক্ষু বিশেষজ্ঞ সম্ভবত কী করবেন?' },
      { en: 'Should my family members get checked too?', bn: 'আমার পরিবারের সদস্যদেরও পরীক্ষা করানো উচিত?' },
    ],
  },
  scriptguard: {
    idle: [
      { en: 'What does ScriptGuard check for?', bn: 'স্ক্রিপ্টগার্ড কী কী পরীক্ষা করে?' },
      { en: 'How do I photograph a prescription clearly?', bn: 'প্রেসক্রিপশনের স্পষ্ট ছবি কীভাবে তুলব?' },
      { en: 'What is a drug interaction?', bn: 'ওষুধের পারস্পরিক প্রতিক্রিয়া কী?' },
      { en: "What do '1+0+1' and 'after meal' mean?", bn: "'১+০+১' আর 'খাবারের পরে' মানে কী?" },
      { en: 'What is the difference between a brand and a generic name?', bn: 'ব্র্যান্ড নাম আর জেনেরিক নামের পার্থক্য কী?' },
      { en: 'What if I miss a dose?', bn: 'একটা ডোজ ভুলে গেলে কী করব?' },
    ],
    result: [
      { en: 'Explain each medicine in simple words', bn: 'প্রতিটি ওষুধ সহজ ভাষায় বুঝিয়ে দাও' },
      { en: 'Which medicines should not be taken together?', bn: 'কোন ওষুধগুলো একসাথে খাওয়া উচিত নয়?' },
      { en: 'What should I eat or avoid with these?', bn: 'এগুলোর সাথে কী খাব, কী এড়িয়ে চলব?' },
      { en: 'Which of these should be taken with food?', bn: 'এগুলোর মধ্যে কোনগুলো খাবারের সাথে খেতে হবে?' },
      { en: 'What side effects should I watch for?', bn: 'কোন পার্শ্বপ্রতিক্রিয়াগুলোর দিকে খেয়াল রাখব?' },
      { en: 'How long will this course last?', bn: 'এই কোর্স কত দিন চলবে?' },
    ],
  },
  glycovision: {
    idle: [
      { en: 'What does glycemic load mean?', bn: 'গ্লাইসেমিক লোড মানে কী?' },
      { en: 'How should I photograph my plate?', bn: 'প্লেটের ছবি কীভাবে তুলব?' },
      { en: 'Is rice bad for diabetes?', bn: 'ডায়াবেটিসে ভাত খাওয়া খারাপ?' },
      { en: 'How many calories do I need in a day?', bn: 'দিনে আমার কত ক্যালরি লাগে?' },
      { en: 'Which Bangladeshi foods are good for blood sugar?', bn: 'কোন বাংলাদেশি খাবার রক্তে শর্করার জন্য ভালো?' },
      { en: 'What is a healthy portion of rice?', bn: 'ভাতের স্বাস্থ্যকর পরিমাণ কতটুকু?' },
    ],
    result: [
      { en: 'How can I lower the glycemic load of this meal?', bn: 'এই খাবারের গ্লাইসেমিক লোড কীভাবে কমাব?' },
      { en: 'Is this meal okay for a diabetic?', bn: 'ডায়াবেটিস রোগীর জন্য এই খাবার ঠিক আছে?' },
      { en: 'Which item adds the most calories?', bn: 'কোন খাবারে সবচেয়ে বেশি ক্যালরি?' },
      { en: 'What could I swap to make this healthier?', bn: 'কী বদলালে এই খাবার আরও স্বাস্থ্যকর হবে?' },
      { en: 'Is this meal okay for high blood pressure?', bn: 'উচ্চ রক্তচাপে এই খাবার ঠিক আছে?' },
      { en: 'How much protein and fat is in this plate?', bn: 'এই প্লেটে কত প্রোটিন আর চর্বি আছে?' },
    ],
  },
  lokhon: {
    idle: [
      { en: 'What does this question mean?', bn: 'এই প্রশ্নটার মানে কী?' },
      { en: 'How is the risk calculated?', bn: 'ঝুঁকি কীভাবে হিসাব করা হয়?' },
      { en: 'Is this a diagnosis?', bn: 'এটা কি রোগ নির্ণয়?' },
      { en: 'How should I answer if my symptoms come and go?', bn: 'লক্ষণ আসা-যাওয়া করলে কীভাবে উত্তর দেব?' },
      { en: 'What does a red-flag symptom mean?', bn: 'রেড-ফ্ল্যাগ লক্ষণ মানে কী?' },
      { en: 'Can I do this screening for someone else?', bn: 'অন্য কারও জন্য এই পরীক্ষা করতে পারি?' },
    ],
    result: [
      { en: 'What does my risk band mean?', bn: 'আমার ঝুঁকির মাত্রা মানে কী?' },
      { en: 'Which doctor should I see and how soon?', bn: 'কোন ডাক্তার দেখাব, কত তাড়াতাড়ি?' },
      { en: 'What should I tell the doctor?', bn: 'ডাক্তারকে কী বলব?' },
      { en: 'What can I do at home until I see a doctor?', bn: 'ডাক্তার দেখানোর আগে বাড়িতে কী করতে পারি?' },
      { en: 'Which of my symptoms matter most?', bn: 'আমার কোন লক্ষণগুলো সবচেয়ে গুরুত্বপূর্ণ?' },
      { en: 'When should I retake this screening?', bn: 'কবে আবার এই পরীক্ষা করব?' },
    ],
  },
}

export function getScopedPrompts(agent: ChatAgent, mode: ScopedChatMode, lang: 'bn' | 'en'): string[] {
  return PROMPTS[agent][mode].map((p) => (lang === 'bn' ? p.bn : p.en))
}
