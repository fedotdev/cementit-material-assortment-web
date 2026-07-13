import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Factory, Layers3 } from 'lucide-react'
import { getMaterialSectionCounts } from '@/lib/queries'

export const metadata: Metadata = {
  title: 'Каталог материалов — Цементит',
  description: 'Конструкционные стали и стали для отливок с техническими сведениями и источниками.',
}

const sections = [
  { code: 'stk', title: 'Конструкционные стали', description: 'Стали для металлоконструкций, деталей машин, проката и других инженерных применений.', icon: Layers3 },
  { code: 'sto', title: 'Стали для отливок', description: 'Литейные марки стали для фасонных отливок и деталей различного назначения.', icon: Factory },
] as const

export default async function MaterialsPage() {
  const counts = await getMaterialSectionCounts()
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="border-b border-border pb-6">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">Материаловедение</p>
        <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight md:text-4xl">Каталог материалов</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">Выберите раздел. Марки, нормативные упоминания и зарубежные обозначения хранятся отдельно от допустимости материала для конкретного профиля.</p>
      </header>
      <section aria-label="Разделы материалов" className="grid gap-4 md:grid-cols-2">
        {sections.map(({ code, title, description, icon: Icon }) => (
          <Link key={code} href={`/materials/${code}`} className="group flex min-h-56 flex-col justify-between rounded-xl border border-border bg-surface p-6 transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <div>
              <div className="flex items-start justify-between gap-4"><Icon aria-hidden className="size-7 text-accent" /><span className="font-mono text-xs text-muted">{code}</span></div>
              <h2 className="mt-6 text-xl font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-4"><span className="font-mono text-sm">{counts[code] ?? 0} материалов</span><ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" /></div>
          </Link>
        ))}
      </section>
    </main>
  )
}
