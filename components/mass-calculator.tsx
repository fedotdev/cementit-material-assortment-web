'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

/**
 * Двусторонний калькулятор массы.
 * Режим «масса»: длина × масса метра × кол-во = общая масса.
 * Режим «длина»: масса ÷ масса метра = длина.
 */
export function MassCalculator({
  massPerM,
  massLabel = 'кг/м',
}: {
  massPerM: string | null
  massLabel?: string
}) {
  const [mode, setMode] = useState<'mass' | 'length'>('mass')
  const [length, setLength] = useState('1')
  const [count, setCount] = useState('1')
  const [totalMass, setTotalMass] = useState('')
  const [copied, setCopied] = useState(false)

  const m = massPerM != null ? Number.parseFloat(massPerM) : null

  if (m == null || Number.isNaN(m)) {
    return (
      <p className="text-sm text-muted">
        Масса метра для этой позиции отсутствует в данных — расчёт недоступен.
      </p>
    )
  }

  const lengthN = Number.parseFloat(length.replace(',', '.'))
  const countN = Number.parseInt(count, 10)
  const totalMassN = Number.parseFloat(totalMass.replace(',', '.'))

  let result: { value: string; unit: string; formula: string } | null = null
  if (mode === 'mass' && !Number.isNaN(lengthN) && lengthN > 0 && !Number.isNaN(countN) && countN > 0) {
    const total = lengthN * m * countN
    result = {
      value: total.toLocaleString('ru-RU', { maximumFractionDigits: 2 }),
      unit: 'кг',
      formula: `${lengthN} м × ${m} ${massLabel}${countN > 1 ? ` × ${countN} шт` : ''}`,
    }
  } else if (mode === 'length' && !Number.isNaN(totalMassN) && totalMassN > 0) {
    const len = totalMassN / m
    result = {
      value: len.toLocaleString('ru-RU', { maximumFractionDigits: 2 }),
      unit: 'м',
      formula: `${totalMassN} кг ÷ ${m} ${massLabel}`,
    }
  }

  async function copyResult() {
    if (!result) return
    await navigator.clipboard.writeText(`${result.value} ${result.unit} (${result.formula})`)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const inputCls =
    'h-9 w-full rounded-md border border-border bg-surface px-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent'

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">Калькулятор массы</h3>
        <span className="font-mono text-xs text-muted">
          {m} {massLabel}
        </span>
      </div>

      <div className="flex gap-1" role="group" aria-label="Режим расчёта">
        {(
          [
            ['mass', 'Масса по длине'],
            ['length', 'Длина по массе'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setMode(k)}
            aria-pressed={mode === k}
            className={`h-8 rounded-md border px-3 text-xs transition-colors ${
              mode === k
                ? 'border-accent bg-surface-secondary font-medium text-foreground'
                : 'border-border bg-surface text-muted hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'mass' ? (
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-xs text-muted">
            Длина, м
            <input
              type="text"
              inputMode="decimal"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            Количество, шт
            <input
              type="number"
              min={1}
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className={inputCls}
            />
          </label>
        </div>
      ) : (
        <label className="flex flex-col gap-1 text-xs text-muted">
          Требуемая масса, кг
          <input
            type="text"
            inputMode="decimal"
            value={totalMass}
            onChange={(e) => setTotalMass(e.target.value)}
            className={inputCls}
          />
        </label>
      )}

      {result && (
        <div className="flex items-center justify-between gap-2 rounded-md bg-surface-secondary px-3 py-2.5">
          <div>
            <p className="text-lg font-semibold tabular-nums">
              {result.value} <span className="text-sm font-normal text-muted">{result.unit}</span>
            </p>
            <p className="font-mono text-[11px] text-muted">{result.formula}</p>
          </div>
          <button
            type="button"
            onClick={copyResult}
            aria-label="Скопировать результат"
            className="rounded-md border border-border p-2 text-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            {copied ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}
          </button>
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-muted">
        Расчёт по номинальной массе метра из сортамента. Не является расчётом несущей
        способности.
      </p>
    </div>
  )
}
