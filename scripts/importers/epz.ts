import { db } from '../../lib/db'
import { contacts } from '../../lib/db/schema'
import { readCsv, clean, extractEmail } from './utils'
import path from 'path'

const DATA_ROOT = path.resolve(__dirname, '../../../../')

export async function importEPZ() {
  console.log('📂 Importing EPZ Decision Makers...')
  const rows = readCsv(path.join(DATA_ROOT, 'EPZ', 'EPZ_Decision_Makers_Dashboard.xlsx - All Contacts.csv'))
  console.log(`   Found ${rows.length} rows`)

  const records = rows.map((r) => {
    const extra: Record<string, string> = {}
    for (const [k, v] of Object.entries(r)) {
      const c = clean(v)
      if (c) extra[k] = c
    }
    return {
      sourceFile: 'EPZ_Decision_Makers_Dashboard.csv',
      sourceCategory: 'EPZ',
      subCategory: clean(r['Category'] || ''),
      association: clean(r['EPZ'] || ''),
      name: clean(r['Contact_Full_Name'] || ''),
      company: clean(r['Company_Name'] || ''),
      designation: clean(r['Job_Title'] || ''),
      email: extractEmail(clean(r['Email'] || '')),
      phone: clean(r['Phone'] || ''),
      website: clean(r['Website'] || ''),
      address: '',
      industry: clean(r['Category'] || ''),
      extraData: extra,
    }
  }).filter(r => r.name || r.company)

  if (records.length > 0) {
    await db.insert(contacts).values(records)
  }
  console.log(`   ✅ EPZ: ${records.length} records imported`)
  return records.length
}
