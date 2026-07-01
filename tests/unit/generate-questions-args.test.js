import { describe, it, expect } from 'vitest'
import { parseArgs, resolveSourceFiles } from '../../scripts/generate-questions.js'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

describe('generate-questions parseArgs', () => {
  it('parses positional slug and difficulty', () => {
    const a = parseArgs(['node', 'gen', 'it_biztonsag', 'hard'])
    expect(a).toMatchObject({ subjectSlug: 'it_biztonsag', difficulty: 'hard', inputFile: null, sourceKind: 'test' })
  })
  it('defaults difficulty to medium', () => {
    expect(parseArgs(['node', 'gen', 'it_biztonsag']).difficulty).toBe('medium')
  })
  it('parses --input and --source-kind', () => {
    const a = parseArgs(['node', 'gen', 's', '--input', '/tmp/x.pdf', '--source-kind', 'lesson'])
    expect(a).toMatchObject({ inputFile: '/tmp/x.pdf', sourceKind: 'lesson' })
  })
  it('does not treat --input value as difficulty', () => {
    const a = parseArgs(['node', 'gen', 's', '--input', '/tmp/x.pdf'])
    expect(a.difficulty).toBe('medium'); expect(a.inputFile).toBe('/tmp/x.pdf')
  })
  it('rejects invalid source-kind → test', () => {
    expect(parseArgs(['node', 'gen', 's', '--source-kind', 'bogus']).sourceKind).toBe('test')
  })
})

describe('resolveSourceFiles', () => {
  it('returns explicit input as single test source', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gq-')); const f = path.join(tmp, 'l.pdf'); fs.writeFileSync(f, 'x')
    const files = resolveSourceFiles({ subjectSlug: 's', inputFile: f, sourceKind: 'test' })
    expect(files).toEqual([{ file: f, sourceKind: 'test', assessmentOnly: false }])
    fs.rmSync(tmp, { recursive: true, force: true })
  })
  it('marks lesson-kind explicit input as assessmentOnly', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gq-')); const f = path.join(tmp, 'n.md'); fs.writeFileSync(f, 'x')
    expect(resolveSourceFiles({ subjectSlug: 's', inputFile: f, sourceKind: 'lesson' })[0].assessmentOnly).toBe(true)
    fs.rmSync(tmp, { recursive: true, force: true })
  })
  it('throws when explicit input missing', () => {
    expect(() => resolveSourceFiles({ subjectSlug: 's', inputFile: '/no/x.pdf', sourceKind: 'test' })).toThrow(/not found/i)
  })
  it('falls back to scan (empty for unknown slug)', () => {
    expect(resolveSourceFiles({ subjectSlug: 'nonexistent_xyz', inputFile: null, sourceKind: 'test' })).toHaveLength(0)
  })
})
