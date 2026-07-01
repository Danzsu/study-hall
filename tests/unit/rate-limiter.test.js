import { describe, it, expect, beforeEach } from 'vitest'
import { RateLimiter, MODEL_LIMITS } from '../../scripts/rate-limiter.js'

describe('RateLimiter', () => {
  let rl

  beforeEach(() => {
    rl = new RateLimiter()
  })

  it('allows calls for unknown models (no limit defined)', () => {
    expect(rl.check('unknown-model-xyz', 1000).allowed).toBe(true)
  })

  it('allows the first call for a known model', () => {
    expect(rl.check('gemini-2.5-flash-lite', 1000).allowed).toBe(true)
  })

  it('markRateLimited blocks immediately', () => {
    rl.markRateLimited('gemini-2.5-flash-lite')
    const result = rl.check('gemini-2.5-flash-lite', 1000)
    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('blocked')
    expect(typeof result.retryAfter).toBe('number')
  })

  it('blocks on rpm after filling the window', () => {
    const model = 'llama-3.3-70b-versatile'
    const rpmLimit = MODEL_LIMITS[model].rpm
    for (let i = 0; i < rpmLimit; i++) rl.record(model, 10)
    const result = rl.check(model, 10)
    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('rpm')
  })

  it('blocks on tpm when tokens would exceed limit', () => {
    const model = 'gemma-3-27b-it'
    const tpmLimit = MODEL_LIMITS[model].tpm
    rl.record(model, tpmLimit - 100)
    const result = rl.check(model, 200)
    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('tpm')
  })

  it('allows when tokens fit within remaining tpm', () => {
    const model = 'gemma-3-27b-it'
    const tpmLimit = MODEL_LIMITS[model].tpm
    rl.record(model, tpmLimit - 500)
    expect(rl.check(model, 400).allowed).toBe(true)
  })

  it('tracks models independently', () => {
    rl.markRateLimited('llama-3.3-70b-versatile')
    expect(rl.check('llama-3.1-8b-instant', 100).allowed).toBe(true)
  })

  it('new instance starts with a clean state', () => {
    rl.markRateLimited('gemini-2.5-flash')
    const fresh = new RateLimiter()
    expect(fresh.check('gemini-2.5-flash', 100).allowed).toBe(true)
  })
})

describe('MODEL_LIMITS', () => {
  it('exports Gemini models with numeric rpm and tpm', () => {
    expect(MODEL_LIMITS['gemini-2.5-flash']).toBeDefined()
    expect(MODEL_LIMITS['gemini-2.5-flash-lite']).toBeDefined()
    expect(typeof MODEL_LIMITS['gemini-2.5-flash'].rpm).toBe('number')
    expect(typeof MODEL_LIMITS['gemini-2.5-flash'].tpm).toBe('number')
    expect(typeof MODEL_LIMITS['gemini-2.5-flash'].vision).toBe('boolean')
  })

  it('exports Groq and fallback models', () => {
    expect(MODEL_LIMITS['llama-3.3-70b-versatile']).toBeDefined()
    expect(MODEL_LIMITS['llama-3.1-8b-instant']).toBeDefined()
  })
})
