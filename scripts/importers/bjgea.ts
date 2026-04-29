import { db } from '../../lib/db'
import { contacts } from '../../lib/db/schema'
import { readCsv, clean, extractEmail } from './utils'
import path from 'path'

const DATA_ROOT = path.resolve(__dirname, '../../../../')

export async function importBJGEA() {
  console.log('📂 Importing BJGEA Member List (full, not just what is in grand_merged)...')
  const rows = readCsv(path.join(DATA_ROOT, 'Gold Mine', 'Jute & Jute Goods', 'BJGEA - Member List.csv'))
  console.log(`   Found ${rows.length} rows`)

  const BATCH = 500
  let imported = 0

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const records = batch.map((r) => {
      const vals = Object.values(r)
      const keys = Object.keys(r)
      const extra: Record<string, string> = {}
      for (let j = 0; j < keys.length; j++) {
        const v = clean(vals[j])
        if (v) extra[keys[j]] = v
      }

      // Try common column names
      const name = clean(r['Name'] || r['name'] || r['NAME'] || r['Representative Name'] || vals[1])
      const company = clean(r['Company'] || r['company'] || r['COMPANY'] || r['Company Name'] || vals[3])
      const email = extractEmail(clean(r['Email'] || r['email'] || r['EMAIL'] || ''))
        || extractEmail(Object.values(r).join(' '))
      const phone = clean(r['Mobile'] || r['Phone'] || r['mobile'] || r['phone'] || vals[5])
      const address = clean(r['Address'] || r['address'] || vals[4])
      const memberSince = clean(r['Member_Since'] || r['Member Since'] || '')
      const designation = clean(r['Designation'] || r['designation'] || vals[2])

      return {
        sourceFile: 'BJGEA - Member List.csv',
        sourceCategory: 'Gold Mine',
        subCategory: 'Jute & Jute Goods',
        association: 'BJGEA',
        name,
        company,
        designation,
        email,
        phone,
        address,
        memberSince,
        extraData: extra,
      }
    }).filter(r => r.name || r.company)

    if (records.length > 0) {
      await db.insert(contacts).values(records)
      imported += records.length
    }
    process.stdout.write(`\r   Progress: ${Math.min(i + BATCH, rows.length)}/${rows.length}`)
  }
  console.log(`\n   ✅ BJGEA: ${imported} records imported`)
  return imported
}
