import type { Metadata } from 'next'
import { StandardStatusChip } from '@/components/badges'
import { getStandards } from '@/lib/queries'

export const metadata: Metadata = {
  title: 'Стандарты — Цементит',
  description:
    'Реестр стандартов на сортаменты и марки стали: статус, цепочки замен, системы ГОСТ, EN, ISO, GB.',
}

export default async function StandardsPage() {
  const standards = await getStandards()

  const bySystem = new Map<string, typeof standards>()
  for (const s of standards) {
    const list = bySystem.get(s.system) ?? []
    list.push(s)
    bySystem.set(s.system, list)
  }
  const systemOrder = ['GOST', 'EN', 'ISO', 'GB']
  const systemLabels: Record<string, string> = {
    GOST: 'ГОСТ (Россия / ЕАЭС)',
    EN: 'EN (Европа)',
    ISO: 'ISO (международные)',
    GB: 'GB (Китай)',
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-balance">Стандарты</h1>
      <p className="mt-1 text-sm text-muted">
        Статусы актуальности и цепочки замен. Жёлтый бейдж — документ заменён, смотрите
        актуальный.
      </p>

      <div className="mt-6 flex flex-col gap-8">
        {systemOrder
          .filter((sys) => bySystem.has(sys))
          .map((sys) => (
            <section key={sys}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                {systemLabels[sys] ?? sys}
              </h2>
              <div className="mt-2 overflow-x-auto rounded-lg border border-border">
                <table className="dense-table w-full min-w-[640px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-secondary text-left text-xs text-muted">
                      <th className="px-3 font-medium">Обозначение</th>
                      <th className="px-3 font-medium">Наименование</th>
                      <th className="px-3 font-medium">Статус</th>
                      <th className="px-3 font-medium">Заменён на</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(bySystem.get(sys) ?? []).map((s) => (
                      <tr key={s.id} className="border-b border-border last:border-b-0">
                        <td className="whitespace-nowrap px-3 font-mono text-xs">{s.designation}</td>
                        <td className="px-3 text-xs leading-relaxed">{s.title}</td>
                        <td className="px-3">
                          <StandardStatusChip status={s.status} />
                        </td>
                        <td className="whitespace-nowrap px-3 font-mono text-xs">
                          {s.replacedByDesignation ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
      </div>
    </div>
  )
}
