import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { contacts } from '@/lib/db/schema'
import { sql } from 'drizzle-orm'

export async function GET() {
  const [cats, subs, assocs, statCounts] = await Promise.all([
    db.execute(sql`SELECT source_category, COUNT(*) as cnt FROM contacts GROUP BY source_category ORDER BY cnt DESC`),
    db.execute(sql`SELECT sub_category, COUNT(*) as cnt FROM contacts WHERE sub_category IS NOT NULL AND sub_category != '' GROUP BY sub_category ORDER BY cnt DESC`),
    db.execute(sql`SELECT association, COUNT(*) as cnt FROM contacts WHERE association IS NOT NULL AND association != '' GROUP BY association ORDER BY cnt DESC`),
    db.execute(sql`SELECT email_status, COUNT(*) as cnt FROM contacts GROUP BY email_status`),
  ])

  return NextResponse.json({
    categories: cats.rows,
    subCategories: subs.rows,
    associations: assocs.rows,
    statusCounts: statCounts.rows,
  })
}
