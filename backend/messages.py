"""All user-facing text from the backend, in English and Kannada.

Kannada here is a DRAFT: a Kannada speaker should read it once (see kn_reviewed in schemes.json).
"""

# error code -> (English, Kannada)
MESSAGES = {
    "login_required":      ("Please log in", "ದಯವಿಟ್ಟು ಲಾಗಿನ್ ಮಾಡಿ"),
    "name_required":       ("Name is required", "ಹೆಸರು ಬೇಕು"),
    "phone_invalid":       ("Enter a 10-digit phone number", "10 ಅಂಕಿಯ ಫೋನ್ ನಂಬರ್ ಹಾಕಿ"),
    "pin_invalid":         ("PIN must be exactly 4 digits", "ಪಿನ್ ಸರಿಯಾಗಿ 4 ಅಂಕಿಗಳಿರಬೇಕು"),
    "lang_invalid":        ("Language must be 'en' or 'kn'", "ಭಾಷೆ 'en' ಅಥವಾ 'kn' ಆಗಿರಬೇಕು"),
    "age_invalid":         ("Enter a valid age", "ಸರಿಯಾದ ವಯಸ್ಸು ಹಾಕಿ"),
    "gender_invalid":      ("Invalid gender value", "ಲಿಂಗದ ಮೌಲ್ಯ ತಪ್ಪಾಗಿದೆ"),
    "phone_taken":         ("This phone number is already registered", "ಈ ಫೋನ್ ನಂಬರ್ ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಲಾಗಿದೆ"),
    "login_failed":        ("Wrong phone number or PIN", "ಫೋನ್ ನಂಬರ್ ಅಥವಾ ಪಿನ್ ತಪ್ಪಾಗಿದೆ"),
    "nothing_to_update":   ("Nothing to update", "ಬದಲಾಯಿಸಲು ಏನೂ ಇಲ್ಲ"),
    "entry_type_invalid":  ("Type must be 'income' or 'expense'", "ಪ್ರಕಾರ 'income' ಅಥವಾ 'expense' ಆಗಿರಬೇಕು"),
    "amount_not_number":   ("Amount must be a number", "ಮೊತ್ತ ಸಂಖ್ಯೆ ಆಗಿರಬೇಕು"),
    "amount_positive":     ("Amount must be greater than 0", "ಮೊತ್ತ 0 ಕ್ಕಿಂತ ಹೆಚ್ಚಿರಬೇಕು"),
    "date_invalid":        ("Date must be YYYY-MM-DD", "ದಿನಾಂಕ YYYY-MM-DD ರೂಪದಲ್ಲಿರಬೇಕು"),
    "unknown_scheme":      ("Scheme not found", "ಈ ಯೋಜನೆ ಸಿಗಲಿಲ್ಲ"),
    "goal_title_required": ("Goal title is required", "ಗುರಿಯ ಹೆಸರು ಬೇಕು"),
    "target_not_number":   ("Target must be a number", "ಗುರಿ ಮೊತ್ತ ಸಂಖ್ಯೆ ಆಗಿರಬೇಕು"),
    "target_positive":     ("Target must be greater than 0", "ಗುರಿ ಮೊತ್ತ 0 ಕ್ಕಿಂತ ಹೆಚ್ಚಿರಬೇಕು"),
    "deadline_invalid":    ("Deadline must be YYYY-MM-DD", "ಕೊನೆಯ ದಿನಾಂಕ YYYY-MM-DD ರೂಪದಲ್ಲಿರಬೇಕು"),
    "goal_not_found":      ("Goal not found", "ಗುರಿ ಸಿಗಲಿಲ್ಲ"),
}

INCOME_NOTE = {
    "en": "No income logged in the last 30 days, so income rules were not applied.",
    "kn": "ಕಳೆದ 30 ದಿನಗಳಲ್ಲಿ ಗಳಿಕೆ ಬರೆದಿಲ್ಲ, ಆದ್ದರಿಂದ ಆದಾಯದ ನಿಯಮಗಳನ್ನು ಬಳಸಿಲ್ಲ.",
}

# health score tips
TIPS = {
    "save_more":     {"en": "Try to save a little more each week.", "kn": "ಪ್ರತಿ ವಾರ ಸ್ವಲ್ಪ ಹೆಚ್ಚು ಉಳಿಸಲು ಪ್ರಯತ್ನಿಸಿ."},
    "log_more_days": {"en": "Write down your earning and spending every day.", "kn": "ಪ್ರತಿದಿನ ನಿಮ್ಮ ಗಳಿಕೆ ಮತ್ತು ಖರ್ಚು ಬರೆದಿಡಿ."},
    "apply_schemes": {"en": "Apply for the schemes you qualify for.", "kn": "ನೀವು ಅರ್ಹರಾದ ಯೋಜನೆಗಳಿಗೆ ಅರ್ಜಿ ಹಾಕಿ."},
    "great":         {"en": "Great work! Keep it up.", "kn": "ತುಂಬಾ ಒಳ್ಳೆಯದು! ಹೀಗೇ ಮುಂದುವರಿಸಿ."},
}

# scheme category names
CATEGORY_LABELS = {
    "insurance": {"en": "Insurance", "kn": "ವಿಮೆ"},
    "pension":   {"en": "Pension",   "kn": "ಪಿಂಚಣಿ"},
    "health":    {"en": "Health",    "kn": "ಆರೋಗ್ಯ"},
    "welfare":   {"en": "Welfare",   "kn": "ಕಲ್ಯಾಣ"},
}


def localize(obj, lang):
    """Turn every {"en": ..., "kn": ...} pair inside obj into one string in `lang`.
    If the Kannada is missing or still a TODO, fall back to English."""
    if isinstance(obj, dict):
        if set(obj.keys()) == {"en", "kn"}:
            text = obj.get(lang)
            return text if text and text != "TODO" else obj["en"]
        return {k: localize(v, lang) for k, v in obj.items()}
    if isinstance(obj, list):
        return [localize(x, lang) for x in obj]
    return obj
