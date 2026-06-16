# Shadcn/UI — Beyond the Defaults

## Theme Customization (globals.css)

```css
@layer base {
  :root {
    /* Override shadcn defaults with medical brand colors */
    --background: 0 0% 99%;
    --foreground: 222 47% 8%;
    --primary: 199 89% 48%;        /* sky-500 */
    --primary-foreground: 0 0% 100%;
    --secondary: 158 64% 52%;      /* emerald-500 */
    --secondary-foreground: 0 0% 100%;
    --muted: 210 40% 97%;
    --muted-foreground: 215 16% 47%;
    --accent: 199 89% 96%;         /* sky-50 */
    --accent-foreground: 199 89% 30%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 214 32% 91%;
    --ring: 199 89% 48%;
    --radius: 0.75rem;
  }
}
```

## Making shadcn Look Non-Generic

DO NOT use shadcn Card component for medical results — it looks too generic.
Instead, use bare divs with intentional border and background.

DO use shadcn for:
- Dialog (modals, disclaimers) — accessible by default
- Tabs (feature switching)
- Badge (severity labels)
- Alert (drug interaction warnings)
- Progress (confidence meter)
- Skeleton (loading states)
- Sheet (mobile sidebar)

CUSTOM BADGE VARIANTS (add to badge.tsx):
```typescript
const badgeVariants = cva('...base classes...', {
  variants: {
    variant: {
      // Add medical variants
      critical: 'bg-red-100 text-red-700 border-red-200',
      high:     'bg-orange-100 text-orange-700 border-orange-200',
      medium:   'bg-yellow-100 text-yellow-700 border-yellow-200',
      low:      'bg-blue-100 text-blue-700 border-blue-200',
      normal:   'bg-green-100 text-green-700 border-green-200',
      green:    'bg-green-100 text-green-700 border-green-200',
      yellow:   'bg-yellow-100 text-yellow-700 border-yellow-200',
      red:      'bg-red-100 text-red-700 border-red-200',
    }
  }
})
```

DIALOG WITH MEDICAL DISCLAIMER:
```typescript
// Always show disclaimer before first analysis
export function DisclaimerModal({ feature, onAccept }: Props) {
  return (
    <Dialog defaultOpen={!hasSeenDisclaimer(feature)}>
      <DialogContent className="max-w-sm mx-4">
        <DialogHeader>
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">⚠️</span>
          </div>
          <DialogTitle className="text-center">স্ক্রিনিং টুল / Screening Tool</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600 text-center leading-relaxed">
          ShasthyaHub-AI একটি AI স্ক্রিনিং টুল, ক্লিনিকাল রোগ নির্ণয় নয়।
          সর্বদা একজন যোগ্য ডাক্তারের পরামর্শ নিন।
        </p>
        <Button onClick={onAccept} className="w-full mt-4">আমি বুঝেছি / I Understand</Button>
      </DialogContent>
    </Dialog>
  )
}
```

ALERT FOR DRUG INTERACTIONS:
```typescript
// Shadcn Alert with medical variant
<Alert variant="destructive" className="border-red-500 bg-red-50">
  <AlertTriangle className="h-5 w-5 text-red-600" />
  <AlertTitle className="text-red-800 font-bold text-base">
    🚨 মারাত্মক ওষুধ মিথস্ক্রিয়া / Critical Drug Interaction
  </AlertTitle>
  <AlertDescription className="text-red-700">
    {interactionDescription}
  </AlertDescription>
</Alert>
```