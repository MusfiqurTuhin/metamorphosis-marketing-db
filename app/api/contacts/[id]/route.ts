import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { contacts } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { emailStatus, notes } = body

  const update: Record<string, unknown> = { updatedAt: sql`now()` }
  if (emailStatus !== undefined) update.emailStatus = emailStatus
  if (notes !== undefined) update.notes = notes

  await db.update(contacts).set(update).where(eq(contacts.id, parseInt(id)))
  return NextResponse.json({ ok: true })
}
