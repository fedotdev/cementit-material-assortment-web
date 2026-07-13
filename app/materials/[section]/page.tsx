import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AlertTriangle, Database } from 'lucide-react'
import { MaterialCatalogControls } from '@/components/material-catalog-controls'
import { MaterialCatalogTable } from '@/components/material-catalog-table'
import { searchMaterialCatalog } from '@/lib/queries'

const SECTION_META = {
  stk: { title: 'Конструкционные стали', description: 'Марки для металлоконструкций, проката и деталей инженерного назначения.' },
  sto: { title: 'Стали для отливок', description: 'Марки для фасонных стальных отливок и литых деталей.' },
} as const

type Props = {
  params: Promise<{ section: string }>
  searchParams: Promise<{ q?: string; class?: string; page?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section } = await params
  const meta = SECTION_META[section as keyof typeof SECTION_META]
  return meta ? { title: `${meta.title} — каталог материалов`, description: meta.description } : {}
}

export default async function MaterialSectionPage({ params, searchParams }: Props) {
  const [{ section }, queryParams] = await Promise.all([params, searchParams])
  const meta = SECTION_META[section as keyof typeof SECTION_META]
  if (!meta) notFound()
  const query = queryParams.q ?? ''
  const materialClass = queryParams.class ?? ''
  const page = Number.parseInt(queryParams.page ?? '1', 10)
  const result = await searchMaterialCatalog({ query, section, materialClass, page: Number.isFinite(page) ? page : 1, pageSize: 24 })
  const pageCount = Math.max(1, Math.ceil(result.total / result.pageSize))
  const basePath = `/materials/${section}`
  const pageHref = (target: number) => {
    const next = new URLSearchParams()
    if (query) next.set('q', query)
    if (materialClass) next.set('class', materialClass)
    if (target > 1) next.set('page', String(target))
    return `${basePath}${next.size ? `?${next}` : ''}`
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <nav aria-label="Хлебные крошки" className="text-xs text-muted"><Link href="/materials" className="hover:text-foreground hover:underline">Каталог материалов</Link><span aria-hidden> / </span><span className="text-foreground">{meta.title}</span></nav>
      <header className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl"><p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">Раздел {section}</p><h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight">{meta.title}</h1><p className="mt-2 text-sm leading-relaxed text-muted">{meta.description}</p></div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3"><Database aria-hidden className="size-5 text-accent" /><div><p className="font-mono text-xl font-semibold">{result.total}</p><p className="text-xs text-muted">материалов найдено</p></div></div>
      </header>
      <div className="flex gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4"><AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0 text-warning" /><p className="text-sm leading-relaxed">Демо-данные требуют проверки. Упоминания стандартов и зарубежные аналоги не являются подтверждением допустимости марки для профиля.</p></div>
      <MaterialCatalogControls initialQuery={query} initialClass={materialClass} classes={result.facets} basePath={basePath} />
      {result.items.length ? <MaterialCatalogTable rows={result.items} section={section} /> : <div className="rounded-xl border border-dashed border-border py-16 text-center"><h2 className="font-semibold">Материалы не найдены</h2><p className="mt-1 text-sm text-muted">Измените запрос или сбросьте фильтры.</p></div>}
      {pageCount > 1 && <nav aria-label="Страницы каталога" className="flex items-center justify-between border-t border-border pt-5"><Link aria-disabled={result.page === 1} className={`rounded-lg border border-border px-4 py-2 text-sm ${result.page === 1 ? 'pointer-events-none opacity-40' : 'hover:border-accent'}`} href={pageHref(result.page - 1)}>Назад</Link><span className="font-mono text-xs text-muted">{result.page} / {pageCount}</span><Link aria-disabled={result.page === pageCount} className={`rounded-lg border border-border px-4 py-2 text-sm ${result.page === pageCount ? 'pointer-events-none opacity-40' : 'hover:border-accent'}`} href={pageHref(result.page + 1)}>Далее</Link></nav>}
    </main>
  )
}
