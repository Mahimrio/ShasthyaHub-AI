# Medical UX Principles

## The Stressed User Model

Medical app users are often:
- Anxious (sick or caring for sick family member)
- Low-literacy (rural Bangladesh context)
- Time-pressured (at clinic, pharmacy, emergency)
- Using with one hand (holding phone while doing something else)

Design for the MOST stressed version of your user.

## Severity Color System (never deviate)

```
🟢 Green  → Safe, Normal, No action needed
🟡 Yellow → Caution, Monitor, See doctor soon
🟠 Orange → Elevated concern, See doctor this week
🔴 Red    → Urgent, Critical, See doctor today / Emergency

// These are universal human colors — do not use red for decoration ANYWHERE
// If red appears as a brand color, severity red loses its urgency signal
```

## Critical Information Hierarchy

Medical result pages must answer in this order:
1. "Am I in danger?" (severity level — shown largest, first, most prominent)
2. "What do I need to do?" (recommendation — actionable, simple)
3. "How soon?" (urgency timeline — specific days, not vague)
4. "Who do I see?" (specialist type)
5. "What are the details?" (diagnosis name, confidence — secondary)

WRONG order:
```
// BAD — details before action
<h1>Diagnosis: Suspected Posterior Subcapsular Cataract</h1>
<p>Confidence: 87.3%</p>
<p>Severity: High</p>
<p>You should see a doctor</p>
```

RIGHT order:
```
// GOOD — severity and action first
<div className="border-l-4 border-orange-500 bg-orange-50 p-4">
  <span className="text-xs uppercase text-orange-600 font-bold tracking-widest">উচ্চ ঝুঁকি — ১৪ দিনের মধ্যে ডাক্তার দেখান</span>
  <h2 className="text-2xl font-black text-gray-900 mt-1">সম্ভাব্য ছানি</h2>
  <p className="text-gray-600 mt-2">চোখের লেন্সে মেঘলা ভাব পাওয়া গেছে।</p>
</div>
```

## Disclaimer Placement

Medical disclaimers must be:
1. Shown BEFORE analysis (modal/gate) — user acknowledges before seeing results
2. Shown AFTER results in small but readable text — reminds during use
3. NEVER hidden in footer — this is legally and ethically important
4. In BOTH languages always

```typescript
// Disclaimer text (final approved version)
const DISCLAIMER = {
  en: "ShasthyaHub-AI is an AI screening tool, not a clinical diagnosis. Always consult a qualified medical professional before making health decisions.",
  bn: "ShasthyaHub-AI একটি AI স্ক্রিনিং টুল, ক্লিনিকাল রোগ নির্ণয় নয়। স্বাস্থ্য সংক্রান্ত সিদ্ধান্ত নেওয়ার আগে সর্বদা একজন যোগ্য চিকিৎসকের পরামর্শ নিন।"
}
```

## Drug Interaction Alerts — Specific Rules

CRITICAL/SEVERE interaction:
- Full-screen red modal alert FIRST before showing schedule
- "Do NOT take these together without consulting a doctor"
- Show which drugs conflict in large text
- Only show "I understand" after 3-second delay (forces reading)

MODERATE interaction:
- Yellow alert banner at top of schedule
- Show warning inline with the conflicting drugs

MILD interaction:
- Small yellow badge next to the drugs — no blocking modal

## Loading States for Anxious Users

Show progress stages, not just a spinner. A spinner with no text = unknown wait = anxiety.
"AI বিশ্লেষণ করছে... / AI is analyzing..." with stage indicators reassures users.
Show approximate time: "সাধারণত ১০-১৫ সেকেন্ড লাগে / Usually takes 10-15 seconds"

## Success State Design

After successful analysis:
- Brief positive micro-animation (gentle scale-in)
- For normal/green results: explicit reassurance in Bengali first
- For high/critical: immediate prominent action item, not buried in text