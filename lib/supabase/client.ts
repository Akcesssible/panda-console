import { createBrowserClient } from '@supabase/ssr'

// Singleton — one instance per browser tab.
// Re-creating the client on every call causes auth lock races in React Strict Mode
// (double-render in dev) and wastes resources in production.
let _client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (!_client) {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    )
  }
  return _client
}
