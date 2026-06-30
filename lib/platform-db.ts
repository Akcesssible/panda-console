import 'server-only'
import { Pool, type QueryResultRow } from 'pg'

declare global {
  // eslint-disable-next-line no-var
  var __pandaPlatformPool: Pool | undefined
}

function getPool() {
  if (!globalThis.__pandaPlatformPool) {
    globalThis.__pandaPlatformPool = new Pool({
      host: process.env.PLATFORM_DB_HOST ?? process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.PLATFORM_DB_PORT ?? process.env.POSTGRES_HOST_PORT ?? 5433),
      database: process.env.PLATFORM_DB_NAME ?? process.env.DB_NAME ?? 'pesa_db',
      user: process.env.PLATFORM_DB_USER ?? process.env.DB_USER ?? 'pesa',
      password: process.env.PLATFORM_DB_PASSWORD ?? process.env.DB_PASSWORD ?? 'pesa',
      max: 5,
    })
  }

  return globalThis.__pandaPlatformPool
}

export async function platformQuery<T extends QueryResultRow>(text: string, values: unknown[] = []) {
  return getPool().query<T>(text, values)
}
