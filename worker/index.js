const SITE_URL = 'https://mykhailostupak.github.io/construction/'
const JOBS_JSON_URL = 'https://raw.githubusercontent.com/mykhailostupak/construction/main/data/jobs.json'
const SUPPORTED_LANGS = ['en', 'pl', 'uk', 'ru']

const VIEW_MORE = {
  en: 'View More \u2192',
  pl: 'Zobacz wi\u0119cej \u2192',
  uk: '\u041f\u0435\u0440\u0435\u0433\u043b\u044f\u043d\u0443\u0442\u0438 \u2192',
  ru: '\u041f\u043e\u0434\u0440\u043e\u0431\u043d\u0435\u0435 \u2192',
}

const REDIRECT_TEXT = {
  en: 'Redirecting to site in a few seconds\u2026',
  pl: 'Za chwil\u0119 nast\u0105pi przekierowanie\u2026',
  uk: '\u0427\u0435\u0440\u0435\u0437 \u043a\u0456\u043b\u044c\u043a\u0430 \u0441\u0435\u043a\u0443\u043d\u0434 \u0432\u0456\u0434\u0431\u0443\u0434\u0435\u0442\u044c\u0441\u044f \u043f\u0435\u0440\u0435\u0445\u0456\u0434\u2026',
  ru: '\u0427\u0435\u0440\u0435\u0437 \u043d\u0435\u0441\u043a\u043e\u043b\u044c\u043a\u043e \u0441\u0435\u043a\u0443\u043d\u0434 \u043f\u0440\u043e\u0438\u0437\u043e\u0439\u0434\u0451\u0442 \u043f\u0435\u0440\u0435\u0445\u043e\u0434\u2026',
}

// ── HTML escape ────────────────────────────────────────────────────
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ── OG preview page ────────────────────────────────────────────────
function buildSharePage(job, lang) {
  const title      = job.title[lang]       || job.title['en']
  const description = job.description[lang] || job.description['en']
  const ogTitle    = `${esc(title)} \u2014 ${esc(job.rate)}`
  const ogDesc     = `${esc(description)} \u00b7 \uD83D\uDCCD ${esc(job.location)} \u00b7 ${esc(job.type)} \u00b7 ${esc(job.urgency)}`
  const ogImage    = `${SITE_URL}og-image.png`
  const viewMore   = VIEW_MORE[lang]
  const redirectTxt = REDIRECT_TEXT[lang]

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${ogTitle}</title>

  <!-- Open Graph -->
  <meta property="og:type"        content="website">
  <meta property="og:title"       content="${ogTitle}">
  <meta property="og:description" content="${ogDesc}">
  <meta property="og:url"         content="${SITE_URL}">
  <meta property="og:image"       content="${ogImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name"   content="Construction">

  <!-- Twitter card -->
  <meta name="twitter:card"        content="summary_large_image">
  <meta name="twitter:title"       content="${ogTitle}">
  <meta name="twitter:description" content="${ogDesc}">
  <meta name="twitter:image"       content="${ogImage}">

  <!-- Auto-redirect humans -->
  <meta http-equiv="refresh" content="4;url=${SITE_URL}">

  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #111;
      color: #eee;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      max-width: 520px;
      width: 100%;
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      border-left: 4px solid #f5c518;
      border-radius: 6px;
      padding: 32px;
    }
    .brand {
      color: #f5c518;
      font-size: 11px;
      letter-spacing: 3px;
      text-transform: uppercase;
      font-weight: 700;
      margin-bottom: 16px;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #fff;
      line-height: 1.3;
      margin-bottom: 4px;
    }
    .rate {
      font-size: 18px;
      font-weight: 700;
      color: #f5c518;
      margin-bottom: 12px;
    }
    .meta {
      color: #888;
      font-size: 13px;
      margin-bottom: 16px;
    }
    .desc {
      color: #bbb;
      font-size: 14px;
      line-height: 1.6;
      border-top: 1px solid #2a2a2a;
      padding-top: 16px;
      margin-bottom: 28px;
    }
    .btn {
      display: block;
      width: 100%;
      background: #f5c518;
      color: #111;
      text-decoration: none;
      text-align: center;
      padding: 14px;
      font-weight: 800;
      font-size: 13px;
      letter-spacing: 1px;
      text-transform: uppercase;
      border-radius: 2px;
    }
    .redirect {
      color: #444;
      font-size: 12px;
      text-align: center;
      margin-top: 12px;
    }
  </style>
</head>
<body>
  <div class="card">
    <p class="brand">CONSTRUCTION</p>
    <h1 class="title">${esc(title)}</h1>
    <p class="rate">${esc(job.rate)}</p>
    <p class="meta">\uD83D\uDCCD ${esc(job.location)} &nbsp;&middot;&nbsp; ${esc(job.type)} &nbsp;&middot;&nbsp; ${esc(job.urgency)}</p>
    <p class="desc">${esc(description)}</p>
    <a class="btn" href="${SITE_URL}">${viewMore}</a>
    <p class="redirect">${redirectTxt}</p>
  </div>
</body>
</html>`
}

function buildPositionFilledPage(lang) {
  const safeLang = SUPPORTED_LANGS.includes(lang) ? lang : 'en'
  return Response.redirect(`${SITE_URL}?filled=1&lang=${safeLang}`, 302)
}

// ── Handlers ───────────────────────────────────────────────────────
async function handleShare(jobId, lang) {
  // Sanitise inputs
  if (!/^[a-z0-9-]{1,60}$/.test(jobId)) {
    return new Response('Not Found', { status: 404 })
  }
  const safeLang = SUPPORTED_LANGS.includes(lang) ? lang : 'en'

  let jobs
  try {
    const res = await fetch(JOBS_JSON_URL, {
      headers: { 'User-Agent': 'construction-api-worker' },
      cf: { cacheTtl: 300, cacheEverything: true },
    })
    if (!res.ok) throw new Error(`GitHub responded ${res.status}`)
    jobs = await res.json()
  } catch (err) {
    return new Response('Could not load jobs data', { status: 502 })
  }

  const job = jobs.find(j => j.id === jobId)
  if (!job) return buildPositionFilledPage(lang)

  const html = buildSharePage(job, safeLang)

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

async function handleWebhook(request, env) {
  if (request.method !== 'POST') {
    return new Response('OK', { status: 200 })
  }

  let update
  try {
    update = await request.json()
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  const message = update?.message
  if (!message) return new Response('OK', { status: 200 })

  const chatId  = String(message.chat?.id || '')
  const text    = (message.text || '').trim()
  const userId  = String(message.from?.id || '')

  const allowedUsers = (env.TELEGRAM_ALLOWED_USERS || '').split(',').map(s => s.trim())
  if (!allowedUsers.includes(userId)) {
    return new Response('OK', { status: 200 })
  }

  if (text === '/sync') {
    await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, '\u23F3 Sync started...')

    const ghRes = await fetch(
      `https://api.github.com/repos/${env.GH_REPO}/actions/workflows/sync-jobs.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.GH_PAT}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
          'User-Agent': 'construction-api-worker',
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: { telegram_chat_id: chatId },
        }),
      }
    )

    if (!ghRes.ok) {
      const errText = await ghRes.text()
      await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, `\u274C Could not trigger sync: ${errText}`)
    }
  }

  return new Response('OK', { status: 200 })
}

async function sendTelegramMessage(botToken, chatId, text) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
}

// ── Router ─────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const url   = new URL(request.url)
    const path  = url.pathname

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        },
      })
    }

    // GET /share/:jobId?lang=xx
    const shareMatch = path.match(/^\/share\/([^/]+)$/)
    if (request.method === 'GET' && shareMatch) {
      const jobId = shareMatch[1]
      const lang  = url.searchParams.get('lang') || 'en'
      return handleShare(jobId, lang)
    }

    // POST /webhook  (Telegram bot)
    if (path === '/webhook') {
      return handleWebhook(request, env)
    }

    return new Response('Not Found', { status: 404 })
  },
}
