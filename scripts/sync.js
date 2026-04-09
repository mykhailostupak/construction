#!/usr/bin/env node
// sync.js — Fetches Google Sheet, translates new jobs via Gemini, writes data/jobs.json

import { createHash } from 'crypto'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// ── Config ────────────────────────────────────────────────────────
const SHEET_ID = process.env.SHEET_ID
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID  // passed from workflow_dispatch input

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`

// Column indices (0-based) matching spec order
const COL = { id:0, active:1, title:2, description:3, type:4, rate:5, rate_type:6, location:7, urgency:8, contact_option:9 }

// ── Helpers ───────────────────────────────────────────────────────
function contentHash(title, description) {
  return createHash('sha256').update(title + description).digest('hex').slice(0, 16)
}

async function fetchSheet() {
  // Google Sheets public CSV export — simpler than API v4 for public sheets
  const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`
  const res = await fetch(csvUrl)
  if (!res.ok) throw new Error(`Sheet fetch failed: HTTP ${res.status}`)
  const csv = await res.text()

  const lines = csv.trim().split('\n')
  // Skip header row (row 0)
  return lines.slice(1).map(line => {
    // Simple CSV parse (handles quoted fields with commas)
    const cols = parseCSVLine(line)
    return {
      id:             (cols[COL.id] || '').trim(),
      active:         (cols[COL.active] || '').trim().toUpperCase() === 'TRUE',
      title:          (cols[COL.title] || '').trim(),
      description:    (cols[COL.description] || '').trim(),
      type:           (cols[COL.type] || '').trim(),
      rate:           `${(cols[COL.rate] || '').trim()} ${(cols[COL.rate_type] || '').trim()}`.trim(),
      location:       (cols[COL.location] || '').trim(),
      urgency:        (cols[COL.urgency] || '').trim(),
      contact_option: (cols[COL.contact_option] || '').trim(),
    }
  }).filter(job => job.id && job.active)
}

function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

async function translateBatch(jobs) {
  if (jobs.length === 0) return []

  const prompt = `Translate the following job listings into Polish (pl), Ukrainian (uk), and Russian (ru).
Return ONLY a JSON array with this exact structure — no markdown, no extra text:
[{"id":"...","title":{"pl":"...","uk":"...","ru":"..."},"description":{"pl":"...","uk":"...","ru":"..."}}]

Jobs to translate:
${JSON.stringify(jobs.map(j => ({ id: j.id, title: j.title, description: j.description })), null, 2)}`

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1 },
    }),
  })

  if (!res.ok) throw new Error(`Gemini API error: HTTP ${res.status}`)

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''

  // Strip any markdown code fences before parsing
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

async function sendTelegramMessage(chatId, text) {
  if (!TELEGRAM_BOT_TOKEN || !chatId) return
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
}

// ── Main ──────────────────────────────────────────────────────────
async function main() {
  let updatedCount = 0
  let translatedCount = 0

  try {
    // 1. Load existing translation cache
    const cacheFile = join(ROOT, 'data', 'translations.json')
    let cache = {}
    try {
      cache = JSON.parse(readFileSync(cacheFile, 'utf8'))
    } catch {
      cache = {}
    }

    // 2. Fetch active jobs from Google Sheet
    const jobs = await fetchSheet()
    updatedCount = jobs.length

    // 3. Find jobs needing (re)translation
    const stale = jobs.filter(job => {
      const hash = contentHash(job.title, job.description)
      return !cache[job.id] || cache[job.id].hash !== hash
    })

    // 4. Batch translate all stale jobs in one Gemini call
    if (stale.length > 0) {
      const translations = await translateBatch(stale)
      translatedCount = stale.length

      // Merge translations into cache
      translations.forEach(t => {
        const hash = contentHash(
          stale.find(j => j.id === t.id)?.title || '',
          stale.find(j => j.id === t.id)?.description || '',
        )
        cache[t.id] = { hash, title: t.title, description: t.description }
      })

      writeFileSync(cacheFile, JSON.stringify(cache, null, 2))
    }

    // 5. Build jobs.json with all language variants
    const output = jobs.map(job => ({
      id:             job.id,
      type:           job.type,
      rate:           job.rate,
      location:       job.location,
      urgency:        job.urgency,
      contact_option: job.contact_option,
      title: {
        en: job.title,
        pl: cache[job.id]?.title?.pl || '',
        uk: cache[job.id]?.title?.uk || '',
        ru: cache[job.id]?.title?.ru || '',
      },
      description: {
        en: job.description,
        pl: cache[job.id]?.description?.pl || '',
        uk: cache[job.id]?.description?.uk || '',
        ru: cache[job.id]?.description?.ru || '',
      },
    }))

    writeFileSync(join(ROOT, 'data', 'jobs.json'), JSON.stringify(output, null, 2))

    console.log(`✅ Sync complete — ${updatedCount} jobs, ${translatedCount} translated`)
    await sendTelegramMessage(
      TELEGRAM_CHAT_ID,
      `✅ Sync complete — ${updatedCount} jobs updated, ${translatedCount} translated.`
    )

  } catch (err) {
    const msg = `❌ Sync failed — ${err.message}. Check Actions log.`
    console.error(msg)
    await sendTelegramMessage(TELEGRAM_CHAT_ID, msg)
    process.exit(1)
  }
}

main()
