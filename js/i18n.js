const LANG_MAP = {
  en: LANG_EN,
  pl: LANG_PL,
  uk: LANG_UK,
  ru: LANG_RU,
}

const SUPPORTED_LANGS = Object.keys(LANG_MAP)
const DEFAULT_LANG = 'en'

let currentLang = DEFAULT_LANG

function t(key) {
  const dict = LANG_MAP[currentLang]
  const value = dict[key]
  // Fall back to English if key is missing or empty in current lang
  if (!value && currentLang !== DEFAULT_LANG) {
    return LANG_MAP[DEFAULT_LANG][key] || key
  }
  return value || key
}

function applyStringsToDOM() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n')
    el.textContent = t(key)
  })
  document.title = t('page_title')
}

function switchLanguage(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return

  currentLang = lang
  localStorage.setItem('lang', lang)

  // Update active button state
  document.querySelectorAll('.lang-btn').forEach(btn => {
    const isActive = btn.dataset.lang === lang
    btn.classList.toggle('lang-btn--active', isActive)
    btn.setAttribute('aria-pressed', String(isActive))
  })

  applyStringsToDOM()

  // Re-render job cards in new language (renderJobCards is defined in jobs.js)
  if (typeof renderJobCards === 'function') {
    renderJobCards()
  }
}

function initI18n() {
  const saved = localStorage.getItem('lang')
  const preferred = SUPPORTED_LANGS.includes(saved) ? saved : DEFAULT_LANG
  switchLanguage(preferred)

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => switchLanguage(btn.dataset.lang))
  })
}

initI18n()
