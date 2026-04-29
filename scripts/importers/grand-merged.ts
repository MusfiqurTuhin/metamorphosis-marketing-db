import { db } from '../../lib/db'
import { contacts } from '../../lib/db/schema'
import { readCsv, clean, extractEmail, mapSourceToCategory } from './utils'
import path from 'path'

const DATA_ROOT = path.resolve(__dirname, '../../../../')

export async function importGrandMerged() {
  console.log('📂 Importing grand_merged.csv...')
  const rows = readCsv(path.join(DATA_ROOT, 'Gold Mine', 'grand_merged.csv'))
  console.log(`   Found ${rows.length} rows`)

  const BATCH = 500
  let imported = 0
  let skipped = 0

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const records = batch.map((r) => {
      // Primary columns by position (header: Serial,Name,Designation,Company,Address,Mobile,Email,Tel,Member_Since,Raw,Source File,...)
      const vals = Object.values(r)
      const keys = Object.keys(r)

      const serial     = clean(vals[0])
      const name       = clean(vals[1])
      const designation = clean(vals[2])
      const company    = clean(vals[3])
      const address    = clean(vals[4])
      const mobile     = clean(vals[5])
      const emailRaw   = clean(vals[6])
      const tel        = clean(vals[7])
      const memberSince = clean(vals[8])
      const sourceFile  = clean(vals[10]) || 'grand_merged.csv'

      const email = extractEmail(emailRaw) || extractEmail(address) || extractEmail(company)

      // Store all remaining columns in extra_data
      const extra: Record<string, string> = {}
      for (let j = 9; j < keys.length; j++) {
        const k = keys[j]
        const v = clean(vals[j])
        if (v && k) extra[k] = v
      }

      const { subCategory, association } = mapSourceToCategory(sourceFile)

      // Determine member type
      let memberType = ''
      if (sourceFile.includes('Associate')) memberType = 'Associate'
      else if (sourceFile.includes('General')) memberType = 'General'

      return {
        sourceFile,
        sourceCategory: 'Gold Mine',
        subCategory,
        association,
        memberType,
        memberSince,
        membershipNo: serial,
        name,
        company,
        designation,
        email,
        phone: mobile || tel,
        phone2: mobile && tel ? tel : '',
        address,
        extraData: extra,
      }
    })

    // Filter: keep rows with at least a name or company
    const valid = records.filter(r => r.name || r.company)
    skipped += records.length - valid.length

    if (valid.length > 0) {
      await db.insert(contacts).values(valid)
      imported += valid.length
    }

    process.stdout.write(`\r   Progress: ${Math.min(i + BATCH, rows.length)}/${rows.length} (${imported} imported, ${skipped} skipped)`)
  }
  console.log(`\n   ✅ grand_merged: ${imported} records imported, ${skipped} rows skipped`)
  return imported
}
