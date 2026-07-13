import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { Pool, type PoolClient } from 'pg'
import { decodeSteelGrade, normalizeGradeName } from '../lib/materials/steel-decoder'

type Row = Record<string, unknown> & { material_id: string }
type Dataset = {
  generatedAt: string
  source: { name: string; url: string; sections?: string[] }
  materials: Array<Row & { grade_name_raw: string; grade_name_normalized: string; catalog_section?: string; material_class?: string; industrial_use?: string }>
  chemicalComposition: Row[]
  analogueCandidates: Row[]
  properties: Row[]
  mechanicalPropertiesRaw: Row[]
  standardReferences: Row[]
}

const sourcePath = resolve(process.cwd(), 'data/import/cementit-materials.demo.json')
const fingerprint = (...parts: unknown[]) => createHash('sha256').update(JSON.stringify(parts)).digest('hex')

function parseDataset(raw: string): Dataset {
  // The supplied export contains trailing commas and one omitted array terminator.
  // These two deterministic repairs are deliberately narrow and verified by expected row counts.
  const repaired = raw
    .replace(/\r?\n  "standardReferences"\s*:/, '\n  ],\n  "standardReferences":')
    .replace(/,\s*([}\]])/g, '$1')
  const data = JSON.parse(repaired) as Dataset
  const expected = { materials: 440, chemicalComposition: 4063, analogueCandidates: 4861, properties: 793, mechanicalPropertiesRaw: 1714, standardReferences: 2395 }
  for (const [key, count] of Object.entries(expected)) {
    if (!Array.isArray(data[key as keyof Dataset]) || (data[key as keyof Dataset] as unknown[]).length !== count) {
      throw new Error(`Unexpected ${key} count; refusing partial import`)
    }
  }
  return data
}

async function upsertChild(client: PoolClient, sql: string, values: unknown[]) {
  await client.query(sql, values)
}

export async function importMaterialCatalog() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required')
  const dataset = parseDataset(await readFile(sourcePath, 'utf8'))
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 })
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const grouped = new Map<string, typeof dataset.materials>()
    for (const row of dataset.materials) {
      const key = normalizeGradeName(row.grade_name_normalized || row.grade_name_raw)
      grouped.set(key, [...(grouped.get(key) ?? []), row])
    }
    if (grouped.size !== 439) throw new Error(`Expected 439 unique grades, got ${grouped.size}`)

    const gradeIds = new Map<string, number>()
    for (const [normalizedName, rows] of grouped) {
      const primary = rows[0]
      const aliases = [...new Set(rows.flatMap((row) => [row.grade_name_raw, row.grade_name_normalized]).filter(Boolean))]
      const decoded = decodeSteelGrade(primary.grade_name_raw)
      const sourceUrl = dataset.source.sections?.find((url) => url.endsWith(`/${primary.catalog_section}`)) ?? dataset.source.url
      const result = await client.query<{ id: number }>(`
        INSERT INTO material_grades
          (name, normalized_name, aliases, category, data_status, source_note, source_material_id,
           catalog_section, material_class, industrial_use, verification_status, source_url,
           source_retrieved_at, source_name, decoding_summary, decoding)
        VALUES ($1,$2,$3::jsonb,'steel','needs_review',$4,$5,$6,$7,$8,'imported_unverified',$9,$10,$11,$12,$13::jsonb)
        ON CONFLICT (normalized_name) DO UPDATE SET
          aliases=EXCLUDED.aliases, source_note=EXCLUDED.source_note,
          source_material_id=EXCLUDED.source_material_id, catalog_section=EXCLUDED.catalog_section,
          material_class=EXCLUDED.material_class, industrial_use=EXCLUDED.industrial_use,
          verification_status=EXCLUDED.verification_status, source_url=EXCLUDED.source_url,
          source_retrieved_at=EXCLUDED.source_retrieved_at, source_name=EXCLUDED.source_name,
          decoding_summary=EXCLUDED.decoding_summary, decoding=EXCLUDED.decoding
        RETURNING id`, [primary.grade_name_raw, normalizedName, JSON.stringify(aliases), `Автоматический импорт; ${rows.length > 1 ? `объединено записей: ${rows.length}` : 'одна исходная запись'}`, primary.material_id, primary.catalog_section ?? null, primary.material_class ?? null, primary.industrial_use ?? null, sourceUrl, dataset.generatedAt, dataset.source.name, decoded.summary, JSON.stringify(decoded)])
      for (const row of rows) gradeIds.set(row.material_id, result.rows[0].id)
    }

    for (const row of dataset.chemicalComposition) {
      const gradeId = gradeIds.get(row.material_id); if (!gradeId) continue
      const fp = fingerprint('chem', row)
      await upsertChild(client, `INSERT INTO chemical_composition_limits
        (material_grade_id, element_symbol, min_percent, max_percent, value_raw, approximate_value, unit, source_url, verification_status, source_fingerprint)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'imported_unverified',$9) ON CONFLICT (source_fingerprint) WHERE source_fingerprint IS NOT NULL DO UPDATE SET value_raw=EXCLUDED.value_raw`,
      [gradeId, row.element, row.min_value ?? null, row.max_value ?? null, row.value_raw ?? null, row.approximate_value ?? null, row.unit ?? '%', dataset.source.url, fp])
    }

    for (const row of dataset.properties) {
      const gradeId = gradeIds.get(row.material_id); if (!gradeId) continue
      await upsertChild(client, `INSERT INTO material_properties (material_grade_id, property_key, value_raw, source_url, source_fingerprint)
        VALUES ($1,$2,$3,$4,$5) ON CONFLICT (source_fingerprint) WHERE source_fingerprint IS NOT NULL DO UPDATE SET value_raw=EXCLUDED.value_raw`,
      [gradeId, row.property_key, row.value_raw ?? null, dataset.source.url, fingerprint('property', row)])
    }

    for (const row of dataset.mechanicalPropertiesRaw) {
      const gradeId = gradeIds.get(row.material_id); if (!gradeId) continue
      await upsertChild(client, `INSERT INTO mechanical_property_raw
        (material_grade_id, table_number, row_number, condition_raw, values_json, source_url, source_fingerprint)
        VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7) ON CONFLICT (source_fingerprint) WHERE source_fingerprint IS NOT NULL DO UPDATE SET values_json=EXCLUDED.values_json`,
      [gradeId, row.table_number ?? null, row.row_number ?? null, row.condition_raw ?? null, JSON.stringify(row.values_json ?? {}), dataset.source.url, fingerprint('mechanical', row)])
    }

    for (const row of dataset.standardReferences) {
      const gradeId = gradeIds.get(row.material_id); if (!gradeId) continue
      await upsertChild(client, `INSERT INTO material_standard_references
        (material_grade_id, standard_system_raw, standard_number_raw, source_url, source_fingerprint)
        VALUES ($1,$2,$3,$4,$5) ON CONFLICT (source_fingerprint) WHERE source_fingerprint IS NOT NULL DO UPDATE SET standard_number_raw=EXCLUDED.standard_number_raw`,
      [gradeId, row.standard_system_raw ?? null, row.standard_number_raw ?? null, dataset.source.url, fingerprint('standard', row)])
    }

    for (const row of dataset.analogueCandidates) {
      const gradeId = gradeIds.get(row.material_id); if (!gradeId) continue
      const designation = String(row.target_grade_raw ?? '')
      const normalized = normalizeGradeName(String(row.target_grade_normalized ?? designation))
      const ext = await client.query<{ id: number }>(`INSERT INTO external_material_designations
        (normalized_designation, designation, country, system_hint) VALUES ($1,$2,$3,$4)
        ON CONFLICT (normalized_designation, country, system_hint) DO UPDATE SET designation=EXCLUDED.designation RETURNING id`,
      [normalized, designation, row.target_country ?? '', row.target_standard_system_hint ?? ''])
      await upsertChild(client, `INSERT INTO material_analogue_candidates
        (material_grade_id, external_designation_id, source_url, source_fingerprint)
        VALUES ($1,$2,$3,$4) ON CONFLICT (source_fingerprint) WHERE source_fingerprint IS NOT NULL DO UPDATE SET source_url=EXCLUDED.source_url`,
      [gradeId, ext.rows[0].id, dataset.source.url, fingerprint('analogue', row)])
    }

    await client.query(`INSERT INTO material_import_runs (dataset_type, source_name, source_url, source_generated_at, material_count, report)
      VALUES ('cementit_demo_material_catalog_import',$1,$2,$3,$4,$5::jsonb)`, [dataset.source.name, dataset.source.url, dataset.generatedAt, grouped.size, JSON.stringify({ sourceRows: 440, uniqueGrades: grouped.size, duplicateRowsMerged: 1, verificationStatus: 'imported_unverified' })])
    await client.query('COMMIT')
    const report = { imported: grouped.size, sourceRows: 440, duplicatesMerged: 1 }
    console.log(JSON.stringify(report))
    return report
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release(); await pool.end()
  }
}

if (process.argv[1]?.endsWith('import-material-catalog.ts')) {
  importMaterialCatalog().catch((error) => { console.error(error); process.exitCode = 1 })
}
