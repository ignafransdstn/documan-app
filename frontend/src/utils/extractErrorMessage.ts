export default function extractErrorMessage(e: unknown): string {
  if (e && typeof e === 'object') {
    const obj = e as Record<string, unknown>
    if (typeof obj.message === 'string') return obj.message
    if (typeof obj.body === 'object' && obj.body !== null) {
      const b = obj.body as Record<string, unknown>
      if (typeof b.message === 'string') return b.message
      try {
        return JSON.stringify(b)
      } catch {
        return String(b)
      }
    }
    try {
      return JSON.stringify(obj)
    } catch {
      return String(obj)
    }
  }
  return String(e)
}
