import 'dotenv/config'
import { db } from '../lib/db'
import { contacts } from '../lib/db/schema'
import { sql } from 'drizzle-orm'

async function main() {
  const [total] = await db.select({ count: sql<number>`count(*)` }).from(contacts)
  console.log(`\nTotal records in DB: ${total.count}\n`)

  const bySrc = await db.execute(sql`
    SELECT source_category, source_file, COUNT(*) as cnt
    FROM contacts
    GROUP BY source_category, source_file
    ORDER BY cnt DESC
  `)
  console.log('Breakdown by source:')
  for (const r of bySrc.rows) {
    console.log(`  ${String(r.cnt).padStart(7)}  ${r.source_category} | ${r.source_file}`)
  }
  process.exit(0)
}
main().catch(e => { console.error(e.message); process.exit(1) })
