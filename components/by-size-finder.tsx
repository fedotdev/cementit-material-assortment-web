'use client'

import { Chip } from '@heroui/react'
import Link from 'next/link'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { findBySize, type NearestResult } from '@/app/actions/find-by-size'
import { AvailabilityChip } from '@/components/badges'
import { ProfileSketch } from '@/components/profile-sketch'
import {
  PROFILE_CONFIG,
  SKETCH_ANCHORS,
  type ProfileType,
} from '@/lib/profile-config'

export interface CategoryOption {
  slug: string
  name: string
  profileType: ProfileType
}

export function BySizeFinder({ categories }: { categories: CategoryOption[] }) {
  const [catSlug, setCatSlug] = useState(categories[0]?.slug ?? '')
  const [values, setValues] = useState<Record<string, string>>({})
  const [focused, setFocused] = useState<string | null>(null)
  const [results, setResults] = useState<NearestResult[]>([])
  const [isPending, startTransition] = useTransition()

  const category = categories.find((c) => c.slug === catSlug) ?? categories[0]
  const config = category ? PROFILE_CONFIG[category.profileType] : null
  const anchors = category ? SKETCH_ANCHORS[category.profileType] : {}

  const sketchValues = useMemo(() => {
    const out: Record<string, string | undefined> = {}
    if (!config) return out
    for (const input of config.sizeInputs) {
      const v = values[input.key]
      if (v) out[input.letter] = v
    }
    return out
  }, [values, config])

  useEffect(() => {
    if (!category || !config) return
    const dim1 = values.dim1 ? Number.parseFloat(values.dim1) : undefined
    const dim2 = values.dim2 ? Number.parseFloat(values.dim2) : undefined
    if (dim1 == null && dim2 == null) {
      setResults([])
      return
    }
    const t = setTimeout(() => {
      startTransition(async () => {
        setResults(await findBySize(category.slug, { dim1, dim2 }))
      })
    }, 300)
    return () => clearTimeout(t)
  }, [values, category, config])

  function switchCategory(slug: string) {
    setCatSlug(slug)
    setValues({})
    setResults([])
  }

  if (!category || !config) return null

  const exact = results.find((r) => r.exact)
  const nearest = results.filter((r) => !r.exact)

  return (
    <div className="flex flex-col gap-6">
      {/* Шаг 1 — выбор профиля */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Шаг 1 — выберите вид профиля
        </p>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Вид профиля">
          {categories.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => switchCategory(c.slug)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                c.slug === catSlug
                  ? 'border-accent bg-surface-secondary font-medium'
                  : 'border-border bg-surface hover:bg-surface-secondary'
              }`}
              aria-pressed={c.slug === catSlug}
            >
              <span className="size-6">
                <ProfileSketch type={c.profileType} className="size-full" />
              </span>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Шаг 2 — эскиз с инпутами на размерных линиях */}
        <div className="lg:w-96 lg:shrink-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Шаг 2 — введите размеры на эскизе
          </p>
          <div className="relative mt-2 rounded-lg border border-border bg-surface-secondary p-4">
            <ProfileSketch
              type={category.profileType}
              values={{}}
              highlight={focused ? [focused] : Object.keys(sketchValues)}
              className="aspect-square w-full"
            />
            {/* Инпуты прямо на размерных линиях (как аннотации на чертеже) */}
            {config.sizeInputs.map((input) => {
              const anchor = anchors[input.letter]
              if (!anchor) return null
              return (
                <label
                  key={input.key}
                  className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-md border border-border bg-surface py-0.5 pl-2 pr-1 shadow-sm transition-colors focus-within:border-accent"
                  style={{
                    left: `calc(1rem + ${anchor.x} * (100% - 2rem) / 100)`,
                    top: `calc(1rem + ${anchor.y} * (100% - 2rem) / 100)`,
                  }}
                >
                  <span className="font-mono text-xs font-semibold text-accent">
                    {input.letter}
                  </span>
                  <span className="text-xs text-muted">=</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={values[input.key] ?? ''}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [input.key]: e.target.value }))
                    }
                    onFocus={() => setFocused(input.letter)}
                    onBlur={() => setFocused(null)}
                    aria-label={input.label}
                    placeholder="мм"
                    className="w-14 bg-transparent font-mono text-sm outline-none placeholder:text-xs placeholder:text-muted"
                  />
                </label>
              )
            })}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            {config.sizeInputs.map((i) => i.label).join(' · ')}
          </p>
        </div>

        {/* Результаты */}
        <div className="min-w-0 flex-1" aria-live="polite">
          {results.length === 0 && !isPending && (
            <div className="flex h-full min-h-40 items-center justify-center rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
              Введите размеры на эскизе — подходящие типоразмеры появятся здесь.
            </div>
          )}

          {/* Точное совпадение — крупная карточка с CTA */}
          {exact && (
            <div className="mb-4 rounded-lg border-2 border-accent bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip color="success" variant="soft" size="sm">
                      <Chip.Label>Точное совпадение</Chip.Label>
                    </Chip>
                    <AvailabilityChip availability={exact.availability} />
                  </div>
                  <p className="mt-2 text-lg font-semibold">{exact.designation}</p>
                  <p className="font-mono text-xs text-muted">
                    {exact.standardDesignation}
                    {exact.massPerM
                      ? ` · ${Number.parseFloat(exact.massPerM)} ${config.massLabel}`
                      : ''}
                  </p>
                </div>
                <Link
                  href={`/item/${exact.slug}`}
                  className="inline-flex h-10 shrink-0 items-center rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
                >
                  Открыть карточку
                </Link>
              </div>
              <div className="mt-3 rounded-lg border border-warning/40 bg-warning/10 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  Шаг 3 — материал
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Выбор выполняется в карточке типоразмера только по подтверждённым связям профиль–материал. Если нормативная допустимость не установлена, селектор будет заблокирован.
                </p>
              </div>
            </div>
          )}

          {nearest.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-border">
              <p className="border-b border-border bg-surface-secondary px-3 py-2 text-xs font-medium text-muted">
                {exact ? 'Ближайшие типоразмеры' : 'Ближайшие по размерам'}
              </p>
              <table className="dense-table w-full min-w-[480px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-secondary text-left text-xs text-muted">
                    <th className="px-3 font-medium">Типоразмер</th>
                    <th className="px-3 text-right font-medium">
                      {config.sizeInputs[0]?.letter}, мм
                    </th>
                    {config.sizeInputs[1] && (
                      <th className="px-3 text-right font-medium">
                        {config.sizeInputs[1].letter}, мм
                      </th>
                    )}
                    <th className="px-3 text-right font-medium">Масса, {config.massLabel}</th>
                    <th className="px-3 font-medium">Доступность</th>
                  </tr>
                </thead>
                <tbody>
                  {nearest.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-border transition-colors last:border-b-0 hover:bg-surface-secondary"
                    >
                      <td className="px-3">
                        <Link href={`/item/${r.slug}`} className="font-medium text-accent hover:underline">
                          {r.designation}
                        </Link>
                      </td>
                      <td className="px-3 text-right font-mono text-xs">
                        {r.dim1 ? Number.parseFloat(r.dim1) : '—'}
                      </td>
                      {config.sizeInputs[1] && (
                        <td className="px-3 text-right font-mono text-xs">
                          {r.dim2 ? Number.parseFloat(r.dim2) : '—'}
                        </td>
                      )}
                      <td className="px-3 text-right font-mono text-xs">
                        {r.massPerM ? Number.parseFloat(r.massPerM) : '—'}
                      </td>
                      <td className="px-3">
                        <AvailabilityChip availability={r.availability} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
