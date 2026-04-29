import { db } from '../../lib/db'
import { contacts } from '../../lib/db/schema'
import { readCsv, clean, extractEmail } from './utils'
import path from 'path'

const DATA_ROOT = path.resolve(__dirname, '../../../../')

export async function importOdoo() {
  let total = 0

  // 1. global_partners.csv — Odoo partner agencies (with emails)
  console.log('📂 Importing Odoo global_partners.csv...')
  const partners = readCsv(path.join(DATA_ROOT, 'Odoo', 'global_partners.csv'))
  console.log(`   Found ${partners.length} rows`)

  const BATCH = 500
  for (let i = 0; i < partners.length; i += BATCH) {
    const batch = partners.slice(i, i + BATCH)
    const records = batch.map((r) => {
      const extra: Record<string, string> = {}
      for (const [k, v] of Object.entries(r)) {
        const c = clean(v)
        if (c) extra[k] = c
      }
      return {
        sourceFile: 'global_partners.csv',
        sourceCategory: 'Odoo',
        subCategory: clean(r['Partner Tier'] || ''),
        association: 'Odoo Partner',
        name: '',
        company: clean(r['Partner Name'] || ''),
        email: extractEmail(clean(r['Email'] || '')),
        phone: clean(r['Phone'] || ''),
        address: clean(r['Address'] || ''),
        city: clean(r['City'] || ''),
        country: clean(r['Country'] || 'International'),
        website: clean(r['Website'] || ''),
        services: clean(r['Services'] || ''),
        industry: clean(r['Industries'] || ''),
        membershipNo: clean(r['Partner ID'] || ''),
        extraData: extra,
      }
    }).filter(r => r.company)

    if (records.length > 0) {
      await db.insert(contacts).values(records)
      total += records.length
    }
    process.stdout.write(`\r   Progress: ${Math.min(i + BATCH, partners.length)}/${partners.length}`)
  }
  console.log(`\n   ✅ global_partners: ${total} records`)

  // 2. global_partner_clients.csv — Odoo partner client companies (60k rows)
  console.log('📂 Importing Odoo global_partner_clients.csv (60k rows)...')
  const clients = readCsv(path.join(DATA_ROOT, 'Odoo', 'global_partner_clients.csv'))
  console.log(`   Found ${clients.length} rows`)

  let clientCount = 0
  for (let i = 0; i < clients.length; i += BATCH) {
    const batch = clients.slice(i, i + BATCH)
    const records = batch.map((r) => {
      const extra: Record<string, string> = {}
      for (const [k, v] of Object.entries(r)) {
        const c = clean(v)
        if (c) extra[k] = c
      }
      return {
        sourceFile: 'global_partner_clients.csv',
        sourceCategory: 'Odoo',
        subCategory: clean(r['Client Industry'] || ''),
        association: 'Odoo Client',
        name: '',
        company: clean(r['Client Name'] || ''),
        industry: clean(r['Client Industry'] || ''),
        membershipNo: clean(r['Partner ID'] || ''),
        country: 'International',
        extraData: extra,
      }
    }).filter(r => r.company)

    if (records.length > 0) {
      await db.insert(contacts).values(records)
      clientCount += records.length
    }
    process.stdout.write(`\r   Progress: ${Math.min(i + BATCH, clients.length)}/${clients.length} (${clientCount} inserted)`)
  }
  console.log(`\n   ✅ global_partner_clients: ${clientCount} records`)
  total += clientCount

  // 3. Import.csv — additional Odoo partners
  console.log('📂 Importing Odoo Import.csv...')
  const importRows = readCsv(path.join(DATA_ROOT, 'Odoo', 'Import.csv'))
  const importRecords = importRows.map((r) => {
    const extra: Record<string, string> = {}
    for (const [k, v] of Object.entries(r)) {
      const c = clean(v)
      if (c) extra[k] = c
    }
    return {
      sourceFile: 'Import.csv',
      sourceCategory: 'Odoo',
      subCategory: clean(r['Partner Tier'] || ''),
      association: 'Odoo Partner',
      company: clean(r['Partner Name'] || ''),
      email: extractEmail(clean(r['Email'] || '')),
      phone: clean(r['Phone'] || ''),
      address: clean(r['Address'] || ''),
      city: clean(r['City'] || ''),
      country: clean(r['Country'] || 'International'),
      website: clean(r['Website'] || ''),
      membershipNo: clean(r['Partner ID'] || ''),
      services: clean(r['Services'] || ''),
      industry: clean(r['Industries'] || ''),
      extraData: extra,
    }
  }).filter(r => r.company)

  if (importRecords.length > 0) {
    await db.insert(contacts).values(importRecords)
    total += importRecords.length
  }
  console.log(`   ✅ Import.csv: ${importRecords.length} records`)

  console.log(`   ✅ Odoo total: ${total} records imported`)
  return total
}
