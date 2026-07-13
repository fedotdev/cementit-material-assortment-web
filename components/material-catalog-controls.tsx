'use client'

import { Button } from '@heroui/react'
import { Filter, Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Props = {
  initialQuery: string
  initialClass: string
  classes: Array<{ materialClass: string | null; count: number }>
  basePath?: string
}

export function MaterialCatalogControls({ initialQuery, initialClass, classes, basePath = '/grades' }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [materialClass, setMaterialClass] = useState(initialClass)

  function navigate(nextQuery = query, nextClass = materialClass) {
    const params = new URLSearchParams()
    if (nextQuery.trim()) params.set('q', nextQuery.trim())
    if (nextClass) params.set('class', nextClass)
    router.push(`${basePath}${params.size ? `?${params}` : ''}`)
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3 shadow-sm">
      <form
        role="search"
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault()
          navigate()
        }}
      >
        <div className="relative flex-1">
          <Search aria-hidden className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Марка, класс или назначение"
            aria-label="Поиск по маркам стали"
            className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted focus:border-accent"
          />
        </div>
        <div className="flex gap-2 sm:min-w-fit">
          {(initialQuery || initialClass) && (
            <Button variant="ghost" type="button" onPress={() => router.push(basePath)}>
              <X aria-hidden className="size-4" />
              Сбросить
            </Button>
          )}
          <Button type="submit" className="sm:min-w-28">Найти</Button>
        </div>
      </form>
      <div className="flex items-center gap-2 overflow-x-auto pb-1" aria-label="Фильтр по классу материала">
        <Filter aria-hidden className="size-4 shrink-0 text-muted" />
        <button
          type="button"
          onClick={() => { setMaterialClass(''); navigate(query, '') }}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${!initialClass ? 'border-accent bg-accent text-accent-foreground' : 'border-border text-muted hover:text-foreground'}`}
        >
          Все классы
        </button>
        {classes.filter((item) => item.materialClass).map((item) => (
          <button
            key={item.materialClass}
            type="button"
            onClick={() => { const value = item.materialClass ?? ''; setMaterialClass(value); navigate(query, value) }}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${initialClass === item.materialClass ? 'border-accent bg-accent text-accent-foreground' : 'border-border text-muted hover:text-foreground'}`}
          >
            {item.materialClass} · {item.count}
          </button>
        ))}
      </div>
    </div>
  )
}
