/** Map raw Supabase/fetch errors to bilingual, user-actionable messages. */
export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('failed to fetch') || m.includes('network') || m.includes('load failed')) {
    return 'Could not reach the server — check your internet connection and try again. / সার্ভারে সংযোগ করা যাচ্ছে না — ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।'
  }
  if (m.includes('invalid login credentials')) {
    return 'Incorrect email or password. / ইমেইল বা পাসওয়ার্ড সঠিক নয়।'
  }
  if (m.includes('email not confirmed')) {
    return 'Please verify your email first — check your inbox. / প্রথমে আপনার ইমেইল যাচাই করুন — ইনবক্স দেখুন।'
  }
  if (m.includes('already registered') || m.includes('already exists')) {
    return 'An account with this email already exists — try logging in. / এই ইমেইলে ইতিমধ্যে অ্যাকাউন্ট আছে — লগইন করুন।'
  }
  if (m.includes('rate limit') || m.includes('too many')) {
    return 'Too many attempts — wait a minute and try again. / অনেকবার চেষ্টা হয়েছে — এক মিনিট পর আবার চেষ্টা করুন।'
  }
  if (m.includes('password') && (m.includes('weak') || m.includes('short') || m.includes('at least'))) {
    return 'Password is too weak — use at least 8 characters. / পাসওয়ার্ড খুব দুর্বল — কমপক্ষে ৮ অক্ষর ব্যবহার করুন।'
  }
  return 'Something went wrong — please try again. / কিছু ভুল হয়েছে — আবার চেষ্টা করুন।'
}
