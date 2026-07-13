'use server'

import {
  getAllowedMaterialsForProfile,
  getProfileDomainBySlug,
  getSizeItemBySlug,
  getStandardChain,
} from '@/lib/queries'

export interface ItemCardData {
  item: {
    id: number
    slug: string
    designation: string
    standardDesignation: string
    massPerM: string | null
    availability: string
    params: Record<string, number | string>
  }
  category: { slug: string; name: string; profileType: string }
  chain: { id: number; designation: string; title: string; status: string }[]
  domain: {
    geometryDocument: { designation: string; title: string; status: string } | null
    materialEligibilityCount: number
    dataStatus: string
  } | null
}

export async function getItemCard(slug: string): Promise<ItemCardData | null> {
  const result = await getSizeItemBySlug(slug)
  if (!result) return null
  const { item, category } = result
  const [chain, domain] = await Promise.all([
    getStandardChain(item.standardDesignation),
    getProfileDomainBySlug(slug),
  ])
  const materials = domain
    ? await getAllowedMaterialsForProfile(
        domain.size.id,
        domain.specification.id,
        domain.specification.purposeCategory ?? 'general',
        domain.specification.accuracyClass ?? 'any',
      )
    : []

  return {
    item: {
      id: item.id,
      slug: item.slug,
      designation: item.designation,
      standardDesignation: item.standardDesignation,
      massPerM: item.massPerM,
      availability: item.availability,
      params: (item.params ?? {}) as Record<string, number | string>,
    },
    category: {
      slug: category.slug,
      name: category.name,
      profileType: category.profileType,
    },
    chain: chain.map((standard) => ({
      id: standard.id,
      designation: standard.designation,
      title: standard.title,
      status: standard.status,
    })),
    domain: domain
      ? {
          geometryDocument: domain.geometryDocument
            ? {
                designation: domain.geometryDocument.designation,
                title: domain.geometryDocument.title,
                status: domain.geometryDocument.status,
              }
            : null,
          materialEligibilityCount: materials.length,
          dataStatus: domain.size.dataStatus,
        }
      : null,
  }
}
