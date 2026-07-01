#!/usr/bin/env node
'use strict'

const DEFAULT_BASE_URL = 'http://127.0.0.1:3000'

function normalizeBaseUrl(value) {
  return String(value || DEFAULT_BASE_URL).replace(/\/+$/, '')
}

function parseArgs(argv) {
  let baseUrl = process.env.BACKEND_BASE_URL || DEFAULT_BASE_URL
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--base-url' && argv[i + 1]) baseUrl = argv[++i]
  }
  return { baseUrl: normalizeBaseUrl(baseUrl) }
}

async function fetchJson(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    })
    const text = await res.text()
    let body
    try { body = text ? JSON.parse(text) : null } catch { body = text }
    return { ok: res.ok, status: res.status, body }
  } finally {
    clearTimeout(timer)
  }
}

module.exports = { fetchJson, parseArgs }
