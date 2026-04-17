import Link from 'next/link'
import { Fragment } from 'react'
import { HeaderActions } from './HeaderActions'

export interface Crumb {
  label: string
  href?: string
}

interface HeaderProps {
  backHref?: string
  backLabel?: string
  title?: string
  crumbs?: Crumb[]
  rightSlot?: React.ReactNode
}

function buildCrumbs(props: Readonly<HeaderProps>): Crumb[] {
  if (props.crumbs) return props.crumbs
  if (props.backHref) {
    const trail: Crumb[] = [{ label: props.backLabel ?? 'Back', href: props.backHref }]
    if (props.title) trail.push({ label: props.title })
    return trail
  }
  if (props.title) return [{ label: props.title }]
  return []
}

export function Header(props: Readonly<HeaderProps>) {
  const { rightSlot } = props
  const breadcrumbs = buildCrumbs(props)

  return (
    <header
      style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        height: 56,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          padding: '0 20px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            textDecoration: 'none', flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 26, height: 26,
              borderRadius: '50%',
              background: 'var(--accent-bg)',
              border: '1.5px solid rgba(224,115,85,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13,
            }}
          >
            📚
          </div>
          <span
            style={{
              fontWeight: 800, fontSize: 15,
              letterSpacing: '-0.3px',
              color: 'var(--text)',
            }}
          >
            Study Hall
          </span>
        </Link>

        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
            <span style={{ color: 'var(--border2)', fontSize: 16, lineHeight: 1 }}>›</span>
            {breadcrumbs.map((crumb, i) => {
              const isLast = i === breadcrumbs.length - 1
              const key = `${crumb.href ?? ''}-${crumb.label}`
              return (
                <Fragment key={key}>
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      style={{
                        fontSize: 13, fontWeight: 500,
                        color: 'var(--text-sub)',
                        textDecoration: 'none',
                        flexShrink: 0,
                      }}
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span
                      style={{
                        fontSize: 13, fontWeight: 600,
                        color: 'var(--text)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {crumb.label}
                    </span>
                  )}
                  {!isLast && (
                    <span style={{ color: 'var(--border2)', fontSize: 16, lineHeight: 1 }}>›</span>
                  )}
                </Fragment>
              )
            })}
          </div>
        )}

        {/* Right */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {rightSlot}
          <HeaderActions />
        </div>
      </div>
    </header>
  )
}
