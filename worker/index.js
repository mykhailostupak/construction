export default {
  async fetch(request, env) {
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

    const chatId = String(message.chat?.id || '')
    const text = (message.text || '').trim()
    const userId = String(message.from?.id || '')

    // Validate user is allowed
    const allowedUsers = (env.TELEGRAM_ALLOWED_USERS || '').split(',').map(s => s.trim())
    if (!allowedUsers.includes(userId)) {
      return new Response('OK', { status: 200 })
    }

    if (text === '/sync') {
      // Acknowledge immediately
      await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, '⏳ Sync started...')

      // Trigger GitHub Actions workflow_dispatch
      const ghRes = await fetch(
        `https://api.github.com/repos/${env.GH_REPO}/actions/workflows/sync-jobs.yml/dispatches`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.GH_PAT}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ref: 'main',
            inputs: { telegram_chat_id: chatId },
          }),
        }
      )

      if (!ghRes.ok) {
        const errText = await ghRes.text()
        await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, `❌ Could not trigger sync: ${errText}`)
      }
    }

    return new Response('OK', { status: 200 })
  },
}

async function sendTelegramMessage(botToken, chatId, text) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
}
