import 'server-only'

import { and, asc, eq, getTableColumns, ilike, or, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { normalizeQuery } from '@/lib/search-parse'
import {
  allowedProfileMaterials,
  categories,
  chemicalCompositionLimits,
  externalMaterialDesignations,
  materialAnalogueCandidates,
  materialProperties,
  materialStandardReferences,
  mechanicalPropertyRaw,
  geometryStandardMappings,
  gradeAnalogs,
  materialGrades,
  materialGradeStandards,
  materialStandardMappings,
  profileFamilies,
  profileSizes,
  profileSpecifications,
  sizeItems,
  standardDocuments,
  standardRelationships,
  standards,
  steelGrades,
} from '@/lib/db/schema'

export async function getProfileDomainBySlug(slug: string) {
  const rows = await db
    .select({
      size: profileSizes,
      specification: profileSpecifications,
      family: profileFamilies,
      geometryDocument: standardDocuments,
    })
    .from(profileSizes)
    .innerJoin(
      profileSpecifications,
      eq(profileSizes.specificationId, profileSpecifications.id),
    )
    .innerJoin(profileFamilies, eq(profileSpecifications.familyId, profileFamilies.id))
    .leftJoin(
      standardDocuments,
      eq(profileSpecifications.geometryStandardId, standardDocuments.id),
    )
    .where(eq(profileSizes.slug, slug))
    .limit(1)
  return rows[0] ?? null
}

export async function getAllowedMaterialsForProfile(
  profileSizeId: number,
  profileSpecificationId: number,
  purposeCategory = 'general',
  accuracyClass = 'any',
) {
  return db
    .select({
      link: allowedProfileMaterials,
      material: materialGrades,
      document: standardDocuments,
      materialStandard: materialGradeStandards,
    })
    .from(allowedProfileMaterials)
    .innerJoin(
      materialGrades,
      eq(allowedProfileMaterials.materialGradeId, materialGrades.id),
    )
    .leftJoin(
      materialGradeStandards,
      eq(materialGradeStandards.materialGradeId, materialGrades.id),
    )
    .leftJoin(
      standardDocuments,
      eq(materialGradeStandards.standardDocumentId, standardDocuments.id),
    )
    .where(
      and(
        or(
          eq(allowedProfileMaterials.profileSizeId, profileSizeId),
          eq(allowedProfileMaterials.profileSpecificationId, profileSpecificationId),
        ),
        or(
          eq(allowedProfileMaterials.purposeCategory, purposeCategory),
          eq(allowedProfileMaterials.purposeCategory, 'any'),
        ),
        or(
          eq(allowedProfileMaterials.accuracyClass, accuracyClass),
          eq(allowedProfileMaterials.accuracyClass, 'any'),
        ),
      ),
    )
}

export async function getIndependentMappings(
  geometryStandardId: number | null,
  materialGradeId?: number,
) {
  const geometry = geometryStandardId
    ? await db
        .select({ mapping: geometryStandardMappings, target: standardDocuments })
        .from(geometryStandardMappings)
        .innerJoin(
          standardDocuments,
          eq(geometryStandardMappings.targetStandardId, standardDocuments.id),
        )
        .where(eq(geometryStandardMappings.sourceStandardId, geometryStandardId))
    : []
  const material = materialGradeId
    ? await db
        .select({ mapping: materialStandardMappings, target: materialGrades })
        .from(materialStandardMappings)
        .innerJoin(
          materialGrades,
          eq(materialStandardMappings.targetMaterialGradeId, materialGrades.id),
        )
        .where(eq(materialStandardMappings.sourceMaterialGradeId, materialGradeId))
    : []
  return { geometry, material }
}

export async function getMaterialRegistry() {
  return db
    .select({ material: materialGrades, standard: standardDocuments, link: materialGradeStandards })
    .from(materialGrades)
    .leftJoin(materialGradeStandards, eq(materialGradeStandards.materialGradeId, materialGrades.id))
    .leftJoin(standardDocuments, eq(materialGradeStandards.standardDocumentId, standardDocuments.id))
    .orderBy(asc(materialGrades.name))
}

export type MaterialSearchParams = {
  query?: string
  section?: string
  materialClass?: string
  page?: number
  pageSize?: number
}

export async function searchMaterialCatalog(params: MaterialSearchParams = {}) {
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(50, Math.max(12, params.pageSize ?? 24))
  const conditions = []
  if (params.query?.trim()) {
    const pattern = `%${params.query.trim()}%`
    conditions.push(or(
      ilike(materialGrades.name, pattern),
      ilike(materialGrades.normalizedName, pattern),
      ilike(materialGrades.materialClass, pattern),
      ilike(materialGrades.industrialUse, pattern),
    ))
  }
  if (params.section) conditions.push(eq(materialGrades.catalogSection, params.section))
  if (params.materialClass) conditions.push(eq(materialGrades.materialClass, params.materialClass))
  const where = conditions.length ? and(...conditions) : undefined
  const [items, totalRows, facets] = await Promise.all([
    db.select({
      ...getTableColumns(materialGrades),
      chemistryCount: sql<number>`(SELECT count(*)::int FROM chemical_composition_limits c WHERE c.material_grade_id = ${materialGrades.id})`,
      analogueCount: sql<number>`(SELECT count(*)::int FROM material_analogue_candidates a WHERE a.material_grade_id = ${materialGrades.id})`,
      standardCount: sql<number>`(SELECT count(*)::int FROM material_standard_references s WHERE s.material_grade_id = ${materialGrades.id})`,
      mechanicalCount: sql<number>`(SELECT count(*)::int FROM mechanical_property_raw m WHERE m.material_grade_id = ${materialGrades.id})`,
    }).from(materialGrades).where(where).orderBy(asc(materialGrades.name)).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ count: sql<number>`count(*)::int` }).from(materialGrades).where(where),
    db.select({ materialClass: materialGrades.materialClass, count: sql<number>`count(*)::int` })
      .from(materialGrades).where(sql`${materialGrades.materialClass} is not null`)
      .groupBy(materialGrades.materialClass).orderBy(asc(materialGrades.materialClass)),
  ])
  return { items, total: totalRows[0]?.count ?? 0, page, pageSize, facets }
}

export async function getMaterialSectionCounts() {
  const rows = await db
    .select({ section: materialGrades.catalogSection, count: sql<number>`count(*)::int` })
    .from(materialGrades)
    .where(or(eq(materialGrades.catalogSection, 'stk'), eq(materialGrades.catalogSection, 'sto')))
    .groupBy(materialGrades.catalogSection)
  return Object.fromEntries(rows.map((row) => [row.section, row.count])) as Record<string, number>
}

export async function getMaterialCatalogEntry(normalizedName: string) {
  const rows = await db
    .select()
    .from(materialGrades)
    .where(eq(sql`lower(${materialGrades.normalizedName})`, normalizedName.toLowerCase()))
    .limit(1)
  const material = rows[0]
  if (!material) return null
  const [composition, properties, mechanics, standardReferences, analogues] = await Promise.all([
    db.select().from(chemicalCompositionLimits).where(eq(chemicalCompositionLimits.materialGradeId, material.id)).orderBy(asc(chemicalCompositionLimits.elementSymbol)),
    db.select().from(materialProperties).where(eq(materialProperties.materialGradeId, material.id)).orderBy(asc(materialProperties.propertyKey)),
    db.select().from(mechanicalPropertyRaw).where(eq(mechanicalPropertyRaw.materialGradeId, material.id)).orderBy(asc(mechanicalPropertyRaw.tableNumber), asc(mechanicalPropertyRaw.rowNumber)),
    db.select().from(materialStandardReferences).where(eq(materialStandardReferences.materialGradeId, material.id)).orderBy(asc(materialStandardReferences.standardSystemRaw), asc(materialStandardReferences.standardNumberRaw)),
    db.select({ candidate: materialAnalogueCandidates, designation: externalMaterialDesignations })
      .from(materialAnalogueCandidates)
      .innerJoin(externalMaterialDesignations, eq(materialAnalogueCandidates.externalDesignationId, externalMaterialDesignations.id))
      .where(eq(materialAnalogueCandidates.materialGradeId, material.id))
      .orderBy(asc(externalMaterialDesignations.country), asc(externalMaterialDesignations.designation)),
  ])
  return { material, composition, properties, mechanics, standardReferences, analogues }
}

function isMissingTableError(error: unknown): boolean {
  let current: unknown = error

  while (current instanceof Error) {
    if ('code' in current && current.code === '42P01') return true
    current = current.cause
  }

  return false
}

export async function getCategories() {
  try {
    return await db.select().from(categories).orderBy(asc(categories.sort))
  } catch (error) {
    if (isMissingTableError(error)) return []
    throw error
  }
}

export async function getCategoryBySlug(slug: string) {
  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1)
  return rows[0] ?? null
}

export async function getCategoryStandardHistory(categoryId: number) {
  const familyRows = await db
    .select({ family: profileFamilies })
    .from(profileFamilies)
    .where(eq(profileFamilies.legacyCategoryId, categoryId))
    .limit(1)
  const family = familyRows[0]?.family
  if (!family) return null

  const specifications = await db
    .select({ specification: profileSpecifications, document: standardDocuments })
    .from(profileSpecifications)
    .innerJoin(standardDocuments, eq(profileSpecifications.geometryStandardId, standardDocuments.id))
    .where(eq(profileSpecifications.familyId, family.id))
    .orderBy(asc(standardDocuments.effectiveDate))

  const current = specifications.find(({ document }) => document.status === 'active') ?? null
  const historical = specifications
    .filter(({ document }) => document.status !== 'active')
    .sort((a, b) => String(b.document.withdrawnDate ?? '').localeCompare(String(a.document.withdrawnDate ?? '')))[0] ?? null

  const relationship = current && historical
    ? (await db
        .select()
        .from(standardRelationships)
        .where(and(
          eq(standardRelationships.sourceStandardId, historical.document.id),
          eq(standardRelationships.targetStandardId, current.document.id),
        ))
        .limit(1))[0] ?? null
    : null

  return { family, current, historical, relationship }
}

export async function getSizeItemsByCategory(categoryId: number) {
  return db
    .select()
    .from(sizeItems)
    .where(eq(sizeItems.categoryId, categoryId))
    .orderBy(asc(sizeItems.dim1), asc(sizeItems.dim2))
}

export async function getSizeItemBySlug(slug: string) {
  const rows = await db
    .select({
      item: sizeItems,
      category: categories,
    })
    .from(sizeItems)
    .innerJoin(categories, eq(sizeItems.categoryId, categories.id))
    .where(eq(sizeItems.slug, slug))
    .limit(1)
  return rows[0] ?? null
}

export async function getStandardByDesignation(designation: string) {
  const rows = await db
    .select()
    .from(standards)
    .where(eq(standards.designation, designation))
    .limit(1)
  return rows[0] ?? null
}

export async function getStandards() {
  return db.select().from(standards).orderBy(asc(standards.designation))
}

export type StandardRow = typeof standards.$inferSelect
export type SizeItemRow = typeof sizeItems.$inferSelect
export type CategoryRow = typeof categories.$inferSelect

/** Цепочка замен НД: от предшественников к действующему (26020-83 → 57837-2017). */
export async function getStandardChain(designation: string): Promise<StandardRow[]> {
  const all = await db.select().from(standards)
  const byDesignation = new Map(all.map((s) => [s.designation, s]))
  const start = byDesignation.get(designation)
  if (!start) return []

  const chain: StandardRow[] = [start]
  let current = start
  while (current.replacedByDesignation) {
    const next = byDesignation.get(current.replacedByDesignation)
    if (!next || chain.includes(next)) break
    chain.push(next)
    current = next
  }
  current = start
  for (;;) {
    const prev = all.find((s) => s.replacedByDesignation === current.designation)
    if (!prev || chain.includes(prev)) break
    chain.unshift(prev)
    current = prev
  }
  return chain
}

const PROFILE_ANALOG_STANDARDS: Record<string, string[]> = {
  'i-beam': ['EN 10365:2017', 'GB/T 706-2016'],
  channel: ['EN 10365:2017', 'GB/T 706-2016'],
  angle: ['EN 10056-1:2017', 'ISO 657-1:1989', 'GB/T 706-2016'],
  pipe: ['EN 10219-2:2019', 'EN 10210-2:2019'],
  round: ['EN 10058:2018'],
  square: ['EN 10058:2018'],
  sheet: [],
}

/** Международные стандарты-аналоги (EN/ISO/GB) для типа профиля. */
export async function getInternationalAnalogs(profileType: string): Promise<StandardRow[]> {
  const designations = PROFILE_ANALOG_STANDARDS[profileType] ?? []
  if (designations.length === 0) return []
  return db
    .select()
    .from(standards)
    .where(or(...designations.map((d) => eq(standards.designation, d))))
}

/** Счётчики для главной. */
export async function getCounts() {
  try {
    const [row] = await db.select({
      sizes: sql<number>`(SELECT count(*)::int FROM size_items)`,
      standards: sql<number>`(SELECT count(*)::int FROM standards)`,
      grades: sql<number>`(SELECT count(*)::int FROM steel_grades)`,
    }).from(sql`(SELECT 1) AS one`)
    return row ?? { sizes: 0, standards: 0, grades: 0 }
  } catch (error) {
    if (isMissingTableError(error)) return { sizes: 0, standards: 0, grades: 0 }
    throw error
  }
}

/** Соседние типоразмеры той же категории для блока «Аналоги». */
export async function getNeighbours(item: SizeItemRow, count = 5) {
  const all = await getSizeItemsByCategory(item.categoryId)
  const idx = all.findIndex((i) => i.id === item.id)
  if (idx === -1) return []
  const start = Math.max(0, idx - Math.floor(count / 2))
  return all
    .slice(start, start + count + 1)
    .filter((i) => i.id !== item.id)
    .slice(0, count)
}

/** Позиции по списку id для страницы сравнения (порядок как в списке). */
export async function getSizeItemsByIds(ids: number[]) {
  if (ids.length === 0) return []
  const rows = await db
    .select({ item: sizeItems, category: categories })
    .from(sizeItems)
    .innerJoin(categories, eq(sizeItems.categoryId, categories.id))
    .where(or(...ids.map((id) => eq(sizeItems.id, id))))
  const byId = new Map(rows.map((r) => [r.item.id, r]))
  return ids.map((id) => byId.get(id)).filter((r) => r != null)
}

export async function getSteelGradesWithAnalogs() {
  const grades = await db
    .select()
    .from(steelGrades)
    .orderBy(asc(steelGrades.id))
  const analogs = await db.select().from(gradeAnalogs)
  return grades.map((g) => ({
    ...g,
    analogs: analogs.filter((a) => a.gradeId === g.id),
  }))
}

/** Поиск ближайших типоразмеров по размерам внутри категории */
export async function findNearestSizes(
  categoryId: number,
  dims: { dim1?: number; dim2?: number },
  limit = 8,
) {
  const d1 = dims.dim1
  const d2 = dims.dim2
  if (d1 == null && d2 == null) return []
  const distance = sql<number>`
    ${d1 != null ? sql`abs(coalesce(${sizeItems.dim1}, 0) - ${d1})` : sql`0`}
    + ${d2 != null ? sql`abs(coalesce(${sizeItems.dim2}, 0) - ${d2}) * 3` : sql`0`}
  `
  return db
    .select()
    .from(sizeItems)
    .where(eq(sizeItems.categoryId, categoryId))
    .orderBy(distance)
    .limit(limit)
}

const SEARCH_SYNONYMS: Record<string, string> = {
  швелер: 'швеллер',
  двутавра: 'двутавр',
  балка: 'двутавр',
  уголок: 'уголок',
}

/** Умный поиск: «труба 76х4», «швеллер 20», «ГОСТ 8240» */
export async function searchSizeItems(rawQuery: string, limit = 40) {
  const normalized = normalizeQuery(rawQuery)
  if (!normalized) return []

  const words = normalized
    .split(/\s+/)
    .map((w) => SEARCH_SYNONYMS[w] ?? w)

  // выделяем числовую часть вида 76x4 или одиночные числа
  const numericParts: number[] = []
  const textParts: string[] = []
  for (const w of words) {
    const sizeMatch = w.match(/^(\d+(?:\.\d+)?)(?:x(\d+(?:\.\d+)?))?(?:x(\d+(?:\.\d+)?))?$/)
    if (sizeMatch) {
      for (const g of [sizeMatch[1], sizeMatch[2], sizeMatch[3]]) {
        if (g) numericParts.push(Number.parseFloat(g))
      }
    } else {
      textParts.push(w)
    }
  }

  const conds = []
  for (const t of textParts) {
    conds.push(
      or(
        ilike(sizeItems.designation, `%${t}%`),
        ilike(sizeItems.standardDesignation, `%${t}%`),
      ),
    )
  }
  // числа должны совпадать с одним из габаритов (допуск 0.01)
  for (const n of numericParts) {
    conds.push(
      or(
        sql`abs(coalesce(${sizeItems.dim1}, -1) - ${n}) < 0.01`,
        sql`abs(coalesce(${sizeItems.dim2}, -1) - ${n}) < 0.01`,
        sql`abs(coalesce(${sizeItems.dim3}, -1) - ${n}) < 0.01`,
        ilike(sizeItems.designation, `%${n}%`),
      ),
    )
  }

  if (conds.length === 0) return []

  return db
    .select({ item: sizeItems, category: categories })
    .from(sizeItems)
    .innerJoin(categories, eq(sizeItems.categoryId, categories.id))
    .where(and(...conds))
    .orderBy(asc(sizeItems.dim1))
    .limit(limit)
}
