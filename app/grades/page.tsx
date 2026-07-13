import { AlertTriangle, ArrowRight, Database, ShieldCheck } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { MaterialCatalogControls } from '@/components/material-catalog-controls'
import { searchMaterialCatalog } from '@/lib/queries'

export const metadata: Metadata = {
  title: 'Каталог марок стали — Цементит',
  description: 'Поиск и технические сведения по маркам стали с трассировкой источника и статусом проверки.',
}

type SearchParams = Promise<{ q?: string; class?: string; page?: string }>

export default async function GradesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const query = params.q ?? ''
  const materialClass = params.class ?? ''
  const requestedPage = Number.parseInt(params.page ?? '1', 10)
  const result = await searchMaterialCatalog({
    query,
    materialClass,
    page: Number.isFinite(requestedPage) ? requestedPage : 1,
  })
  const pageCount = Math.max(1, Math.ceil(result.total / result.pageSize))

  function pageHref(page: number) {
    const next = new URLSearchParams()
    if (query) next.set('q', query)
    if (materialClass) next.set('class', materialClass)
    if (page > 1) next.set('page', String(page))
    return `/grades${next.size ? `?${next}` : ''}`
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-widest text-accent">Материаловедение / реестр</p>
          <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">Каталог марок стали</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Состав, свойства, варианты обозначений и упоминания стандартов. Данные источника отделены от подтверждённых нормативных соответствий.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
          <Database aria-hidden className="size-5 text-accent" />
          <div><p className="font-mono text-xl font-semibold">{result.total}</p><p className="text-xs text-muted">марок найдено</p></div>
        </div>
      </header>

      <div className="flex gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
        <p className="text-sm leading-relaxed">
          Импортированные сведения имеют статус «требует проверки». Зарубежные обозначения показаны как кандидаты, а не как нормативно подтверждённые аналоги.
        </p>
      </div>

      <MaterialCatalogControls initialQuery={query} initialClass={materialClass} classes={result.facets} />

      {result.items.length ? (
        <section aria-label="Марки стали" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((material) => (
            <Link
              key={material.id}
              href={`/grades/${encodeURIComponent(material.normalizedName)}`}
              className="group flex min-h-56 flex-col justify-between gap-5 rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-mono text-xl font-semibold tracking-tight">{material.name}</h2>
                  <span className="rounded-full border border-warning/40 bg-warning/10 px-2 py-1 text-[11px] font-medium text-warning">Проверить</span>
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted">{material.industrialUse || material.materialClass || 'Описание назначения уточняется'}</p>
              </div>
              <div className="flex flex-col gap-3 border-t border-border pt-4">
                <div className="flex flex-wrap gap-2 text-xs">
                  {material.materialClass && <span className="rounded-md bg-surface-secondary px-2 py-1">{material.materialClass}</span>}
                  {material.catalogSection && <span className="rounded-md bg-surface-secondary px-2 py-1 text-muted">{material.catalogSection}</span>}
                </div>
                <span className="flex items-center justify-between text-xs font-medium text-accent">
                  Открыть карточку <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <ShieldCheck aria-hidden className="mx-auto size-8 text-muted" />
          <h2 className="mt-3 font-semibold">Марки не найдены</h2>
          <p className="mt-1 text-sm text-muted">Измените запрос или сбросьте фильтры.</p>
        </div>
      )}

      {pageCount > 1 && (
        <nav aria-label="Страницы каталога" className="flex items-center justify-between border-t border-border pt-5">
          <Link aria-disabled={result.page === 1} className={`rounded-lg border border-border px-4 py-2 text-sm ${result.page === 1 ? 'pointer-events-none opacity-40' : 'hover:border-accent'}`} href={pageHref(result.page - 1)}>Назад</Link>
          <span className="font-mono text-xs text-muted">{result.page} / {pageCount}</span>
          <Link aria-disabled={result.page === pageCount} className={`rounded-lg border border-border px-4 py-2 text-sm ${result.page === pageCount ? 'pointer-events-none opacity-40' : 'hover:border-accent'}`} href={pageHref(result.page + 1)}>Далее</Link>
        </nav>
      )}
    </main>
  )
}
