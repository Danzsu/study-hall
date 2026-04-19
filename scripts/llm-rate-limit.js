const lastRequestAt = new Map()
const requestHistory = new Map()
const ONE_HOUR_MS = 60 * 60 * 1000

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function envInt(name, fallback) {
  const value = Number.parseInt(process.env[name] || '', 10)
  return Number.isFinite(value) && value >= 0 ? value : fallback
}

function providerDelay(provider) {
  if (process.env.LLM_DISABLE_RATE_LIMIT === '1') return 0
  if (provider === 'openrouter') return envInt('OPENROUTER_REQUEST_DELAY_MS', 30000)
  return envInt('GROQ_REQUEST_DELAY_MS', 70000)
}

function providerMaxRequestsPerHour(provider) {
  if (provider === 'openrouter') return envInt('OPENROUTER_MAX_REQUESTS_PER_HOUR', 90)
  return envInt('GROQ_MAX_REQUESTS_PER_HOUR', 45)
}

function providerHasApiKey(provider) {
  if (provider === 'openrouter') return !!process.env.OPENROUTER_API_KEY
  return !!process.env.GROQ_API_KEY
}

function pruneRequestHistory(provider, now = Date.now()) {
  const entries = requestHistory.get(provider) || []
  const cutoff = now - ONE_HOUR_MS
  const next = entries.filter((ts) => ts >= cutoff)
  requestHistory.set(provider, next)
  return next
}

function recordRequest(provider, at = Date.now()) {
  const next = pruneRequestHistory(provider, at)
  next.push(at)
  requestHistory.set(provider, next)
  lastRequestAt.set(provider, at)
}

function getProviderBudget(provider) {
  const now = Date.now()
  const history = pruneRequestHistory(provider, now)
  const delay = providerDelay(provider)
  const maxRequestsPerHour = providerMaxRequestsPerHour(provider)
  const recentCount = history.length
  const remaining = Math.max(0, maxRequestsPerHour - recentCount)
  const last = lastRequestAt.get(provider) || 0
  const nextDelayReadyAt = delay ? last + delay : now
  const nextHourReadyAt = recentCount >= maxRequestsPerHour
    ? (history[0] || now) + ONE_HOUR_MS
    : now

  return {
    provider,
    available: providerHasApiKey(provider),
    minDelayMs: delay,
    maxRequestsPerHour,
    usedLastHour: recentCount,
    remainingLastHour: remaining,
    nextAvailableAt: Math.max(nextDelayReadyAt, nextHourReadyAt),
  }
}

function getProviderBudgetSnapshot() {
  return {
    groq: getProviderBudget('groq'),
    openrouter: getProviderBudget('openrouter'),
  }
}

function getPreferredProviders(options = {}) {
  const preferFast = options.preferFast !== false
  const base = preferFast ? ['openrouter', 'groq'] : ['groq', 'openrouter']
  const forced = Array.isArray(options.order) && options.order.length ? options.order : base

  return forced.filter((provider) => providerHasApiKey(provider))
}

function retryAfterMs(err, provider) {
  const headers = err?.headers || {}
  const retryAfter = typeof headers.get === 'function'
    ? headers.get('retry-after')
    : headers['retry-after']

  if (retryAfter) {
    const seconds = Number.parseFloat(retryAfter)
    if (Number.isFinite(seconds)) {
      return Math.ceil(seconds * 1000) + envInt('LLM_RETRY_SAFETY_MS', 5000)
    }

    const date = Date.parse(retryAfter)
    if (Number.isFinite(date)) {
      return Math.max(0, date - Date.now()) + envInt('LLM_RETRY_SAFETY_MS', 5000)
    }
  }

  return providerDelay(provider) + envInt('LLM_RETRY_SAFETY_MS', 5000)
}

async function waitForProvider(provider) {
  const delay = providerDelay(provider)
  const budget = getProviderBudget(provider)
  const now = Date.now()
  const minWaitMs = delay ? Math.max(0, (lastRequestAt.get(provider) || 0) + delay - now) : 0
  const hourWaitMs = budget.usedLastHour >= budget.maxRequestsPerHour
    ? Math.max(0, (requestHistory.get(provider) || [now])[0] + ONE_HOUR_MS - now)
    : 0
  const waitMs = Math.max(minWaitMs, hourWaitMs)
  if (!waitMs) return

  console.log(`   Rate limit guard: waiting ${Math.ceil(waitMs / 1000)}s before ${provider} request.`)
  await sleep(waitMs)
}

async function callWithProviderLimit(provider, fn, options = {}) {
  const retries = options.retries ?? envInt('LLM_MAX_RETRIES', 2)

  for (let attempt = 0; attempt <= retries; attempt++) {
    await waitForProvider(provider)

    try {
      const result = await fn()
      recordRequest(provider)
      return result
    } catch (err) {
      recordRequest(provider)
      const status = err?.status || err?.response?.status
      const message = String(err?.message || err)
      const isRateLimit = status === 429 || message.includes('429') || message.toLowerCase().includes('rate limit')

      if (!isRateLimit || attempt >= retries) throw err

      const waitMs = retryAfterMs(err, provider)
      console.log(`   ${provider} rate limit hit; retrying in ${Math.ceil(waitMs / 1000)}s (${attempt + 1}/${retries}).`)
      await sleep(waitMs)
    }
  }
}

module.exports = {
  callWithProviderLimit,
  getPreferredProviders,
  getProviderBudget,
  getProviderBudgetSnapshot,
  providerDelay,
  waitForProvider,
}
