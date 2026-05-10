'use strict';

// Unified LLM service for study-hall.
// Provider priority: Google AI Studio → Groq → OpenRouter
// Ported from quiz-aura/server/services/llmService.js with study-hall adaptations:
//   - PROMPTS_DIR points to prompts/ (project root)
//   - Removed: convertToMarkdown, validateAnswers, checkDedup (not needed)
//   - Added: study-hall-specific OpenRouter referer

const OpenAI = require('openai');
const fs = require('node:fs');
const path = require('node:path');
const { RateLimiter, MODEL_LIMITS } = require('./rate-limiter');

const PROMPTS_DIR = path.join(process.cwd(), 'prompts');
const rateLimiter = new RateLimiter();

const PROVIDER_CONFIGS = {
  google: {
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    keyEnv: 'GOOGLE_AI_KEY',
  },
  groq: {
    baseURL: 'https://api.groq.com/openai/v1',
    keyEnv: 'GROQ_API_KEY',
  },
  openrouter: {
    baseURL: 'https://openrouter.ai/api/v1',
    keyEnv: 'OPENROUTER_API_KEY',
    defaultHeaders: { 'HTTP-Referer': 'https://github.com/study-hall' },
  },
};

const TOKEN_LIMITS = {
  EXTRACT:          4000,
  REPAIR:           8000,
  GENERATE_DEFAULT: 4000,
  GENERATE_MAX:    32000,
  GENERATE_PER_Q:    200,
  GENERATE_OVERHEAD: 2000,
};

function getProviderClient(provider) {
  const cfg = PROVIDER_CONFIGS[provider];
  if (!cfg) return null;
  const apiKey = process.env[cfg.keyEnv];
  if (!apiKey) return null;
  return new OpenAI({ apiKey, baseURL: cfg.baseURL, defaultHeaders: cfg.defaultHeaders });
}

const VISION_CAPABLE = new Set(
  Object.entries(MODEL_LIMITS)
    .filter(([, v]) => v.vision)
    .map(([k]) => k)
);

const DEFAULT_GOOGLE_STANDARD = 'gemini-2.5-flash-lite,gemini-3.1-flash-lite';
const DEFAULT_GOOGLE_PREMIUM  = 'gemini-2.5-flash,gemini-2.5-flash-lite';
const DEFAULT_GROQ_LARGE   = ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile', 'qwen-qwq-32b'];
const DEFAULT_GROQ_SMALL   = ['llama-3.1-8b-instant', 'gemma2-9b-it', 'llama-3.2-3b-preview'];
const DEFAULT_OR_LARGE     = ['qwen/qwen3-coder:free', 'nvidia/nemotron-3-super-120b-a12b:free', 'google/gemma-2-27b-it:free'];
const DEFAULT_OR_SMALL     = ['google/gemma-2-9b-it:free', 'inclusionai/ling-2.6-flash:free', 'meta-llama/llama-3.1-8b-instruct:free'];

function buildActiveChain(chainName, needsVision = false) {
  const entries = [];

  if (process.env.GOOGLE_AI_KEY) {
    const raw = chainName === 'premium'
      ? (process.env.GOOGLE_PREMIUM_MODELS || DEFAULT_GOOGLE_PREMIUM)
      : (process.env.GOOGLE_STANDARD_MODELS || DEFAULT_GOOGLE_STANDARD);
    for (const m of raw.split(',').map(s => s.trim()).filter(Boolean)) {
      entries.push({ provider: 'google', modelId: m });
    }
  }

  if (process.env.GROQ_API_KEY) {
    const models = chainName === 'premium' ? DEFAULT_GROQ_LARGE : DEFAULT_GROQ_SMALL;
    for (const m of models) entries.push({ provider: 'groq', modelId: m });
  }

  if (process.env.OPENROUTER_API_KEY) {
    const models = chainName === 'premium' ? DEFAULT_OR_LARGE : DEFAULT_OR_SMALL;
    for (const m of models) entries.push({ provider: 'openrouter', modelId: m });
  }

  if (needsVision) return entries.filter(e => VISION_CAPABLE.has(e.modelId));
  return entries;
}

function textOnlyContent(userContent) {
  if (!Array.isArray(userContent)) return userContent;
  const texts = userContent.filter(p => p.type === 'text').map(p => p.text);
  return texts.length === 1 ? texts[0] : texts.join('\n\n');
}

async function callWithChain(chainName, systemPrompt, userContent, maxTokens = TOKEN_LIMITS.GENERATE_DEFAULT, options = {}) {
  const needsVision = options.needsVision ?? (Array.isArray(userContent) && userContent.some(p => p.type === 'image_url'));
  const chain = buildActiveChain(chainName, false);

  if (chain.length === 0) throw new Error('No LLM providers configured. Set GOOGLE_AI_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY.');

  let lastErr;
  for (const { provider, modelId } of chain) {
    const check = rateLimiter.check(modelId, options.estimatedTokens ?? maxTokens);
    if (!check.allowed) {
      console.log(`[RateLimit] Skip ${provider}/${modelId} (${check.reason}) → next`);
      continue;
    }

    const client = getProviderClient(provider);
    if (!client) continue;

    const content = VISION_CAPABLE.has(modelId) ? userContent : textOnlyContent(userContent);
    if (needsVision && !VISION_CAPABLE.has(modelId)) {
      console.log(`[Vision] Skipping images for ${modelId}, sending text only`);
    }

    const params = {
      model: modelId,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content },
      ],
    };
    if (options.temperature !== undefined) params.temperature = options.temperature;

    try {
      const response = await client.chat.completions.create(params);
      if (!response.choices?.[0]?.message?.content) {
        console.log(`[ModelError] No choices from ${provider}/${modelId}:`, JSON.stringify(response).slice(0, 200));
        continue;
      }
      const tokensUsed = response.usage?.total_tokens ?? (options.estimatedTokens ?? maxTokens);
      rateLimiter.record(modelId, tokensUsed);
      console.log(`[LLM] ${provider}/${modelId} ok (${tokensUsed} tokens)`);
      return response.choices[0].message.content;
    } catch (err) {
      lastErr = err;
      const status = err.status ?? err.statusCode;
      if (status === 429) {
        rateLimiter.markRateLimited(modelId);
        console.log(`[RateLimit] 429 ${provider}/${modelId} → next`);
        continue;
      }
      if ([503, 404, 400].includes(status)) {
        console.log(`[ModelError] ${status} ${provider}/${modelId} → next`);
        continue;
      }
      throw err;
    }
  }
  throw lastErr ?? new Error('All models exhausted in ' + chainName + ' chain');
}

const _promptCache = new Map();

function readPrompt(filename) {
  if (_promptCache.has(filename)) return _promptCache.get(filename);
  const content = fs.readFileSync(path.join(PROMPTS_DIR, filename), 'utf8');
  _promptCache.set(filename, content);
  return content;
}

function extractBalanced(text, startChar) {
  const endChar = startChar === '[' ? ']' : '}';
  const idx = text.indexOf(startChar);
  if (idx === -1) return null;
  let depth = 0, inStr = false, escape = false;
  for (let i = idx; i < text.length; i++) {
    const c = text[i];
    if (escape) { escape = false; continue; }
    if (c === '\\' && inStr) { escape = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === startChar) depth++;
    if (c === endChar && --depth === 0) return text.slice(idx, i + 1);
  }
  return null;
}

function tryParseJSON(text) {
  const stripped = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
  try { return { ok: true, data: JSON.parse(stripped) }; } catch { /* expected */ }
  for (const startChar of ['[', '{']) {
    const candidate = extractBalanced(text, startChar);
    if (candidate) {
      try { return { ok: true, data: JSON.parse(candidate) }; } catch { /* expected */ }
    }
  }
  return { ok: false, raw: text };
}

function injectConfig(template, vars) {
  let result = template;
  for (const [key, val] of Object.entries(vars)) {
    const safeVal = String(val).replaceAll('{{', '{ {').replaceAll('}}', '} }');
    result = result.split('{{' + key + '}}').join(safeVal);
  }
  return result;
}

function buildGeneratorPrompt(config) {
  let prompt = readPrompt('system_quiz_generator.txt');
  prompt = injectConfig(prompt, {
    SUBJECT: config.subject || '',
    TYPE: config.type || 'Synthetic Questionnaire',
    YEAR: config.year || new Date().getFullYear().toString(),
    DIFFICULTY: config.difficulty || 'medium',
    QUESTION_COUNT: String(config.questionCount || 40),
    ENABLED_TYPES: Array.isArray(config.enabledTypes) && config.enabledTypes.length
      ? config.enabledTypes.join(',')
      : 'all',
    REQUIREMENTS_CONTEXT: config.requirementsContext || 'Nincs megadva.',
    HAS_IMAGES: config.hasImages ? 'true' : 'false',
    IMAGE_QUESTION_COUNT: String(config.imageQuestionCount || 0),
  });

  try {
    const modifier = readPrompt(`modifiers/difficulty_${config.difficulty || 'medium'}.txt`);
    prompt += '\n\n' + modifier;
  } catch (e) {
    console.warn(`[Prompt] Difficulty modifier not found: difficulty_${config.difficulty}.txt`);
  }

  if (Array.isArray(config.enabledTypes) && config.enabledTypes.length > 0 && config.enabledTypes.length < 5) {
    try {
      let typeRules = readPrompt('modifiers/type_rules.txt');
      typeRules = injectConfig(typeRules, { ENABLED_TYPES: config.enabledTypes.join(',') });
      prompt += '\n\n' + typeRules;
    } catch (e) {
      console.warn('[Prompt] type_rules.txt not found');
    }
  }

  return prompt;
}

async function extractFacts(textChunk, chunkId = '', images = []) {
  const hasImages = Array.isArray(images) && images.length > 0;
  const systemPrompt = hasImages
    ? readPrompt('system_image_fact_extractor.txt')
    : readPrompt('system_fact_extractor.txt');

  const chunkLabel = chunkId ? ` (${chunkId})` : '';
  let userContent;
  if (hasImages) {
    userContent = [
      { type: 'text', text: `Forrás szöveg${chunkLabel}:\n\n${textChunk || '(Nincs szöveges tartalom)'}` },
      ...images.map(img => ({ type: 'image_url', image_url: { url: `data:${img.mimeType};base64,${img.base64}` } })),
    ];
  } else {
    userContent = `Forrás szöveg${chunkLabel}:\n\n${textChunk}`;
  }

  const raw = await callWithChain('standard', systemPrompt, userContent, TOKEN_LIMITS.EXTRACT, {
    needsVision: hasImages,
    temperature: 0,
  });
  const parsed = tryParseJSON(raw);
  if (!parsed.ok) return parsed;
  let facts = parsed.data;
  if (!Array.isArray(facts)) facts = (facts && typeof facts === 'object') ? [facts] : [];
  return { ok: true, data: facts };
}

async function generateQuiz(factsJson, config) {
  const isHard = (config.difficulty || 'medium') === 'hard';
  const chain = isHard ? 'premium' : 'standard';
  const systemPrompt = buildGeneratorPrompt(config);
  const userMessage = `Tények listája:\n${JSON.stringify(factsJson, null, 2)}`;
  const maxTokens = Math.min(TOKEN_LIMITS.GENERATE_MAX, (config.questionCount || 40) * TOKEN_LIMITS.GENERATE_PER_Q + TOKEN_LIMITS.GENERATE_OVERHEAD);
  return callWithChain(chain, systemPrompt, userMessage, maxTokens);
}

async function repairQuestions(questions) {
  const systemPrompt = readPrompt('system_repair_agent.txt');
  const raw = await callWithChain('standard', systemPrompt, `Javítandó kérdéssor (JSON):\n${JSON.stringify(questions)}`, TOKEN_LIMITS.REPAIR, { temperature: 0 });
  return tryParseJSON(raw);
}

module.exports = {
  extractFacts,
  generateQuiz,
  repairQuestions,
  callWithChain,
  tryParseJSON,
};
