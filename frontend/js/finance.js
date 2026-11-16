
const financeForm = document.getElementById("financeForm");
const financeMessage = document.getElementById("financeMessage");
const dateInput = document.getElementById("date");
const entryType = document.getElementById("entryType");

// Automatically select Income or Expense from dashboard
const params = new URLSearchParams(window.location.search);
const selectedType = params.get("type");

if (selectedType === "income" || selectedType === "expense") {
    entryType.value = selectedType;
}

// Set today's date
dateInput.value = new Date().toLocaleDateString("en-CA");

// Save transaction
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

        await api("POST", "/api/entries", {
            type: type,
            amount: amount,
            category: category,
            note: note,
            date: date
        });

        financeMessage.textContent =
            "Transaction saved successfully! 🎉";

        financeMessage.style.color = "#176b4b";

        financeForm.reset();

        dateInput.value = new Date().toLocaleDateString("en-CA");

        entryType.value = type;

    } catch (error) {
        financeMessage.textContent =
            error.message || "Unable to save transaction.";

        financeMessage.style.color = "#b42318";
    }
});
