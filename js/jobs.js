let allJobs = []

// ── Contact block builder ──────────────────────────────────────────
function buildContactBlock(contactOption) {
  const items = []

  if (contactOption === 'phone' || contactOption === 'phone+email') {
    items.push(`
      <div class="modal__contact-item">
        <span class="modal__contact-label">${t('modal_call')}:</span>
        <span class="modal__contact-value">${escapeHTML(CONFIG.phone)}</span>
      </div>
    `)
  }

  if (contactOption === 'email' || contactOption === 'phone+email') {
    items.push(`
      <div class="modal__contact-item">
        <span class="modal__contact-label">${t('modal_email')}:</span>
        <span class="modal__contact-value">${escapeHTML(CONFIG.email)}</span>
      </div>
    `)
  }

  return items.join('')
}

// ── Job card renderer ──────────────────────────────────────────────
function buildJobCardHTML(job) {
  const title = job.title[currentLang] || job.title['en']
  const description = job.description[currentLang] || job.description['en']
  const shareDisabled = !CONFIG.workerUrl ? ' hidden' : ''

  return `
    <article class="job-card job-card--${job.type}" role="listitem" data-job-id="${job.id}">
      <div class="job-card__header">
        <h2 class="job-card__title">${escapeHTML(title)}</h2>
        <span class="job-card__rate">${escapeHTML(job.rate)}</span>
      </div>
      <p class="job-card__meta">
        📍 ${escapeHTML(job.location)} &nbsp;·&nbsp; ${escapeHTML(job.type)} &nbsp;·&nbsp; ${escapeHTML(job.urgency)}
      </p>
      <p class="job-card__description">${escapeHTML(description)}</p>
      <div class="job-card__actions">
        <button class="apply-btn" data-job-id="${job.id}">${t('apply_btn')}</button>
        <button class="share-btn${shareDisabled}" data-job-id="${job.id}" aria-label="${t('share_btn')}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          ${t('share_btn')}
        </button>
      </div>
    </article>
  `
}

function buildEmptyStateHTML() {
  return `
    <div class="jobs__empty">
      <div class="jobs__empty-icon">🔧</div>
      <p class="jobs__empty-title">${t('no_jobs_title')}</p>
      <p class="jobs__empty-sub">${t('no_jobs_sub')}</p>
    </div>
  `
}

function renderJobCards() {
  const grid = document.getElementById('jobs-grid')
  if (!grid) return

  if (allJobs.length === 0) {
    grid.innerHTML = buildEmptyStateHTML()
    return
  }

  grid.innerHTML = allJobs.map(buildJobCardHTML).join('')

  // Attach apply button listeners
  grid.querySelectorAll('.apply-btn').forEach(btn => {
    btn.addEventListener('click', () => openApplyModal(btn.dataset.jobId))
  })

  // Attach share button listeners
  grid.querySelectorAll('.share-btn').forEach(btn => {
    btn.addEventListener('click', () => shareJob(btn.dataset.jobId))
  })
}

// ── Share ──────────────────────────────────────────────────────────
function shareJob(jobId) {
  const job = allJobs.find(j => j.id === jobId)
  if (!job || !CONFIG.workerUrl) return

  const shareUrl = `${CONFIG.workerUrl}/share/${jobId}?lang=${currentLang}`
  const title = job.title[currentLang] || job.title['en']

  if (navigator.share) {
    navigator.share({ title, url: shareUrl }).catch(() => {})
  } else {
    navigator.clipboard.writeText(shareUrl)
      .then(() => showToast(t('share_copied')))
      .catch(() => {
        // Fallback for older browsers
        const ta = document.createElement('textarea')
        ta.value = shareUrl
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        showToast(t('share_copied'))
      })
  }
}

function showToast(message) {
  const toast = document.getElementById('toast')
  if (!toast) return
  toast.textContent = message
  toast.classList.add('toast--visible')
  setTimeout(() => toast.classList.remove('toast--visible'), 2500)
}

// ── Modal ──────────────────────────────────────────────────────────
function openApplyModal(jobId) {
  const job = allJobs.find(j => j.id === jobId)
  if (!job) return

  const title = job.title[currentLang] || job.title['en']
  const description = job.description[currentLang] || job.description['en']

  document.getElementById('modal-title').textContent = title
  document.getElementById('modal-description').textContent = description
  document.getElementById('modal-contact').innerHTML = buildContactBlock(job.contact_option)

  const overlay = document.getElementById('modal-overlay')
  overlay.classList.add('modal-overlay--visible')
  document.body.style.overflow = 'hidden'

  // Focus the close button for accessibility
  document.getElementById('modal-close').focus()
}

function closeApplyModal() {
  const overlay = document.getElementById('modal-overlay')
  overlay.classList.remove('modal-overlay--visible')
  document.body.style.overflow = ''
}

// ── Data fetching ──────────────────────────────────────────────────
async function fetchJobs() {
  try {
    const response = await fetch(CONFIG.jobsDataUrl)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const jobs = await response.json()
    if (!Array.isArray(jobs)) throw new Error('Invalid jobs data format')
    allJobs = jobs
  } catch (err) {
    console.error('Failed to fetch jobs:', err)
    allJobs = []
    const grid = document.getElementById('jobs-grid')
    if (grid) {
      grid.innerHTML = `<p style="color:var(--color-text-muted);grid-column:1/-1;text-align:center;padding:32px">${t('error_load')}</p>`
    }
  }
}

// ── Footer contact ─────────────────────────────────────────────────
function renderFooterContact() {
  const el = document.getElementById('footer-contact')
  if (!el) return
  el.innerHTML = `
    <span>${t('footer_phone')}: ${escapeHTML(CONFIG.phone)}</span><br>
    <span>${t('footer_email')}: ${escapeHTML(CONFIG.email)}</span>
  `
}

// ── Utility ───────────────────────────────────────────────────────
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ── Init ──────────────────────────────────────────────────────────
async function initJobs() {
  // Footer year
  const yearEl = document.getElementById('footer-year')
  if (yearEl) yearEl.textContent = new Date().getFullYear()

  renderFooterContact()
  await fetchJobs()
  renderJobCards()

  // Show toast if redirected from a filled position
  const params = new URLSearchParams(window.location.search)
  if (params.get('filled') === '1') {
    // Apply language from URL param if provided (overrides localStorage)
    const urlLang = params.get('lang')
    if (urlLang && typeof switchLanguage === 'function') {
      switchLanguage(urlLang)
    }
    showToast(t('job_filled'))
    // Clean params from URL without reloading
    const clean = window.location.pathname + window.location.hash
    history.replaceState(null, '', clean)
  }

  // Modal close handlers
  document.getElementById('modal-close').addEventListener('click', closeApplyModal)
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeApplyModal()
  })
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeApplyModal()
  })
}

initJobs()
