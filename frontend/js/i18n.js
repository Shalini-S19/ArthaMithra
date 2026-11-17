
let strings = {};
let currentLang = localStorage.getItem("lang") || "en";

function lookup(path) {
    return path.split(".").reduce(
        (obj, key) => obj?.[key],
        strings
    );
}

function t(path, fallback = "") {
    const value = lookup(path);
    return value !== undefined && value !== null
        ? value
        : (fallback || path);
}

async function setLang(lang) {
    if (!["en", "kn"].includes(lang)) {
        lang = "en";
    }

    try {
        const response = await fetch(`/i18n/${lang}.json`);

        if (!response.ok) {
            throw new Error("Translation file not found");
        }

        const translations = await response.json();

        strings = translations;
        currentLang = lang;

        document.documentElement.lang = lang;

        document.querySelectorAll("[data-i18n]").forEach(el => {
            const value = t(el.dataset.i18n);

            if (value !== el.dataset.i18n) {
                el.textContent = value;
            }
        });

        document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
            el.placeholder = t(el.dataset.i18nPlaceholder);
        });

        document.querySelectorAll("[data-i18n-option]").forEach(el => {
            el.textContent = t(el.dataset.i18nOption);
        });

        document.querySelectorAll("[data-i18n-title]").forEach(el => {
            el.title = t(el.dataset.i18nTitle);
        });

        document.querySelectorAll("[data-i18n-value]").forEach(el => {
            el.value = t(el.dataset.i18nValue);
        });

        document.querySelectorAll("[data-language-selector]").forEach(selector => {
            selector.value = lang;
        });

        const dashboardSelector = document.getElementById("dashboardLanguage");

        if (dashboardSelector) {
            dashboardSelector.value = lang;
        }

        const financeSelector = document.getElementById("financeLanguage");

        if (financeSelector) {
            financeSelector.value = lang;
        }

        localStorage.setItem("lang", lang);

        document.dispatchEvent(
            new CustomEvent("languageChanged", {
                detail: { lang }
            })
        );

        console.log("Language changed to:", lang);

    } catch (error) {
        console.error("Language error:", error);
        alert("Unable to load language. Please try again.");
    }
}

function getCurrentLanguage() {
    return currentLang;
}

async function initializeLanguage() {
    const savedLang = localStorage.getItem("lang") || "en";
    await setLang(savedLang);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeLanguage);
} else {
    initializeLanguage();
}
