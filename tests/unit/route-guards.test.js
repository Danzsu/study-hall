import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.join(__dirname, '..', '..')
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf-8')

describe('admin route guards', () => {
  it('generate-pipeline route requires admin auth', () => {
    const src = read('app/api/upload/generate-pipeline/route.js')
    expect(src).toMatch(/requireAdmin/)
    expect(src).toMatch(/import\s*\{\s*requireAdmin\s*\}/)
  })

  it('save-subject route clears the content cache after writing', () => {
    const src = read('app/api/upload/save-subject/route.js')
    expect(src).toMatch(/clearCache/)
  })
})
