# Image Upload Pipeline — Client to AI

## Client-Side Compression (ALWAYS compress before upload)

```typescript
// hooks/useImageUpload.ts
import imageCompression from 'browser-image-compression'

export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1,              // Max 1MB (reduces API token cost + latency)
    maxWidthOrHeight: 1024,    // Optimal for Gemini Vision
    useWebWorker: true,        // Non-blocking
    fileType: 'image/jpeg',    // Always convert to JPEG
    initialQuality: 0.85,      // Good quality, small size
  }
  return imageCompression(file, options)
}
```

## File Validation

```typescript
// lib/utils.ts
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
  const MAX_SIZE_MB = 10 // Before compression

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Please upload a JPEG, PNG, or WebP image. / অনুগ্রহ করে JPEG, PNG বা WebP ছবি আপলোড করুন।' }
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return { valid: false, error: `Image must be under ${MAX_SIZE_MB}MB. / ছবির আকার ${MAX_SIZE_MB}MB এর কম হতে হবে।` }
  }
  return { valid: true }
}
```

## File to Base64 (for API routes)

```typescript
// lib/utils.ts
export async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  const buffer = await file.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  return { base64, mimeType: file.type as 'image/jpeg' | 'image/png' | 'image/webp' }
}
```

## FormData Upload Pattern

```typescript
// In the hook/component — use FormData for file uploads (not JSON)
async function uploadAndAnalyze(file: File) {
  const compressed = await compressImage(file)
  const formData = new FormData()
  formData.append('image', compressed, 'analysis.jpg')

  // IMPORTANT: Do NOT set Content-Type header — browser sets it with boundary
  const response = await fetch('/api/nayan/analyze', {
    method: 'POST',
    body: formData,
    // No headers! fetch sets multipart/form-data automatically
  })
  return response.json()
}
```

## Mobile Camera Integration

```typescript
// In ImageUploader component — critical for Bangladesh mobile users
<input
  type="file"
  accept="image/*"
  capture="environment"  // Rear camera on mobile (best for prescriptions + food)
  // For eye images: capture="user" (front camera)
  className="hidden"
  ref={inputRef}
  onChange={handleFileChange}
/>
```

## Image Preview Pattern

```typescript
const [preview, setPreview] = useState<string | null>(null)

function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0]
  if (!file) return
  const validation = validateImageFile(file)
  if (!validation.valid) { setError(validation.error); return }

  // Create preview URL
  const objectUrl = URL.createObjectURL(file)
  setPreview(objectUrl)
  setSelectedFile(file)

  // Cleanup old URL
  return () => URL.revokeObjectURL(objectUrl)
}
```

## API Route — Receiving Image

```typescript
// In API route (route.ts)
const formData = await request.formData()
const imageFile = formData.get('image') as File | null
if (!imageFile || imageFile.size === 0) {
  return NextResponse.json({ success: false, error: 'No image provided' }, { status: 400 })
}
const { base64, mimeType } = await fileToBase64(imageFile)
// Now send base64 to Gemini
```