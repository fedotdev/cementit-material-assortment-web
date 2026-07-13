'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { AvailabilityChip } from '@/components/badges'
import { ProfileSketch } from '@/components/profile-sketch'
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

/** Параметры, для которых уместна относительная разница. */
const PERCENT_PARAMS = new Set(['A', 'Ix', 'Wx', 'massPerM', 'mass_m2'])

export interface CompareItem {
  id: number
  slug: string
  designation: string
  standardDesignation: string
  massPerM: string | null
  availability: string
  profileType: string
  categoryName: string
  params: Record<string, number | string>
}

export function CompareView({ items }: { items: CompareItem[] }) {
  const router = useRouter()
  const [hideSame, setHideSame] = useState(false)

  // все ключи параметров по всем позициям, в стабильном порядке
  const paramKeys = useMemo(() => {
    const keys: string[] = []
    for (const it of items) {
      for (const k of Object.keys(it.params)) {
        if (!keys.includes(k)) keys.push(k)
      }
    }
    return keys
  }, [items])

  // максимальный главный размер для приведения эскизов к одному масштабу
  const maxDim = useMemo(() => {
    let max = 0
    for (const it of items) {
      const v = Number(Object.values(it.params)[0] ?? 0)
      if (v > max) max = v
    }
    return max
  }, [items])

  function remove(id: number) {
    const rest = items.filter((i) => i.id !== id).map((i) => i.id)
    if (rest.length < 1) {
      router.push('/catalog')
      return
    }
    router.replace(`/compare?ids=${rest.join(',')}`, { scroll: false })
  }

  function isSameRow(values: (string | number | null)[]): boolean {
    const first = values[0]
    return values.every((v) => String(v) === String(first))
  }

  const base = items[0]

  function diffCell(key: string, value: number | string | null, baseValue: number | string | null) {
    if (value == null) return <span className="text-muted">—</span>
    const vN = Number(value)
    const bN = Number(baseValue)
    const showPercent =
      PERCENT_PARAMS.has(key) &&
      !Number.isNaN(vN) &&
      !Number.isNaN(bN) &&
      bN !== 0 &&
      vN !== bN
    const pct = showPercent ? ((vN - bN) / bN) * 100 : null
    return (
      <span className="inline-flex items-baseline gap-1.5">
        <span className="font-mono">{String(value)}</span>
        {pct != null && (
          <span
            className={`text-[11px] tabular-nums ${pct > 0 ? 'text-warning' : 'text-success'}`}
          >
            {pct > 0 ? '+' : ''}
            {pct.toLocaleString('ru-RU', { maximumFractionDigits: 1 })}%
          </span>
        )}
      </span>
    )
  }

  // строки: параметры + масса + стандарт + доступность
  const rows: {
    key: string
    label: string
    values: (string | number | null)[]
    render?: (v: string | number | null, i: number) => React.ReactNode
  }[] = [
    ...paramKeys.map((k) => ({
      key: k,
      label: PARAM_LABELS[k] ?? k,
      values: items.map((it) => it.params[k] ?? null),
      render: (v: string | number | null) => diffCell(k, v, base.params[k] ?? null),
    })),
    {
      key: 'massPerM',
      label: 'Масса, кг/м',
      values: items.map((it) => (it.massPerM ? Number.parseFloat(it.massPerM) : null)),
      render: (v: string | number | null) =>
        diffCell('massPerM', v, base.massPerM ? Number.parseFloat(base.massPerM) : null),
    },
    {
      key: 'std',
      label: 'Стандарт',
      values: items.map((it) => it.standardDesignation),
      render: (v) => <span className="font-mono text-xs">{String(v)}</span>,
    },
    {
      key: 'avail',
      label: 'Доступность',
      values: items.map((it) => it.availability),
      render: (v) => <AvailabilityChip availability={String(v)} />,
    },
  ]

  const visibleRows = hideSame ? rows.filter((r) => !isSameRow(r.values)) : rows
  const sameCount = rows.filter((r) => isSameRow(r.values)).length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={hideSame}
            onChange={(e) => setHideSame(e.target.checked)}
            className="size-4 accent-current"
          />
          Скрыть одинаковые
          {sameCount > 0 && <span className="text-xs text-muted">({sameCount})</span>}
        </label>
        <p className="text-xs text-muted">
          Разница указана относительно первой позиции ({base.designation})
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-secondary">
              <th className="sticky left-0 z-10 bg-surface-secondary px-3 py-2 text-left text-xs font-medium text-muted">
                Параметр
              </th>
              {items.map((it, i) => {
                const scale =
                  maxDim > 0
                    ? Math.max(0.45, Math.min(1, Number(Object.values(it.params)[0] ?? 0) / maxDim))
                    : 1
                return (
                  <th key={it.id} className="min-w-40 px-3 py-3 text-left align-top font-normal">
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <Link
                          href={`/item/${it.slug}`}
                          className="block truncate text-sm font-semibold text-accent hover:underline"
                        >
                          {it.designation}
                        </Link>
                        <span className="block truncate text-[11px] text-muted">
                          {it.categoryName}
                          {i === 0 && ' · база'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(it.id)}
                        aria-label={`Убрать ${it.designation} из сравнения`}
                        className="shrink-0 rounded p-1 text-muted transition-colors hover:bg-surface hover:text-foreground"
                      >
                        <X aria-hidden className="size-3.5" />
                      </button>
                    </div>
                    <div className="mt-2 flex h-20 items-end overflow-hidden">
                      <div className="max-h-full" style={{ width: `${scale * 5}rem` }}>
                        <ProfileSketch
                          type={it.profileType as ProfileType}
                          className="aspect-square w-full"
                        />
                      </div>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => {
              const same = isSameRow(row.values)
              return (
                <tr
                  key={row.key}
                  className={`border-b border-border last:border-b-0 ${
                    !same ? 'bg-surface-secondary/50' : ''
                  }`}
                >
                  <td className="sticky left-0 z-10 bg-surface px-3 py-2 text-xs text-muted">
                    {row.label}
                    {!same && (
                      <span aria-hidden className="ml-1.5 inline-block size-1.5 rounded-full bg-accent align-middle" />
                    )}
                  </td>
                  {row.values.map((v, i) => (
                    <td key={items[i].id} className="px-3 py-2">
                      {row.render ? row.render(v, i) : <span className="font-mono">{v ?? '—'}</span>}
                    </td>
                  ))}
                </tr>
              )
            })}
            {visibleRows.length === 0 && (
              <tr>
                <td colSpan={items.length + 1} className="px-3 py-8 text-center text-sm text-muted">
                  Все параметры одинаковы.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
