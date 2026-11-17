
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

const monthKey =
    `arthamitra_budget_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, "0")}`;

const currentMonth =
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

let budget = Number(localStorage.getItem(monthKey)) || 0;
let currentExpenses = 0;
let loadFailed = false;
let budgetMessageKey = "";

// Translation helper
function budgetText(key) {
    return typeof t === "function" ? t(`budget.${key}`) : key;
}

// Format currency
function money(amount) {
    const lang = typeof getCurrentLanguage === "function"
        ? getCurrentLanguage()
        : "en";

    const locale = lang === "kn" ? "kn-IN" : "en-IN";

    return "₹" + Number(amount || 0).toLocaleString(locale, {
        maximumFractionDigits: 2
    });
}

// Load current month's expenses
async function loadBudget() {
    try {
        const result = await api("GET", "/api/entries?days=3650");

        const entries = Array.isArray(result)
            ? result
            : (result.entries || []);

        currentExpenses = entries
            .filter(entry =>
                entry.type === "expense" &&
                String(entry.date || "").startsWith(currentMonth)
            )
            .reduce(
                (total, entry) => total + Number(entry.amount || 0),
                0
            );

        loadFailed = false;
        updateBudgetDisplay();

    } catch (error) {
        console.error("Budget loading error:", error);
        loadFailed = true;
        updateBudgetDisplay();
    }
}

// Update all budget information
function updateBudgetDisplay() {
    const remaining = budget - currentExpenses;

    const percentage = budget > 0
        ? (currentExpenses / budget) * 100
        : 0;

    monthlyBudget.textContent = money(budget);
    monthlyExpenses.textContent = money(currentExpenses);
    remainingBudget.textContent = money(remaining);
    budgetPercentage.textContent = Math.round(percentage) + "%";

    budgetInput.value = budget || "";

    budgetProgress.style.width =
        Math.min(Math.max(percentage, 0), 100) + "%";

    if (loadFailed) {
        budgetAlert.textContent = budgetText("load_error");
        budgetAlert.style.color = "#b42318";
        return;
    }

    if (budget <= 0) {
        budgetAlert.textContent = budgetText("initial_alert");
        budgetAlert.style.color = "#71847a";
        budgetProgress.style.background = "#26945e";
        return;
    }

    if (percentage >= 100) {
        budgetAlert.textContent = budgetText("exceeded");
        budgetAlert.style.color = "#b42318";
        budgetProgress.style.background = "#d92d20";

    } else if (percentage >= 80) {
        budgetAlert.textContent = budgetText("warning");
        budgetAlert.style.color = "#c07812";
        budgetProgress.style.background = "#e5a329";

    } else {
        budgetAlert.textContent = budgetText("good");
        budgetAlert.style.color = "#176b4b";
        budgetProgress.style.background = "#26945e";
    }
}

// Save monthly budget
budgetForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const amount = Number(budgetInput.value);

    if (!Number.isFinite(amount) || amount <= 0) {
        budgetMessageKey = "invalid_amount";
        budgetMessage.textContent = budgetText(budgetMessageKey);
        budgetMessage.style.color = "#b42318";
        return;
    }

    budget = amount;

    localStorage.setItem(monthKey, String(budget));

    budgetMessageKey = "save_success";
    budgetMessage.textContent = budgetText(budgetMessageKey);
    budgetMessage.style.color = "#176b4b";

    updateBudgetDisplay();
});

// Update dynamic text whenever language changes
document.addEventListener("languageChanged", function() {
    updateBudgetDisplay();

    if (budgetMessageKey) {
        budgetMessage.textContent = budgetText(budgetMessageKey);
    }
});

// Initial load
updateBudgetDisplay();
loadBudget();
