import { decodeSteelGrade, normalizeGradeName } from './steel-decoder'

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

export function parseDataset(raw: string): Dataset {
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

export function prepareImportStatements(dataset: Dataset) {
  const grouped = new Map<string, typeof dataset.materials>()
  for (const row of dataset.materials) {
    const key = normalizeGradeName(row.grade_name_normalized || row.grade_name_raw)
    grouped.set(key, [...(grouped.get(key) ?? []), row])
  }
  if (grouped.size !== 439) throw new Error(`Expected 439 unique grades, got ${grouped.size}`)

  const statements: string[] = []
  const gradeMapping = new Map<string, { normalizedName: string; temporaryId: string }>()
  let gradeIdx = 1

  // Grades
  for (const [normalizedName, rows] of grouped) {
    const primary = rows[0]
    const aliases = [...new Set(rows.flatMap((r) => [r.grade_name_raw, r.grade_name_normalized]).filter(Boolean))]
    const decoded = decodeSteelGrade(primary.grade_name_raw)
    const sourceUrl = dataset.source.sections?.find((url) => url.endsWith(`/${primary.catalog_section}`)) ?? dataset.source.url
    const tempId = `grade_${gradeIdx++}`
    for (const row of rows) gradeMapping.set(row.material_id, { normalizedName, temporaryId: tempId })

    const note = `Автоматический импорт; ${rows.length > 1 ? `объединено записей: ${rows.length}` : 'одна исходная запись'}`
    statements.push(`INSERT INTO material_grades (name,normalized_name,aliases,category,data_status,source_note,source_material_id,catalog_section,material_class,industrial_use,verification_status,source_url,source_retrieved_at,source_name,decoding_summary,decoding) VALUES (${[
      `'${esc(primary.grade_name_raw)}'`,
      `'${esc(normalizedName)}'`,
      `'${JSON.stringify(aliases)}'::jsonb`,
      `'steel'`,
      `'needs_review'`,
      `'${esc(note)}'`,
      primary.material_id ? `'${esc(primary.material_id)}'` : 'NULL',
      primary.catalog_section ? `'${esc(primary.catalog_section)}'` : 'NULL',
      primary.material_class ? `'${esc(primary.material_class)}'` : 'NULL',
      primary.industrial_use ? `'${esc(primary.industrial_use)}'` : 'NULL',
      `'imported_unverified'`,
      `'${esc(sourceUrl)}'`,
      `'${dataset.generatedAt}'`,
      `'${esc(dataset.source.name)}'`,
      `'${esc(decoded.summary)}'`,
      `'${JSON.stringify(decoded)}'::jsonb`,
    ].join(',')}) ON CONFLICT (normalized_name) DO UPDATE SET aliases=EXCLUDED.aliases, source_note=EXCLUDED.source_note, source_material_id=EXCLUDED.source_material_id, catalog_section=EXCLUDED.catalog_section, material_class=EXCLUDED.material_class, industrial_use=EXCLUDED.industrial_use, verification_status=EXCLUDED.verification_status, source_url=EXCLUDED.source_url, source_retrieved_at=EXCLUDED.source_retrieved_at, source_name=EXCLUDED.source_name, decoding_summary=EXCLUDED.decoding_summary, decoding=EXCLUDED.decoding`)
  }

  // Chemical composition
  for (const row of dataset.chemicalComposition) {
    const gradeData = gradeMapping.get(row.material_id)
    if (!gradeData) continue
    const fp = fingerprint('chem', row)
    statements.push(`INSERT INTO chemical_composition_limits (material_grade_id,element_symbol,min_percent,max_percent,value_raw,approximate_value,unit,source_url,verification_status,source_fingerprint) SELECT id,'${esc(String(row.element))}',${row.min_value ?? 'NULL'},${row.max_value ?? 'NULL'},${row.value_raw ? `'${esc(String(row.value_raw))}'` : 'NULL'},${row.approximate_value ?? 'NULL'},'${esc(String(row.unit ?? '%'))}','${esc(dataset.source.url)}','imported_unverified','${fp}' FROM material_grades WHERE normalized_name='${esc(gradeData.normalizedName)}' ON CONFLICT (source_fingerprint) WHERE source_fingerprint IS NOT NULL DO UPDATE SET value_raw=EXCLUDED.value_raw`)
  }

  // Properties
  for (const row of dataset.properties) {
    const gradeData = gradeMapping.get(row.material_id)
    if (!gradeData) continue
    const fp = fingerprint('property', row)
    statements.push(`INSERT INTO material_properties (material_grade_id,property_key,value_raw,source_url,source_fingerprint) SELECT id,'${esc(String(row.property_key))}',${row.value_raw ? `'${esc(String(row.value_raw))}'` : 'NULL'},'${esc(dataset.source.url)}','${fp}' FROM material_grades WHERE normalized_name='${esc(gradeData.normalizedName)}' ON CONFLICT (source_fingerprint) WHERE source_fingerprint IS NOT NULL DO UPDATE SET value_raw=EXCLUDED.value_raw`)
  }

  // Mechanical properties
  for (const row of dataset.mechanicalPropertiesRaw) {
    const gradeData = gradeMapping.get(row.material_id)
    if (!gradeData) continue
    const fp = fingerprint('mechanical', row)
    statements.push(`INSERT INTO mechanical_property_raw (material_grade_id,table_number,row_number,condition_raw,values_json,source_url,source_fingerprint) SELECT id,${row.table_number ?? 'NULL'},${row.row_number ?? 'NULL'},${row.condition_raw ? `'${esc(String(row.condition_raw))}'` : 'NULL'},'${JSON.stringify(row.values_json ?? {})}'::jsonb,'${esc(dataset.source.url)}','${fp}' FROM material_grades WHERE normalized_name='${esc(gradeData.normalizedName)}' ON CONFLICT (source_fingerprint) WHERE source_fingerprint IS NOT NULL DO UPDATE SET values_json=EXCLUDED.values_json`)
  }

  // Standard references
  for (const row of dataset.standardReferences) {
    const gradeData = gradeMapping.get(row.material_id)
    if (!gradeData) continue
    const fp = fingerprint('standard', row)
    statements.push(`INSERT INTO material_standard_references (material_grade_id,standard_system_raw,standard_number_raw,source_url,source_fingerprint) SELECT id,${row.standard_system_raw ? `'${esc(String(row.standard_system_raw))}'` : 'NULL'},${row.standard_number_raw ? `'${esc(String(row.standard_number_raw))}'` : 'NULL'},'${esc(dataset.source.url)}','${fp}' FROM material_grades WHERE normalized_name='${esc(gradeData.normalizedName)}' ON CONFLICT (source_fingerprint) WHERE source_fingerprint IS NOT NULL DO UPDATE SET standard_number_raw=EXCLUDED.standard_number_raw`)
  }

  // External designations and analogue candidates
  const extDesignations = new Map<string, { normalized: string; designation: string; country: string; system: string }>()
  for (const row of dataset.analogueCandidates) {
    const designation = String(row.target_grade_raw ?? '')
    const normalized = normalizeGradeName(String(row.target_grade_normalized ?? designation))
    const country = String(row.target_country ?? '')
    const system = String(row.target_standard_system_hint ?? '')
    const key = `${normalized}|${country}|${system}`
    if (!extDesignations.has(key)) {
      extDesignations.set(key, { normalized, designation, country, system })
    }
  }

  for (const { normalized, designation, country, system } of extDesignations.values()) {
    statements.push(`INSERT INTO external_material_designations (normalized_designation,designation,country,system_hint) VALUES ('${esc(normalized)}','${esc(designation)}','${esc(country)}','${esc(system)}') ON CONFLICT (normalized_designation,country,system_hint) DO UPDATE SET designation=EXCLUDED.designation`)
  }

  for (const row of dataset.analogueCandidates) {
    const gradeData = gradeMapping.get(row.material_id)
    if (!gradeData) continue
    const designation = String(row.target_grade_raw ?? '')
    const normalized = normalizeGradeName(String(row.target_grade_normalized ?? designation))
    const country = String(row.target_country ?? '')
    const system = String(row.target_standard_system_hint ?? '')
    const fp = fingerprint('analogue', row)
    statements.push(`INSERT INTO material_analogue_candidates (material_grade_id,external_designation_id,source_url,source_fingerprint) SELECT mg.id, ed.id, '${esc(dataset.source.url)}', '${fp}' FROM material_grades mg, external_material_designations ed WHERE mg.normalized_name='${esc(gradeData.normalizedName)}' AND ed.normalized_designation='${esc(normalized)}' AND ed.country='${esc(country)}' AND ed.system_hint='${esc(system)}' ON CONFLICT (source_fingerprint) WHERE source_fingerprint IS NOT NULL DO UPDATE SET source_url=EXCLUDED.source_url`)
  }

  // Import run metadata
  statements.push(`INSERT INTO material_import_runs (dataset_type,source_name,source_url,source_generated_at,material_count,report) VALUES ('cementit_demo_material_catalog_import','${esc(dataset.source.name)}','${esc(dataset.source.url)}','${dataset.generatedAt}',${grouped.size},'${JSON.stringify({ sourceRows: 440, uniqueGrades: grouped.size, duplicateRowsMerged: 1, verificationStatus: 'imported_unverified' })}'::jsonb)`)

  return statements
}

function esc(value: string) {
  return value.replace(/'/g, "''")
}

function fingerprint(...parts: unknown[]) {
  return require('node:crypto').createHash('sha256').update(JSON.stringify(parts)).digest('hex')
}
