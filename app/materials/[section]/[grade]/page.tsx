import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AlertTriangle, ExternalLink, FileText } from 'lucide-react'
import { GradeDecoding } from '@/components/grade-decoding'
import { MaterialDetailTabs } from '@/components/material-detail-tabs'
import { decodeSteelGrade } from '@/lib/materials/steel-decoder'
import { getMaterialCatalogEntry } from '@/lib/queries'

const SECTION_NAMES: Record<string, string> = { stk: 'Конструкционные стали', sto: 'Стали для отливок' }
type Props = { params: Promise<{ section: string; grade: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { grade } = await params
  const entry = await getMaterialCatalogEntry(decodeURIComponent(grade))
  return entry ? { title: `${entry.material.name} — марка стали`, description: entry.material.industrialUse ?? `Справочная карточка стали ${entry.material.name}` } : {}
}

export default async function MaterialPage({ params }: Props) {
  const { section, grade } = await params
  if (!SECTION_NAMES[section]) notFound()
  const entry = await getMaterialCatalogEntry(decodeURIComponent(grade))
  if (!entry || entry.material.catalogSection !== section) notFound()
  const { material, composition, properties, mechanics, standardReferences, analogues } = entry
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <nav aria-label="Хлебные крошки" className="text-xs text-muted"><Link href="/materials" className="hover:text-foreground hover:underline">Каталог материалов</Link><span aria-hidden> / </span><Link href={`/materials/${section}`} className="hover:text-foreground hover:underline">{SECTION_NAMES[section]}</Link><span aria-hidden> / </span><span className="text-foreground">{material.name}</span></nav>
      <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="h-fit rounded-xl border border-border bg-surface p-5">
          <div className="flex size-12 items-center justify-center rounded-lg bg-surface-secondary"><FileText aria-hidden className="size-6 text-accent" /></div>
          <p className="mt-5 font-mono text-3xl font-semibold tracking-tight">{material.name}</p>
          <dl className="mt-5 flex flex-col gap-3 border-t border-border pt-4 text-sm"><div><dt className="text-xs text-muted">Класс</dt><dd className="mt-1">{material.materialClass || 'Не указан'}</dd></div><div><dt className="text-xs text-muted">Раздел</dt><dd className="mt-1 font-mono">{section}</dd></div><div><dt className="text-xs text-muted">Статус данных</dt><dd className="mt-1 text-warning">Требует проверки</dd></div></dl>
          <div className="mt-5"><GradeDecoding grade={material.name} decoding={decodeSteelGrade(material.name)} /></div>
          {material.sourceUrl && <a href={material.sourceUrl} target="_blank" rel="noreferrer" className="mt-5 flex items-center justify-between rounded-lg border border-border px-3 py-2 text-xs hover:border-accent">Источник<ExternalLink aria-hidden className="size-4" /></a>}
        </aside>
        <div className="min-w-0">
          <header className="border-b border-border pb-5"><p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">Паспорт материала</p><h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight">{material.name}</h1><p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">{material.industrialUse || 'Назначение в источнике не указано.'}</p><div className="mt-4 flex gap-3 rounded-lg border border-warning/40 bg-warning/10 p-3"><AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" /><p className="text-xs leading-relaxed">Импортировано из справочного набора. Сведения не являются нормативным заключением, а зарубежные обозначения требуют отдельной проверки.</p></div></header>
          <MaterialDetailTabs material={material} composition={composition} properties={properties} mechanics={mechanics} standardReferences={standardReferences} analogues={analogues} />
        </div>
      </div>
    </main>
  )
}
