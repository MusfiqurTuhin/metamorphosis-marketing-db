import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

// Lazy singleton — created on first request, not at build time
let _db: ReturnType<typeof drizzle> | null = null

export function getDb() {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set. Add it in Vercel → Settings → Environment Variables.')
    }
    _db = drizzle(neon(process.env.DATABASE_URL), { schema })
  }
  return _db
}

// Named export for convenience — resolves at call time, not import time
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (getDb() as any)[prop]
  },
})
