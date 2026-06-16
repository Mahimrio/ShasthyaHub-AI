# API Error Handling Patterns

## Error Taxonomy for ShasthyaHub-AI

Define specific error types:
```typescript
// lib/errors.ts
export class ImageValidationError extends Error { constructor(msg: string) { super(msg); this.name = 'ImageValidationError' } }
export class AuthError extends Error { constructor() { super('Unauthorized'); this.name = 'AuthError' } }
export class RateLimitError extends Error { constructor() { super('Too many requests'); this.name = 'RateLimitError' } }
export class AIServiceError extends Error { constructor(msg: string, public service: 'gemini'|'groq') { super(msg); this.name = 'AIServiceError' } }
export class JsonExtractionError extends Error { constructor(public raw: string) { super('Could not parse AI response'); this.name = 'JsonExtractionError' } }
export class DatabaseError extends Error { constructor(msg: string) { super(msg); this.name = 'DatabaseError' } }
```

## API Route Error Handler

```typescript
// lib/utils.ts
export function handleApiError(error: unknown, feature: string): NextResponse {
  console.error(`[${feature}]`, error)

  if (error instanceof AuthError)
    return NextResponse.json({ success: false, error: 'Please log in again.', code: 'AUTH_ERROR' }, { status: 401 })

  if (error instanceof ImageValidationError)
    return NextResponse.json({ success: false, error: error.message, code: 'INVALID_IMAGE' }, { status: 400 })

  if (error instanceof RateLimitError)
    return NextResponse.json({ success: false, error: 'Too many requests. Please wait a minute and try again.', error_bn: 'অনেক বেশি অনুরোধ। একটু অপেক্ষা করুন।', code: 'RATE_LIMITED' }, { status: 429 })

  if (error instanceof AIServiceError)
    return NextResponse.json({ success: false, error: `AI service temporarily unavailable. Please try again in a moment.`, code: 'AI_SERVICE_ERROR' }, { status: 503 })

  return NextResponse.json({ success: false, error: 'Analysis failed. Please try again.', error_bn: 'বিশ্লেষণ ব্যর্থ হয়েছে। আবার চেষ্টা করুন।', code: 'INTERNAL_ERROR' }, { status: 500 })
}
```

## Client-Side Error Display

```typescript
// Map error codes to user-friendly Bengali+English messages
const ERROR_MESSAGES: Record<string, { en: string; bn: string }> = {
  AUTH_ERROR:     { en: 'Session expired. Please log in again.', bn: 'সেশন শেষ হয়ে গেছে। আবার লগইন করুন।' },
  INVALID_IMAGE:  { en: 'Invalid image. Please upload a clear JPEG or PNG photo.', bn: 'ছবি অবৈধ। একটি স্পষ্ট JPEG বা PNG ছবি আপলোড করুন।' },
  RATE_LIMITED:   { en: 'Too many requests. Please wait a minute.', bn: 'বেশি অনুরোধ হয়েছে। এক মিনিট অপেক্ষা করুন।' },
  AI_SERVICE_ERROR: { en: 'AI service is busy. Please try again.', bn: 'AI সেবা ব্যস্ত। আবার চেষ্টা করুন।' },
  INTERNAL_ERROR: { en: 'Something went wrong. Please try again.', bn: 'কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।' },
}
```

## Retry Logic

```typescript
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  delayMs = 2000
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxRetries) throw error
      // Only retry on 5xx or network errors, not 4xx
      const status = (error as any)?.status
      if (status && status < 500) throw error
      await new Promise(r => setTimeout(r, delayMs * (attempt + 1)))
    }
  }
  throw new Error('Max retries exceeded')
}
```

## Frontend Error State Pattern

```typescript
// In analysis hooks
const [error, setError] = useState<{ code: string; message: string } | null>(null)

// In the UI — never show raw error messages to users
{error && (
  <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex gap-3 items-start">
    <span className="text-red-500 mt-0.5">⚠️</span>
    <div>
      <p className="font-medium text-red-800 text-sm">
        {ERROR_MESSAGES[error.code]?.[lang] ?? ERROR_MESSAGES.INTERNAL_ERROR[lang]}
      </p>
      <button onClick={reset} className="text-xs text-red-600 underline mt-1">
        {lang === 'bn' ? 'আবার চেষ্টা করুন' : 'Try Again'}
      </button>
    </div>
  </div>
)}
```