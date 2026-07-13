import { AlertTriangle, ArrowLeft, ExternalLink, FlaskConical, Gauge, Library, Link2 } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { GradeDecoding } from '@/components/grade-decoding'
import { StandardReference } from '@/components/standard-reference'
import { decodeSteelGrade } from '@/lib/materials/steel-decoder'
import { getMaterialCatalogEntry } from '@/lib/queries'

type Props = { params: Promise<{ grade: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { grade } = await params
  const entry = await getMaterialCatalogEntry(decodeURIComponent(grade))
  return entry ? { title: `${entry.material.name} — марка стали`, description: entry.material.industrialUse ?? `Справочная карточка стали ${entry.material.name}` } : {}
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg bg-surface-secondary p-4 text-sm text-muted">{children}</p>
}

export default async function MaterialGradePage({ params }: Props) {
  const { grade } = await params
  const entry = await getMaterialCatalogEntry(decodeURIComponent(grade))
  if (!entry) notFound()
  const { material, composition, properties, mechanics, standardReferences, analogues } = entry

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <Link href="/grades" className="flex w-fit items-center gap-2 text-sm text-muted hover:text-foreground"><ArrowLeft aria-hidden className="size-4" />Каталог марок</Link>

      <header className="grid gap-5 border-b border-border pb-6 md:grid-cols-[1fr_auto] md:items-start">
        <div>
          <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-widest text-accent">Марка стали / {material.sourceMaterialId ?? 'реестр'}</p>
          <GradeDecoding grade={material.name} decoding={decodeSteelGrade(material.name)} />
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted">{material.industrialUse || 'Назначение в источнике не указано.'}</p>
        </div>
        <div className="flex flex-col gap-2 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm md:max-w-72">
          <span className="flex items-center gap-2 font-medium text-warning"><AlertTriangle aria-hidden className="size-4" />Требует проверки</span>
          <span className="text-xs leading-relaxed text-muted">Импортировано из справочного набора; не является нормативным заключением.</span>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Классификация">
        {[['Класс', material.materialClass], ['Раздел', material.catalogSection], ['Категория', material.category]].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-surface p-4"><p className="text-xs uppercase tracking-wide text-muted">{label}</p><p className="mt-2 text-sm font-medium">{value || 'Не указан'}</p></div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="flex flex-col gap-6">
          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><FlaskConical aria-hidden className="size-5 text-accent" />Химический состав</h2>
            {composition.length ? (
              <div className="mt-4 overflow-x-auto"><table className="w-full min-w-lg text-left text-sm"><thead className="border-b border-border text-xs text-muted"><tr><th className="pb-3 font-medium">Элемент</th><th className="pb-3 font-medium">Значение источника</th><th className="pb-3 font-medium">Мин., %</th><th className="pb-3 font-medium">Макс., %</th></tr></thead><tbody>{composition.map((item) => <tr key={item.id} className="border-b border-border/70 last:border-0"><td className="py-3 font-mono font-semibold">{item.elementSymbol}</td><td className="py-3 font-mono text-muted">{item.valueRaw || '—'}</td><td className="py-3 font-mono">{item.minPercent || '—'}</td><td className="py-3 font-mono">{item.maxPercent || '—'}</td></tr>)}</tbody></table></div>
            ) : <div className="mt-4"><EmptyState>Состав в источнике не указан.</EmptyState></div>}
          </section>

          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><Gauge aria-hidden className="size-5 text-accent" />Свойства и механика</h2>
            {properties.length || mechanics.length ? <div className="mt-4 flex flex-col gap-3">{properties.map((item) => <div key={item.id} className="grid gap-1 rounded-lg bg-surface-secondary p-3 sm:grid-cols-[12rem_1fr]"><span className="text-xs font-medium text-muted">{item.propertyKey}</span><span className="font-mono text-xs break-words">{item.valueRaw || JSON.stringify(item.valueJson)}</span></div>)}{mechanics.map((item) => <div key={item.id} className="rounded-lg bg-surface-secondary p-3"><p className="text-xs text-muted">Таблица {item.tableNumber ?? '—'}, строка {item.rowNumber ?? '—'} · {item.conditionRaw || 'условие не указано'}</p><pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-xs">{JSON.stringify(item.valuesJson, null, 2)}</pre></div>)}</div> : <div className="mt-4"><EmptyState>Механические свойства в источнике не указаны.</EmptyState></div>}
          </section>
        </div>

        <aside className="flex flex-col gap-6">
          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="flex items-center gap-2 font-semibold"><Library aria-hidden className="size-5 text-accent" />Упоминания стандартов</h2>
            {standardReferences.length ? <ul className="mt-4 flex flex-col gap-2">{standardReferences.map((item) => <li key={item.id} className="rounded-lg bg-surface-secondary p-3"><StandardReference current={{ id: item.id, designation: [item.standardSystemRaw, item.standardNumberRaw].filter(Boolean).join(' '), status: 'needs_review', note: 'Упомянут в источнике, сведения требуют проверки' }} compact /></li>)}</ul> : <div className="mt-4 rounded-lg bg-surface-secondary p-3"><StandardReference /></div>}
          </section>

          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="flex items-center gap-2 font-semibold"><Link2 aria-hidden className="size-5 text-accent" />Зарубежные обозначения</h2>
            {analogues.length ? <ul className="mt-4 flex flex-col gap-2">{analogues.map(({ candidate, designation }) => <li key={candidate.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"><div><p className="font-mono text-sm font-semibold">{designation.designation}</p><p className="mt-1 text-xs text-muted">{designation.country || designation.systemHint || 'Система не указана'}</p></div><span className="rounded-full bg-warning/10 px-2 py-1 text-[10px] font-medium text-warning">Кандидат</span></li>)}</ul> : <div className="mt-4"><EmptyState>Кандидаты не указаны.</EmptyState></div>}
          </section>

          {material.sourceUrl && <a href={material.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border border-border bg-surface p-4 text-sm hover:border-accent">Источник данных <ExternalLink aria-hidden className="size-4" /></a>}
        </aside>
      </div>
    </main>
  )
}
