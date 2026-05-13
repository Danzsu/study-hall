'use strict'

export const themes = {
  ml: {
    course: 'Machine Learning',
    heroFont: 'font-archivo',
    accent:        '#D85A30',
    accentDark:    '#993C1D',
    accentDarker:  '#712B13',
    accentLight:   '#FAECE7',
    accentFaded:   'rgba(216,90,48,0.35)',
  },
  bme: {
    course: 'BME Engineering',
    heroFont: 'font-montserrat',
    accent:        '#378ADD',
    accentDark:    '#185FA5',
    accentDarker:  '#0C447C',
    accentLight:   '#E6F1FB',
    accentFaded:   'rgba(55,138,221,0.35)',
  },
  claudeCode: {
    course: 'Claude Code',
    heroFont: 'font-montserrat',
    accent:        '#1D9E75',
    accentDark:    '#0F6E56',
    accentDarker:  '#085041',
    accentLight:   '#E1F5EE',
    accentFaded:   'rgba(29,158,117,0.35)',
  },
  economics: {
    course: 'Economics',
    heroFont: 'font-alfaslab',
    accent:        '#BA7517',
    accentDark:    '#854F0B',
    accentDarker:  '#633806',
    accentLight:   '#FAEEDA',
    accentFaded:   'rgba(186,117,23,0.35)',
  },
}

export function getThemeByColor(hexColor) {
  if (!hexColor) return null
  const normalized = hexColor.toLowerCase()
  return Object.values(themes).find(t => t.accent.toLowerCase() === normalized) ?? null
}
