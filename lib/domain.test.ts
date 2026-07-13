import { describe, expect, it } from 'vitest'
import {
  assertValidMaterialSelection,
  buildResolvedDesignation,
  filterAllowedMaterials,
  publicMappings,
  type MaterialOption,
} from './domain'

const document = {
  id: 1,
  system: 'GOST',
  designation: 'ГОСТ 27772-2021',
  title: 'Прокат для строительных конструкций',
  status: 'active',
  sourceUrl: 'https://example.test/standard',
  verifiedAt: new Date('2026-01-01'),
}

function material(overrides: Partial<MaterialOption> = {}): MaterialOption {
  return {
    id: 1,
    name: 'С255',
    category: 'construction_steel',
    dataStatus: 'verified',
    governingDocument: document,
    recommendationStatus: 'verified',
    purposeCategory: 'general',
    accuracyClass: 'any',
    sourceClause: '5.1',
    ...overrides,
  }
}

describe('material eligibility', () => {
  it('keeps only verified, applicable profile-material links', () => {
    const options = [
      material(),
      material({ id: 2, dataStatus: 'needs_review' }),
      material({ id: 3, recommendationStatus: 'needs_review' }),
      material({ id: 4, governingDocument: null }),
      material({ id: 5, purposeCategory: 'bridge' }),
    ]
    expect(filterAllowedMaterials(options, 'general', 'any').map(({ id }) => id)).toEqual([1])
  })

  it('rejects an unverified legacy material choice', () => {
    expect(() => assertValidMaterialSelection(material({ dataStatus: 'needs_review' }))).toThrow(
      'Материал не подтверждён',
    )
  })
})

describe('independent normative dimensions', () => {
  it('builds a designation from separate geometry and material documents', () => {
    expect(
      buildResolvedDesignation(
        'Двутавр 20Б1',
        'С255',
        { designation: 'ГОСТ Р 57837-2017' },
        { designation: 'ГОСТ 27772-2021' },
      ),
    ).toBe('Двутавр 20Б1 по ГОСТ Р 57837-2017 / С255 по ГОСТ 27772-2021')
  })

  it('publishes only explicit equivalence or comparability mappings', () => {
    const mappings = [
      { id: 1, mappingStatus: 'equivalent' as const },
      { id: 2, mappingStatus: 'comparable' as const },
      { id: 3, mappingStatus: 'needs_review' as const },
      { id: 4, mappingStatus: 'rejected' as const },
    ]
    expect(publicMappings(mappings).map(({ id }) => id)).toEqual([1, 2])
  })
})
