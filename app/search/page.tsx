import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AvailabilityChip } from '@/components/badges'
import { searchSizeItems } from '@/lib/queries'

export const metadata: Metadata = {
  title: 'Поиск — Цементит',
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q = '' } = await searchParams
  const results = q ? await searchSizeItems(q) : []

  // единственный точный результат — сразу на карточку
  if (results.length === 1) redirect(`/item/${results[0].item.slug}`)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-balance">
        {q ? `Результаты поиска: «${q}»` : 'Поиск'}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {q
          ? `Найдено позиций: ${results.length}`
          : 'Введите запрос в строке поиска, например «труба 76х4» или «швеллер 20».'}
      </p>

      {q && results.length === 0 && (
        <div className="mt-8 rounded-lg border border-border p-6 text-sm text-muted">
          <p>Ничего не найдено. Попробуйте:</p>
          <ul className="mt-2 list-inside list-disc leading-relaxed">
            <li>указать вид проката и размер: «двутавр 30», «уголок 63»</li>
            <li>
              подобрать по размерам в режиме{' '}
              <Link href="/by-size" className="text-accent hover:underline">
                «По размерам»
              </Link>
            </li>
          </ul>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border">
          <table className="dense-table w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-secondary text-left text-xs text-muted">
                <th className="px-3 font-medium">Обозначение</th>
                <th className="px-3 font-medium">Категория</th>
                <th className="px-3 font-medium">НД</th>
                <th className="px-3 text-right font-medium">Масса, кг/м</th>
                <th className="px-3 font-medium">Доступность</th>
              </tr>
            </thead>
            <tbody>
              {results.map(({ item, category }) => (
                <tr
                  key={item.id}
                  className="border-b border-border transition-colors last:border-b-0 hover:bg-surface-secondary"
                >
                  <td className="px-3">
                    <Link href={`/item/${item.slug}`} className="font-medium text-accent hover:underline">
                      {item.designation}
                    </Link>
                  </td>
                  <td className="px-3 text-xs text-muted">{category.name}</td>
                  <td className="px-3 font-mono text-xs">{item.standardDesignation}</td>
                  <td className="px-3 text-right font-mono text-xs">
                    {item.massPerM != null ? Number.parseFloat(item.massPerM) : '—'}
                  </td>
                  <td className="px-3">
                    <AvailabilityChip availability={item.availability} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
