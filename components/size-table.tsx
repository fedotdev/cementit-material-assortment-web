'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ArrowDown, ArrowUp, ExternalLink, X } from 'lucide-react'
import { AvailabilityChip } from '@/components/badges'
import {
  AVAILABILITY_LABEL,
  PROFILE_CONFIG,
  type ProfileType,
} from '@/lib/profile-config'

export interface SizeRow {
  id: number
  designation: string
  slug: string
  dim1: string | null
  dim2: string | null
  dim3: string | null
  dim4: string | null
  massPerM: string | null
  availability: string
}

type SortKey = 'dim1' | 'dim2' | 'dim3' | 'dim4' | 'massPerM'
type SortDir = 'asc' | 'desc'
type Preset = 'main' | 'all'

const MAX_COMPARE = 5

function fmt(v: string | null) {
  if (v == null) return '—'
  return String(Number.parseFloat(v))
}

function num(v: string | null): number {
  return v == null ? Number.NEGATIVE_INFINITY : Number.parseFloat(v)
}

export function SizeTable({
  rows,
  profileType,
}: {
  rows: SizeRow[]
  profileType: ProfileType
}) {
  const config = PROFILE_CONFIG[profileType]
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // --- состояние из URL ---
  const min = searchParams.get('min') ?? ''
  const max = searchParams.get('max') ?? ''
  const availability = searchParams.get('avail') ?? 'all'
  const sortKey = (searchParams.get('sort') as SortKey | null) ?? null
  const sortDir = (searchParams.get('dir') as SortDir | null) ?? 'asc'
  const preset = (searchParams.get('cols') as Preset | null) ?? 'main'

  const [selected, setSelected] = useState<number[]>([])
  const [announce, setAnnounce] = useState('')

  const setParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString())
      for (const [k, v] of Object.entries(updates)) {
        if (v == null || v === '' || v === 'all') next.delete(k)
        else next.set(k, v)
      }
      router.replace(`${pathname}?${next.toString()}`, { scroll: false })
    },
    [searchParams, router, pathname],
  )

  const mainCol = config.columns[0]

  // пресеты столбцов: «Основные» — первые 2 размера + масса; «Все параметры» — всё
  const visibleColumns = useMemo(() => {
    if (preset === 'all' || config.columns.length <= 3) return config.columns
    const dims = config.columns.filter((c) => c.key !== 'massPerM').slice(0, 2)
    const mass = config.columns.find((c) => c.key === 'massPerM')
    return mass ? [...dims, mass] : dims
  }, [config.columns, preset])

  function toggleSort(key: SortKey) {
    if (sortKey !== key) {
      setParams({ sort: key, dir: 'asc' })
    } else if (sortDir === 'asc') {
      setParams({ dir: 'desc' })
    } else {
      setParams({ sort: null, dir: null })
    }
  }

  const filtered = useMemo(() => {
    const minN = min ? Number.parseFloat(min) : null
    const maxN = max ? Number.parseFloat(max) : null
    const out = rows.filter((r) => {
      const v = r.dim1 != null ? Number.parseFloat(r.dim1) : null
      if (minN != null && (v == null || v < minN)) return false
      if (maxN != null && (v == null || v > maxN)) return false
      if (availability !== 'all' && r.availability !== availability) return false
      return true
    })
    if (sortKey) {
      out.sort((a, b) => {
        const d = num(a[sortKey]) - num(b[sortKey])
        return sortDir === 'asc' ? d : -d
      })
    }
    return out
  }, [rows, min, max, availability, sortKey, sortDir])

  function toggleSelect(id: number) {
    setSelected((prev) => {
      if (prev.includes(id)) {
        setAnnounce(`Убрано из сравнения. Выбрано: ${prev.length - 1}`)
        return prev.filter((x) => x !== id)
      }
      if (prev.length >= MAX_COMPARE) {
        setAnnounce(`Максимум ${MAX_COMPARE} позиций для сравнения`)
        return prev
      }
      setAnnounce(`Добавлено к сравнению. Выбрано: ${prev.length + 1}`)
      return [...prev, id]
    })
  }

  function openItem(slug: string) {
    setParams({ item: slug })
  }

  function openItemFullPage(slug: string) {
    router.push(`/item/${slug}`)
  }

  // --- чипы применённых фильтров ---
  const filterChips: { key: string; label: string; clear: Record<string, null> }[] = []
  if (min) filterChips.push({ key: 'min', label: `${mainCol.label.split(',')[0]}: от ${min} мм`, clear: { min: null } })
  if (max) filterChips.push({ key: 'max', label: `${mainCol.label.split(',')[0]}: до ${max} мм`, clear: { max: null } })
  if (availability !== 'all')
    filterChips.push({
      key: 'avail',
      label: `Доступность: ${AVAILABILITY_LABEL[availability] ?? availability}`,
      clear: { avail: null },
    })

  const availabilityOptions = [
    ['all', 'Любая'] as const,
    ...Object.entries(AVAILABILITY_LABEL),
  ]

  const hasPresets = config.columns.length > 3

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-muted">
          {mainCol.label} от
          <input
            type="number"
            inputMode="decimal"
            value={min}
            onChange={(e) => setParams({ min: e.target.value })}
            className="h-8 w-24 rounded-md border border-border bg-surface px-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          {mainCol.label} до
          <input
            type="number"
            inputMode="decimal"
            value={max}
            onChange={(e) => setParams({ max: e.target.value })}
            className="h-8 w-24 rounded-md border border-border bg-surface px-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </label>

        <div className="flex flex-col gap-1 text-xs text-muted">
          Доступность
          <div className="flex flex-wrap gap-1" role="group" aria-label="Фильтр по доступности">
            {availabilityOptions.map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setParams({ avail: k })}
                aria-pressed={availability === k}
                className={`h-8 rounded-md border px-2.5 text-xs transition-colors ${
                  availability === k
                    ? 'border-accent bg-surface-secondary font-medium text-foreground'
                    : 'border-border bg-surface text-muted hover:bg-surface-secondary hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {hasPresets && (
          <div className="flex flex-col gap-1 text-xs text-muted">
            Столбцы
            <div className="flex gap-1" role="group" aria-label="Набор столбцов">
              {(
                [
                  ['main', 'Основные'],
                  ['all', 'Все параметры'],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setParams({ cols: k === 'main' ? null : k })}
                  aria-pressed={preset === k}
                  className={`h-8 rounded-md border px-2.5 text-xs transition-colors ${
                    preset === k
                      ? 'border-accent bg-surface-secondary font-medium text-foreground'
                      : 'border-border bg-surface text-muted hover:bg-surface-secondary hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <span aria-live="polite" className="ml-auto pb-1 text-xs tabular-nums text-muted">
          {filtered.length} из {rows.length}
        </span>
      </div>

      {filterChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" aria-label="Применённые фильтры">
          {filterChips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-secondary py-1 pl-3 pr-1.5 text-xs"
            >
              {chip.label}
              <button
                type="button"
                onClick={() => setParams(chip.clear)}
                aria-label={`Убрать фильтр «${chip.label}»`}
                className="rounded-full p-0.5 text-muted transition-colors hover:bg-surface hover:text-foreground"
              >
                <X aria-hidden className="size-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => setParams({ min: null, max: null, avail: null })}
            className="text-xs text-muted underline-offset-2 transition-colors hover:text-foreground hover:underline"
          >
            Сбросить всё
          </button>
        </div>
      )}

      <div className="max-h-[70vh] overflow-auto rounded-lg border border-border">
        <table className="dense-table w-full min-w-[560px] border-collapse text-sm">
          <thead className="sticky top-0 z-20">
            <tr className="border-b border-border bg-surface-secondary text-left text-xs text-muted">
              <th className="sticky left-0 z-10 w-9 bg-surface-secondary px-2 font-medium">
                <span className="sr-only">Выбор для сравнения</span>
              </th>
              <th className="sticky left-9 z-10 bg-surface-secondary px-3 font-medium shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)]">
                Обозначение
              </th>
              {visibleColumns.map((c) => {
                const isSorted = sortKey === c.key
                return (
                  <th
                    key={c.key}
                    className="px-0 text-right font-medium"
                    aria-sort={isSorted ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(c.key as SortKey)}
                      aria-label={`Сортировать по «${c.label}»`}
                      className={`inline-flex h-full w-full items-center justify-end gap-1 px-3 py-1.5 transition-colors hover:text-foreground ${
                        isSorted ? 'text-foreground' : ''
                      }`}
                    >
                      {c.label}
                      {isSorted &&
                        (sortDir === 'asc' ? (
                          <ArrowUp aria-hidden className="size-3" />
                        ) : (
                          <ArrowDown aria-hidden className="size-3" />
                        ))}
                    </button>
                  </th>
                )
              })}
              <th className="px-3 font-medium">Доступность</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const isSelected = selected.includes(r.id)
              return (
                <tr
                  key={r.id}
                  className={`border-b border-border transition-colors last:border-b-0 ${
                    isSelected ? 'bg-surface-secondary' : 'hover:bg-surface-secondary'
                  }`}
                >
                  <td className="sticky left-0 z-10 w-9 bg-surface px-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(r.id)}
                      disabled={!isSelected && selected.length >= MAX_COMPARE}
                      aria-label={`Выбрать ${r.designation} для сравнения`}
                      className="size-4 cursor-pointer accent-current disabled:cursor-not-allowed disabled:opacity-40"
                    />
                  </td>
                  <td className="sticky left-9 z-10 bg-surface px-3 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)]">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => openItem(r.slug)}
                        className="text-left font-medium text-accent hover:underline"
                      >
                        {r.designation}
                      </button>
                      <button
                        type="button"
                        onClick={() => openItemFullPage(r.slug)}
                        aria-label={`Открыть ${r.designation} отдельной страницей`}
                        className="shrink-0 rounded-md p-1 text-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
                      >
                        <ExternalLink aria-hidden className="size-4" />
                      </button>
                    </div>
                  </td>
                  {visibleColumns.map((c) => (
                    <td key={c.key} className="px-3 text-right font-mono text-xs">
                      {fmt(r[c.key])}
                    </td>
                  ))}
                  <td className="px-3">
                    <AvailabilityChip availability={r.availability} />
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={visibleColumns.length + 3}
                  className="px-3 py-8 text-center text-sm text-muted"
                >
                  <p>Ничего не найдено с текущими фильтрами.</p>
                  {filterChips.length > 0 && (
                    <p className="mt-2">
                      Попробуйте убрать: {filterChips.map((c) => c.label).join(', ')} —{' '}
                      <button
                        type="button"
                        onClick={() => setParams({ min: null, max: null, avail: null })}
                        className="text-accent underline-offset-2 hover:underline"
                      >
                        сбросить всё
                      </button>
                    </p>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p aria-live="polite" className="sr-only">
        {announce}
      </p>

      {selected.length > 0 && (
        <div className="sticky bottom-4 z-30 flex items-center gap-3 self-center rounded-full border border-border bg-surface px-4 py-2 shadow-lg">
          <span className="text-sm tabular-nums">
            Выбрано: {selected.length}
            {selected.length < 2 && (
              <span className="ml-1 text-xs text-muted">(мин. 2 для сравнения)</span>
            )}
          </span>
          <button
            type="button"
            disabled={selected.length < 2}
            onClick={() => router.push(`/compare?ids=${selected.join(',')}`)}
            className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Сравнить
          </button>
          <button
            type="button"
            onClick={() => setSelected([])}
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Снять выбор
          </button>
        </div>
      )}
    </div>
  )
}
