'use client'

import { Button } from '@heroui/react'
import { CheckIcon, CopyIcon } from 'lucide-react'
import { useState } from 'react'

interface Grade {
  name: string
  standardDesignation: string
}

export function DesignationGenerator({
  sizeLabel,
  sizeStandard,
  grades,
}: {
  /** Например «20У» из «Швеллер 20У» или «76x4» */
  sizeLabel: string
  sizeStandard: string
  grades: Grade[]
}) {
  const [gradeName, setGradeName] = useState(grades[0]?.name ?? '')
  const [copied, setCopied] = useState(false)

  const grade = grades.find((g) => g.name === gradeName)
  const record = grade
    ? `${sizeLabel} ${sizeStandard} / ${grade.name} ${grade.standardDesignation}`
    : `${sizeLabel} ${sizeStandard}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(record)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard может быть недоступен в iframe
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-xs text-muted">
        Марка стали
        <select
          value={gradeName}
          onChange={(e) => setGradeName(e.target.value)}
          className="h-9 max-w-xs rounded-md border border-border bg-surface px-2 text-sm text-foreground outline-none focus:border-accent"
        >
          {grades.map((g) => (
            <option key={g.name} value={g.name}>
              {g.name} — {g.standardDesignation}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface-secondary p-3">
        <code className="flex-1 whitespace-pre-wrap break-all font-mono text-sm leading-relaxed">
          {record}
        </code>
        <Button size="sm" variant="secondary" onPress={copy} aria-label="Скопировать запись">
          {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
          {copied ? 'Скопировано' : 'Копировать'}
        </Button>
      </div>
      <p className="text-xs leading-relaxed text-muted">
        Условная запись для указания в конструкторской документации: типоразмер по
        сортаментному стандарту в числителе, марка стали по стандарту на технические
        условия в знаменателе.
      </p>
    </div>
  )
}
