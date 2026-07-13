'use client'

import { Button } from '@heroui/react'
import { MoonIcon, SearchIcon, SunIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useRef, useState, useTransition } from 'react'
import { suggestSizeItems, type GroupedSuggestions } from '@/app/actions/search-suggest'
import { AvailabilityChip } from '@/components/badges'

const NAV = [
  { href: '/catalog', label: 'Каталог' },
  { href: '/by-size', label: 'Подбор по размерам' },
  { href: '/materials', label: 'Материалы' },
  { href: '/standards', label: 'Стандарты' },
]

const EMPTY: GroupedSuggestions = { items: [], standards: [], sections: [] }

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return (
    <Button
      variant="ghost"
      size="sm"
      isIconOnly
      aria-label="Переключить тему"
      onPress={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      {mounted && resolvedTheme === 'dark' ? (
        <SunIcon className="size-4" />
      ) : (
        <MoonIcon className="size-4" />
      )}
    </Button>
  )
}

/** Плоский список навигируемых пунктов для клавиатуры: сначала типоразмеры, потом стандарты, потом разделы. */
interface FlatEntry {
  key: string
  href: string
}

function flatten(s: GroupedSuggestions): FlatEntry[] {
  return [
    ...s.items.map((i) => ({ key: `item-${i.slug}`, href: `/item/${i.slug}` })),
    ...s.standards.map((st) => ({
      key: `std-${st.designation}`,
      href: `/standards`,
    })),
    ...s.sections.map((sec) => ({ key: `sec-${sec.href}`, href: sec.href })),
  ]
}

function SearchWithSuggestions() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [groups, setGroups] = useState<GroupedSuggestions>(EMPTY)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [, startTransition] = useTransition()
  const containerRef = useRef<HTMLDivElement>(null)
  const listId = 'header-search-suggestions'

  const flat = flatten(groups)
  const total = flat.length

  // debounce 250 мс
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setGroups(EMPTY)
      setOpen(false)
      setActive(-1)
      return
    }
    const t = setTimeout(() => {
      startTransition(async () => {
        const res = await suggestSizeItems(q)
        setGroups(res)
        setOpen(res.items.length + res.standards.length + res.sections.length > 0)
        setActive(-1)
      })
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  // закрытие по клику вне
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  function navigate(href: string) {
    setOpen(false)
    setQuery('')
    router.push(href)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (active >= 0 && flat[active]) {
      navigate(flat[active].href)
      return
    }
    const q = query.trim()
    if (q) {
      setOpen(false)
      router.push(`/search?q=${encodeURIComponent(q)}`)
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (total > 0) {
        setOpen(true)
        setActive((a) => (a + 1) % total)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (total > 0) {
        setActive((a) => (a <= 0 ? total - 1 : a - 1))
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActive(-1)
    }
  }

  // индексы групп в плоском списке
  const stdOffset = groups.items.length
  const secOffset = stdOffset + groups.standards.length

  return (
    <div ref={containerRef} className="relative ml-auto w-full max-w-xs">
      <form onSubmit={submit} role="search">
        <div className="relative w-full">
          <SearchIcon aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => total > 0 && setOpen(true)}
            placeholder="труба 76х4, швеллер 20…"
            aria-label="Поиск по сортаментам"
            aria-expanded={open}
            aria-controls={listId}
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            role="combobox"
            autoComplete="off"
            className="h-9 w-full rounded-lg border border-border bg-surface pl-8 pr-3 text-sm outline-none transition-colors placeholder:text-muted focus:border-accent"
          />
        </div>
      </form>

      {open && total > 0 && (
        <div
          id={listId}
          role="listbox"
          aria-label="Подсказки поиска"
          className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-border bg-surface shadow-lg"
        >
          {groups.items.length > 0 && (
            <div role="group" aria-label="Типоразмеры">
              <p className="px-3 pt-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted">
                Типоразмеры
              </p>
              {groups.items.map((s, i) => (
                <button
                  key={s.slug}
                  type="button"
                  role="option"
                  aria-selected={i === active}
                  id={`${listId}-${i}`}
                  onClick={() => navigate(`/item/${s.slug}`)}
                  onMouseEnter={() => setActive(i)}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors ${
                    i === active ? 'bg-surface-secondary' : ''
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{s.designation}</span>
                    <span className="block truncate text-xs text-muted">
                      {s.categoryName} · {s.standardDesignation}
                    </span>
                  </span>
                  <AvailabilityChip availability={s.availability} />
                </button>
              ))}
            </div>
          )}

          {groups.standards.length > 0 && (
            <div role="group" aria-label="Стандарты" className="border-t border-border">
              <p className="px-3 pt-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted">
                Стандарты
              </p>
              {groups.standards.map((st, i) => {
                const idx = stdOffset + i
                return (
                  <button
                    key={st.designation}
                    type="button"
                    role="option"
                    aria-selected={idx === active}
                    id={`${listId}-${idx}`}
                    onClick={() => navigate('/standards')}
                    onMouseEnter={() => setActive(idx)}
                    className={`flex w-full flex-col px-3 py-2 text-left text-sm transition-colors ${
                      idx === active ? 'bg-surface-secondary' : ''
                    }`}
                  >
                    <span className="truncate font-mono font-medium">{st.designation}</span>
                    <span className="truncate text-xs text-muted">{st.title}</span>
                  </button>
                )
              })}
            </div>
          )}

          {groups.sections.length > 0 && (
            <div role="group" aria-label="Разделы" className="border-t border-border">
              <p className="px-3 pt-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted">
                Разделы
              </p>
              {groups.sections.map((sec, i) => {
                const idx = secOffset + i
                return (
                  <button
                    key={sec.href}
                    type="button"
                    role="option"
                    aria-selected={idx === active}
                    id={`${listId}-${idx}`}
                    onClick={() => navigate(sec.href)}
                    onMouseEnter={() => setActive(idx)}
                    className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                      idx === active ? 'bg-surface-secondary' : ''
                    }`}
                  >
                    {sec.label}
                  </button>
                )
              })}
            </div>
          )}

          <div className="border-t border-border">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                router.push(`/search?q=${encodeURIComponent(query.trim())}`)
              }}
              className="w-full px-3 py-2 text-left text-xs text-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
            >
              Все результаты по запросу «{query.trim()}»
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span aria-hidden className="flex size-6 items-center justify-center rounded bg-foreground font-mono text-xs font-bold text-background">
            Fe
          </span>
          Цементит
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Основная навигация">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <SearchWithSuggestions />

        <ThemeToggle />
      </div>
    </header>
  )
}
