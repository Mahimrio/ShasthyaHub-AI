import type { ChatAgent } from '@/types'

export type ScopedChatMode = 'idle' | 'result'

interface Prompt {
  en: string
  bn: string
}

const PROMPTS: Record<ChatAgent, Record<ScopedChatMode, Prompt[]>> = {
  scriptguard: {
    idle: [
      { en: 'What does ScriptGuard check for?', bn: 'স্ক্রিপ্টগার্ড কী কী পরীক্ষা করে?' },
      { en: 'How do I photograph a prescription clearly?', bn: 'প্রেসক্রিপশনের স্পষ্ট ছবি কীভাবে তুলব?' },
      { en: 'What is a drug interaction?', bn: 'ওষুধের পারস্পরিক প্রতিক্রিয়া কী?' },
    ],
    result: [
      { en: 'Explain each medicine in simple words', bn: 'প্রতিটি ওষুধ সহজ ভাষায় বুঝিয়ে দাও' },
      { en: 'Which medicines should not be taken together?', bn: 'কোন ওষুধগুলো একসাথে খাওয়া উচিত নয়?' },
      { en: 'What should I eat or avoid with these?', bn: 'এগুলোর সাথে কী খাব, কী এড়িয়ে চলব?' },
    ],
  },
  glycovision: {
    idle: [
      { en: 'What does glycemic load mean?', bn: 'গ্লাইসেমিক লোড মানে কী?' },
      { en: 'How should I photograph my plate?', bn: 'প্লেটের ছবি কীভাবে তুলব?' },
      { en: 'Is rice bad for diabetes?', bn: 'ডায়াবেটিসে ভাত খাওয়া খারাপ?' },
    ],
    result: [
      { en: 'How can I lower the glycemic load of this meal?', bn: 'এই খাবারের গ্লাইসেমিক লোড কীভাবে কমাব?' },
      { en: 'Is this meal okay for a diabetic?', bn: 'ডায়াবেটিস রোগীর জন্য এই খাবার ঠিক আছে?' },
      { en: 'Which item adds the most calories?', bn: 'কোন খাবারে সবচেয়ে বেশি ক্যালরি?' },
    ],
  },
  lokhon: {
    idle: [
      { en: 'What does this question mean?', bn: 'এই প্রশ্নটার মানে কী?' },
      { en: 'How is the risk calculated?', bn: 'ঝুঁকি কীভাবে হিসাব করা হয়?' },
      { en: 'Is this a diagnosis?', bn: 'এটা কি রোগ নির্ণয়?' },
    ],
    result: [
      { en: 'What does my risk band mean?', bn: 'আমার ঝুঁকির মাত্রা মানে কী?' },
      { en: 'Which doctor should I see and how soon?', bn: 'কোন ডাক্তার দেখাব, কত তাড়াতাড়ি?' },
      { en: 'What should I tell the doctor?', bn: 'ডাক্তারকে কী বলব?' },
    ],
  },
}

export function getScopedPrompts(agent: ChatAgent, mode: ScopedChatMode, lang: 'bn' | 'en'): string[] {
  return PROMPTS[agent][mode].map((p) => (lang === 'bn' ? p.bn : p.en))
}
