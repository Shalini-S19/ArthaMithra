
const translations = {
  en: {
    welcome: "Your Money, Your Future.",
    subtitle: "Learn, save and grow with ArthaMitra.",
    feature1: "💰 Track your income and expenses",
    feature2: "🎯 Plan your savings goals",
    feature3: "🏛️ Discover government schemes",
    feature4: "🔔 Stay updated with reminders",
    login: "Login",
    register: "Register",
    welcomeBack: "Welcome Back!",
    mobile: "Mobile Number",
    mobilePlaceholder: "10-digit mobile number",
    pin: "4-digit PIN",
    pinPlaceholder: "Enter PIN",
    createAccount: "Create Account",
    fullName: "Full Name",
    namePlaceholder: "Your name",
    createPin: "Create 4-digit PIN",
    createPinPlaceholder: "Create PIN",
    language: "Language",
    age: "Age",
    agePlaceholder: "Your age",
    gender: "Gender",
    select: "Select",
    female: "Female",
    male: "Male",
    other: "Other",
    preferNot: "Prefer not to say",
    bank: "Do you have a bank account?",
    insurance: "Do you have insurance?"
  },
  kn: {
    welcome: "ನಿಮ್ಮ ಹಣ, ನಿಮ್ಮ ಭವಿಷ್ಯ.",
    subtitle: "ಅರ್ಥಮಿತ್ರದೊಂದಿಗೆ ಕಲಿಯಿರಿ, ಉಳಿಸಿ ಮತ್ತು ಬೆಳೆಯಿರಿ.",
    feature1: "💰 ನಿಮ್ಮ ಆದಾಯ ಮತ್ತು ವೆಚ್ಚಗಳನ್ನು ದಾಖಲಿಸಿ",
    feature2: "🎯 ನಿಮ್ಮ ಉಳಿತಾಯದ ಗುರಿಗಳನ್ನು ಯೋಜಿಸಿ",
    feature3: "🏛️ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳನ್ನು ಅನ್ವೇಷಿಸಿ",
    feature4: "🔔 ಜ್ಞಾಪನೆಗಳ ಮೂಲಕ ನವೀಕರಣಗಳನ್ನು ಪಡೆಯಿರಿ",
    login: "ಲಾಗಿನ್",
    register: "ನೋಂದಣಿ",
    welcomeBack: "ಮತ್ತೆ ಸ್ವಾಗತ!",
    mobile: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ",
    mobilePlaceholder: "10 ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ",
    pin: "4 ಅಂಕಿಯ ಪಿನ್",
    pinPlaceholder: "ಪಿನ್ ನಮೂದಿಸಿ",
    createAccount: "ಖಾತೆ ರಚಿಸಿ",
    fullName: "ಪೂರ್ಣ ಹೆಸರು",
    namePlaceholder: "ನಿಮ್ಮ ಹೆಸರು",
    createPin: "4 ಅಂಕಿಯ ಪಿನ್ ರಚಿಸಿ",
    createPinPlaceholder: "ಪಿನ್ ರಚಿಸಿ",
    language: "ಭಾಷೆ",
    age: "ವಯಸ್ಸು",
    agePlaceholder: "ನಿಮ್ಮ ವಯಸ್ಸು",
    gender: "ಲಿಂಗ",
    select: "ಆಯ್ಕೆಮಾಡಿ",
    female: "ಮಹಿಳೆ",
    male: "ಪುರುಷ",
    other: "ಇತರೆ",
    preferNot: "ಹೇಳಲು ಇಷ್ಟವಿಲ್ಲ",
    bank: "ನಿಮ್ಮಲ್ಲಿ ಬ್ಯಾಂಕ್ ಖಾತೆ ಇದೆಯೇ?",
    insurance: "ನಿಮ್ಮಲ್ಲಿ ವಿಮೆ ಇದೆಯೇ?"
  }
};

const translationsMap = {
  "welcome": "welcome",
  "subtitle": "subtitle",
  "feature1": "feature1",
  "feature2": "feature2",
  "feature3": "feature3",
  "feature4": "feature4",
  "login": "login",
  "register": "register",
  "welcomeBack": "welcomeBack",
  "mobile": "mobile",
  "pin": "pin",
  "createAccount": "createAccount",
  "fullName": "fullName",
  "createPin": "createPin",
  "language": "language",
  "age": "age",
  "gender": "gender",
  "bank": "bank",
  "insurance": "insurance"
};

function applyLanguage(lang) {
  const dictionary = translations[lang] || translations.en;
  document.documentElement.lang = lang;

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    if (dictionary[key]) el.textContent = dictionary[key];
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (dictionary[key]) el.placeholder = dictionary[key];
  });

  document.querySelectorAll("[data-i18n-option]").forEach(el => {
    const key = el.dataset.i18nOption;
    if (dictionary[key]) el.textContent = dictionary[key];
  });

  try {
    localStorage.setItem("lang", lang);
  } catch (error) {
    console.warn("Language preference could not be saved.");
  }
}

async function setLang(lang) {
  applyLanguage(lang);
}

function t(key) {
  const lang = localStorage.getItem("lang") || "en";
  return translations[lang]?.[key] || translations.en[key] || key;
}

document.addEventListener("DOMContentLoaded", () => {
  let savedLanguage = "en";

  try {
    savedLanguage = localStorage.getItem("lang") || "en";
  } catch (error) {}

  applyLanguage(savedLanguage);
});
