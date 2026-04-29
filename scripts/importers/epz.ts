import { execFileSync } from 'child_process'
import { db } from '../../lib/db'
import { contacts, NewContact } from '../../lib/db/schema'
import { readCsv, clean, extractEmail, extractPhone } from './utils'
import path from 'path'

const DATA_ROOT = path.resolve(process.cwd(), '../')

function readXlsxSheet(filePath: string, sheetName: string): Record<string, string>[] {
  const script = `
import openpyxl, json, sys, warnings
warnings.filterwarnings('ignore')
wb = openpyxl.load_workbook(sys.argv[1], read_only=True)
ws = wb[sys.argv[2]]
rows = list(ws.iter_rows(values_only=True))
if not rows:
    print('[]')
    sys.exit(0)
headers = [str(h) if h is not None else '' for h in rows[0]]
result = []
for row in rows[1:]:
    if any(c for c in row if c is not None):
        result.append({headers[i]: str(row[i]) if row[i] is not None else '' for i in range(len(headers))})
print(json.dumps(result, ensure_ascii=False))
`
  const out = execFileSync('python3', ['-c', script, filePath, sheetName], { maxBuffer: 50 * 1024 * 1024 })
  return JSON.parse(out.toString()) as Record<string, string>[]
}

async function insertBatch(records: NewContact[], label: string): Promise<number> {
  const BATCH = 300
  let n = 0
  for (let i = 0; i < records.length; i += BATCH) {
    await db.insert(contacts).values(records.slice(i, i + BATCH))
    n += records.slice(i, i + BATCH).length
    process.stdout.write(`\r   ${label}: ${n}/${records.length}`)
  }
  console.log(`\n   ✅ ${label}: ${n} records`)
  return n
}

export async function importEPZ() {
  let total = 0

  // 1. EPZ Decision Makers CSV
  console.log('📂 Importing EPZ Decision Makers...')
  const rows = readCsv(path.join(DATA_ROOT, 'EPZ', 'EPZ_Decision_Makers_Dashboard.xlsx - All Contacts.csv'))
  const dmRecords: NewContact[] = rows.map((r) => {
    const extra: Record<string, string> = {}
    for (const [k, v] of Object.entries(r)) { const c = clean(v); if (c) extra[k] = c }
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
      industry: clean(r['Category'] || ''),
      extraData: extra,
    }
  }).filter(r => r.name || r.company)
  total += await insertBatch(dmRecords, 'EPZ Decision Makers')

  // 2. BEPZA Lead Database (xlsx — All Leads sheet)
  console.log('📂 Importing BEPZA Lead Database (xlsx)...')
  const bepzaRows = readXlsxSheet(
    path.join(DATA_ROOT, 'EPZ', 'BEPZA_Lead_Database.xlsx'),
    'All Leads'
  )
  console.log(`   Found ${bepzaRows.length} rows`)
  const bepzaRecords: NewContact[] = bepzaRows.map((r) => {
    const extra: Record<string, string> = {}
    for (const [k, v] of Object.entries(r)) { const c = clean(v); if (c) extra[k] = c }
    return {
      sourceFile: 'BEPZA_Lead_Database.xlsx',
      sourceCategory: 'EPZ',
      subCategory: clean(r['Category'] || ''),
      association: clean(r['EPZ'] || ''),
      company: clean(r['Name'] || ''),
      address: clean(r['Address'] || ''),
      phone: extractPhone(clean(r['Phone'] || '')),
      website: clean(r['Website'] || ''),
      extraData: extra,
    }
  }).filter(r => r.company)
  total += await insertBatch(bepzaRecords, 'BEPZA Lead Database')

  return total
}
