export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { contacts } from '@/lib/db/schema'
import { sql, ilike, and, or, eq, count } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const page       = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const pageSize   = Math.min(200, Math.max(10, parseInt(searchParams.get('pageSize') || '50')))
  const search     = searchParams.get('search') || ''
  const category   = searchParams.get('category') || ''
  const subCat     = searchParams.get('subCategory') || ''
  const assoc      = searchParams.get('association') || ''
  const status     = searchParams.get('emailStatus') || ''
  const hasEmail   = searchParams.get('hasEmail') || ''

  const conditions = []

  if (search) {
    conditions.push(
      or(
        ilike(contacts.name, `%${search}%`),
        ilike(contacts.company, `%${search}%`),
        ilike(contacts.email, `%${search}%`),
        ilike(contacts.phone, `%${search}%`),
        ilike(contacts.designation, `%${search}%`),
        ilike(contacts.address, `%${search}%`),
      )
    )
  }
  if (category)  conditions.push(eq(contacts.sourceCategory, category))
  if (subCat)    conditions.push(eq(contacts.subCategory, subCat))
  if (assoc)     conditions.push(eq(contacts.association, assoc))
  if (status)    conditions.push(eq(contacts.emailStatus, status))
  if (hasEmail === 'yes') conditions.push(sql`${contacts.email} != '' AND ${contacts.email} IS NOT NULL`)
  if (hasEmail === 'no')  conditions.push(or(sql`${contacts.email} = ''`, sql`${contacts.email} IS NULL`))

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const [totalResult, rows] = await Promise.all([
    db.select({ count: count() }).from(contacts).where(where),
    db.select().from(contacts).where(where)
      .orderBy(contacts.id)
      .limit(pageSize)
      .offset((page - 1) * pageSize),
  ])

  const total = totalResult[0]?.count ?? 0

  return NextResponse.json({
    data: rows,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}
