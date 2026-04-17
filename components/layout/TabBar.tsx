'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Layers, AlertTriangle, BookOpen } from 'lucide-react'

const TABS = [
  { label: 'Home',     Icon: Home,          href: '/' },
  { label: 'Review',   Icon: Layers,        href: null },
  { label: 'Mistakes', Icon: AlertTriangle, href: null },
  { label: 'Glossary', Icon: BookOpen,      href: null },
] as const

export function TabBar() {
  const pathname = usePathname()

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 99,
        padding: 6,
        display: 'flex',
        gap: 4,
        boxShadow: '0 8px 28px rgba(0,0,0,0.08)',
        zIndex: 90,
      }}
    >
      {TABS.map(({ label, Icon, href }) => {
        const active = href === '/' ? pathname === '/' : false
        const baseStyle: React.CSSProperties = {
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '8px 14px', borderRadius: 99,
          border: 'none', cursor: href ? 'pointer' : 'not-allowed',
          fontWeight: 700, fontSize: 12.5,
          fontFamily: "'DM Sans', system-ui, sans-serif",
          textDecoration: 'none',
          opacity: href ? 1 : 0.4,
          transition: 'background 0.15s, color 0.15s',
        }

        if (!href) {
          return (
            <span
              key={label}
              style={{ ...baseStyle, background: 'transparent', color: 'var(--text-sub)' }}
            >
              <Icon size={14} />
              {label}
            </span>
          )
        }

        return (
          <Link
            key={label}
            href={href}
            style={{
              ...baseStyle,
              background: active ? 'var(--accent)' : 'transparent',
              color: active ? '#fff' : 'var(--text-sub)',
            }}
          >
            <Icon size={14} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
