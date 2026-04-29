import { execFileSync } from 'child_process'
import { readFileSync, writeFileSync, unlinkSync } from 'fs'
import { tmpdir } from 'os'
import { db } from '../../lib/db'
import { contacts, NewContact } from '../../lib/db/schema'
import { clean, extractEmail, extractPhone } from './utils'
import path from 'path'

const ROOT = path.resolve(__dirname, '../../../')

// Use Python to parse grand_merged.csv (PapaParse fails on multi-line quoted fields).
// Filters to PDF-only source rows and writes to a temp file to stay within Node.js string limits.
function parsePdfRowsWithPython(filePath: string): Record<string, string>[] {
  const tmpFile = path.join(tmpdir(), `grand_merged_pdf_${Date.now()}.json`)
  const script = `
import csv, json, sys
PDF_SOURCES = ['FBCCI', 'BFVAPEA', 'BJMA', 'BJSA', 'BAPA']
rows = []
with open(sys.argv[1], encoding='utf-8', errors='replace') as f:
    reader = csv.DictReader(f)
    for row in reader:
        src = row.get('Source File', '')
        if any(s in src for s in PDF_SOURCES):
            rows.append(dict(row))
with open(sys.argv[2], 'w', encoding='utf-8') as out:
    json.dump(rows, out, ensure_ascii=False)
`
  try {
    execFileSync('python3', ['-c', script, filePath, tmpFile], { timeout: 120000 })
    const data = JSON.parse(readFileSync(tmpFile, 'utf-8')) as Record<string, string>[]
    return data
  } finally {
    try { unlinkSync(tmpFile) } catch { /* ignore */ }
  }
}

// Extract first email found anywhere in a string
function firstEmail(s: string): string {
  return extractEmail(s)
}

// Extract lines from a multi-line blob as an array
function lines(s: string): string[] {
  return s.split(/[\n\r]+/).map(l => l.trim()).filter(Boolean)
}

function mapBapa(r: Record<string, string>): NewContact {
  const company = clean(r['Name of Member Company']).replace(/\n/g, ' ')
  const name = clean(r['Name of Proprietor/Chairman/Managing Director & Contact']).replace(/\n/g, ' ')
  const address = clean(r['Address']).replace(/\n/g, ', ')
  const phone = extractPhone(clean(r['Col_6'] || '').replace(/\n/g, ' '))
  const email = firstEmail(clean(r['Col_7'] || ''))
  const products = clean(r['Processed Products'] || '').replace(/\n/g, ', ')
  const extra: Record<string, string> = {}
  for (const [k, v] of Object.entries(r)) { const c = clean(v); if (c) extra[k] = c }
  return {
    sourceFile: r['Source File'],
    sourceCategory: 'Gold Mine',
    subCategory: 'Food & Agro-Processing',
    association: 'BAPA',
    membershipNo: clean(r['Mem. No.'] || r['Sl. NO'] || ''),
    company,
    name,
    designation: clean(r['Col_5'] || ''),
    address,
    phone,
    email,
    products,
    extraData: extra,
  }
}

function mapBjma(r: Record<string, string>): NewContact {
  const millField = clean(r['NAME OF THE MILLS AND NO. OF LOOMS.'] || '')
  const company = lines(millField)[0] || ''
  const headsField = clean(r['HEADS OF ORGANIZATION'] || '')
  const headsLines = lines(headsField)
  const name = headsLines[0] || ''
  const addressField = clean(r['HEAD OFFICE ADDRESS'] || r['LOCATION OF THE MILLS'] || '')
  const address = addressField.replace(/\n/g, ', ')
  const telField = clean(r['TELEPHONE'] || '')
  const email = firstEmail(telField)
  const phone = extractPhone(telField.split('\n').find(l => /\d{7,}/.test(l)) || '')
  const extra: Record<string, string> = {}
  for (const [k, v] of Object.entries(r)) { const c = clean(v); if (c) extra[k] = c }
  return {
    sourceFile: r['Source File'],
    sourceCategory: 'Gold Mine',
    subCategory: 'Jute & Jute Goods',
    association: 'BJMA',
    membershipNo: clean(r['Sl. No.'] || ''),
    company,
    name,
    address,
    phone,
    email,
    extraData: extra,
  }
}

function mapBjsa(r: Record<string, string>): NewContact {
  const company = clean(r['NAME OF FIRMS'] || '').replace(/\n/g, ' ')
  const localAddr = clean(r['LOCAL/ MILL ADDRESS'] || '')
  const email = firstEmail(localAddr)
  const phone = extractPhone(localAddr.split('\n').find(l => /Ph:|Tel:|Mobile:|Mob:/.test(l)) || '')
  const address = lines(localAddr).slice(0, 2).join(', ')
  const headsField = clean(r['PRINCIPAL OFFICER'] || '')
  const name = lines(headsField)[0] || ''
  const extra: Record<string, string> = {}
  for (const [k, v] of Object.entries(r)) { const c = clean(v); if (c) extra[k] = c }
  return {
    sourceFile: r['Source File'],
    sourceCategory: 'Gold Mine',
    subCategory: 'Jute & Jute Goods',
    association: 'BJSA',
    membershipNo: clean(r['SL NO'] || ''),
    company,
    name,
    address,
    phone,
    email,
    extraData: extra,
  }
}

function mapBfvapea(r: Record<string, string>): NewContact {
  const blob = clean(r['Company Name & Address'] || '')
  const blobLines = lines(blob)
  const company = blobLines[0] || ''
  const email = firstEmail(blob)
  const phoneLine = blobLines.find(l => /Mobile:|Phone:|Tel:/.test(l)) || ''
  const phone = extractPhone(phoneLine.replace(/Mobile:|Phone:|Tel:/g, ''))
  const address = blobLines.slice(2, 4).join(', ')
  const name = blobLines[1] || ''
  const extra: Record<string, string> = {}
  for (const [k, v] of Object.entries(r)) { const c = clean(v); if (c) extra[k] = c }
  return {
    sourceFile: r['Source File'],
    sourceCategory: 'Gold Mine',
    subCategory: 'Food & Agro-Processing',
    association: 'BFVAPEA',
    memberType: r['Source File'].includes('Associate') ? 'Associate' : 'General',
    membershipNo: clean(r['Member Reg. No'] || ''),
    memberSince: clean(r['Date of Renew'] || ''),
    company,
    name,
    address,
    phone,
    email,
    extraData: extra,
  }
}

function mapFbcciAssociation(r: Record<string, string>): NewContact {
  const assocBlob = clean(r['Name of Association'] || '')
  const assocLines = lines(assocBlob)
  const company = assocLines.slice(0, 3).join(' ')
  const address = assocLines.slice(3, 5).join(', ')
  const email = firstEmail(assocBlob)
  const phone = extractPhone(assocLines.find(l => /Tel:|Mob:|Phone:|Mobile:/.test(l)) || '')
  const voterBlob = clean(r['Col_7'] || '')
  const name = lines(voterBlob)[0] || ''
  const extra: Record<string, string> = {}
  for (const [k, v] of Object.entries(r)) { const c = clean(v); if (c) extra[k] = c }
  return {
    sourceFile: r['Source File'],
    sourceCategory: 'Gold Mine',
    subCategory: 'FBCCI',
    association: 'FBCCI',
    membershipNo: clean(r['Col_0'] || r['Col_4'] || ''),
    company,
    name,
    address,
    phone,
    email,
    extraData: extra,
  }
}

function mapFbcciChamber(r: Record<string, string>): NewContact {
  const chamberBlob = clean(r['Name of Chamber'] || '')
  const chamberLines = lines(chamberBlob)
  const company = chamberLines[0] || ''
  const address = chamberLines.slice(1, 3).join(', ')
  const email = firstEmail(chamberBlob)
  const phone = extractPhone(chamberLines.find(l => /Tel:|Mob:|Phone:|Mobile:/.test(l)) || '')
  const voterBlob = clean(r['Col_7'] || '')
  const voterLines = lines(voterBlob)
  const name = voterLines[0] || ''
  const extra: Record<string, string> = {}
  for (const [k, v] of Object.entries(r)) { const c = clean(v); if (c) extra[k] = c }
  return {
    sourceFile: r['Source File'],
    sourceCategory: 'Gold Mine',
    subCategory: 'FBCCI',
    association: 'FBCCI',
    membershipNo: clean(r['Col_0'] || r['Col_4'] || ''),
    company,
    name,
    address,
    phone,
    email,
    extraData: extra,
  }
}

function mapRow(r: Record<string, string>): NewContact | null {
  const src = r['Source File'] || ''
  if (src.includes('BAPA')) return mapBapa(r)
  if (src.includes('BJMA')) return mapBjma(r)
  if (src.includes('BJSA')) return mapBjsa(r)
  if (src.includes('BFVAPEA')) return mapBfvapea(r)
  if (src.includes('FBCCI - Final Voter List (Association)')) return mapFbcciAssociation(r)
  if (src.includes('FBCCI - Final Voter List (Chamber)')) return mapFbcciChamber(r)
  return null
}

export async function importGrandMerged() {
  console.log('📂 Parsing grand_merged.csv with Python (handles multi-line fields)...')
  const csvPath = path.join(ROOT, 'Gold Mine', 'grand_merged.csv')
  const pdfRows = parsePdfRowsWithPython(csvPath)
  console.log(`   PDF-only rows to import: ${pdfRows.length}`)

  const BATCH = 300
  let imported = 0
  let skipped = 0

  for (let i = 0; i < pdfRows.length; i += BATCH) {
    const batch = pdfRows.slice(i, i + BATCH)
    const records: NewContact[] = []
    for (const r of batch) {
      const mapped = mapRow(r)
      if (!mapped) { skipped++; continue }
      if (!mapped.company && !mapped.name) { skipped++; continue }
      records.push(mapped)
    }
    if (records.length > 0) {
      await db.insert(contacts).values(records)
      imported += records.length
    }
    process.stdout.write(`\r   Progress: ${Math.min(i + BATCH, pdfRows.length)}/${pdfRows.length} (${imported} imported)`)
  }
  console.log(`\n   ✅ grand_merged PDF-only: ${imported} records imported, ${skipped} skipped`)
  return imported
}
