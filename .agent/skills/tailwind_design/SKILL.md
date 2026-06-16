# Advanced Tailwind CSS Patterns

## Custom Design Tokens (add to tailwind.config.ts)

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f9ff',
          500: '#0ea5e9', // Primary sky blue
          600: '#0284c7',
        },
        health: {
          green:  '#10b981', // Safe
          yellow: '#f59e0b', // Caution
          red:    '#ef4444', // Critical
          blue:   '#3b82f6', // Info
        }
      },
      fontFamily: {
        bengali: ['Hind Siliguri', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      lineHeight: {
        bengali: '1.8', // Bengali diacritics need extra vertical space
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'count-up': 'countUp 1.5s ease-out forwards',
        'slide-up': 'slideUp 0.3s ease-out forwards',
        'severity-ping': 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        slideUp: { '0%': { transform: 'translateY(16px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        countUp: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
      }
    },
  },
  plugins: [],
}
export default config
```

## Responsive Design for This Project

Breakpoints used in ShasthyaHub-AI:
- Default (no prefix): mobile 360px — DESIGN FOR THIS FIRST
- sm: 640px — larger phones
- md: 768px — tablet / when sidebar appears
- lg: 1024px — desktop

Pattern: mobile stack → desktop side-by-side:
```
<div className="flex flex-col md:flex-row gap-4">
```

## Component Class Patterns

SEVERITY BORDER CARD (medical standard):
```
const severityBorder = {
  Critical: 'border-l-4 border-red-500 bg-red-50',
  High:     'border-l-4 border-orange-500 bg-orange-50',
  Medium:   'border-l-4 border-yellow-500 bg-yellow-50',
  Low:      'border-l-4 border-blue-500 bg-blue-50',
  Normal:   'border-l-4 border-green-500 bg-green-50',
}
```

CONSISTENT BUTTON SCALE:
```
// Primary action (analyze, submit)
className="h-12 px-8 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-semibold text-base hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"

// Secondary action (download, share)
className="h-10 px-6 rounded-lg border border-gray-200 bg-white text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"

// Destructive (cancel, clear)
className="h-10 px-6 rounded-lg text-red-600 font-medium text-sm hover:bg-red-50 transition-colors"
```

UPLOAD ZONE:
```
className="border-2 border-dashed border-gray-200 rounded-2xl p-8 
  hover:border-sky-400 hover:bg-sky-50/50 transition-all duration-200
  cursor-pointer flex flex-col items-center gap-3 text-center"
```

## Avoiding AI-Looking Classes

SWAP THESE:
- rounded-xl shadow-md → use border-l-4 for medical content instead
- text-gray-600 everywhere → vary: text-gray-400 (meta), text-gray-700 (body), text-gray-900 (important)
- p-p-p-4 everywhere → use asymmetric padding: pt-6 pb-4 px-5
- gap-4 everywhere → vary gap by relationship importance

USE THESE MORE:
- tracking-wide/widest on labels and badges (uppercase labels need letter-spacing)
- leading-relaxed on Bengali text (1.625 baseline — set in font styles)
- tabular-nums on numbers that change (calories, scores) — prevents layout shift
- font-black (900) for impactful medical results — not just font-bold (700)