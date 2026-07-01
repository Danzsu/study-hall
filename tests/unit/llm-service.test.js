import { describe, it, expect } from 'vitest'
import { tryParseJSON } from '../../scripts/llm-service.js'

describe('tryParseJSON — happy path', () => {
  it('parses a plain JSON object', () => {
    const result = tryParseJSON('{"score": 90, "ok": true}')
    expect(result.ok).toBe(true)
    expect(result.data).toEqual({ score: 90, ok: true })
  })

  it('parses a JSON array', () => {
    const result = tryParseJSON('[1, 2, 3]')
    expect(result.ok).toBe(true)
    expect(result.data).toEqual([1, 2, 3])
  })

  it('strips ```json code block wrapper', () => {
    const result = tryParseJSON('```json\n{"key":"value"}\n```')
    expect(result.ok).toBe(true)
    expect(result.data).toEqual({ key: 'value' })
  })

  it('strips plain ``` code block wrapper', () => {
    const result = tryParseJSON('```\n[1,2]\n```')
    expect(result.ok).toBe(true)
    expect(result.data).toEqual([1, 2])
  })

  it('extracts JSON object embedded in prose', () => {
    const result = tryParseJSON('Here is the result: {"answer": 42} and more text.')
    expect(result.ok).toBe(true)
    expect(result.data.answer).toBe(42)
  })

  it('extracts JSON array embedded in prose', () => {
    const result = tryParseJSON('Result: [{"a":1},{"b":2}] done.')
    expect(result.ok).toBe(true)
    expect(Array.isArray(result.data)).toBe(true)
    expect(result.data.length).toBe(2)
  })
})

describe('tryParseJSON — edge cases', () => {
  it('returns ok:false for plain text with no JSON', () => {
    const result = tryParseJSON('just some text with no JSON structure')
    expect(result.ok).toBe(false)
    expect(typeof result.raw).toBe('string')
  })

  it('returns ok:false for structurally broken JSON', () => {
    const result = tryParseJSON('{broken: no quotes}')
    expect(result.ok).toBe(false)
  })

  it('returns ok:false for empty string', () => {
    const result = tryParseJSON('')
    expect(result.ok).toBe(false)
  })

  it('handles deeply nested valid JSON', () => {
    const nested = JSON.stringify({ a: { b: { c: [1, 2, 3] } } })
    const result = tryParseJSON(nested)
    expect(result.ok).toBe(true)
    expect(result.data.a.b.c).toEqual([1, 2, 3])
  })
})
