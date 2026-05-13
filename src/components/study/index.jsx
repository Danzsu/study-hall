'use client'

import { Lightbulb, AlertTriangle, Info, AlertCircle } from 'lucide-react'

// ─── SVG FILTERS ─────────────────────────────────────────────────────────────

export function SvgFilters() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      style={{ position: 'absolute', overflow: 'hidden', pointerEvents: 'none' }}
    >
      <defs>
        <filter id="study-roughen">
          <feTurbulence type="fractalNoise" baseFrequency="0.04 0.07" numOctaves="3" seed="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="study-rough">
          <feTurbulence type="fractalNoise" baseFrequency="0.03 0.06" numOctaves="3" seed="5" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  )
}

// ─── CORE LAYOUT ─────────────────────────────────────────────────────────────

function Breadcrumb({ course }) {
  return (
    <div className="font-sans text-[11px] tracking-[0.12em] uppercase text-stone-500 dark:text-stone-400 mb-6 font-medium">
      {course} <span style={{ color: 'var(--accent-dark)' }}>›</span> Study
    </div>
  )
}

export function StudyPage({ theme, course, children }) {
  const themeStyle = theme
    ? {
        '--accent':        theme.accent,
        '--accent-dark':   theme.accentDark,
        '--accent-darker': theme.accentDarker,
        '--accent-light':  theme.accentLight,
        '--accent-faded':  theme.accentFaded,
        '--hero-font':     `var(--${theme.heroFont ?? 'font-fraunces'})`,
      }
    : { '--hero-font': 'var(--font-fraunces)' }

  const displayCourse = course ?? theme?.course
  return (
    <article
      style={themeStyle}
      className="font-serif text-stone-900 dark:text-stone-100 max-w-3xl mx-auto px-6 py-10"
    >
      {displayCourse && <Breadcrumb course={displayCourse} />}
      {children}
    </article>
  )
}

// ─── HERO ─────────────────────────────────────────────────────────────────────

function renderMarkerTitle(title, highlight = []) {
  const lookup = new Map(highlight.map(h => [h.word.toLowerCase(), h]))
  const tokens = title.split(/(\s+)/)
  return tokens.map((tok, i) => {
    const match = lookup.get(tok.toLowerCase())
    if (!match) return <span key={i}>{tok}</span>
    return (
      <span key={i} className="relative inline-block px-[0.2em] z-0">
        <span
          aria-hidden="true"
          className="absolute -z-10 pointer-events-none"
          style={{
            inset: '0.08em -0.05em',
            background: match.bg ?? 'var(--accent-light)',
            filter: 'url(#study-rough)',
          }}
        />
        <span className="relative" style={{ color: match.color ?? 'var(--accent-darker)' }}>
          {tok}
        </span>
      </span>
    )
  })
}

export function Hero({ variant = 'box', title, tag, compact = false, children, highlight = [] }) {
  const titleSize = compact ? 'text-2xl md:text-3xl' : 'text-4xl md:text-5xl'
  const padding   = compact ? 'px-4 py-3' : 'px-6 py-5'

  let heroNode = null

  if (variant === 'swatch') {
    heroNode = (
      <div className="inline-flex items-baseline flex-wrap gap-1 mb-3">
        {children}
      </div>
    )
  } else if (variant === 'marker' && title) {
    heroNode = (
      <h1
        className={`${titleSize} font-medium text-stone-900 dark:text-stone-100 leading-tight tracking-tight m-0 mb-3`}
        style={{ fontFamily: 'var(--hero-font, var(--font-fraunces))' }}
      >
        {renderMarkerTitle(title, highlight)}
      </h1>
    )
  } else if (variant === 'rough' && title) {
    heroNode = (
      <div className={`relative inline-block ${padding} mb-3`}>
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none text-stone-900 dark:text-stone-100"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          <rect
            x="2" y="2" width="96" height="96"
            fill="none" stroke="currentColor" strokeWidth="2.5"
            vectorEffect="non-scaling-stroke"
            filter="url(#study-rough)"
          />
        </svg>
        <h1
          className={`relative ${titleSize} font-medium text-stone-900 dark:text-stone-100 leading-none tracking-tight m-0`}
          style={{ fontFamily: 'var(--hero-font, var(--font-fraunces))' }}
        >
          {title}
        </h1>
      </div>
    )
  } else if (title) {
    heroNode = (
      <div className={`inline-block border-[2.5px] border-stone-900 dark:border-stone-100 ${padding} mb-3`}>
        <h1
          className={`${titleSize} font-medium text-stone-900 dark:text-stone-100 leading-none tracking-tight m-0`}
          style={{ fontFamily: 'var(--hero-font, var(--font-fraunces))' }}
        >
          {title}
        </h1>
      </div>
    )
  }

  return (
    <header className="mb-6">
      {heroNode}
      {tag && (
        <p className="italic text-stone-600 dark:text-stone-400 text-base mt-2 mb-0">{tag}</p>
      )}
    </header>
  )
}

export function HeroWord({ bg = 'var(--accent-light)', color = '#1a1a1a', plain = false, rotation, children }) {
  const sizeClasses = 'font-serif text-4xl md:text-5xl font-medium leading-tight'

  if (plain) {
    return (
      <span className={`inline-block ${sizeClasses} text-stone-900 dark:text-stone-100 px-[0.1em]`}>
        {children}
      </span>
    )
  }

  return (
    <span
      className={`relative inline-block ${sizeClasses} px-[0.35em] py-[0.15em] z-0`}
      style={rotation !== undefined ? { transform: `rotate(${rotation}deg)` } : undefined}
    >
      <span
        aria-hidden="true"
        className="absolute -z-10 pointer-events-none"
        style={{ inset: '0.05em -0.05em', background: bg, filter: 'url(#study-rough)' }}
      />
      <span className="relative" style={{ color }}>{children}</span>
    </span>
  )
}

export function HeroViz({ children, caption }) {
  return (
    <figure className="mb-6 -mx-2">
      <div className="bg-white dark:bg-stone-900 rounded-lg border-[0.5px] border-stone-200 dark:border-stone-800 p-5">
        {children}
      </div>
      {caption && (
        <figcaption className="text-center text-sm italic text-stone-600 dark:text-stone-400 mt-2">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

// ─── METADATA ────────────────────────────────────────────────────────────────

export function Author({ authors, date }) {
  return (
    <p className="text-sm text-stone-600 dark:text-stone-400 mb-8">
      {authors.map((a, i) => (
        <span key={a.name}>
          {a.href ? (
            <a
              href={a.href}
              style={{ color: 'var(--accent)', textDecorationColor: 'var(--accent-faded)' }}
              className="underline underline-offset-[3px] font-medium"
            >
              {a.name}
            </a>
          ) : (
            <span style={{ color: 'var(--accent)' }} className="font-medium">{a.name}</span>
          )}
          {i < authors.length - 1 && (i === authors.length - 2 ? ' & ' : ', ')}
        </span>
      ))}
      , {date}
    </p>
  )
}

export function SectionHeading({ level = 2, children }) {
  const Tag = `h${level}`
  const sizeClass = level === 2 ? 'text-[22px]' : 'text-lg'
  return (
    <Tag className={`font-serif ${sizeClass} font-medium text-stone-900 dark:text-stone-100 mt-7 mb-2 flex items-baseline gap-2.5`}>
      <span style={{ color: 'var(--accent)' }} className="font-medium">›</span>
      {children}
    </Tag>
  )
}

// ─── CONTENT BLOCKS ──────────────────────────────────────────────────────────

export function TwoCol({ children, ratio = '1:1' }) {
  const gridClass =
    ratio === '2:1' ? 'md:grid-cols-[2fr_1fr]' :
    ratio === '1:2' ? 'md:grid-cols-[1fr_2fr]' :
    'md:grid-cols-2'
  return (
    <div className={`grid grid-cols-1 ${gridClass} gap-5 my-4 items-start`}>
      {children}
    </div>
  )
}

export function MathBlock({ children, caption }) {
  return (
    <div className="my-4">
      <div
        className="bg-white dark:bg-stone-900 px-5 py-4 text-center font-mono text-base rounded-r-md border-l-[3px] text-stone-900 dark:text-stone-100"
        style={{ borderLeftColor: 'var(--accent)' }}
      >
        {children}
      </div>
      {caption && (
        <p className="font-serif italic text-sm text-stone-600 dark:text-stone-400 text-center mt-1.5">
          {caption}
        </p>
      )}
    </div>
  )
}

export function MarginNote({ children, label = 'Side note' }) {
  return (
    <aside
      className="rounded-md px-3 py-2.5 text-[14px] leading-relaxed font-handwritten"
      style={{ background: 'var(--accent-light)', color: 'var(--accent-darker)' }}
    >
      <div
        className="font-sans text-[10px] font-semibold tracking-[0.1em] uppercase mb-1"
        style={{ color: 'var(--accent-dark)' }}
      >
        {label}
      </div>
      {children}
    </aside>
  )
}

// ─── CALLOUTS & EMPHASIS ─────────────────────────────────────────────────────

const CALLOUT_ICONS = {
  insight:   Lightbulb,
  important: AlertTriangle,
  warning:   AlertCircle,
  note:      Info,
}

const CALLOUT_LABELS = {
  insight:   'Insight',
  important: 'Important',
  warning:   'Warning',
  note:      'Note',
}

export function Callout({ variant = 'insight', title, children }) {
  const Icon  = CALLOUT_ICONS[variant]  ?? Info
  const label = CALLOUT_LABELS[variant] ?? 'Note'

  return (
    <aside
      className="my-5 px-4 py-3 rounded-r-md border-l-[3px]"
      style={{ background: 'var(--accent-light)', borderLeftColor: 'var(--accent)' }}
    >
      <div
        className="font-sans text-[11px] font-medium tracking-[0.1em] uppercase mb-1 flex items-center gap-1.5"
        style={{ color: 'var(--accent-darker)' }}
      >
        <Icon size={13} aria-hidden="true" />
        <span>{title ?? label}</span>
      </div>
      <div
        className="text-[14.5px] leading-relaxed"
        style={{ color: 'var(--accent-darker)' }}
      >
        {children}
      </div>
    </aside>
  )
}

export function Highlight({ children, variant = 'flat' }) {
  if (variant === 'marker') {
    return (
      <span className="relative inline-block z-0">
        <span
          aria-hidden="true"
          className="absolute -inset-x-1 inset-y-0 -z-10 rounded-sm border"
          style={{
            background: 'var(--accent-light)',
            borderColor: 'var(--accent)',
            filter: 'url(#study-roughen)',
            transform: 'rotate(-0.4deg)',
          }}
        />
        <span style={{ color: 'var(--accent-darker)' }} className="font-medium">
          {children}
        </span>
      </span>
    )
  }

  return (
    <span
      className="px-1 py-px rounded-sm font-medium"
      style={{ background: 'var(--accent-light)', color: 'var(--accent-darker)' }}
    >
      {children}
    </span>
  )
}

// ─── UTILITIES ───────────────────────────────────────────────────────────────

export function StudyImage({ src, alt, caption }) {
  return (
    <figure className="my-5">
      <img
        src={src}
        alt={alt}
        className="w-full rounded-md border-[0.5px] border-stone-200 dark:border-stone-800"
      />
      {caption && (
        <figcaption className="font-serif italic text-sm text-stone-600 dark:text-stone-400 text-center mt-2">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
