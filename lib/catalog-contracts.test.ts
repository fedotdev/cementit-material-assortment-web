import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

describe('material catalog route contracts', () => {
  it('keeps stk and sto as separate catalog sections', () => {
    const root = read('../app/materials/page.tsx')
    expect(root).toContain("code: 'stk'")
    expect(root).toContain("code: 'sto'")
    expect(root).toContain('getMaterialSectionCounts')
  })

  it('renders materials as a paginated table with URL filters', () => {
    const section = read('../app/materials/[section]/page.tsx')
    expect(section).toContain('MaterialCatalogTable')
    expect(section).toContain("queryParams.q")
    expect(section).toContain("queryParams.class")
    expect(section).toContain("next.set('page'")
  })

  it('keeps chemistry, mechanics, analogues, and sources in separate accessible tabs', () => {
    const tabs = read('../components/material-detail-tabs.tsx')
    expect(tabs).toContain("['chemistry', 'Химический состав']")
    expect(tabs).toContain("['mechanics', 'Механические свойства']")
    expect(tabs).toContain("['analogues', 'Зарубежные аналоги']")
    expect(tabs).toContain("['standards', 'Стандарты и источники']")
    expect(tabs).toContain('role="tablist"')
  })

  it('does not import the source JSON into client components', () => {
    const controls = read('../components/material-catalog-controls.tsx')
    const table = read('../components/material-catalog-table.tsx')
    const tabs = read('../components/material-detail-tabs.tsx')
    expect(controls + table + tabs).not.toContain('cementit-materials.demo.json')
    expect(controls + table + tabs).not.toContain('data/import')
  })
})

describe('normative history contracts', () => {
  it('uses typed standard relationships rather than a generic old marker', () => {
    const schema = read('./db/schema.ts')
    const category = read('../app/catalog/[slug]/page.tsx')
    expect(schema).toContain("standard_relationships")
    expect(category).toContain('relationship.relationType')
    expect(category).not.toContain("relationType: 'old'")
  })

  it('keeps strength class distinct from material grade in allowed links', () => {
    const schema = read('./db/schema.ts')
    expect(schema).toContain("materialGradeId: integer('material_grade_id')")
    expect(schema).toContain("strengthClassId: integer('strength_class_id')")
    expect(schema).toContain("strengthClasses = pgTable('strength_classes'")
  })
})
