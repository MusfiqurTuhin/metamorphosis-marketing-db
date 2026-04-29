import 'dotenv/config'
import { db } from '../lib/db'
import { sql } from 'drizzle-orm'

import { importGrandMerged } from './importers/grand-merged'
import { importEPZ } from './importers/epz'
import { importTourism } from './importers/tourism'
import { importOdoo } from './importers/odoo'
import { importAssociations } from './importers/associations'

import {
  importBGMEAGeneral,
  importBGMEAAssociate,
  importBKMEA,
  importBASIS,
  importBACCO,
  importBGAPMEA,
  importBTA,
  importLFMEAB,
  importBAPI,
  importBSAA,
  importBFFEA,
  importBLCFEA,
  importFIAB,
  importBanglacraft,
  importBTTLMEA,
  importBJGEAFull,
} from './importers/gold-mine-csvs'

async function main() {
  console.log('🚀 MetaMorPhosis Marketing Database Import')
  console.log('==========================================\n')

  console.log('🗑️  Clearing existing data...')
  await db.execute(sql`TRUNCATE TABLE contacts RESTART IDENTITY`)
  console.log('   ✅ Table cleared\n')

  const results: Record<string, number> = {}

  // ── Gold Mine: individual CSVs ──
  results['BGMEA General']    = await importBGMEAGeneral();    console.log()
  results['BGMEA Associate']  = await importBGMEAAssociate();  console.log()
  results['BKMEA']            = await importBKMEA();            console.log()
  results['BASIS']            = await importBASIS();            console.log()
  results['BACCO']            = await importBACCO();            console.log()
  results['BGAPMEA']          = await importBGAPMEA();          console.log()
  results['BTA']              = await importBTA();              console.log()
  results['LFMEAB']           = await importLFMEAB();           console.log()
  results['BAPI']             = await importBAPI();             console.log()
  results['BSAA']             = await importBSAA();             console.log()
  results['BFFEA']            = await importBFFEA();            console.log()
  results['BLCFEA']           = await importBLCFEA();           console.log()
  results['FIAB']             = await importFIAB();             console.log()
  results['Banglacraft']      = await importBanglacraft();      console.log()
  results['BTTLMEA']          = await importBTTLMEA();          console.log()
  results['BJGEA']            = await importBJGEAFull();        console.log()

  // ── Gold Mine: PDF-only sources via grand_merged.csv ──
  results['grand_merged_pdf'] = await importGrandMerged();     console.log()

  // ── Other sources ──
  results['epz']              = await importEPZ();              console.log()
  results['tourism']          = await importTourism();          console.log()
  results['odoo']             = await importOdoo();             console.log()
  results['associations']     = await importAssociations();     console.log()

  const total = Object.values(results).reduce((a, b) => a + b, 0)

  console.log('\n==========================================')
  console.log('📊 IMPORT SUMMARY')
  console.log('==========================================')
  for (const [source, count] of Object.entries(results)) {
    console.log(`   ${source.padEnd(22)} ${count.toLocaleString()} records`)
  }
  console.log(`   ${'TOTAL'.padEnd(22)} ${total.toLocaleString()} records`)
  console.log('==========================================')
  console.log('✅ Import complete!')
  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Import failed:', err)
  process.exit(1)
})
