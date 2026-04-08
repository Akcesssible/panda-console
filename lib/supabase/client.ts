import { createBrowserClient } from '@supabase/ssr'

// Browser client — uses publishable key, for Realtime subscriptions only
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
