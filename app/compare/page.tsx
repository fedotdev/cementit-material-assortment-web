import Link from 'next/link'
import { CompareView, type CompareItem } from '@/components/compare-view'
import { getSizeItemsByIds } from '@/lib/queries'

export const metadata = {
  title: 'Сравнение типоразмеров — Цементит',
  description: 'Сравнение металлопроката: параметры рядом, различия выделены.',
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>
}) {
  const { ids: idsParam } = await searchParams
  const ids = (idsParam ?? '')
    .split(',')
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n))
    .slice(0, 5)

  const rows = await getSizeItemsByIds(ids)

  const items: CompareItem[] = rows.map((r) => ({
    id: r.item.id,
    slug: r.item.slug,
    designation: r.item.designation,
    standardDesignation: r.item.standardDesignation,
    massPerM: r.item.massPerM,
    availability: r.item.availability,
    profileType: r.category.profileType,
    categoryName: r.category.name,
    params: (r.item.params ?? {}) as Record<string, number | string>,
  }))

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav aria-label="Хлебные крошки" className="text-xs text-muted">
        <Link href="/catalog" className="hover:text-foreground hover:underline">
          Каталог
        </Link>
        <span aria-hidden> / </span>
        <span className="text-foreground">Сравнение</span>
      </nav>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        Сравнение типоразмеров
      </h1>

      {items.length < 2 ? (
        <div className="mt-6 rounded-lg border border-border p-8 text-center">
          <p className="text-sm text-muted">
            Для сравнения нужно минимум 2 позиции. Выберите их галочками в таблице
            сортамента.
          </p>
          <Link
            href="/catalog"
            className="mt-4 inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <div className="mt-6">
          <CompareView items={items} />
        </div>
      )}
    </div>
  )
}
