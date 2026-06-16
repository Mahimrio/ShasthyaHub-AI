# UI Design Anti-Patterns — How to NOT Look Like AI Generated

## The "AI Look" Problem

AI-generated UIs are instantly recognizable by these patterns. NEVER do these:

BAD PATTERNS TO AVOID:
1. Equal-shadow card grids — every feature in an identical rounded-xl shadow-md card
2. Default blue-500 as primary — Tailwind's default blue is overused
3. Icon + heading + paragraph — this 3-element card pattern is exhausted
4. Dividers everywhere — excessive <hr> or border-b between every section
5. Centered everything — real layouts use intentional asymmetry
6. Gradient text on headings — gradient text is a cliché
7. Every button is the same size — visual hierarchy through button size is ignored
8. Stats in equal-width boxes — 4 identical metric cards in a row
9. Padding always p-4 or p-6 — mechanical, not thoughtful
10. All shadows identical — shadow-md everywhere is lazy

## What Real UI Looks Like

TYPE HIERARCHY (use extremes, not increments):
```
// BAD — too similar
<h1 className="text-2xl font-bold">Title</h1>
<p className="text-lg">Description</p>
<p className="text-base">Body</p>

// GOOD — dramatic contrast
<h1 className="text-5xl font-black tracking-tight leading-none">Title</h1>
<p className="text-base text-gray-500 max-w-prose">Description</p>
```

COLOR PERSONALITY (specific values, not defaults):
```
// BAD — generic Tailwind
className="bg-blue-500 text-white"

// GOOD — custom, memorable
style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #10B981 100%)' }}
// Or use a CSS variable: var(--brand-gradient)
```

WHITESPACE AS A DESIGN ELEMENT:
```
// BAD — uniform padding
<div className="p-4">
  <div className="p-4">...</div>
</div>

// GOOD — intentional breathing room
<div className="px-8 py-12 md:px-16 md:py-20">
  <div className="mt-2">...</div>
  <div className="mt-10">...</div> // Large gap signals new section
</div>
```

## ShasthyaHub-AI Design Principles

MEDICAL UI MUST:
1. Use severity colors UNAMBIGUOUSLY — red is ONLY for danger, never decoration
2. Show confidence through visual weight — important info is larger + darker
3. Provide clear visual hierarchy: what the patient must do first
4. Never use red as a brand accent — it will conflict with critical alerts
5. Bengali text needs 1.7 line-height minimum (diacritics above letters need space)

TRUSTWORTHY MEDICAL LOOK:
```
// Trust signals — use clean, documentary aesthetic
// NOT: colorful, playful, startup-y
// YES: clinical white space, precise typography, purposeful accent colors

// Primary brand: sky blue → emerald (health, nature, growth)
// Never: purple, orange, pink as primary (fun colors undermine medical trust)
```

LAYOUT PATTERNS THAT LOOK REAL:
```
// Feature sections with offset typography
<section className="grid grid-cols-1 md:grid-cols-5 gap-0">
  <div className="md:col-span-2 bg-sky-50 p-10">
    {/* Label + small text — narrow column */}
    <span className="text-xs uppercase tracking-widest text-sky-600 font-medium">NayanAI</span>
    <h2 className="text-3xl font-black mt-3 leading-tight">চোখের রোগ<br/>শনাক্তকরণ</h2>
  </div>
  <div className="md:col-span-3 p-10">
    {/* Content — wide column */}
  </div>
</section>
```

RESULT CARDS THAT LOOK MEDICAL NOT GENERIC:
```
// BAD — generic card
<div className="rounded-xl shadow-md p-6 border">
  <h3>Diagnosis</h3>
  <p>Suspected Cataract</p>
</div>

// GOOD — medical severity card
<div className="border-l-4 border-orange-500 bg-orange-50 pl-4 py-3 rounded-r-lg">
  <div className="flex items-baseline gap-3">
    <span className="text-xs uppercase tracking-widest text-orange-600 font-semibold">High Severity</span>
    <span className="text-xs text-orange-400">87% confidence</span>
  </div>
  <p className="text-xl font-bold text-gray-900 mt-1">Suspected Cataract</p>
  <p className="text-sm text-gray-600 mt-2 leading-relaxed">সম্ভাব্য ছানির লক্ষণ পাওয়া গেছে...</p>
</div>
```

## Animation Anti-Patterns

- DO NOT fade-in every element — only animate things that need attention
- DO NOT use bounce — it looks like a toy
- DO NOT animate on every scroll — exhausting and unprofessional
- DO animate: severity badges (pulse on critical), number countups, progress bars
- DO use subtle transitions: opacity 0.2s ease for hover states

## Spacing System

Use an intentional scale, not just multiples of 4:
- Inner element gap: gap-2 (8px)
- Related items: gap-4 (16px)
- Sections: gap-8 to gap-12 (32-48px)
- Page sections: gap-16 to gap-24 (64-96px)
Inconsistent spacing = no visual grouping = looks AI-generated.