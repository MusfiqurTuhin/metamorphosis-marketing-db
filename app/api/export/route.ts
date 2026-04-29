export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { contacts } from '@/lib/db/schema'
import { ilike, and, or, eq, sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const search   = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''
  const subCat   = searchParams.get('subCategory') || ''
  const assoc    = searchParams.get('association') || ''
  const status   = searchParams.get('emailStatus') || ''
  const hasEmail = searchParams.get('hasEmail') || ''

  const conditions = []
  if (search)  conditions.push(or(ilike(contacts.name, `%${search}%`), ilike(contacts.company, `%${search}%`), ilike(contacts.email, `%${search}%`)))
  if (category) conditions.push(eq(contacts.sourceCategory, category))
  if (subCat)   conditions.push(eq(contacts.subCategory, subCat))
  if (assoc)    conditions.push(eq(contacts.association, assoc))
  if (status)   conditions.push(eq(contacts.emailStatus, status))
  if (hasEmail === 'yes') conditions.push(sql`${contacts.email} != '' AND ${contacts.email} IS NOT NULL`)
  if (hasEmail === 'no')  conditions.push(or(sql`${contacts.email} = ''`, sql`${contacts.email} IS NULL`))

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const rows = await db.select().from(contacts).where(where).orderBy(contacts.id).limit(100000)

  const headers = ['ID','Name','Company','Designation','Email','Phone','Phone2','Address','Website','Source Category','Sub Category','Association','Member Type','Member Since','Membership No','Industry','Products','Services','Email Status','Notes','Country']
  const csvRows = rows.map(r => [
    r.id, r.name, r.company, r.designation, r.email, r.phone, r.phone2,
    r.address, r.website, r.sourceCategory, r.subCategory, r.association,
    r.memberType, r.memberSince, r.membershipNo, r.industry, r.products,
    r.services, r.emailStatus, r.notes, r.country,
  ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))

  const csv = [headers.join(','), ...csvRows].join('\n')
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="metamorphosis-contacts-${Date.now()}.csv"`,
    },
  })
}
