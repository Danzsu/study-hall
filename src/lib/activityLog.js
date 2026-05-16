const CAP = 180

export function appendActivity(entry) {
  let log = []
  try { log = JSON.parse(localStorage.getItem('activityLog') ?? '[]') } catch {}
  log.unshift({ ...entry, ts: Date.now() })
  if (log.length > CAP) log = log.slice(0, CAP)
  localStorage.setItem('activityLog', JSON.stringify(log))
}

export function appendSession(entry) {
  appendActivity(entry)
  let sessions = []
  try { sessions = JSON.parse(localStorage.getItem('recentSessions') ?? '[]') } catch {}
  sessions.unshift({
    type: entry.type,
    subject: entry.subjectName,
    score: entry.score ?? 0,
    total: entry.total ?? 0,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    color: entry.color,
  })
  localStorage.setItem('recentSessions', JSON.stringify(sessions.slice(0, 20)))
}
