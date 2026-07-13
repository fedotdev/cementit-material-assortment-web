import type { ProfileType } from '@/lib/profile-config'

interface SketchProps {
  type: ProfileType
  /** Подсвечиваемые буквы размеров */
  highlight?: string[]
  /** Значения размеров для подписей: { h: 200, b: 100 } */
  values?: Record<string, number | string | undefined>
  className?: string
}

const STROKE = 'var(--color-foreground)'
const DIM_COLOR = 'var(--color-accent)'
const MUTED = 'var(--color-muted)'

function DimLabel({
  x,
  y,
  letter,
  value,
  active,
}: {
  x: number
  y: number
  letter: string
  value?: number | string
  active?: boolean
}) {
  return (
    <text
      x={x}
      y={y}
      fontSize="11"
      fontFamily="var(--font-mono)"
      fill={active ? DIM_COLOR : MUTED}
      fontWeight={active ? 700 : 400}
      textAnchor="middle"
    >
      {letter}
      {value != null ? `=${value}` : ''}
    </text>
  )
}

/**
 * Схематичные эскизы сечений профилей с размерными линиями.
 * Все эскизы в viewBox 0 0 200 200.
 */
export function ProfileSketch({ type, highlight = [], values = {}, className }: SketchProps) {
  const hl = (letter: string) => highlight.includes(letter)

  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label="Эскиз сечения профиля"
      fill="none"
    >
      {type === 'i-beam' && (
        <>
          {/* Двутавр */}
          <path
            d="M55 40 h90 v14 h-38 v92 h38 v14 h-90 v-14 h38 v-92 h-38 z"
            stroke={STROKE}
            strokeWidth="2"
            fill="var(--color-surface-secondary)"
          />
          {/* h */}
          <line x1="35" y1="40" x2="35" y2="160" stroke={hl('h') ? DIM_COLOR : MUTED} strokeWidth="1" />
          <line x1="30" y1="40" x2="55" y2="40" stroke={MUTED} strokeWidth="0.5" />
          <line x1="30" y1="160" x2="55" y2="160" stroke={MUTED} strokeWidth="0.5" />
          <DimLabel x={26} y={104} letter="h" value={values.h} active={hl('h')} />
          {/* b */}
          <line x1="55" y1="25" x2="145" y2="25" stroke={hl('b') ? DIM_COLOR : MUTED} strokeWidth="1" />
          <DimLabel x={100} y={18} letter="b" value={values.b} active={hl('b')} />
          {/* s — стенка */}
          <DimLabel x={100} y={110} letter="s" value={values.s} active={hl('s')} />
          {/* t — полка */}
          <line x1="160" y1="40" x2="160" y2="54" stroke={hl('t') ? DIM_COLOR : MUTED} strokeWidth="1" />
          <DimLabel x={172} y={50} letter="t" value={values.t} active={hl('t')} />
        </>
      )}

      {type === 'channel' && (
        <>
          {/* Швеллер */}
          <path
            d="M60 40 h85 v14 h-71 v92 h71 v14 h-85 z"
            stroke={STROKE}
            strokeWidth="2"
            fill="var(--color-surface-secondary)"
          />
          <line x1="42" y1="40" x2="42" y2="160" stroke={hl('h') ? DIM_COLOR : MUTED} strokeWidth="1" />
          <DimLabel x={33} y={104} letter="h" value={values.h} active={hl('h')} />
          <line x1="60" y1="25" x2="145" y2="25" stroke={hl('b') ? DIM_COLOR : MUTED} strokeWidth="1" />
          <DimLabel x={102} y={18} letter="b" value={values.b} active={hl('b')} />
          <DimLabel x={90} y={107} letter="s" value={values.s} active={hl('s')} />
          <line x1="158" y1="40" x2="158" y2="54" stroke={hl('t') ? DIM_COLOR : MUTED} strokeWidth="1" />
          <DimLabel x={170} y={50} letter="t" value={values.t} active={hl('t')} />
        </>
      )}

      {type === 'angle' && (
        <>
          {/* Уголок */}
          <path
            d="M60 40 v120 h100 v-16 h-84 v-104 z"
            stroke={STROKE}
            strokeWidth="2"
            fill="var(--color-surface-secondary)"
          />
          <line x1="60" y1="175" x2="160" y2="175" stroke={hl('b') ? DIM_COLOR : MUTED} strokeWidth="1" />
          <DimLabel x={110} y={190} letter="b" value={values.b} active={hl('b')} />
          <line x1="45" y1="40" x2="45" y2="160" stroke={hl('b') ? DIM_COLOR : MUTED} strokeWidth="1" />
          <DimLabel x={36} y={104} letter="b" active={hl('b')} />
          <line x1="60" y1="30" x2="76" y2="30" stroke={hl('t') ? DIM_COLOR : MUTED} strokeWidth="1" />
          <DimLabel x={92} y={33} letter="t" value={values.t} active={hl('t')} />
        </>
      )}

      {type === 'pipe' && (
        <>
          {/* Труба */}
          <circle cx="100" cy="100" r="58" stroke={STROKE} strokeWidth="2" fill="var(--color-surface-secondary)" />
          <circle cx="100" cy="100" r="44" stroke={STROKE} strokeWidth="2" fill="var(--color-background)" />
          <line x1="42" y1="100" x2="158" y2="100" stroke={hl('D') ? DIM_COLOR : MUTED} strokeWidth="1" strokeDasharray="4 3" />
          <DimLabel x={100} y={92} letter="D" value={values.D} active={hl('D')} />
          <line x1="100" y1="158" x2="100" y2="144" stroke={hl('t') ? DIM_COLOR : MUTED} strokeWidth="2" />
          <DimLabel x={114} y={156} letter="t" value={values.t} active={hl('t')} />
        </>
      )}

      {type === 'round' && (
        <>
          <circle cx="100" cy="100" r="56" stroke={STROKE} strokeWidth="2" fill="var(--color-surface-secondary)" />
          <line x1="44" y1="100" x2="156" y2="100" stroke={hl('d') ? DIM_COLOR : MUTED} strokeWidth="1" strokeDasharray="4 3" />
          <DimLabel x={100} y={92} letter="d" value={values.d} active={hl('d')} />
        </>
      )}

      {type === 'square' && (
        <>
          <rect x="50" y="50" width="100" height="100" stroke={STROKE} strokeWidth="2" fill="var(--color-surface-secondary)" />
          <line x1="50" y1="170" x2="150" y2="170" stroke={hl('a') ? DIM_COLOR : MUTED} strokeWidth="1" />
          <DimLabel x={100} y={185} letter="a" value={values.a} active={hl('a')} />
        </>
      )}

      {type === 'sheet' && (
        <>
          {/* Лист в изометрии */}
          <path d="M40 120 L120 90 L170 105 L90 138 z" stroke={STROKE} strokeWidth="2" fill="var(--color-surface-secondary)" />
          <path d="M40 120 L40 132 L90 150 L90 138 z" stroke={STROKE} strokeWidth="2" fill="var(--color-surface-secondary)" />
          <path d="M90 138 L170 105 L170 117 L90 150 z" stroke={STROKE} strokeWidth="2" fill="var(--color-surface-secondary)" />
          <line x1="28" y1="120" x2="28" y2="132" stroke={hl('t') ? DIM_COLOR : MUTED} strokeWidth="2" />
          <DimLabel x={22} y={148} letter="t" value={values.t} active={hl('t')} />
        </>
      )}
    </svg>
  )
}
