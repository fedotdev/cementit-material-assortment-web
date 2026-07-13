'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Tabs } from '@heroui/react'
import { Check, Copy, ExternalLink, X } from 'lucide-react'
import { getItemCard, type ItemCardData } from '@/app/actions/item-card'
import { AvailabilityChip, StandardStatusChip } from '@/components/badges'
import { MassCalculator } from '@/components/mass-calculator'
import { ProfileSketch } from '@/components/profile-sketch'
import {
  AVAILABILITY_LABEL,
  PROFILE_CONFIG,
  type ProfileType,
} from '@/lib/profile-config'

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

function CopyButton({
  text,
  label,
  announce,
}: {
  text: string
  label: string
  announce: (msg: string) => void
}) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        announce(`${label}: скопировано`)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
    >
      {copied ? <Check aria-hidden className="size-3.5" /> : <Copy aria-hidden className="size-3.5" />}
      {label}
    </button>
  )
}

/**
 * Немодальная карточка типоразмера поверх таблицы.
 * Открывается через ?item=slug — восстанавливается при перезагрузке.
 */
export function ItemDrawer() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const slug = searchParams.get('item')

  const [data, setData] = useState<ItemCardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [announce, setAnnounce] = useState('')

  const close = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString())
    next.delete('item')
    const qs = next.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [searchParams, router, pathname])

  useEffect(() => {
    if (!slug) {
      setData(null)
      return
    }
    let cancelled = false
    setLoading(true)
    getItemCard(slug).then((res) => {
      if (!cancelled) {
        setData(res)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [slug])

  // Escape закрывает
  useEffect(() => {
    if (!slug) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [slug, close])

  if (!slug) return null

  const config = data ? PROFILE_CONFIG[data.category.profileType as ProfileType] : null
  const params = data?.item.params ?? {}

  const sketchValues: Record<string, number | string | undefined> = {}
  if (config) {
    for (const c of config.columns) {
      if (c.dimLetter && params[c.dimLetter] != null) {
        sketchValues[c.dimLetter] = params[c.dimLetter]
      }
    }
  }

  const paramsText = data
    ? [
        data.item.designation,
        data.item.standardDesignation,
        ...Object.entries(params).map(([k, v]) => `${PARAM_LABELS[k] ?? k}: ${v}`),
        data.item.massPerM ? `Масса: ${Number.parseFloat(data.item.massPerM)} ${config?.massLabel}` : null,
      ]
        .filter(Boolean)
        .join('\n')
    : ''

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-label={data ? `Карточка ${data.item.designation}` : 'Карточка типоразмера'}
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-surface shadow-2xl"
    >
      <p aria-live="polite" className="sr-only">
        {announce}
      </p>

      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0">
          {loading ? (
            <p className="text-sm text-muted">Загрузка…</p>
          ) : data ? (
            <>
              <h2 className="truncate text-lg font-semibold">{data.item.designation}</h2>
              <p className="truncate font-mono text-xs text-muted">
                {data.item.standardDesignation}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted">Позиция не найдена</p>
          )}
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="Закрыть карточку"
          className="shrink-0 rounded-md p-2 text-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>

      {data && config && (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="flex items-start gap-4">
            <div className="w-32 shrink-0 rounded-lg border border-border bg-surface-secondary p-1.5">
              <ProfileSketch
                type={data.category.profileType as ProfileType}
                values={sketchValues}
                highlight={Object.keys(sketchValues)}
                className="aspect-square w-full"
              />
            </div>
            <div className="flex flex-col gap-2">
              <AvailabilityChip availability={data.item.availability} />
              {data.chain.find((s) => s.designation === data.item.standardDesignation) && (
                <StandardStatusChip
                  status={
                    data.chain.find((s) => s.designation === data.item.standardDesignation)!
                      .status
                  }
                />
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <CopyButton
              text={data.item.designation}
              label="Скопировать обозначение"
              announce={setAnnounce}
            />
            <CopyButton
              text={paramsText}
              label="Скопировать характеристики"
              announce={setAnnounce}
            />
            <Link
              href={`/item/${data.item.slug}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
            >
              <ExternalLink aria-hidden className="size-3.5" />
              Открыть отдельной страницей
            </Link>
          </div>

          <div className="mt-4">
            <Tabs defaultSelectedKey="chars">
              <Tabs.ListContainer>
                <Tabs.List aria-label="Разделы карточки">
                  <Tabs.Tab id="chars">
                    Характеристики
                    <Tabs.Indicator />
                  </Tabs.Tab>
                  <Tabs.Tab id="standards">
                    Стандарты и аналоги
                    <Tabs.Indicator />
                  </Tabs.Tab>
                  <Tabs.Tab id="avail">
                    Доступность
                    <Tabs.Indicator />
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs.ListContainer>

              <Tabs.Panel id="chars">
                <div className="flex flex-col gap-4">
                  <div className="overflow-hidden rounded-lg border border-border">
                    <table className="dense-table w-full border-collapse text-sm">
                      <tbody>
                        {Object.entries(params).map(([k, v]) => (
                          <tr key={k} className="border-b border-border last:border-b-0">
                            <td className="px-3 text-muted">{PARAM_LABELS[k] ?? k}</td>
                            <td className="px-3 text-right font-mono">{String(v)}</td>
                          </tr>
                        ))}
                        {data.item.massPerM && (
                          <tr>
                            <td className="px-3 text-muted">Масса, {config.massLabel}</td>
                            <td className="px-3 text-right font-mono">
                              {Number.parseFloat(data.item.massPerM)}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <MassCalculator massPerM={data.item.massPerM} massLabel={config.massLabel} />
                </div>
              </Tabs.Panel>

              <Tabs.Panel id="standards">
                <div className="flex flex-col gap-3">
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">
                      Стандарт продукции
                    </p>
                    {data.domain?.geometryDocument ? (
                      <div className="mt-2">
                        <p className="font-mono text-sm font-medium">
                          {data.domain.geometryDocument.designation}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-muted">
                          {data.domain.geometryDocument.title}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-muted">Документ не идентифицирован.</p>
                    )}
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">
                      Стандарты материалов
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-muted">
                      {data.domain?.materialEligibilityCount
                        ? `Подтверждённых вариантов: ${data.domain.materialEligibilityCount}`
                        : 'Подтверждённые связи профиль–материал отсутствуют. Выбор марки заблокирован.'}
                    </p>
                  </div>
                </div>
              </Tabs.Panel>

              <Tabs.Panel id="avail">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <AvailabilityChip availability={data.item.availability} />
                    <span className="text-sm text-muted">
                      {AVAILABILITY_LABEL[data.item.availability]}
                    </span>
                  </div>
                  <p className="rounded-lg border border-border bg-surface-secondary p-3 text-xs leading-relaxed text-muted">
                    Оценка типичности позиции по сортаменту. Данные о фактическом наличии у
                    поставщиков, ценах и сроках пока не подтверждены — уточняйте при закупке.
                  </p>
                </div>
              </Tabs.Panel>
            </Tabs>
          </div>
        </div>
      )}

      {!data && !loading && (
        <div className="flex-1 px-4 py-6 text-sm text-muted">
          Типоразмер не найден. Возможно, ссылка устарела.
        </div>
      )}
    </aside>
  )
}
