import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parseDataset, prepareImportStatements } from '../lib/materials/import-builder.js'

async function main() {
  const sourcePath = resolve(process.cwd(), 'data/import/cementit-materials.demo.json')
  const raw = await readFile(sourcePath, 'utf8')
  const dataset = parseDataset(raw)
  const statements = prepareImportStatements(dataset)
  console.log(`-- Material catalog import: ${statements.length} statements`)
  console.log(`-- Generated from ${dataset.source.name} at ${dataset.generatedAt}`)
  console.log(`-- Source: ${dataset.source.url}\n`)
  for (const sql of statements) {
    console.log(sql + ';')
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
