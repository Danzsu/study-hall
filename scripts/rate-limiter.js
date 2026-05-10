'use strict';

const MODEL_LIMITS = {
  // Google — Tier 1 limits (paid)
  'gemini-2.5-flash':        { rpm: 1000, tpm: 1000000,  rpd: 10000,    vision: true  },
  'gemini-2.5-flash-lite':   { rpm: 4000, tpm: 4000000,  rpd: Infinity, vision: true  },
  'gemini-3.1-flash-lite':   { rpm: 4000, tpm: 4000000,  rpd: 150000,   vision: true  },
  // Google — Gemma (last-resort fallback only; low TPM makes them impractical for long prompts)
  'gemma-3-27b-it':          { rpm: 30,   tpm: 15000,    rpd: 14400,    vision: false },
  'gemma-4-31b-it':          { rpm: 30,   tpm: 16000,    rpd: 14400,    vision: true  },
  'gemma-4-26b-a4b-it':      { rpm: 30,   tpm: 16000,    rpd: 14400,    vision: true  },
  // Groq — large
  'llama-3.3-70b-versatile': { rpm: 30,   tpm: 6000,     rpd: 1000,     vision: false },
  'llama-3.1-70b-versatile': { rpm: 30,   tpm: 6000,     rpd: 1000,     vision: false },
  'qwen-qwq-32b':            { rpm: 30,   tpm: 6000,     rpd: 1000,     vision: false },
  // Groq — small
  'llama-3.1-8b-instant':    { rpm: 30,   tpm: 6000,     rpd: 14400,    vision: false },
  'gemma2-9b-it':            { rpm: 30,   tpm: 6000,     rpd: 14400,    vision: false },
  'llama-3.2-3b-preview':    { rpm: 30,   tpm: 6000,     rpd: 14400,    vision: false },
};

class RateLimiter {
  constructor() {
    this._w = {}; // modelId → { rpm: number[], tpm: {ts,tokens}[], rpd: string[], blocked_until: number }
  }

  _win(modelId) {
    if (!this._w[modelId]) this._w[modelId] = { rpm: [], tpm: [], rpd: [], blocked_until: 0 };
    return this._w[modelId];
  }

  _clean(w, now) {
    const ago = now - 60000;
    w.rpm = w.rpm.filter(ts => ts > ago);
    w.tpm = w.tpm.filter(e => e.ts > ago);
  }

  check(modelId, estimatedTokens = 1000) {
    const lim = MODEL_LIMITS[modelId];
    if (!lim) return { allowed: true };

    const now = Date.now();
    const w = this._win(modelId);

    if (w.blocked_until > now) {
      return { allowed: false, reason: 'blocked', retryAfter: w.blocked_until - now };
    }

    this._clean(w, now);

    if (isFinite(lim.rpm) && w.rpm.length >= lim.rpm) {
      return { allowed: false, reason: 'rpm', retryAfter: 60000 - (now - (w.rpm[0] ?? now)) };
    }

    if (isFinite(lim.tpm)) {
      const used = w.tpm.reduce((s, e) => s + e.tokens, 0);
      if (used + estimatedTokens > lim.tpm) {
        return { allowed: false, reason: 'tpm', retryAfter: 60000 - (now - (w.tpm[0]?.ts ?? now)) };
      }
    }

    if (isFinite(lim.rpd)) {
      const today = new Date().toISOString().slice(0, 10);
      if (w.rpd.filter(d => d === today).length >= lim.rpd) {
        return { allowed: false, reason: 'rpd' };
      }
    }

    return { allowed: true };
  }

  record(modelId, tokensUsed = 1000) {
    const now = Date.now();
    const w = this._win(modelId);
    this._clean(w, now);
    w.rpm.push(now);
    w.tpm.push({ ts: now, tokens: tokensUsed });
    w.rpd.push(new Date().toISOString().slice(0, 10));
  }

  markRateLimited(modelId, durationMs = 60000) {
    this._win(modelId).blocked_until = Date.now() + durationMs;
  }
}

module.exports = { RateLimiter, MODEL_LIMITS };
