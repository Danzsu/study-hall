'use strict';

// Deterministic Markdown → quiz JSON parser.
// Supports all 7 question types via type prefix: [multi], [true_false], [fill], [drag], [input], [formula_drag_drop], [calc_input].
// Old format without type prefix defaults to multi_choice (backward-compatible).
// Ported from quiz-aura/js/upload/markdownParser.js (ES module → CommonJS)

const QUESTION_TYPES = {
  MULTI_CHOICE:      'multi_choice',
  TRUE_FALSE:        'true_false',
  FILL_THE_BLANKS:   'fill_the_blanks',
  DRAG_N_DROP:       'drag_n_drop',
  SIMPLE_INPUT:      'simple_input',
  FORMULA_DRAG_DROP: 'formula_drag_drop',
  CALC_INPUT:        'calc_input',
};

const TYPE_MAP = {
  multi:              'multi_choice',
  multi_choice:       'multi_choice',
  true_false:         'true_false',
  trueFalse:          'true_false',
  fill:               'fill_the_blanks',
  fill_in:            'fill_the_blanks',
  fill_the_blanks:    'fill_the_blanks',
  drag:               'drag_n_drop',
  drag_n_drop:        'drag_n_drop',
  input:              'simple_input',
  simple_input:       'simple_input',
  formula_drag_drop:  'formula_drag_drop',
  formula:            'formula_drag_drop',
  calc_input:         'calc_input',
};

function parseYamlFrontMatter(text) {
  const match = text.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return { tags: {}, rest: text };
  const tags = {};
  for (const line of match[1].split('\n')) {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      tags[key.trim()] = valueParts.join(':').trim();
    }
  }
  return { tags, rest: text.slice(match[0].length).trim() };
}

function stripAnnotations(text) {
  return text.replaceAll(/<!--.*?-->/g, '').trim();
}

function parseTitleLine(line) {
  const withType = line.match(/^#{2,3}\s*(?:N\.?\s*)?\d+\.?\s*\[(\w+)\]\s*([\s\S]+)$/i);
  if (withType) {
    const rawType = withType[1].toLowerCase();
    const qType = TYPE_MAP[rawType] || 'multi_choice';
    return { qType, title: stripAnnotations(withType[2]) };
  }
  const noType = line.replace(/^#{2,3}\s*(?:N\.?\s*)?\d+\.?\s*/, '');
  return { qType: 'multi_choice', title: stripAnnotations(noType) };
}

const OPTION_LETTERS = 'abcdefghijklmnopqrstuvwxyz';

function parseStandardFormat(trimmed) {
  const m = trimmed.match(/^([@-])\s*([a-z])\)\s*(.+)$/i);
  if (!m) return null;
  return { key: m[2].toLowerCase(), text: m[3].trim(), correct: m[1] === '@', auto: false };
}

function parseBareAtEnd(trimmed) {
  const m = trimmed.match(/^\(([a-z])\)\s+(.+)\s+@$/);
  if (!m) return null;
  return { key: m[1].toLowerCase(), text: m[2].trim(), correct: true, auto: false };
}

function parseBracketed(trimmed) {
  const m = trimmed.match(/^\(([a-z])\)\s*(.*?)\s*(\[@\]|\[-\])\s*$/i);
  if (!m) return null;
  return { key: m[1].toLowerCase(), text: m[2].trim(), correct: m[3] === '[@]', auto: false };
}

function parsePlainAlt(trimmed) {
  const m = trimmed.match(/^\(([a-z])\)\s+(.+)$/i);
  if (!m) return null;
  return { key: m[1].toLowerCase(), text: m[2].trim(), correct: false, auto: false };
}

function parseDashAtPrefix(trimmed, autoIndex) {
  const m = trimmed.match(/^-\s+@\s+(.+)$/);
  if (!m) return null;
  return { key: OPTION_LETTERS[autoIndex] || String(autoIndex), text: m[1].trim(), correct: true, auto: true };
}

function parseBarePrefix(trimmed, autoIndex) {
  const bare = trimmed.replace(/^[@-]\s*/, '');
  if (!bare || bare === trimmed) return null;
  return { key: OPTION_LETTERS[autoIndex] || String(autoIndex), text: bare, correct: trimmed.startsWith('@'), auto: true };
}

function extractOptionEntry(trimmed, autoIndex) {
  return (
    parseStandardFormat(trimmed) ??
    parseBareAtEnd(trimmed) ??
    parseBracketed(trimmed) ??
    parsePlainAlt(trimmed) ??
    parseDashAtPrefix(trimmed, autoIndex) ??
    parseBarePrefix(trimmed, autoIndex)
  );
}

function parseMultiChoice(title, bodyLines, id) {
  const options = {};
  const answer = [];
  let autoIndex = 0;
  for (const line of bodyLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const entry = extractOptionEntry(trimmed, autoIndex);
    if (!entry) continue;
    options[entry.key] = entry.text;
    if (entry.correct) answer.push(entry.key);
    if (entry.auto) autoIndex++;
  }
  return { question_type: 'multi_choice', question_title: title, options, answer, ID: id, supervised: 'generated' };
}

function parseTrueFalse(title, bodyLines, id) {
  let correctText = null;
  for (const line of bodyLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('@')) {
      const withKey = trimmed.match(/^@\s*[a-z]\)\s*(.+)$/i);
      correctText = (withKey ? withKey[1] : trimmed.replace(/^@\s*/, '')).trim().toLowerCase();
      break;
    }
    const altBracketed = trimmed.match(/^\([a-z]\)\s*(.*?)\s*\[@\]\s*$/i);
    if (altBracketed?.[1]) { correctText = altBracketed[1].trim().toLowerCase(); break; }
    const altBareAt = trimmed.match(/^\([a-z]\)\s+(.+?)\s+@$/i);
    if (altBareAt?.[1]) { correctText = altBareAt[1].trim().toLowerCase(); break; }
  }
  const answer = (correctText === 'igaz' || correctText === 'true') ? 'true' : 'false';
  return { question_type: 'true_false', question_title: title, answer, ID: id, supervised: 'generated' };
}

function parseFill(title, bodyLines, id) {
  const blank = [];
  for (const line of bodyLines) {
    const match = line.trim().match(/^=\s*(\w+)\s*:\s*(.+)$/);
    if (match) {
      blank.push({ identifier: match[1].trim(), answer: match[2].trim() });
    }
  }
  return {
    question_type: 'fill_the_blanks',
    text: title,
    blank: blank.length === 1 ? blank[0] : blank,
    ID: id,
    supervised: 'generated',
  };
}

function parseDrag(title, bodyLines, id) {
  const choices = [];
  for (const line of bodyLines) {
    const match = line.trim().match(/^>\s*(\w+)\s*:\s*(.+)$/);
    if (match) {
      choices.push({ identifier: match[1].trim(), label: match[2].trim() });
    }
  }
  return { question_type: 'drag_n_drop', text: title, choices, ID: id, supervised: 'generated' };
}

function parseSimpleInput(title, bodyLines, id) {
  let answer = '';
  for (const line of bodyLines) {
    const match = line.trim().match(/^=\s*answer\s*:\s*(.+)$/i);
    if (match) { answer = match[1].trim(); break; }
  }
  return { question_type: 'simple_input', question_title: title, answer, ID: id, supervised: 'generated' };
}

function parseFormulaDragDrop(title, bodyLines, id) {
  let text = '';
  const choices = [];
  for (const line of bodyLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const textLine = trimmed.match(/^text\s*:\s*(.+)$/i);
    if (textLine) { text = textLine[1].trim(); continue; }
    const choiceLine = trimmed.match(/^>\s*(\w+)\s*:\s*(.+)$/);
    if (choiceLine) {
      const identifier = choiceLine[1].trim();
      const rest = choiceLine[2].trim();
      const latexMatch = rest.match(/^(.*?)\s*\(latex:\s*(.+?)\)\s*$/);
      if (latexMatch) {
        choices.push({ identifier, label: latexMatch[1].trim(), latex: latexMatch[2].trim() });
      } else {
        choices.push({ identifier, label: rest });
      }
    }
  }
  return { question_type: 'formula_drag_drop', question_title: title, text, choices, ID: id, supervised: 'generated' };
}

function parseCalcInput(title, bodyLines, id) {
  let answer = '';
  const formula_chips = [];
  for (const line of bodyLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const answerMatch = trimmed.match(/^=\s*answer\s*:\s*(.+)$/i);
    if (answerMatch) { answer = answerMatch[1].trim(); continue; }
    const chipLine = trimmed.match(/^>\s*\w+\s*:\s*(.+)$/);
    if (chipLine) {
      const rest = chipLine[1].trim();
      const latexMatch = rest.match(/^(.*?)\s*\(latex:\s*(.+?)\)\s*$/);
      if (latexMatch) {
        formula_chips.push({ label: latexMatch[1].trim(), latex: latexMatch[2].trim() });
      } else {
        formula_chips.push({ label: rest });
      }
    }
  }
  const result = { question_type: 'calc_input', question_title: title, answer, ID: id, supervised: 'generated' };
  if (formula_chips.length > 0) result.formula_chips = formula_chips;
  return result;
}

const QUESTION_PARSERS = {
  [QUESTION_TYPES.MULTI_CHOICE]:      parseMultiChoice,
  [QUESTION_TYPES.TRUE_FALSE]:        parseTrueFalse,
  [QUESTION_TYPES.FILL_THE_BLANKS]:   parseFill,
  [QUESTION_TYPES.DRAG_N_DROP]:       parseDrag,
  [QUESTION_TYPES.SIMPLE_INPUT]:      parseSimpleInput,
  [QUESTION_TYPES.FORMULA_DRAG_DROP]: parseFormulaDragDrop,
  [QUESTION_TYPES.CALC_INPUT]:        parseCalcInput,
};

function parseQuestion(rawBlock, id) {
  const lines = rawBlock.trim().split('\n');
  const { qType, title } = parseTitleLine(lines[0]);
  const bodyLines = lines.slice(1).filter(l => l.trim());
  const parser = QUESTION_PARSERS[qType] ?? QUESTION_PARSERS[QUESTION_TYPES.MULTI_CHOICE];
  return parser(title, bodyLines, id);
}

function parseMarkdownToQuiz(markdown) {
  const { tags, rest } = parseYamlFrontMatter(markdown);
  const questionBlocks = rest.split(/(?=^#{2,3}\s+(?:N\.?\s*)?\d+)/m).filter(b => b.trim());
  const questions = questionBlocks.map((block, i) => parseQuestion(block, i + 1));
  return { tags, questions };
}

function summarizeQuiz(quiz) {
  const counts = {
    multi_choice: 0, true_false: 0, fill_the_blanks: 0,
    drag_n_drop: 0, simple_input: 0, formula_drag_drop: 0, calc_input: 0,
  };
  for (const q of quiz.questions) {
    if (q.question_type in counts) counts[q.question_type]++;
  }
  return { total: quiz.questions.length, counts };
}

module.exports = { parseMarkdownToQuiz, summarizeQuiz, QUESTION_TYPES };
