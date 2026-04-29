import fs from 'fs'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Papa = require('papaparse')

export function readCsv(filePath: string): Record<string, string>[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
    relaxQuotes: true,
    delimiter: ',',
  })
  return (result.data ?? []) as Record<string, string>[]
}

export function clean(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = String(v).trim()
  if (s.toLowerCase() === 'n/a' || s.toLowerCase() === 'not provided' || s === '-') return ''
  return s
}

export function extractEmail(s: string): string {
  const match = s.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)
  return match ? match[0].toLowerCase() : ''
}

export function extractPhone(s: string): string {
  return s.replace(/[^\d+\-() ]/g, '').trim().slice(0, 50)
}

export function mapSourceToCategory(sourceFile: string): { subCategory: string; association: string } {
  const s = sourceFile.toUpperCase()
  if (s.includes('BGMEA')) return { subCategory: 'Textiles & Apparel (RMG)', association: 'BGMEA' }
  if (s.includes('BKMEA')) return { subCategory: 'Textiles & Apparel (RMG)', association: 'BKMEA' }
  if (s.includes('BGAPMEA')) return { subCategory: 'Textiles & Apparel (RMG)', association: 'BGAPMEA' }
  if (s.includes('BTTLMEA')) return { subCategory: 'Textiles & Apparel (RMG)', association: 'BTTLMEA' }
  if (s.includes('BTMA')) return { subCategory: 'Textiles & Apparel (RMG)', association: 'BTMA' }
  if (s.includes('BASIS')) return { subCategory: 'Engineering, Technology & Services', association: 'BASIS' }
  if (s.includes('BACCO')) return { subCategory: 'Engineering, Technology & Services', association: 'BACCO' }
  if (s.includes('BEIOA')) return { subCategory: 'Engineering, Technology & Services', association: 'BEIOA' }
  if (s.includes('BTA')) return { subCategory: 'Leather & Footwear', association: 'BTA' }
  if (s.includes('LFMEAB')) return { subCategory: 'Leather & Footwear', association: 'LFMEAB' }
  if (s.includes('BAPI')) return { subCategory: 'Pharmaceuticals', association: 'BAPI' }
  if (s.includes('BSAA')) return { subCategory: 'Shipbuilding & Maritime', association: 'BSAA' }
  if (s.includes('BJGEA')) return { subCategory: 'Jute & Jute Goods', association: 'BJGEA' }
  if (s.includes('BJMA')) return { subCategory: 'Jute & Jute Goods', association: 'BJMA' }
  if (s.includes('BJSA')) return { subCategory: 'Jute & Jute Goods', association: 'BJSA' }
  if (s.includes('BFFEA')) return { subCategory: 'Food & Agro-Processing', association: 'BFFEA' }
  if (s.includes('BLCFEA')) return { subCategory: 'Food & Agro-Processing', association: 'BLCFEA' }
  if (s.includes('FIAB')) return { subCategory: 'Food & Agro-Processing', association: 'FIAB' }
  if (s.includes('BAPA')) return { subCategory: 'Food & Agro-Processing', association: 'BAPA' }
  if (s.includes('BFVAPEA')) return { subCategory: 'Food & Agro-Processing', association: 'BFVAPEA' }
  if (s.includes('BANGLACRAFT')) return { subCategory: 'Handicrafts', association: 'Banglacraft' }
  if (s.includes('FBCCI')) return { subCategory: 'FBCCI', association: 'FBCCI' }
  return { subCategory: 'Other', association: '' }
}
