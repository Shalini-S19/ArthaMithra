
const financeForm = document.getElementById("financeForm");
const financeMessage = document.getElementById("financeMessage");
const dateInput = document.getElementById("date");

// Set today's date automatically
dateInput.value = new Date().toLocaleDateString("en-CA");

// Save income or expense
financeForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const type = document.getElementById("entryType").value;
    const amount = Number(document.getElementById("amount").value);
    const category = document.getElementById("category").value;
    const note = document.getElementById("note").value.trim();
    const date = dateInput.value;

    if (!Number.isFinite(amount) || amount <= 0) {
        financeMessage.textContent = "Please enter a valid amount.";
        return;
    }

    try {
        financeMessage.textContent = "Saving your transaction...";

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

    } catch (error) {
        financeMessage.textContent =
            error.message || "Unable to save transaction.";

        financeMessage.style.color = "#b42318";
    }
});
