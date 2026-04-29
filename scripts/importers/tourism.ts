import { db } from '../../lib/db'
import { contacts } from '../../lib/db/schema'
import { readCsv, clean, extractEmail } from './utils'
import path from 'path'

const DATA_ROOT = path.resolve(__dirname, '../../../../')

export async function importTourism() {
  console.log('📂 Importing Tourism / Tour Operators...')
  const rows = readCsv(path.join(DATA_ROOT, 'Tourism', 'Tour Operators_.csv'))
  console.log(`   Found ${rows.length} rows`)

  const records = rows.map((r) => {
    const extra: Record<string, string> = {}
    for (const [k, v] of Object.entries(r)) {
      const c = clean(v)
      if (c) extra[k] = c
    }
    return {
      sourceFile: 'Tour Operators_.csv',
      sourceCategory: 'Tourism',
      subCategory: clean(r['Member Type'] || ''),
      association: 'TOAB',
      memberType: clean(r['Member Type'] || ''),
      memberSince: clean(r['Member Since'] || ''),
      membershipNo: clean(r['Membership Number'] || ''),
      name: clean(r['Representative Name'] || ''),
      company: clean(r['Company Name'] || ''),
      email: extractEmail(clean(r['Email'] || '')),
      phone: clean(r['Phone'] || ''),
      address: clean(r['Address'] || ''),
      website: clean(r['Website'] || ''),
      services: clean(r['Services'] || ''),
      extraData: extra,
    }
  }).filter(r => r.name || r.company)

  if (records.length > 0) {
    await db.insert(contacts).values(records)
  }

  console.log('📂 Importing Tourism / FBCCI Associations Refined...')
  const rows2 = readCsv(path.join(DATA_ROOT, 'Tourism', 'fbcci_associations_refined.csv'))
  const records2 = rows2.map((r) => {
    const extra: Record<string, string> = {}
    for (const [k, v] of Object.entries(r)) {
      const c = clean(v)
      if (c) extra[k] = c
    }
    return {
      sourceFile: 'fbcci_associations_refined.csv',
      sourceCategory: 'Tourism',
      subCategory: 'FBCCI Association',
      association: clean(r['Association Name'] || ''),
      name: '',
      company: clean(r['Association Name'] || ''),
      email: extractEmail(clean(r['Email'] || '')),
      phone: clean(r['Mobile'] || r['Telephone'] || ''),
      address: clean(r['Address'] || ''),
      website: clean(r['Website'] || ''),
      extraData: extra,
    }
  }).filter(r => r.company)

  if (records2.length > 0) {
    await db.insert(contacts).values(records2)
  }

  const total = records.length + records2.length
  console.log(`   ✅ Tourism: ${total} records imported`)
  return total
}
