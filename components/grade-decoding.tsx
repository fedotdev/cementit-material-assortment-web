'use client'

import { Info } from 'lucide-react'

type DecodingPart = { token: string; meaning: string; kind: string }

export function GradeDecoding({ grade, decoding }: { grade: string; decoding: unknown }) {
  const data = decoding as { tokens?: DecodingPart[]; summary?: string } | null
  const parts = data?.tokens ?? []

  if (!parts.length) return <span className="font-mono text-2xl font-semibold">{grade}</span>

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline" aria-label={`Расшифровка марки ${grade}`}>
        {parts.map((part, index) => (
          <span key={`${part.token}-${index}`} className="group relative">
            <button
              type="button"
              className="rounded px-0.5 font-mono text-2xl font-semibold underline decoration-accent/50 decoration-dotted underline-offset-4 outline-none hover:bg-accent/10 focus-visible:ring-2 focus-visible:ring-accent"
              aria-describedby={`decoding-${index}`}
            >
              {part.token}
            </button>
            <span
              id={`decoding-${index}`}
              role="tooltip"
              className="pointer-events-none absolute bottom-full left-0 z-20 mb-2 hidden w-64 rounded-lg border border-border bg-foreground p-3 text-left font-sans text-xs font-normal leading-relaxed text-background shadow-lg group-hover:block group-focus-within:block"
            >
              {part.meaning}
            </span>
          </span>
        ))}
      </div>
      {data?.summary && (
        <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
          <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          {data.summary}
        </p>
      )}
    </div>
  )
}
