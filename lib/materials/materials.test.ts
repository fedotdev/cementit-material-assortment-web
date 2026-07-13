import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseDataset, prepareImportStatements } from './import-builder'
import { decodeSteelGrade, normalizeGradeName } from './steel-decoder'

const sourcePath = new URL('../../data/import/cementit-materials.demo.json', import.meta.url)
const dataset = parseDataset(readFileSync(sourcePath, 'utf8'))

describe('steel grade decoder', () => {
  it('normalizes Cyrillic and Latin lookalikes deterministically', () => {
    expect(normalizeGradeName(' 12X18H10T ')).toBe(normalizeGradeName('12Х18Н10Т'))
  })

  it('decodes carbon, alloying elements, and quality suffixes', () => {
    const decoded = decodeSteelGrade('12Х18Н10Т')
    expect(decoded.tokens.some((part) => part.kind === 'carbon')).toBe(true)
    expect(decoded.tokens.some((part) => part.token.includes('Х18'))).toBe(true)
    expect(decoded.summary).toContain('углерода')
  })
})

describe('catalog import', () => {
  it('repairs and parses every source collection', () => {
    expect(dataset.materials).toHaveLength(440)
    expect(dataset.chemicalComposition.length).toBeGreaterThan(0)
    expect(dataset.analogueCandidates.length).toBeGreaterThan(0)
  })

  it('merges one duplicate material into 439 canonical grades', () => {
    const statements = prepareImportStatements(dataset)
    expect(statements.filter((sql) => sql.startsWith('INSERT INTO material_grades'))).toHaveLength(439)
    expect(statements.at(-1)).toContain('"sourceRows":440')
    expect(statements.at(-1)).toContain('"uniqueGrades":439')
  })

  it('keeps all analogues as unverified candidates', () => {
    const candidates = prepareImportStatements(dataset).filter((sql) => sql.startsWith('INSERT INTO material_analogue_candidates'))
    expect(candidates.length).toBe(dataset.analogueCandidates.length)
    expect(candidates.every((sql) => !sql.includes('grade_analogs'))).toBe(true)
  })
})
