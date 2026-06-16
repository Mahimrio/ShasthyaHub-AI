# Mobile-First Design for Bangladesh Users

## Target Device Profile

Primary user device: Samsung Galaxy A series, Redmi Note series
- Screen: 360-390px wide (CSS width, not physical)
- Browser: Chrome for Android (latest, but auto-update is slow in BD)
- Connection: 3G/LTE with variable speeds
- Input method: touch + Bengali keyboard (Ridmik, Bijoy)
- Camera: rear camera, 13-48MP (use this for all image capture)

## Critical Touch Rules

Every interactive element: minimum 44x44px touch target
```
// Button minimum height
className="h-11 px-5 ..." // h-11 = 44px

// List items
className="py-3 px-4 ..." // Enough vertical space to tap

// Icon buttons — add padding
<button className="p-3 rounded-full hover:bg-gray-100">
  <ShareIcon className="w-5 h-5" />
</button>
```

## Font Size Rules (prevents iOS auto-zoom)

NEVER use font-size smaller than 16px on input fields:
```
className="text-base ..." // text-base = 16px — minimum for inputs
// text-sm = 14px — OK for labels but not for inputs
```

## Navigation for Mobile

Bottom navigation bar (not sidebar) for small screens:
```typescript
// Only 4 core destinations — more = too crowded
const navItems = [
  { href: '/', icon: Home, label: 'হোম' },
  { href: '/nayan-ai', icon: Eye, label: 'চোখ' },
  { href: '/scriptguard', icon: FileText, label: 'প্রেসক্রিপশন' },
  { href: '/glycovision', icon: Utensils, label: 'খাদ্য' },
]

<nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 
                pb-safe md:hidden z-40">
  {/* pb-safe handles iPhone home bar */}
```

## Image Upload via Camera (most common input method)

```typescript
// Prescription scan — rear camera, flat surface
<input type="file" accept="image/*" capture="environment" />

// Eye photo — user-facing camera (closer, better detail)
<input type="file" accept="image/*" capture="user" />

// Food photo — rear camera
<input type="file" accept="image/*" capture="environment" />

// ALWAYS also provide a "Choose from Gallery" option:
<input type="file" accept="image/*" /> // No capture = gallery picker
```

## Slow Network Patterns

Show progress, not just a spinner:
```typescript
// Show stage-by-stage progress during AI analysis
const stages = [
  '📡 সার্ভারে পাঠানো হচ্ছে...',
  '🔬 AI বিশ্লেষণ করছে...',
  '📝 রিপোর্ট তৈরি হচ্ছে...',
  '✅ প্রায় শেষ...',
]
```

Pre-compress images before upload to reduce upload time:
- 1MB file uploads 5-10x faster than 8MB original on 3G

Use skeleton screens instead of spinners — skeleton screens make the wait feel shorter.

## Layout Rules for 360px

- NEVER use a fixed width wider than 100vw
- NEVER use gap-8 on mobile flex rows — too wide, items will overlap
- Use single column on mobile: `flex-col md:flex-row`
- Padding: mobile p-4, desktop p-8
- Card gap: gap-3 on mobile, gap-6 on desktop

## Bengali Input Considerations

When users type in Bengali (Ridmik keyboard):
- Phone number fields: use inputMode="numeric" for number keyboard
- Name fields: no autocorrect (it destroys Bengali words)
- Use placeholder text in Bengali for Bengali-context fields
```
<input placeholder="আপনার নাম লিখুন" autoCorrect="off" autoComplete="name" />
```