'use server'

import { searchSizeItems, getStandards } from '@/lib/queries'
import { normalizeQuery } from '@/lib/search-parse'

export interface Suggestion {
  slug: string
  designation: string
  standardDesignation: string
  categoryName: string
  availability: string
}

export interface StandardSuggestion {
  designation: string
  title: string
  status: string
}

export interface SectionSuggestion {
  href: string
  label: string
}

export interface GroupedSuggestions {
  items: Suggestion[]
  standards: StandardSuggestion[]
  sections: SectionSuggestion[]
}

const SECTIONS: { href: string; label: string; keywords: string[] }[] = [
  { href: '/catalog', label: 'Каталог сортаментов', keywords: ['каталог', 'сортамент', 'ассортимент'] },
  { href: '/by-size', label: 'Подбор по размерам', keywords: ['размер', 'подбор', 'эскиз'] },
  { href: '/grades', label: 'Марки стали', keywords: ['марк', 'сталь', 'аналог'] },
  { href: '/standards', label: 'Стандарты', keywords: ['гост', 'стандарт', 'iso', 'en'] },
]

export async function suggestSizeItems(query: string): Promise<GroupedSuggestions> {
  const q = normalizeQuery(query)
  if (q.length < 2) return { items: [], standards: [], sections: [] }

  const [rows, allStandards] = await Promise.all([
    searchSizeItems(q, 5),
    getStandards(),
  ])

  const items = rows.map((r) => ({
    slug: r.item.slug,
    designation: r.item.designation,
    standardDesignation: r.item.standardDesignation,
    categoryName: r.category.name,
    availability: r.item.availability,
  }))

  const standardMatches = allStandards
    .filter(
      (s) =>
        s.designation.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q),
    )
    .slice(0, 3)
    .map((s) => ({
      designation: s.designation,
      title: s.title,
      status: s.status,
    }))

  const sections = SECTIONS.filter((s) =>
    s.keywords.some((k) => q.includes(k)),
  ).map(({ href, label }) => ({ href, label }))

  return { items, standards: standardMatches, sections }
}
