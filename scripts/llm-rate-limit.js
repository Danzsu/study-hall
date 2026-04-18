const lastRequestAt = new Map()

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
  if (!delay) return

  const last = lastRequestAt.get(provider) || 0
  const waitMs = Math.max(0, last + delay - Date.now())
  if (waitMs > 0) {
    console.log(`   Rate limit guard: waiting ${Math.ceil(waitMs / 1000)}s before ${provider} request.`)
    await sleep(waitMs)
  }
}

async function callWithProviderLimit(provider, fn, options = {}) {
  const retries = options.retries ?? envInt('LLM_MAX_RETRIES', 2)

  for (let attempt = 0; attempt <= retries; attempt++) {
    await waitForProvider(provider)

    try {
      const result = await fn()
      lastRequestAt.set(provider, Date.now())
      return result
    } catch (err) {
      lastRequestAt.set(provider, Date.now())
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
  providerDelay,
  waitForProvider,
}
