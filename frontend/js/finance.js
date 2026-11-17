
const financeForm = document.getElementById("financeForm");
const financeMessage = document.getElementById("financeMessage");
const dateInput = document.getElementById("date");
const entryType = document.getElementById("entryType");
const entriesList = document.getElementById("entriesList");

// Select transaction type from dashboard
const params = new URLSearchParams(window.location.search);
const selectedType = params.get("type");

if (selectedType === "income" || selectedType === "expense") {
    entryType.value = selectedType;
}

// Set today's date
dateInput.value = new Date().toLocaleDateString("en-CA");

function formatMoney(amount) {
    return "₹" + Number(amount || 0).toLocaleString("en-IN");
}

// Load transaction history
async function loadEntries() {
    entriesList.textContent = "Loading transactions...";

    try {
        const result = await api("GET", "/api/entries?days=3650");
        const entries = result.entries || [];

        entriesList.replaceChildren();

        if (entries.length === 0) {
            entriesList.textContent = "No transactions found yet.";
            return;
        }

        entries.forEach(entry => {
            const card = document.createElement("div");
            card.style.padding = "15px";
            card.style.marginBottom = "12px";
            card.style.border = "1px solid #dce9e0";
            card.style.borderRadius = "12px";
            card.style.background = "#ffffff";

            const title = document.createElement("h3");
            title.textContent =
                (entry.type === "income" ? "💰 Income" : "💸 Expense")
                + " - " + (entry.category || "Other");

            title.style.color =
                entry.type === "income" ? "#176b4b" : "#b42318";

            const amount = document.createElement("p");
            amount.textContent = formatMoney(entry.amount);

            const note = document.createElement("p");
            note.textContent = entry.note || "No description";

            const date = document.createElement("small");
            date.textContent = entry.date || "";

            card.append(title, amount, note, date);
            entriesList.appendChild(card);
        });

    } catch (error) {
        entriesList.textContent =
            "Unable to load transaction history. Please try again.";
    }
}

// Save income or expense
financeForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const type = entryType.value;
    const amount = Number(document.getElementById("amount").value);
    const category = document.getElementById("category").value;
    const note = document.getElementById("note").value.trim();
    const date = dateInput.value;

    if (!Number.isFinite(amount) || amount <= 0) {
        financeMessage.textContent = "Please enter a valid amount.";
        return;
    }

    try {
        financeMessage.textContent = "Saving transaction...";
        financeMessage.style.color = "#176b4b";

        await api("POST", "/api/entries", {
            type: type,
            amount: amount,
            category: category,
            note: note,
            date: date
        });

        financeMessage.textContent =
            "Transaction saved successfully! 🎉";

        financeForm.reset();

        dateInput.value = new Date().toLocaleDateString("en-CA");
        entryType.value = type;

        await loadEntries();

    } catch (error) {
        financeMessage.textContent =
            error.message || "Unable to save transaction.";

        financeMessage.style.color = "#b42318";
    }
});

// Load history when page opens
loadEntries();
