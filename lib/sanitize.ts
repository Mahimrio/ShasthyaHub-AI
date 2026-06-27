export function sanitizeInput(text: string | null | undefined): string {
  if (!text) return ''
  return text.replace(/<[^>]*>/g, '').slice(0, 10000)
}
