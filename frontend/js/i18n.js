
let strings = {};
let currentLang = "en";

// Change application language
async function setLang(lang) {
    try {
        const response = await fetch(`/i18n/${lang}.json`);

        if (!response.ok) {
            throw new Error("Translation file not found");
        }

        const translations = await response.json();

        strings = translations;
        currentLang = lang;

        // Update page language
        document.documentElement.lang = lang;

        // Translate normal text
        document.querySelectorAll("[data-i18n]").forEach(el => {
            const value = lookup(el.dataset.i18n);

            if (value !== undefined) {
                el.textContent = value;
            }
        });

        // Translate placeholders
        document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
            const value = lookup(el.dataset.i18nPlaceholder);

            if (value !== undefined) {
                el.placeholder = value;
            }
        });

        // Translate dropdown options
        document.querySelectorAll("[data-i18n-option]").forEach(el => {
            const value = lookup(el.dataset.i18nOption);

            if (value !== undefined) {
                el.textContent = value;
            }
        });

        // Keep language selector updated
        const selector = document.getElementById("dashboardLanguage");

        if (selector) {
            selector.value = lang;
        }

        // Remember selected language
        localStorage.setItem("lang", lang);

        // Notify other JavaScript files
        document.dispatchEvent(
            new CustomEvent("languageChanged", {
                detail: { lang: lang }
            })
        );

        console.log("Language changed to:", lang);

    } catch (error) {
        console.error("Language error:", error);
        alert("Unable to load language. Please try again.");
    }
}

// Find translated text using nested keys
function lookup(path) {
    return path.split(".").reduce(
        (obj, key) => obj?.[key],
        strings
    );
}

// Get translated text
function t(path) {
    return lookup(path) || path;
}

// Get current language
function getCurrentLanguage() {
    return currentLang;
}

// Load saved language when page opens
document.addEventListener("DOMContentLoaded", () => {
    const savedLang = localStorage.getItem("lang") || "en";

    setLang(savedLang);
});
