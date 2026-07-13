export type DataStatus = 'verified' | 'needs_review' | 'rejected'
export type MappingStatus = 'equivalent' | 'comparable' | 'needs_review' | 'rejected'

export interface StandardRef {
  id: number
  system: string
  designation: string
  title: string
  status: string
  sourceUrl: string | null
  verifiedAt: Date | null
}

export interface MaterialOption {
  id: number
  name: string
  category: string
  dataStatus: DataStatus
  governingDocument: StandardRef | null
  recommendationStatus: DataStatus
  purposeCategory: string
  accuracyClass: string
  sourceClause: string | null
}

export interface SelectionContext {
  profileSizeId: number
  profileSpecificationId: number
  purposeCategory?: string
  accuracyClass?: string
}

export interface ResolvedConfiguration {
  profile: {
    id: number
    designation: string
    family: string
    geometryDocument: StandardRef | null
    dataStatus: DataStatus
  }
  material: MaterialOption
  designation: string
}

export function isSelectableMaterial(
  material: MaterialOption,
  purposeCategory = 'general',
  accuracyClass = 'any',
) {
  if (material.dataStatus !== 'verified') return false
  if (material.recommendationStatus !== 'verified') return false
  if (!material.governingDocument?.verifiedAt) return false
  if (
    material.purposeCategory !== 'any' &&
    material.purposeCategory !== purposeCategory
  ) return false
  if (
    material.accuracyClass !== 'any' &&
    accuracyClass !== 'any' &&
    material.accuracyClass !== accuracyClass
  ) return false
  return true
}

export function assertValidMaterialSelection(
  material: MaterialOption,
  purposeCategory = 'general',
  accuracyClass = 'any',
) {
  if (!isSelectableMaterial(material, purposeCategory, accuracyClass)) {
    throw new Error('Материал не подтверждён для выбранного типоразмера и условий применения')
  }
}

export function buildResolvedDesignation(
  profileDesignation: string,
  materialName: string,
  geometryDocument?: Pick<StandardRef, 'designation'> | null,
  materialDocument?: Pick<StandardRef, 'designation'> | null,
) {
  const geometry = geometryDocument ? ` по ${geometryDocument.designation}` : ''
  const material = materialDocument ? ` по ${materialDocument.designation}` : ''
  return `${profileDesignation}${geometry} / ${materialName}${material}`
}

export function filterAllowedMaterials(
  materials: MaterialOption[],
  purposeCategory = 'general',
  accuracyClass = 'any',
) {
  return materials.filter((material) =>
    isSelectableMaterial(material, purposeCategory, accuracyClass),
  )
}

export function publicMappings<T extends { mappingStatus: MappingStatus }>(mappings: T[]) {
  return mappings.filter(({ mappingStatus }) =>
    mappingStatus === 'equivalent' || mappingStatus === 'comparable',
  )
}
