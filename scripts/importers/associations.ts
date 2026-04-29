import { db } from '../../lib/db'
import { contacts } from '../../lib/db/schema'
import { readCsv, clean } from './utils'
import path from 'path'

const DATA_ROOT = path.resolve(__dirname, '../../../../')

export async function importAssociations() {
  console.log('📂 Importing Associations List...')
  const rows = readCsv(path.join(DATA_ROOT, 'Associations List', 'associations.csv'))
  console.log(`   Found ${rows.length} rows`)

  const records = rows.map((r) => {
    const extra: Record<string, string> = {}
    for (const [k, v] of Object.entries(r)) {
      const c = clean(v)
      if (c) extra[k] = c
    }
    const vals = Object.values(r)
    const keys = Object.keys(r)
    return {
      sourceFile: 'associations.csv',
      sourceCategory: 'Associations List',
      subCategory: 'Business Association',
      membershipNo: clean(vals[0]),
      company: clean(r['Name of Association'] || vals[1] || ''),
      extraData: extra,
    }
  }).filter(r => r.company)

  if (records.length > 0) {
    await db.insert(contacts).values(records)
  }
  console.log(`   ✅ Associations: ${records.length} records imported`)
  return records.length
}
