import 'dotenv/config'
import { db } from '../lib/db'
import { contacts } from '../lib/db/schema'
import { importGrandMerged } from './importers/grand-merged'
import { importBJGEA } from './importers/bjgea'
import { importEPZ } from './importers/epz'
import { importTourism } from './importers/tourism'
import { importOdoo } from './importers/odoo'
import { importAssociations } from './importers/associations'
import { sql } from 'drizzle-orm'

async function main() {
  console.log('🚀 MetaMorPhosis Marketing Database Import')
  console.log('==========================================\n')

  // Drop and recreate table for clean import
  console.log('🗑️  Clearing existing data...')
  await db.execute(sql`TRUNCATE TABLE contacts RESTART IDENTITY`)
  console.log('   ✅ Table cleared\n')

  const results: Record<string, number> = {}

  results['grand_merged'] = await importGrandMerged()
  console.log()
  results['bjgea'] = await importBJGEA()
  console.log()
  results['epz'] = await importEPZ()
  console.log()
  results['tourism'] = await importTourism()
  console.log()
  results['odoo'] = await importOdoo()
  console.log()
  results['associations'] = await importAssociations()
  console.log()

  const total = Object.values(results).reduce((a, b) => a + b, 0)

  console.log('\n==========================================')
  console.log('📊 IMPORT SUMMARY')
  console.log('==========================================')
  for (const [source, count] of Object.entries(results)) {
    console.log(`   ${source.padEnd(20)} ${count.toLocaleString()} records`)
  }
  console.log(`   ${'TOTAL'.padEnd(20)} ${total.toLocaleString()} records`)
  console.log('==========================================')
  console.log('✅ Import complete!')
  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Import failed:', err)
  process.exit(1)
})
