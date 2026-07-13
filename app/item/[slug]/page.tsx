import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AvailabilityChip, StandardStatusChip } from '@/components/badges'
import { ItemTabs } from '@/components/item-tabs'
import { MassCalculator } from '@/components/mass-calculator'
import { MaterialSelector } from '@/components/material-selector'
import { ProfileSketch } from '@/components/profile-sketch'
import { StandardReference } from '@/components/standard-reference'
import {
  getAllowedMaterialsForProfile,
  getNeighbours,
  getProfileDomainBySlug,
  getSizeItemBySlug,
  getStandardChain,
} from '@/lib/queries'
import { PROFILE_CONFIG, type ProfileType } from '@/lib/profile-config'

const PARAM_LABELS: Record<string, string> = {
  h: 'Высота h, мм',
  b: 'Ширина b, мм',
  s: 'Толщина стенки s, мм',
  t: 'Толщина, мм',
  A: 'Площадь сечения, см²',
  Ix: 'Момент инерции Ix, см⁴',
  Wx: 'Момент сопротивления Wx, см³',
  D: 'Наружный диаметр D, мм',
  d: 'Диаметр d, мм',
  a: 'Сторона a, мм',
  w: 'Ширина, мм',
  l: 'Длина, мм',
  mass_m2: 'Масса 1 м², кг',
}

export default async function ItemPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const result = await getSizeItemBySlug(slug)
  if (!result) notFound()
  const { item, category } = result

  const profileType = category.profileType as ProfileType

  const [chain, neighbours, domain] = await Promise.all([
    getStandardChain(item.standardDesignation),
    getNeighbours(item),
    getProfileDomainBySlug(slug),
  ])
  const allowedRows = domain
    ? await getAllowedMaterialsForProfile(
        domain.size.id,
        domain.specification.id,
        domain.specification.purposeCategory ?? 'general',
        domain.specification.accuracyClass ?? 'any',
      )
    : []

  const standard = chain.find((s) => s.designation === item.standardDesignation) ?? null
  const geometryDocument = domain?.geometryDocument
    ? {
        id: domain.geometryDocument.id,
        system: domain.geometryDocument.system,
        designation: domain.geometryDocument.designation,
        title: domain.geometryDocument.title,
        status: domain.geometryDocument.status,
        effectiveDate: domain.geometryDocument.effectiveDate,
        withdrawnDate: domain.geometryDocument.withdrawnDate,
        sourceUrl: domain.geometryDocument.sourceUrl,
        verifiedAt: domain.geometryDocument.verifiedAt,
      }
    : null
  const materialOptions = allowedRows.map(({ link, material, document }) => ({
    id: material.id,
    name: material.name,
    category: material.category,
    dataStatus: material.dataStatus as 'verified' | 'needs_review' | 'rejected',
    governingDocument: document
      ? {
          id: document.id,
          system: document.system,
          designation: document.designation,
          title: document.title,
          status: document.status,
          sourceUrl: document.sourceUrl,
          verifiedAt: document.verifiedAt,
        }
      : null,
    recommendationStatus: link.recommendationStatus as 'verified' | 'needs_review' | 'rejected',
    purposeCategory: link.purposeCategory,
    accuracyClass: link.accuracyClass,
    sourceClause: link.sourceClause,
  }))
  const config = PROFILE_CONFIG[profileType]
  const itemParams = (item.params ?? {}) as Record<string, number | string>

  // значения размеров для подписей на эскизе
  const sketchValues: Record<string, number | string | undefined> = {}
  for (const c of config.columns) {
    if (c.dimLetter && itemParams[c.dimLetter] != null) {
      sketchValues[c.dimLetter] = itemParams[c.dimLetter]
    }
  }

  // «Швеллер 20У» → «20У», «Труба 76x4» → «76х4»
  const sizeLabel = item.designation

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav aria-label="Хлебные крошки" className="text-xs text-muted">
        <Link href="/catalog" className="hover:text-foreground hover:underline">
          Каталог
        </Link>
        <span aria-hidden> / </span>
        <Link href={`/catalog/${category.slug}`} className="hover:text-foreground hover:underline">
          {category.name}
        </Link>
        <span aria-hidden> / </span>
        <span className="text-foreground">{item.designation}</span>
      </nav>

      <div className="mt-4 flex flex-col gap-6 lg:flex-row">
        <div className="flex flex-col gap-3 lg:w-72 lg:shrink-0">
          <div className="rounded-lg border border-border bg-surface-secondary p-3">
            <ProfileSketch
              type={profileType}
              values={sketchValues}
              highlight={Object.keys(sketchValues)}
              className="aspect-square w-full"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <AvailabilityChip availability={item.availability} />
            {standard && <StandardStatusChip status={standard.status} />}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            {item.designation}
          </h1>
          <p className="mt-1 font-mono text-sm text-muted">{item.standardDesignation}</p>

          <div className="mt-4">
            <ItemTabs
              paramsPanel={
                <div className="flex flex-col gap-4">
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="dense-table w-full border-collapse text-sm">
                      <tbody>
                        {Object.entries(itemParams).map(([k, v]) => (
                          <tr key={k} className="border-b border-border last:border-b-0">
                            <td className="px-3 text-muted">{PARAM_LABELS[k] ?? k}</td>
                            <td className="px-3 text-right font-mono">{String(v)}</td>
                          </tr>
                        ))}
                        {item.massPerM && (
                          <tr>
                            <td className="px-3 text-muted">Масса, {config.massLabel}</td>
                            <td className="px-3 text-right font-mono">{Number.parseFloat(item.massPerM)}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <MassCalculator massPerM={item.massPerM} massLabel={config.massLabel} />
                </div>
              }
              availabilityPanel={
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <AvailabilityChip availability={item.availability} />
                  </div>
                  <p className="rounded-lg border border-border bg-surface-secondary p-3 text-xs leading-relaxed text-muted">
                    Оценка типичности позиции по сортаменту. Данные о фактическом наличии у
                    поставщиков, ценах и сроках пока не подтверждены — уточняйте при закупке.
                  </p>
                </div>
              }
              standardsPanel={
                <div className="flex flex-col gap-5 rounded-lg border border-border p-5">
                  <section aria-labelledby="geometry-standard-title">
                    <h2 id="geometry-standard-title" className="text-sm font-semibold">Стандарт на геометрию</h2>
                    <div className="mt-4">
                      <StandardReference
                        current={geometryDocument ? {
                          id: geometryDocument.id,
                          designation: geometryDocument.designation,
                          title: geometryDocument.title,
                          status: geometryDocument.status,
                          effectiveDate: geometryDocument.effectiveDate,
                          withdrawnDate: geometryDocument.withdrawnDate,
                          sourceUrl: geometryDocument.sourceUrl,
                        } : standard ? {
                          id: standard.id,
                          designation: standard.designation,
                          title: standard.title,
                          status: standard.status,
                          note: standard.note,
                        } : null}
                        history={chain
                          .filter((item) => item.designation !== (geometryDocument?.designation ?? standard?.designation))
                          .map((item) => ({
                            id: item.id,
                            designation: item.designation,
                            title: item.title,
                            status: item.status,
                            note: item.note,
                          }))}
                      />
                    </div>
                  </section>
                  <section aria-labelledby="material-standard-title" className="border-t border-border pt-5">
                    <h2 id="material-standard-title" className="text-sm font-semibold">Стандарт на материал</h2>
                    <div className="mt-4">
                      <StandardReference emptyText="Стандарт материала не определён" />
                    </div>
                  </section>
                  <p className="text-xs leading-relaxed text-muted">
                    Геометрические аналоги и аналоги материалов учитываются независимо.
                  </p>
                </div>
              }
              recordPanel={
                <MaterialSelector
                  profileDesignation={sizeLabel}
                  geometryDocument={geometryDocument}
                  materials={materialOptions}
                  purposeCategory={domain?.specification.purposeCategory ?? 'general'}
                  accuracyClass={domain?.specification.accuracyClass ?? 'any'}
                />
              }
            />
          </div>

          {neighbours.length > 0 && (
            <section aria-label="Соседние типоразмеры" className="mt-6">
              <h2 className="text-sm font-medium text-muted">Соседние типоразмеры</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {neighbours.map((n) => (
                  <Link
                    key={n.id}
                    href={`/item/${n.slug}`}
                    className="rounded-md border border-border px-3 py-1.5 font-mono text-sm transition-colors hover:border-foreground hover:bg-surface-secondary"
                  >
                    {n.designation}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
