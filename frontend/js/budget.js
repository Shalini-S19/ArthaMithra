
const budgetForm = document.getElementById("budgetForm");
const budgetInput = document.getElementById("budgetAmount");
const budgetMessage = document.getElementById("budgetMessage");

const monthlyBudget = document.getElementById("monthlyBudget");
const monthlyExpenses = document.getElementById("monthlyExpenses");
const remainingBudget = document.getElementById("remainingBudget");
const budgetPercentage = document.getElementById("budgetPercentage");
const budgetProgress = document.getElementById("budgetProgress");
const budgetAlert = document.getElementById("budgetAlert");

const now = new Date();
const monthKey = `arthamitra_budget_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, "0")}`;

let budget = Number(localStorage.getItem(monthKey)) || 0;

function money(amount) {
    return "₹" + Number(amount || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 2
    });
}

async function loadBudget() {
    try {
        const result = await api("GET", "/api/entries?days=3650");

        const entries = Array.isArray(result)
            ? result
            : (result.entries || []);

        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

        const expenses = entries
            .filter(entry =>
                entry.type === "expense" &&
                String(entry.date || "").startsWith(currentMonth)
            )
            .reduce((total, entry) => total + Number(entry.amount || 0), 0);

        updateBudgetDisplay(expenses);

    } catch (error) {
        budgetAlert.textContent =
            "Unable to load expenses. Please log in and try again.";
        budgetAlert.style.color = "#b42318";
    }
}

function updateBudgetDisplay(expenses) {
    const remaining = budget - expenses;
    const percentage = budget > 0
        ? (expenses / budget) * 100
        : 0;

    monthlyBudget.textContent = money(budget);
    monthlyExpenses.textContent = money(expenses);
    remainingBudget.textContent = money(remaining);
    budgetPercentage.textContent = Math.round(percentage) + "%";

    budgetInput.value = budget || "";

    budgetProgress.style.width = Math.min(percentage, 100) + "%";

    if (budget <= 0) {
        budgetAlert.textContent =
            "Set your monthly budget to start tracking.";
        budgetAlert.style.color = "#71847a";
        return;
    }

    if (percentage >= 100) {
        budgetAlert.textContent =
            "⚠️ Budget exceeded! Try to reduce your spending.";
        budgetAlert.style.color = "#b42318";
        budgetProgress.style.background = "#d92d20";
    } else if (percentage >= 80) {
        budgetAlert.textContent =
            "⚠️ You have used 80% or more of your budget. Spend carefully!";
        budgetAlert.style.color = "#c07812";
        budgetProgress.style.background = "#e5a329";
    } else {
        budgetAlert.textContent =
            "Great job! You are within your monthly budget. 💚";
        budgetAlert.style.color = "#176b4b";
        budgetProgress.style.background = "#26945e";
    }
}

budgetForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const amount = Number(budgetInput.value);

    if (!Number.isFinite(amount) || amount <= 0) {
        budgetMessage.textContent = "Enter a valid budget amount.";
        budgetMessage.style.color = "#b42318";
        return;
    }

    budget = amount;
    localStorage.setItem(monthKey, String(budget));

    budgetMessage.textContent = "Monthly budget saved successfully! 🎉";
    budgetMessage.style.color = "#176b4b";

    loadBudget();
});

loadBudget();
