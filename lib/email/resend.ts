import { Resend } from 'resend'

// Resend requires an API key. If missing, the send call will fail gracefully
// (logged + non-fatal) rather than crashing the entire module at import time.
export const resend = new Resend(process.env.RESEND_API_KEY ?? 'missing')
