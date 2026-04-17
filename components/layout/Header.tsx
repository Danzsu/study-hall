import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

interface HeaderProps {
  backHref?: string
  backLabel?: string
  title?: string
  rightSlot?: React.ReactNode
}

export function Header({ backHref, backLabel, title, rightSlot }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-[var(--background)] border-b border-[var(--border)]">
      <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between gap-4">
        {/* Left: back link or brand */}
        <div className="flex items-center gap-3 min-w-0">
          {backHref ? (
            <Link
              href={backHref}
              className="flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              <span>←</span>
              <span>{backLabel ?? 'Back'}</span>
            </Link>
          ) : (
            <Link href="/" className="flex items-center gap-2 font-semibold text-[var(--foreground)]">
              <BookOpen size={18} className="text-accent" />
              <span>Study Hall</span>
            </Link>
          )}
        </div>

        {/* Center: title */}
        {title && (
          <span className="text-sm font-medium text-[var(--foreground)] truncate hidden sm:block">
            {title}
          </span>
        )}

        {/* Right: slot + theme toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {rightSlot}
          <ThemeToggle />
        </div>
      </div>

      {/* Accent underline */}
      <div className="h-0.5 bg-accent opacity-80" />
    </header>
  )
}
