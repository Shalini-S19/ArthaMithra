
let strings = {};
let currentLang = "en";

async function setLang(lang) {
  try {
    const response = await fetch(`/i18n/${lang}.json`);

    if (!response.ok) {
      throw new Error("Translation file not found");
    }

    strings = await response.json();
    currentLang = lang;

    document.documentElement.lang = lang;

    document.querySelectorAll("[data-i18n]").forEach(el => {
      const value = lookup(el.dataset.i18n);
      if (value !== undefined) el.textContent = value;
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      const value = lookup(el.dataset.i18nPlaceholder);
      if (value !== undefined) el.placeholder = value;
    });

    document.querySelectorAll("[data-i18n-option]").forEach(el => {
      const value = lookup(el.dataset.i18nOption);
      if (value !== undefined) el.textContent = value;
    });

    localStorage.setItem("lang", lang);

  } catch (error) {
    console.error("Language error:", error);
    alert("Unable to load language. Please try again.");
  }
}

function lookup(path) {
  return path.split(".").reduce(
    (obj, key) => obj?.[key],
    strings
  );
}

function t(path) {
  return lookup(path) || path;
}

document.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("lang") || "en";
  setLang(savedLang);
});
