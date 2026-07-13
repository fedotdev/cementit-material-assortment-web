'use client'

import { Link, Tooltip } from '@heroui/react'
import { ArrowUpRight, CircleHelp, File, Files } from 'lucide-react'
import { StandardStatusChip } from '@/components/badges'

export type StandardReferenceItem = {
  id: string | number
  designation: string
  title?: string | null
  status: string
  effectiveDate?: string | Date | null
  withdrawnDate?: string | Date | null
  sourceUrl?: string | null
  note?: string | null
}

type Props = {
  current?: StandardReferenceItem | null
  history?: StandardReferenceItem[]
  emptyText?: string
  compact?: boolean
}

const formatDate = (value?: string | Date | null) => {
  if (!value) return null
  return new Intl.DateTimeFormat('ru-RU').format(new Date(value))
}

const getTooltipText = (item: StandardReferenceItem) => {
  const introduced = formatDate(item.effectiveDate)
  const withdrawn = formatDate(item.withdrawnDate)
  if (item.status === 'active' && introduced) return `Дата введения: ${introduced}`
  if ((item.status === 'withdrawn' || item.status === 'replaced' || item.status === 'cancelled') && withdrawn) return `Отменён с ${withdrawn}`
  if (item.note) return item.note
  if (item.status === 'unknown' || item.status === 'needs_review') return 'В процессе наполнения данных'
  return 'Дата действия не указана'
}

function StatusWithTooltip({ item }: { item: StandardReferenceItem }) {
  return (
    <Tooltip delay={250} closeDelay={100}>
      <Tooltip.Trigger className="inline-flex cursor-help rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <StandardStatusChip status={item.status} />
      </Tooltip.Trigger>
      <Tooltip.Content showArrow className="max-w-xs text-sm">
        {getTooltipText(item)}
      </Tooltip.Content>
    </Tooltip>
  )
}

function Designation({ item, muted = false }: { item: StandardReferenceItem; muted?: boolean }) {
  return (
    <Link
      href={item.sourceUrl ?? undefined}
      isDisabled={!item.sourceUrl}
      target={item.sourceUrl ? '_blank' : undefined}
      rel={item.sourceUrl ? 'noreferrer' : undefined}
      className={muted ? 'font-mono text-sm text-muted' : 'font-mono text-sm font-semibold text-foreground'}
    >
      {item.designation}
      <Link.Icon>
        <ArrowUpRight aria-hidden className="size-4 stroke-2" />
      </Link.Icon>
    </Link>
  )
}

export function StandardReference({ current, history = [], emptyText = 'Стандарт не определён', compact = false }: Props) {
  if (!current) {
    const unknown: StandardReferenceItem = { id: 'unknown', designation: emptyText, status: 'unknown' }
    return (
      <div className="flex items-center gap-2">
        <CircleHelp aria-hidden className="size-5 shrink-0" />
        <StatusWithTooltip item={unknown} />
      </div>
    )
  }

  return (
    <div className="min-w-0">
      <div className="relative min-w-0">
        {history.length > 0 ? (
          <Files aria-hidden className="absolute left-0 top-0 size-5" />
        ) : (
          <File aria-hidden className="absolute left-0 top-0 size-5" />
        )}
        <div className="min-w-0 pl-8">
          <div className="flex flex-wrap items-center gap-2">
            <Designation item={current} />
            <StatusWithTooltip item={current} />
          </div>
          {current.title ? <p className="mt-1 text-sm leading-relaxed text-muted">{current.title}</p> : null}
        </div>
        {history.length ? (
          <>
            <span
              aria-hidden
              className="absolute bottom-2.5 left-2.5 top-6 w-[18px] rounded-bl-2xl border-b-2 border-l-2 border-foreground"
            />
            <ul className="mt-3 flex min-w-0 flex-col gap-2">
              {history.map((item) => (
                <li key={item.id} className="relative flex min-h-5 flex-wrap items-center gap-2 pl-8">
                  <Designation item={item} muted />
                  <StatusWithTooltip item={item} />
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
      {!compact && current.note ? <p className="mt-2 pl-8 text-xs leading-relaxed text-muted">{current.note}</p> : null}
    </div>
  )
}
