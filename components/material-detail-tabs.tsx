'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { StandardReference } from '@/components/standard-reference'

type Composition = { id: number; elementSymbol: string; valueRaw: string | null; minPercent: string | null; maxPercent: string | null; approximateValue: string | null }
type Property = { id: number; propertyKey: string; valueRaw: string | null; valueJson: unknown }
type Mechanic = { id: number; tableNumber: number | null; rowNumber: number | null; conditionRaw: string | null; valuesJson: unknown }
type StandardRef = { id: number; standardSystemRaw: string | null; standardNumberRaw: string | null; mentionStatus: string }
type Analogue = { candidate: { id: number }; designation: { designation: string; country: string | null; systemHint: string | null } }

type Props = {
  material: { materialClass: string | null; catalogSection: string | null; industrialUse: string | null; weldability: string | null; verificationStatus: string; sourceUrl: string | null; sourceName: string | null; decodingSummary: string | null }
  composition: Composition[]
  properties: Property[]
  mechanics: Mechanic[]
  standardReferences: StandardRef[]
  analogues: Analogue[]
}

const TABS = [
  ['overview', 'Характеристики'], ['chemistry', 'Химический состав'], ['mechanics', 'Механические свойства'], ['analogues', 'Зарубежные аналоги'], ['standards', 'Стандарты'],
] as const

const displayNumber = (value: string | null) => value ? Number.parseFloat(value).toLocaleString('ru-RU', { maximumFractionDigits: 6 }) : '—'

export function MaterialDetailTabs(props: Props) {
  const [tab, setTab] = useState<(typeof TABS)[number][0]>('overview')
  const groups = Object.groupBy(props.analogues, ({ designation }) => designation.country || designation.systemHint || 'Система не указана')
  return (
    <section className="min-w-0">
      <div role="tablist" aria-label="Разделы карточки материала" className="flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map(([id, label]) => <button key={id} id={`tab-${id}`} role="tab" aria-selected={tab === id} aria-controls={`panel-${id}`} type="button" onClick={() => setTab(id)} className={`shrink-0 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${tab === id ? 'border-accent text-foreground' : 'border-transparent text-muted hover:text-foreground'}`}>{label}</button>)}
      </div>
      <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className="py-5">
        {tab === 'overview' && <div className="grid gap-3 sm:grid-cols-2">{[['Класс материала', props.material.materialClass], ['Раздел', props.material.catalogSection], ['Применение', props.material.industrialUse], ['Свариваемость', props.material.weldability], ['Статус проверки', 'Требует проверки'], ['Расшифровка', props.material.decodingSummary]].map(([label, value]) => <div key={label} className="rounded-lg border border-border p-4"><p className="text-xs text-muted">{label}</p><p className="mt-2 text-sm leading-relaxed">{value || 'Нет данных в демо-источнике'}</p></div>)}</div>}
        {tab === 'chemistry' && (props.composition.length ? <div className="overflow-x-auto rounded-lg border border-border"><table className="w-full min-w-2xl text-left text-sm"><thead className="bg-surface-secondary text-xs text-muted"><tr><th className="px-4 py-3">Элемент</th><th className="px-4 py-3">Значение источника</th><th className="px-4 py-3">Минимум</th><th className="px-4 py-3">Максимум</th><th className="px-4 py-3">Приблизительно</th></tr></thead><tbody>{props.composition.map((item) => <tr key={item.id} className="border-t border-border"><td className="px-4 py-3 font-mono font-semibold">{item.elementSymbol}</td><td className="px-4 py-3 font-mono">{item.valueRaw || '—'}</td><td className="px-4 py-3 font-mono">{displayNumber(item.minPercent)}</td><td className="px-4 py-3 font-mono">{displayNumber(item.maxPercent)}</td><td className="px-4 py-3 font-mono">{displayNumber(item.approximateValue)}</td></tr>)}</tbody></table><p className="border-t border-border px-4 py-3 text-xs text-muted">Единица: % массовой доли</p></div> : <Empty />)}
        {tab === 'mechanics' && (props.properties.length || props.mechanics.length ? <div className="flex flex-col gap-3">{props.properties.map((item) => <div key={item.id} className="grid gap-2 rounded-lg border border-border p-4 sm:grid-cols-[14rem_1fr]"><span className="text-xs text-muted">{item.propertyKey}</span><span className="font-mono text-xs">{item.valueRaw || JSON.stringify(item.valueJson)}</span></div>)}{props.mechanics.map((item) => <article key={item.id} className="rounded-lg border border-border p-4"><p className="text-xs text-muted">Условие: {item.conditionRaw || 'не указано'} · таблица {item.tableNumber ?? '—'}, строка {item.rowNumber ?? '—'}</p><pre className="mt-3 overflow-x-auto whitespace-pre-wrap font-mono text-xs">{JSON.stringify(item.valuesJson, null, 2)}</pre></article>)}</div> : <Empty />)}
        {tab === 'analogues' && (props.analogues.length ? <div className="flex flex-col gap-3"><p className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">Все обозначения ниже — кандидаты в зарубежные аналоги и требуют проверки.</p>{Object.entries(groups).map(([country, values]) => <details key={country} className="rounded-lg border border-border" open={Object.keys(groups)[0] === country}><summary className="cursor-pointer px-4 py-3 text-sm font-semibold">{country} · {values?.length ?? 0}</summary><div className="grid gap-2 border-t border-border p-3 sm:grid-cols-2 lg:grid-cols-3">{values?.map(({ candidate, designation }) => <div key={candidate.id} className="rounded-md bg-surface-secondary p-3"><p className="font-mono text-sm font-semibold">{designation.designation}</p><p className="mt-1 text-[11px] text-warning">Кандидат в зарубежный аналог</p></div>)}</div></details>)}</div> : <Empty />)}
        {tab === 'standards' && <div className="flex flex-col gap-3">{props.standardReferences.length ? props.standardReferences.map((item) => <div key={item.id} className="rounded-lg border border-border p-4"><StandardReference current={{ id: item.id, designation: [item.standardSystemRaw, item.standardNumberRaw].filter(Boolean).join(' '), status: 'needs_review', note: 'Упомянут в источнике, сведения требуют проверки' }} compact /></div>) : <div className="rounded-lg border border-border p-4"><StandardReference /></div>}{props.material.sourceUrl && <a href={props.material.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg border border-border p-4 text-sm hover:border-accent">{props.material.sourceName || 'Источник данных'}<ExternalLink aria-hidden className="size-4" /></a>}</div>}
      </div>
    </section>
  )
}

function Empty() { return <p className="rounded-lg bg-surface-secondary p-4 text-sm text-muted">Нет данных в демо-источнике</p> }
