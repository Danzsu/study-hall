'use client'

import { Flame } from 'lucide-react'
import { useEffect, useState } from 'react'

interface StreakData {
  count: number
  lastDate: string
}

export function StreakBadge() {
  const [streak, setStreak] = useState<StreakData>({ count: 0, lastDate: '' })

  useEffect(() => {
    const raw = localStorage.getItem('streak')
    if (raw) {
      try {
        setStreak(JSON.parse(raw))
      } catch {}
    }
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const isComplete = streak.lastDate === today

  return (
    <div className="flex items-center gap-2 text-sm">
      <Flame
        size={16}
        className={streak.count > 0 ? 'text-accent' : 'text-[var(--muted)]'}
        fill={streak.count > 0 ? 'currentColor' : 'none'}
      />
      <span className={streak.count > 0 ? 'text-[var(--foreground)]' : 'text-[var(--muted)]'}>
        <span className="font-semibold">{streak.count} days streak</span>
      </span>
      {!isComplete && (
        <span className="text-xs text-[var(--muted)] uppercase tracking-wide">
          — complete a quiz today
        </span>
      )}
    </div>
  )
}
