import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { StandardStatusChip } from '@/components/badges'
import { ItemDrawer } from '@/components/item-drawer'
import { ProfileSketch } from '@/components/profile-sketch'
import { SizeTable } from '@/components/size-table'
import { StandardReference } from '@/components/standard-reference'
import {
  getCategoryBySlug,
  getCategoryStandardHistory,
  getSizeItemsByCategory,
  getStandardByDesignation,
} from '@/lib/queries'
import type { ProfileType } from '@/lib/profile-config'

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) notFound()

  const items = await getSizeItemsByCategory(category.id)
  const [standard, standardHistory] = await Promise.all([
    items[0] ? getStandardByDesignation(items[0].standardDesignation) : null,
    getCategoryStandardHistory(category.id),
  ])
  const displayedStandard = standardHistory?.current?.document ?? standard

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav aria-label="Хлебные крошки" className="text-xs text-muted">
        <Link href="/catalog" className="hover:text-foreground hover:underline">
          Каталог
        </Link>
        <span aria-hidden> / </span>
        <span className="text-foreground">{category.name}</span>
      </nav>

      <div className="mt-4 flex items-start gap-5">
        <div className="hidden size-24 shrink-0 rounded-lg border border-border bg-surface-secondary p-1 sm:block">
          <ProfileSketch type={category.profileType as ProfileType} className="size-full" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">{category.name}</h1>
          <p className="text-sm leading-relaxed text-muted">
            {standardHistory?.current
              ? `${standardHistory.family.name}. Текущий нормативный документ — ${standardHistory.current.document.designation}.`
              : category.description}
          </p>
          {displayedStandard && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-mono text-xs">{displayedStandard.designation}</span>
              <StandardStatusChip status={displayedStandard.status} />
              {'note' in displayedStandard && displayedStandard.note && (
                <span className="text-xs text-muted">{displayedStandard.note}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {standardHistory?.current && (
        <section aria-labelledby="standards-title" className="mt-6 rounded-xl border border-border bg-surface p-5">
          <h2 id="standards-title" className="text-base font-semibold">Стандарты</h2>
          <div className="mt-4">
            <StandardReference
              current={{
                id: standardHistory.current.document.id,
                designation: standardHistory.current.document.designation,
                title: standardHistory.current.document.title,
                status: standardHistory.current.document.status,
                effectiveDate: standardHistory.current.document.effectiveDate,
                sourceUrl: standardHistory.current.document.sourceUrl,
              }}
              history={standardHistory.historical ? [{
                id: standardHistory.historical.document.id,
                designation: standardHistory.historical.document.designation,
                status: standardHistory.historical.document.status,
                effectiveDate: standardHistory.historical.document.effectiveDate,
                withdrawnDate: standardHistory.historical.document.withdrawnDate,
                sourceUrl: standardHistory.historical.document.sourceUrl,
                note: standardHistory.relationship?.legalEffect,
              }] : []}
            />
          </div>
        </section>
      )}

      <div className="mt-6">
        <Suspense>
          <SizeTable
            rows={items.map((i) => ({
              id: i.id,
              designation: i.designation,
              slug: i.slug,
              dim1: i.dim1,
              dim2: i.dim2,
              dim3: i.dim3,
              dim4: i.dim4,
              massPerM: i.massPerM,
              availability: i.availability,
            }))}
            profileType={category.profileType as ProfileType}
          />
        </Suspense>
      </div>

      <Suspense>
        <ItemDrawer />
      </Suspense>
    </div>
  )
}
