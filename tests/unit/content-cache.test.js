import { describe, it, expect, vi, afterEach } from 'vitest'
import { getSubjects, clearCache } from '../../lib/content.js'

describe('content cache TTL', () => {
  afterEach(() => {
    vi.useRealTimers()
    clearCache()
  })

  it('serves the cached value within TTL and reloads after expiry', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000_000)
    clearCache()
    const a = getSubjects()
    const b = getSubjects()
    expect(b).toBe(a) // cache hit: same reference

    vi.setSystemTime(1_000_000 + 31_000) // past the 30s TTL
    const c = getSubjects()
    expect(c).not.toBe(a) // reloaded from disk
    expect(c).toEqual(a) // same content
  })
})
