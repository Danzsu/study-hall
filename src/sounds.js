'use client'

export const SOUND_PREF_KEY = 'studyHall:soundsEnabled'

export const SOUND_PATHS = {
  correct: '/sounds/Correct_answear.mp3',
  wrong: '/sounds/Wrong_answear.mp3',
  pomodoroTimeUp: '/sounds/pomodoro_time_up.mp3',
  pomodoroBlockFinished: '/sounds/pomodoro_block_finished.mp3',
}

export function soundsEnabled() {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(SOUND_PREF_KEY) !== '0'
}

export function setSoundsEnabled(enabled) {
  if (typeof window === 'undefined') return
  localStorage.setItem(SOUND_PREF_KEY, enabled ? '1' : '0')
}

export function playSound(name) {
  if (typeof window === 'undefined' || !soundsEnabled()) return
  const src = SOUND_PATHS[name]
  if (!src) return

  const audio = new Audio(src)
  audio.volume = 0.72
  audio.play().catch(() => {
    // Browsers can block audio before user interaction; the app should stay usable.
  })
}
