// Swaps text for every element with data-i18n="section.key". Usage: await setLang('kn')
let strings = {};
function lookup(path) { return path.split('.').reduce((o, k) => (o ? o[k] : undefined), strings); }

async function setLang(lang) {
  const res = await fetch(`/i18n/${lang}.json`);
  strings = await res.json();
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const t = lookup(el.dataset.i18n);
    if (t) el.textContent = t;
  });
  try { localStorage.setItem('lang', lang); } catch (e) {}
}
const t = path => lookup(path) || path;
