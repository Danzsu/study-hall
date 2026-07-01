import { describe, it, expect } from 'vitest'
import { parseMarkdownToQuiz, summarizeQuiz } from '../../scripts/markdown-parser.js'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MC_AT_PREFIX = `
## 1. What is least privilege?
@ a) Grant only necessary permissions
- b) Share all resources
- c) Disable all access
- d) Block all traffic
`

const MC_BRACKETED = `
## 2. [multi] Which is a firewall type?
(a) Packet filtering [@]
(b) Social engineering [-]
`

const TRUE_FALSE_HU = `
## 3. [true_false] Az adattitkosítás fontos?
@ a) Igaz
- b) Hamis
`

const TRUE_FALSE_EN = `
## 4. [true_false] Is access control important?
@ a) True
- b) False
`

const FILL = `
## 5. [fill] A ___ elv minimalizálja az engedélyeket
= x: least privilege
`

const DRAG = `
## 6. [drag] Párosíts fogalmakat
> auth: Authentication
> az: Authorization
`

const SIMPLE_INPUT = `
## 7. [input] What does MFA stand for?
= answer: Multi-Factor Authentication
`

const FORMULA_DRAG = `
## 8. [formula] Illesszük be a nyomás képletébe
text: Nyomás kiszámítása
> slot1: F/A (latex: \\frac{F}{A})
`

const CALC = `
## 9. [calc_input] Calculate resistance R
= answer: 50
> chip1: Ohm's law (latex: R = V/I)
`

const WITH_FRONTMATTER = `---
subject: IT Security
year: 2024
---

## 1. What is least privilege?
@ a) Grant only necessary permissions
- b) Share resources
`

const ALL_TYPES = [MC_AT_PREFIX, MC_BRACKETED, TRUE_FALSE_HU, TRUE_FALSE_EN, FILL, DRAG, SIMPLE_INPUT, FORMULA_DRAG, CALC].join('\n')

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('parseMarkdownToQuiz — multi_choice', () => {
  it('parses @ prefix correct answer', () => {
    const { questions } = parseMarkdownToQuiz(MC_AT_PREFIX)
    expect(questions[0].question_type).toBe('multi_choice')
    expect(questions[0].answer).toContain('a')
    expect(questions[0].answer).not.toContain('b')
  })

  it('parses [@] bracketed correct answer', () => {
    const { questions } = parseMarkdownToQuiz(MC_BRACKETED)
    expect(questions[0].question_type).toBe('multi_choice')
    expect(questions[0].answer).toContain('a')
    expect(questions[0].answer).not.toContain('b')
  })

  it('stores options as an object keyed by letter', () => {
    const { questions } = parseMarkdownToQuiz(MC_AT_PREFIX)
    expect(typeof questions[0].options).toBe('object')
    expect(questions[0].options.a).toBeTruthy()
  })
})

describe('parseMarkdownToQuiz — true_false', () => {
  it('handles Hungarian "Igaz" as true', () => {
    const { questions } = parseMarkdownToQuiz(TRUE_FALSE_HU)
    expect(questions[0].question_type).toBe('true_false')
    expect(questions[0].answer).toBe('true')
  })

  it('handles English "True"', () => {
    const { questions } = parseMarkdownToQuiz(TRUE_FALSE_EN)
    expect(questions[0].question_type).toBe('true_false')
    expect(questions[0].answer).toBe('true')
  })
})

describe('parseMarkdownToQuiz — fill_the_blanks', () => {
  it('parses = identifier: answer syntax', () => {
    const { questions } = parseMarkdownToQuiz(FILL)
    expect(questions[0].question_type).toBe('fill_the_blanks')
    const blank = questions[0].blank
    const entry = Array.isArray(blank) ? blank[0] : blank
    expect(entry.identifier).toBe('x')
    expect(entry.answer).toBe('least privilege')
  })
})

describe('parseMarkdownToQuiz — drag_n_drop', () => {
  it('parses > identifier: label syntax into choices', () => {
    const { questions } = parseMarkdownToQuiz(DRAG)
    expect(questions[0].question_type).toBe('drag_n_drop')
    expect(questions[0].choices.length).toBeGreaterThanOrEqual(2)
    expect(questions[0].choices[0].identifier).toBe('auth')
    expect(questions[0].choices[0].label).toBe('Authentication')
  })
})

describe('parseMarkdownToQuiz — simple_input', () => {
  it('parses = answer: value', () => {
    const { questions } = parseMarkdownToQuiz(SIMPLE_INPUT)
    expect(questions[0].question_type).toBe('simple_input')
    expect(questions[0].answer).toBe('Multi-Factor Authentication')
  })
})

describe('parseMarkdownToQuiz — formula_drag_drop', () => {
  it('parses text line and choices with latex', () => {
    const { questions } = parseMarkdownToQuiz(FORMULA_DRAG)
    expect(questions[0].question_type).toBe('formula_drag_drop')
    expect(questions[0].text).toBe('Nyomás kiszámítása')
    expect(questions[0].choices[0].identifier).toBe('slot1')
    expect(questions[0].choices[0].latex).toBe('\\frac{F}{A}')
  })
})

describe('parseMarkdownToQuiz — calc_input', () => {
  it('parses answer and formula chips with latex', () => {
    const { questions } = parseMarkdownToQuiz(CALC)
    expect(questions[0].question_type).toBe('calc_input')
    expect(questions[0].answer).toBe('50')
    expect(questions[0].formula_chips[0].label).toBe("Ohm's law")
    expect(questions[0].formula_chips[0].latex).toBe('R = V/I')
  })
})

describe('parseMarkdownToQuiz — type aliases', () => {
  it('[fill] alias → fill_the_blanks', () => {
    const md = '## 1. [fill] Complete the ___ sentence\n= slot: word'
    expect(parseMarkdownToQuiz(md).questions[0].question_type).toBe('fill_the_blanks')
  })

  it('[drag] alias → drag_n_drop', () => {
    const md = '## 1. [drag] Match the items\n> a: Alpha'
    expect(parseMarkdownToQuiz(md).questions[0].question_type).toBe('drag_n_drop')
  })

  it('unknown type prefix defaults to multi_choice', () => {
    const md = '## 1. [unknown_xyz] What is access control?\n@ a) Correct\n- b) Wrong'
    expect(parseMarkdownToQuiz(md).questions[0].question_type).toBe('multi_choice')
  })
})

describe('parseMarkdownToQuiz — YAML frontmatter', () => {
  it('parses tags and strips frontmatter from questions', () => {
    const { tags, questions } = parseMarkdownToQuiz(WITH_FRONTMATTER)
    expect(tags.subject).toBe('IT Security')
    expect(tags.year).toBe('2024')
    expect(questions.length).toBe(1)
    expect(questions[0].question_type).toBe('multi_choice')
  })
})

describe('summarizeQuiz', () => {
  it('counts 9 questions across all 7 types', () => {
    const quiz = parseMarkdownToQuiz(ALL_TYPES)
    const summary = summarizeQuiz(quiz)
    expect(summary.total).toBe(9)
    expect(summary.counts.multi_choice).toBe(2)
    expect(summary.counts.true_false).toBe(2)
    expect(summary.counts.fill_the_blanks).toBe(1)
    expect(summary.counts.drag_n_drop).toBe(1)
    expect(summary.counts.simple_input).toBe(1)
    expect(summary.counts.formula_drag_drop).toBe(1)
    expect(summary.counts.calc_input).toBe(1)
  })
})
