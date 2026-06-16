# Supabase Full-Stack Integration Patterns

## Client Setup (ALWAYS use these, not createClient directly)

```typescript
// lib/supabase/client.ts — FOR CLIENT COMPONENTS
import { createBrowserClient } from '@supabase/ssr'
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// lib/supabase/server.ts — FOR API ROUTES AND SERVER COMPONENTS
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export function createServerSupabaseClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n) => cookieStore.get(n)?.value, set: () => {}, remove: () => {} } }
  )
}

// lib/supabase/admin.ts — FOR SERVICE ROLE OPERATIONS (bypasses RLS)
import { createClient } from '@supabase/supabase-js'
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // NEVER expose to client
  )
}
```

## Auth Patterns

```typescript
// Register
const { data, error } = await supabase.auth.signUp({
  email, password,
  options: { data: { name, phone, district } }
})

// Login
const { data, error } = await supabase.auth.signInWithPassword({ email, password })

// Logout (client)
await supabase.auth.signOut()
await router.push('/login')

// Get user in API Route (server-side — most secure)
const supabase = createServerSupabaseClient()
const { data: { user } } = await supabase.auth.getUser()
// IMPORTANT: getUser() makes a network request to validate — do NOT use getSession() for auth checks
```

## Database Query Patterns

```typescript
// SELECT with filter
const { data, error } = await supabase
  .from('eye_analyses')
  .select('id, diagnosis, severity, created_at')
  .eq('user_id', user.id)           // RLS also enforces this, but be explicit
  .order('created_at', { ascending: false })
  .limit(10)

// INSERT
const { data, error } = await supabase
  .from('eye_analyses')
  .insert({ user_id: user.id, status: 'pending', ...result })
  .select('id')
  .single()

// UPDATE
const { error } = await supabase
  .from('eye_analyses')
  .update({ status: 'complete', diagnosis: result.diagnosis })
  .eq('id', analysisId)
  .eq('user_id', user.id) // Always include user_id check

// JSONB queries (PostgreSQL power)
const { data } = await supabase
  .from('prescription_analyses')
  .select('*')
  .contains('interaction_warnings', [{ severity: 'Critical' }])

// Fuzzy text search on bd_drugs
const { data } = await supabase
  .from('bd_drugs')
  .select('*')
  .ilike('brand_name', `%${searchTerm}%`)
  .limit(3)
```

## Storage Patterns

```typescript
// Upload image
async function uploadImage(file: File, bucket: string, userId: string): Promise<string> {
  const fileName = `${userId}/${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '_')}`
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, { contentType: file.type, upsert: false })
  if (error) throw new Error(`Upload failed: ${error.message}`)
  return data.path
}

// Get signed URL (temporary access)
const { data } = await supabase.storage
  .from(bucket)
  .createSignedUrl(path, 3600) // 1 hour expiry

// Delete after processing (privacy)
await supabase.storage.from(bucket).remove([path])
```

## Error Handling with Supabase

```typescript
// Always check both data and error
const { data, error } = await supabase.from('table').select('*')
if (error) {
  // Supabase errors have: message, details, hint, code
  console.error('[Supabase]', error.code, error.message)
  // PGRST116 = row not found, 23505 = unique violation
  if (error.code === 'PGRST116') return null
  throw new DatabaseError(error.message)
}
```

## RLS Policy Verification

After writing any query, mentally verify:
1. Does the user own this row? (user_id = auth.uid())
2. Is RLS enabled on this table?
3. Am I using the server client (not admin) for user-facing queries?
4. Am I using .eq('user_id', user.id) even though RLS handles it? (do both)