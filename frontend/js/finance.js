
"use strict";

const financeForm = document.getElementById("financeForm");
const financeMessage = document.getElementById("financeMessage");
const dateInput = document.getElementById("date");
const entryType = document.getElementById("entryType");
const entriesList = document.getElementById("entriesList");

const params = new URLSearchParams(window.location.search);
const selectedType = params.get("type");

if (
    selectedType === "income" ||
    selectedType === "expense"
) {
    entryType.value = selectedType;
}

let savedEntries = [];

const EDIT_STORAGE_KEY = "arthamithra_transaction_edits_v1";

// Translation helper
function translate(key, fallback) {
    if (typeof t === "function") {
        const translated = t(key);

        if (translated && translated !== key) {
            return translated;
        }
    }

    return fallback;
}

// Today's date
function getTodayDate() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

dateInput.value = getTodayDate();

function formatMoney(amount) {
    return "₹" + Number(amount || 0).toLocaleString("en-IN");
}

// Safe HTML
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

// Category translation
function translateCategory(category) {
    const categories = {
        Salary: "salary",
        Business: "business",
        Agriculture: "agriculture",
        Food: "food",
        Transport: "transport",
        Education: "education",
        Healthcare: "healthcare",
        Shopping: "shopping",
        Bills: "bills",
        Other: "other"
    };

    const key = categories[category];

    if (key) {
        return translate("finance." + key, category);
    }

    return category || translate("finance.other", "Other");
}

// Browser storage helpers
function getStoredEdits() {
    try {
        return JSON.parse(
            localStorage.getItem(EDIT_STORAGE_KEY) || "{}"
        );
    } catch (error) {
        console.error("Unable to read saved edits:", error);
        return {};
    }
}

function saveStoredEdits(edits) {
    localStorage.setItem(
        EDIT_STORAGE_KEY,
        JSON.stringify(edits)
    );
}

// Apply browser-only edits to loaded transactions
function applyStoredEdits(entries) {
    const edits = getStoredEdits();

    return entries.map(entry => {
        const id = String(entry.id ?? "");

        if (!id || !edits[id]) {
            return entry;
        }

        return {
            ...entry,
            ...edits[id]
        };
    });
}

// Display transaction history
function renderEntries() {
    entriesList.replaceChildren();

    if (savedEntries.length === 0) {
        entriesList.textContent = translate(
            "finance.empty",
            "No transactions recorded yet."
        );
        return;
    }

    savedEntries.forEach(entry => {
        const card = document.createElement("div");

        card.style.padding = "15px";
        card.style.marginBottom = "12px";
        card.style.border = "1px solid #dce9e0";
        card.style.borderRadius = "12px";
        card.style.background = "#ffffff";

        const title = document.createElement("h3");

        const typeText = entry.type === "income"
            ? translate("finance.income", "Income")
            : translate("finance.expense", "Expense");

        const icon = entry.type === "income" ? "💰" : "💸";

        title.textContent =
            icon + " " + typeText + " - " +
            translateCategory(entry.category);

        title.style.color =
            entry.type === "income" ? "#176b4b" : "#b42318";

        const amount = document.createElement("p");
        amount.textContent = formatMoney(entry.amount);

        const note = document.createElement("p");
        note.textContent = entry.note || "";

        const date = document.createElement("small");
        date.textContent = entry.date || "";

        const editButton = document.createElement("button");

        editButton.type = "button";
        editButton.textContent = translate(
            "finance.edit",
            "✏️ Edit"
        );

        editButton.style.marginTop = "12px";
        editButton.style.padding = "8px 18px";
        editButton.style.background = "#176b4b";
        editButton.style.color = "#ffffff";
        editButton.style.border = "none";
        editButton.style.borderRadius = "8px";
        editButton.style.cursor = "pointer";

        if (entry.id === undefined || entry.id === null) {
            editButton.disabled = true;
            editButton.title = "Transaction ID unavailable";
        } else {
            editButton.dataset.entryId = String(entry.id);
            editButton.addEventListener("click", function() {
                editTransaction(entry.id);
            });
        }

        card.append(
            title,
            amount,
            note,
            date,
            editButton
        );

        entriesList.appendChild(card);
    });
}

// Load transaction history
async function loadEntries() {
    entriesList.textContent = translate(
        "finance.loading",
        "Loading transactions..."
    );

    try {
        const result = await api(
            "GET",
            "/api/entries?days=3650"
        );

        const entries = Array.isArray(result)
            ? result
            : (Array.isArray(result.entries) ? result.entries : []);

        savedEntries = applyStoredEdits(entries);

        renderEntries();

    } catch (error) {
        console.error("Load transactions error:", error);

        entriesList.textContent = translate(
            "finance.load_error",
            "Unable to load transactions."
        );
    }
}

// Edit existing transaction (browser only)
function editTransaction(entryId) {
    const entry = savedEntries.find(
        item => String(item.id) === String(entryId)
    );

    if (!entry) return;

    const newAmountInput = prompt(
        translate("finance.edit_amount", "Enter new amount:"),
        entry.amount
    );

    if (newAmountInput === null) return;

    const newAmount = Number(newAmountInput);

    if (!Number.isFinite(newAmount) || newAmount <= 0) {
        alert(
            translate(
                "finance.invalid_amount",
                "Please enter a valid amount."
            )
        );
        return;
    }

    const newCategory = prompt(
        translate("finance.edit_category", "Enter category:"),
        entry.category || "Other"
    );

    if (newCategory === null) return;

    if (!newCategory.trim()) {
        alert("Category cannot be empty.");
        return;
    }

    const newNote = prompt(
        translate("finance.edit_note", "Enter note:"),
        entry.note || ""
    );

    if (newNote === null) return;

    const newDate = prompt(
        translate(
            "finance.edit_date",
            "Enter date (YYYY-MM-DD):"
        ),
        entry.date || getTodayDate()
    );

    if (newDate === null) return;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
        alert("Please enter the date in YYYY-MM-DD format.");
        return;
    }

    const parsedDate = new Date(newDate + "T00:00:00");

    if (
        Number.isNaN(parsedDate.getTime()) ||
        parsedDate.toISOString().slice(0, 10) !== newDate
    ) {
        alert("Please enter a valid date.");
        return;
    }

    const updatedEntry = {
        amount: newAmount,
        category: newCategory.trim(),
        note: newNote.trim(),
        date: newDate
    };

    const edits = getStoredEdits();

    edits[String(entryId)] = updatedEntry;

    try {
        saveStoredEdits(edits);

        savedEntries = savedEntries.map(item =>
            String(item.id) === String(entryId)
                ? { ...item, ...updatedEntry }
                : item
        );

        renderEntries();

        financeMessage.textContent = translate(
            "finance.edit_success",
            "Transaction updated in this browser! 🎉"
        );

        financeMessage.style.color = "#176b4b";

    } catch (error) {
        console.error("Save edit error:", error);

        alert(
            "Unable to save this edit in browser storage."
        );
    }
}

// Save income or expense
financeForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const type = entryType.value;
    const amount = Number(
        document.getElementById("amount").value
    );

    const category =
        document.getElementById("category").value;

    const note =
        document.getElementById("note").value.trim();

    const date = dateInput.value;

    if (!Number.isFinite(amount) || amount <= 0) {
        financeMessage.textContent = translate(
            "finance.invalid_amount",
            "Please enter an amount greater than zero."
        );

        financeMessage.style.color = "#b42318";
        return;
    }

    try {
        financeMessage.textContent = translate(
            "finance.saving",
            "Saving transaction..."
        );

        financeMessage.style.color = "#176b4b";

        await api("POST", "/api/entries", {
            type: type,
            amount: amount,
            category: category,
            note: note,
            date: date
        });

        financeMessage.textContent = translate(
            "finance.save_success",
            "Transaction saved successfully! 🎉"
        );

        financeMessage.style.color = "#176b4b";

        financeForm.reset();

        dateInput.value = getTodayDate();
        entryType.value = type;

        await loadEntries();

    } catch (error) {
        console.error("Save transaction error:", error);

        financeMessage.textContent = translate(
            "finance.save_error",
            error.message || "Unable to save transaction."
        );

        financeMessage.style.color = "#b42318";
    }
});

// Refresh history when language changes
document.addEventListener("languageChanged", function() {
    renderEntries();
});

// Load transactions when page opens
loadEntries();
