'use client'

import { Button } from '@heroui/react'
import { SearchIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const EXAMPLES = ['труба 76х4', 'двутавр 20Б1', 'уголок 63х5', 'ГОСТ 8240']

export function HomeSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <div className="flex w-full max-w-xl flex-col gap-2.5">
      <form onSubmit={submit} role="search" className="flex w-full items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Например: труба 76х4 или швеллер 20"
            aria-label="Поиск по сортаментам"
            className="h-12 w-full rounded-xl border border-border bg-surface pl-10 pr-4 text-base outline-none transition-colors placeholder:text-muted focus:border-accent"
          />
        </div>
        <Button type="submit" size="lg">
          Найти
        </Button>
      </form>
      <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
        <span className="text-muted">Попробуйте:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => router.push(`/search?q=${encodeURIComponent(ex)}`)}
            className="rounded-full border border-border px-2.5 py-1 text-muted transition-colors hover:border-accent hover:text-foreground"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  )
}
