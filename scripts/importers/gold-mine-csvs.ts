import { db } from '../../lib/db'
import { contacts, NewContact } from '../../lib/db/schema'
import { readCsv, clean, extractEmail } from './utils'
import path from 'path'

const ROOT = path.resolve(__dirname, '../../../')

async function insertBatch(records: NewContact[], label: string) {
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

// Generic: store ALL columns in extra_data, pull out named fields
function mapGeneric(r: Record<string, string>, sourceFile: string, sourceCategory: string, subCategory: string, association: string, memberType = '') {
  const extra: Record<string, string> = {}
  for (const [k, v] of Object.entries(r)) { const c = clean(v); if (c) extra[k] = c }
  const vals = Object.values(r)
  const emailVal = (() => {
    for (const v of vals) { const e = extractEmail(clean(v)); if (e) return e }
    return ''
  })()
  return { sourceFile, sourceCategory, subCategory, association, memberType, extraData: extra, email: emailVal }
}

// ──────────────────────────────────────────────────
// BGMEA General  (Company Name,BGMEA Reg No,EPB Reg No,Mailing Address,Factory Address,Phone,Fax,Email,Website,Contact Person,Directors,Factory Type,Products,...)
// ──────────────────────────────────────────────────
export async function importBGMEAGeneral() {
  const rows = readCsv(path.join(ROOT, 'Gold Mine/Textiles & Apparel (RMG)/BGMEA/BGMEA - General Member List.csv'))
  const records: NewContact[] = rows.map(r => ({
    ...mapGeneric(r, 'BGMEA - General Member List.csv', 'Gold Mine', 'Textiles & Apparel (RMG)', 'BGMEA', 'General'),
    company:     clean(r['Company Name']),
    membershipNo: clean(r['BGMEA Reg No']),
    address:     clean(r['Mailing Address'] || r['Factory Address']),
    phone:       clean(r['Phone']),
    email:       extractEmail(clean(r['Email'] || '')),
    website:     clean(r['Website']),
    name:        clean(r['Contact Person']),
    products:    clean(r['Products']),
  })).filter(r => r.company || r.name)
  return insertBatch(records, 'BGMEA General')
}

// ──────────────────────────────────────────────────
// BGMEA Associate  (Company Name,Membership No,Contact Person,Designation,Company Address,Factory Address,Phone,Fax,Email,Website,Products,Association)
// ──────────────────────────────────────────────────
export async function importBGMEAAssociate() {
  const rows = readCsv(path.join(ROOT, 'Gold Mine/Textiles & Apparel (RMG)/BGMEA/BGMEA - Associate Member List.csv'))
  const records: NewContact[] = rows.map(r => ({
    ...mapGeneric(r, 'BGMEA - Associate Member List.csv', 'Gold Mine', 'Textiles & Apparel (RMG)', 'BGMEA', 'Associate'),
    company:      clean(r['Company Name']),
    membershipNo: clean(r['Membership No']),
    name:         clean(r['Contact Person']),
    designation:  clean(r['Designation']),
    address:      clean(r['Company Address'] || r['Factory Address']),
    phone:        clean(r['Phone']),
    email:        extractEmail(clean(r['Email'] || '')),
    website:      clean(r['Website']),
    products:     clean(r['Products']),
  })).filter(r => r.company || r.name)
  return insertBatch(records, 'BGMEA Associate')
}

// ──────────────────────────────────────────────────
// BKMEA  (Factory Name,BKMEA Membership No.,Membership Category,Date of Establishment,Factory Address,Mailing Address,Owner Name,Owner Email,Owner Mobile,Representative Name,Representative Email,Representative Mobile,...)
// ──────────────────────────────────────────────────
export async function importBKMEA() {
  const rows = readCsv(path.join(ROOT, 'Gold Mine/Textiles & Apparel (RMG)/BKMEA - Member List.csv'))
  const records: NewContact[] = rows.map(r => ({
    ...mapGeneric(r, 'BKMEA - Member List.csv', 'Gold Mine', 'Textiles & Apparel (RMG)', 'BKMEA'),
    company:      clean(r['Factory Name']),
    membershipNo: clean(r['BKMEA Membership No.']),
    memberType:   clean(r['Membership Category']),
    address:      clean(r['Mailing Address'] || r['Factory Address']),
    name:         clean(r['Owner Name'] || r['Representative Name']),
    email:        extractEmail(clean(r['Owner Email'] || r['Representative Email'] || '')),
    phone:        clean(r['Owner Mobile'] || r['Representative Mobile']),
    memberSince:  clean(r['Date of Establishment']),
  })).filter(r => r.company || r.name)
  return insertBatch(records, 'BKMEA')
}

// ──────────────────────────────────────────────────
// BASIS  (Organization,Representative,Designation,Address,Phone,Email,Website,Profile PDF)
// ──────────────────────────────────────────────────
export async function importBASIS() {
  const rows = readCsv(path.join(ROOT, 'Gold Mine/Engineering, Technology & Services/BASIS - Member List.csv'))
  const records: NewContact[] = rows.map(r => ({
    ...mapGeneric(r, 'BASIS - Member List.csv', 'Gold Mine', 'Engineering, Technology & Services', 'BASIS'),
    company:     clean(r['Organization']),
    name:        clean(r['Representative']),
    designation: clean(r['Designation']),
    address:     clean(r['Address']),
    phone:       clean(r['Phone']),
    email:       extractEmail(clean(r['Email'] || '')),
    website:     clean(r['Website']),
  })).filter(r => r.company || r.name)
  return insertBatch(records, 'BASIS')
}

// ──────────────────────────────────────────────────
// BACCO  (Company Name,Membership ID,Address,Phone,Email,Website,Representative Name,Designation,Detail URL)
// ──────────────────────────────────────────────────
export async function importBACCO() {
  const rows = readCsv(path.join(ROOT, 'Gold Mine/Engineering, Technology & Services/BACCO - Member List.csv'))
  const records: NewContact[] = rows.map(r => ({
    ...mapGeneric(r, 'BACCO - Member List.csv', 'Gold Mine', 'Engineering, Technology & Services', 'BACCO'),
    company:      clean(r['Company Name']),
    membershipNo: clean(r['Membership ID']),
    address:      clean(r['Address']),
    phone:        clean(r['Phone']),
    email:        extractEmail(clean(r['Email'] || '')),
    website:      clean(r['Website']),
    name:         clean(r['Representative Name']),
    designation:  clean(r['Designation']),
  })).filter(r => r.company || r.name)
  return insertBatch(records, 'BACCO')
}

// ──────────────────────────────────────────────────
// BGAPMEA  (same structure as BGMEA Associate)
// ──────────────────────────────────────────────────
export async function importBGAPMEA() {
  const rows = readCsv(path.join(ROOT, 'Gold Mine/Textiles & Apparel (RMG)/BGAPMEA - Member List.csv'))
  const records: NewContact[] = rows.map(r => ({
    ...mapGeneric(r, 'BGAPMEA - Member List.csv', 'Gold Mine', 'Textiles & Apparel (RMG)', 'BGAPMEA'),
    company:      clean(r['Company Name']),
    membershipNo: clean(r['Membership No']),
    name:         clean(r['Contact Person']),
    designation:  clean(r['Designation']),
    address:      clean(r['Company Address'] || r['Factory Address']),
    phone:        clean(r['Phone']),
    email:        extractEmail(clean(r['Email'] || '')),
    website:      clean(r['Website']),
    products:     clean(r['Products']),
  })).filter(r => r.company || r.name)
  return insertBatch(records, 'BGAPMEA')
}

// ──────────────────────────────────────────────────
// BTA General + Associate  (Company Name,Representative,Designation,Address,Email,Phone,Member No,Product)
// ──────────────────────────────────────────────────
export async function importBTA() {
  let total = 0
  for (const [file, memberType] of [
    ['Gold Mine/Leather & Footwear/BTA/BTA - General Member List.csv', 'General'],
    ['Gold Mine/Leather & Footwear/BTA/BTA - Associate Member List.csv', 'Associate'],
  ] as [string, string][]) {
    const rows = readCsv(path.join(ROOT, file))
    const records: NewContact[] = rows.map(r => ({
      ...mapGeneric(r, path.basename(file), 'Gold Mine', 'Leather & Footwear', 'BTA', memberType),
      company:      clean(r['Company Name']),
      name:         clean(r['Representative']),
      designation:  clean(r['Designation']),
      address:      clean(r['Address']),
      email:        extractEmail(clean(r['Email'] || '')),
      phone:        clean(r['Phone']),
      membershipNo: clean(r['Member No']),
      products:     clean(r['Product']),
    })).filter(r => r.company || r.name)
    total += await insertBatch(records, `BTA ${memberType}`)
  }
  return total
}

// ──────────────────────────────────────────────────
// LFMEAB  (Category,Company Name,Head Office Address,Factory Address,Email Address,Phone,Managing Director)
// ──────────────────────────────────────────────────
export async function importLFMEAB() {
  let total = 0
  for (const file of [
    'Gold Mine/Leather & Footwear/LFMEAB/LFMEAB - Member List.csv',
    'Gold Mine/Leather & Footwear/LFMEAB/LFMEAB - Member List (Old).csv',
  ]) {
    const rows = readCsv(path.join(ROOT, file))
    const records: NewContact[] = rows.map(r => ({
      ...mapGeneric(r, path.basename(file), 'Gold Mine', 'Leather & Footwear', 'LFMEAB'),
      subCategory:  clean(r['Category']) || 'Leather & Footwear',
      company:      clean(r['Company Name']),
      address:      clean(r['Head Office Address'] || r['Factory Address']),
      email:        extractEmail(clean(r['Email Address'] || r['Email'] || '')),
      phone:        clean(r['Phone']),
      name:         clean(r['Managing Director']),
    })).filter(r => r.company || r.name)
    total += await insertBatch(records, `LFMEAB (${path.basename(file)})`)
  }
  return total
}

// ──────────────────────────────────────────────────
// BAPI  (Sl. No.,Company Name,Address,Email,Representative Name,Telephone,Web Address)
// ──────────────────────────────────────────────────
export async function importBAPI() {
  const rows = readCsv(path.join(ROOT, 'Gold Mine/Pharmaceuticals/BAPI - Member List.csv'))
  const records: NewContact[] = rows.map(r => ({
    ...mapGeneric(r, 'BAPI - Member List.csv', 'Gold Mine', 'Pharmaceuticals', 'BAPI'),
    membershipNo: clean(r['Sl. No.']),
    company:      clean(r['Company Name']),
    address:      clean(r['Address']),
    email:        extractEmail(clean(r['Email'] || '')),
    name:         clean(r['Representative Name']),
    phone:        clean(r['Telephone']),
    website:      clean(r['Web Address']),
  })).filter(r => r.company || r.name)
  return insertBatch(records, 'BAPI')
}

// ──────────────────────────────────────────────────
// BSAA  (Organization,Type,Address,Email,Phone)
// ──────────────────────────────────────────────────
export async function importBSAA() {
  const rows = readCsv(path.join(ROOT, 'Gold Mine/Shipbuilding & Maritime/BSAA - Member List.csv'))
  const records: NewContact[] = rows.map(r => ({
    ...mapGeneric(r, 'BSAA - Member List.csv', 'Gold Mine', 'Shipbuilding & Maritime', 'BSAA'),
    company:     clean(r['Organization']),
    memberType:  clean(r['Type']),
    address:     clean(r['Address']),
    email:       extractEmail(clean(r['Email'] || '')),
    phone:       clean(r['Phone']),
  })).filter(r => r.company)
  return insertBatch(records, 'BSAA')
}

// ──────────────────────────────────────────────────
// BFFEA  (Company Name,Office Address,Factory Address,Phone,Mobile,Fax,Email,Website,Brand,USFDA Code,EU Approval No,USFDA Reg No,BFFEA Membership No,Contact Person Name,Contact Person Designation,...)
// ──────────────────────────────────────────────────
export async function importBFFEA() {
  const rows = readCsv(path.join(ROOT, 'Gold Mine/Food & Agro-Processing/BFFEA - Member List.csv'))
  const records: NewContact[] = rows.map(r => ({
    ...mapGeneric(r, 'BFFEA - Member List.csv', 'Gold Mine', 'Food & Agro-Processing', 'BFFEA'),
    company:      clean(r['Company Name']),
    address:      clean(r['Office Address'] || r['Factory Address']),
    phone:        clean(r['Mobile'] || r['Phone']),
    email:        extractEmail(clean(r['Email'] || '')),
    website:      clean(r['Website']),
    membershipNo: clean(r['BFFEA Membership No']),
    name:         clean(r['Contact Person Name']),
    designation:  clean(r['Contact Person Designation']),
  })).filter(r => r.company)
  return insertBatch(records, 'BFFEA')
}

// ──────────────────────────────────────────────────
// BLCFEA  (Company,Name,Designation,Address,Mobile,Email)
// ──────────────────────────────────────────────────
export async function importBLCFEA() {
  const rows = readCsv(path.join(ROOT, 'Gold Mine/Food & Agro-Processing/BLCFEA - Member List.csv'))
  const records: NewContact[] = rows.map(r => ({
    ...mapGeneric(r, 'BLCFEA - Member List.csv', 'Gold Mine', 'Food & Agro-Processing', 'BLCFEA'),
    company:     clean(r['Company']),
    name:        clean(r['Name']),
    designation: clean(r['Designation']),
    address:     clean(r['Address']),
    phone:       clean(r['Mobile']),
    email:       extractEmail(clean(r['Email'] || '')),
  })).filter(r => r.company || r.name)
  return insertBatch(records, 'BLCFEA')
}

// ──────────────────────────────────────────────────
// FIAB  (Company Name,Representative,Designation,Head Office Address,Factory Address,Mobile,Email)
// ──────────────────────────────────────────────────
export async function importFIAB() {
  const rows = readCsv(path.join(ROOT, 'Gold Mine/Food & Agro-Processing/FIAB - Member List.csv'))
  const records: NewContact[] = rows.map(r => ({
    ...mapGeneric(r, 'FIAB - Member List.csv', 'Gold Mine', 'Food & Agro-Processing', 'FIAB'),
    company:     clean(r['Company Name']),
    name:        clean(r['Representative']),
    designation: clean(r['Designation']),
    address:     clean(r['Head Office Address'] || r['Factory Address']),
    phone:       clean(r['Mobile']),
    email:       extractEmail(clean(r['Email'] || '')),
  })).filter(r => r.company || r.name)
  return insertBatch(records, 'FIAB')
}

// ──────────────────────────────────────────────────
// Banglacraft  (Member Type,SL,Organization,Representative,Address,Phone,Email,Website)
// ──────────────────────────────────────────────────
export async function importBanglacraft() {
  const rows = readCsv(path.join(ROOT, 'Gold Mine/Handicrafts/Banglacraft - Member List.csv'))
  const records: NewContact[] = rows.map(r => ({
    ...mapGeneric(r, 'Banglacraft - Member List.csv', 'Gold Mine', 'Handicrafts', 'Banglacraft'),
    memberType:   clean(r['Member Type']),
    membershipNo: clean(r['SL']),
    company:      clean(r['Organization']),
    name:         clean(r['Representative']),
    address:      clean(r['Address']),
    phone:        clean(r['Phone']),
    email:        extractEmail(clean(r['Email'] || '')),
    website:      clean(r['Website']),
  })).filter(r => r.company || r.name)
  return insertBatch(records, 'Banglacraft')
}

// ──────────────────────────────────────────────────
// BTTLMEA  (Serial No.,Factory Name,Representative Name,Designation,Address,Phone,Mobile,Email,Business Type)
// ──────────────────────────────────────────────────
export async function importBTTLMEA() {
  const rows = readCsv(path.join(ROOT, 'Gold Mine/Textiles & Apparel (RMG)/BTTLMEA - Member List.csv'))
  const records: NewContact[] = rows.map(r => ({
    ...mapGeneric(r, 'BTTLMEA - Member List.csv', 'Gold Mine', 'Textiles & Apparel (RMG)', 'BTTLMEA'),
    membershipNo: clean(r['Serial No.']),
    company:      clean(r['Factory Name']),
    name:         clean(r['Representative Name']),
    designation:  clean(r['Designation']),
    address:      clean(r['Address']),
    phone:        clean(r['Mobile'] || r['Phone']),
    email:        extractEmail(clean(r['Email'] || '')),
    subCategory:  clean(r['Business Type']) || 'Textiles & Apparel (RMG)',
  })).filter(r => r.company || r.name)
  return insertBatch(records, 'BTTLMEA')
}

// ──────────────────────────────────────────────────
// BJGEA  (Serial,Name,Designation,Company,Address,Mobile,Email,Tel,Member_Since,Raw)
// ──────────────────────────────────────────────────
export async function importBJGEAFull() {
  const rows = readCsv(path.join(ROOT, 'Gold Mine/Jute & Jute Goods/BJGEA - Member List.csv'))
  const records: NewContact[] = rows.map(r => ({
    ...mapGeneric(r, 'BJGEA - Member List.csv', 'Gold Mine', 'Jute & Jute Goods', 'BJGEA'),
    membershipNo: clean(r['Serial']),
    name:         clean(r['Name']),
    designation:  clean(r['Designation']),
    company:      clean(r['Company']),
    address:      clean(r['Address']),
    phone:        clean(r['Mobile']),
    email:        extractEmail(clean(r['Email'] || '')),
    memberSince:  clean(r['Member_Since']),
  })).filter(r => r.name || r.company)
  return insertBatch(records, 'BJGEA')
}
