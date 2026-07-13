'use server'

import { findNearestSizes, getCategoryBySlug } from '@/lib/queries'

export interface NearestResult {
  id: number
  designation: string
  standardDesignation: string
  slug: string
  dim1: string | null
  dim2: string | null
  massPerM: string | null
  availability: string
  exact: boolean
}

export async function findBySize(
  categorySlug: string,
  dims: { dim1?: number; dim2?: number },
): Promise<NearestResult[]> {
  const category = await getCategoryBySlug(categorySlug)
  if (!category) return []
  const rows = await findNearestSizes(category.id, dims)
  return rows.map((r) => {
    const d1 = r.dim1 != null ? Number.parseFloat(r.dim1) : null
    const d2 = r.dim2 != null ? Number.parseFloat(r.dim2) : null
    const exact =
      (dims.dim1 == null || (d1 != null && Math.abs(d1 - dims.dim1) < 0.01)) &&
      (dims.dim2 == null || (d2 != null && Math.abs(d2 - dims.dim2) < 0.01))
    return {
      id: r.id,
      designation: r.designation,
      standardDesignation: r.standardDesignation,
      slug: r.slug,
      dim1: r.dim1,
      dim2: r.dim2,
      massPerM: r.massPerM,
      availability: r.availability,
      exact,
    }
  })
}
