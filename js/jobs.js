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
      <div class="job-card__apply-wrapper">
        <button class="apply-btn" data-job-id="${job.id}">${t('apply_btn')}</button>
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
