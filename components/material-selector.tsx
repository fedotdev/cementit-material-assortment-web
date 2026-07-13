'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, FileCheck2, LockKeyhole } from 'lucide-react'
import type { MaterialOption, StandardRef } from '@/lib/domain'
import {
  buildResolvedDesignation,
  filterAllowedMaterials,
} from '@/lib/domain'

interface MaterialSelectorProps {
  profileDesignation: string
  geometryDocument: StandardRef | null
  materials: MaterialOption[]
  purposeCategory?: string
  accuracyClass?: string
}

export function MaterialSelector({
  profileDesignation,
  geometryDocument,
  materials,
  purposeCategory = 'general',
  accuracyClass = 'any',
}: MaterialSelectorProps) {
  const allowed = useMemo(
    () => filterAllowedMaterials(materials, purposeCategory, accuracyClass),
    [materials, purposeCategory, accuracyClass],
  )
  const [materialId, setMaterialId] = useState<number | null>(allowed[0]?.id ?? null)
  const selected = allowed.find((material) => material.id === materialId) ?? null

  return (
    <section className="rounded-xl border border-border bg-surface p-4" aria-labelledby="material-selector-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="material-selector-title" className="text-sm font-semibold">Материал для выбранного профиля</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Список формируется только из подтверждённых нормативных связей профиль–материал.
          </p>
        </div>
        {allowed.length > 0 ? <FileCheck2 className="size-5 text-success" aria-hidden /> : <LockKeyhole className="size-5 text-muted" aria-hidden />}
      </div>

      {allowed.length === 0 ? (
        <div className="mt-4 flex gap-3 rounded-lg border border-warning/40 bg-warning/10 p-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
          <div>
            <p className="text-sm font-medium">Выбор марки временно недоступен</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Для этой спецификации нет подтверждённой записи в таблице допустимости. Старые марки не подставляются автоматически, чтобы не создавать ложную нормативную связь.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
            Марка материала
            <select
              value={materialId ?? ''}
              onChange={(event) => setMaterialId(Number(event.target.value))}
              className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-accent"
            >
              {allowed.map((material) => (
                <option key={material.id} value={material.id}>{material.name}</option>
              ))}
            </select>
          </label>
          {selected && (
            <div className="rounded-lg bg-surface-secondary p-3">
              <p className="text-xs text-muted">Сформированное обозначение</p>
              <p className="mt-1 font-mono text-sm font-medium">
                {buildResolvedDesignation(
                  profileDesignation,
                  selected.name,
                  geometryDocument,
                  selected.governingDocument,
                )}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
