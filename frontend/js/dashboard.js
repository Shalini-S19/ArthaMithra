
// ============================================
// ARTHAMITHRA - COMPLETE DASHBOARD JAVASCRIPT
// ============================================

let weeklyFinanceChart = null;
let dashboardGoals = [];
let dashboardEntries = [];

// --------------------------------------------
// TRANSLATION HELPER
// --------------------------------------------

function dashboardText(key, fallback) {
    if (typeof t === "function") {
        return t("dashboard." + key, fallback);
    }
    return fallback;
}

function currentDashboardLanguage() {
    return typeof getCurrentLanguage === "function"
        ? getCurrentLanguage()
        : (localStorage.getItem("lang") || "en");
}

// --------------------------------------------
// SAFE HTML HELPER
// --------------------------------------------

function escapeDashboardHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

// --------------------------------------------
// CURRENCY FORMAT
// --------------------------------------------

function formatDashboardMoney(amount) {
    return new Intl.NumberFormat(
        currentDashboardLanguage() === "kn" ? "kn-IN" : "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }
    ).format(Number(amount) || 0);
}

// --------------------------------------------
// NAVIGATION
// --------------------------------------------

function openFeature(feature) {
    const pages = {
        home: "dashboard.html",
        income: "finance.html?type=income",
        expense: "finance.html?type=expense",
        budget: "budget.html",
        goals: "#goalsSection",
        schemes: "schemes.html",
        lessons: "learn.html",
        profile: "profile.html"
    };

    const destination = pages[feature];

    if (!destination) return;

    if (destination.startsWith("#")) {
        document.querySelector(destination)?.scrollIntoView({
            behavior: "smooth"
        });
        return;
    }

    window.location.href = destination;
}

// --------------------------------------------
// LOAD DASHBOARD
// --------------------------------------------

async function loadDashboard() {
    try {
        const profile = await api("GET", "/api/me");
        const user = profile.user || profile;

        const nameElement = document.getElementById("userName");

        if (nameElement) {
            nameElement.textContent = user.name || "Friend";
        }

        await loadFinancialSummary();
        await loadRecentTransactions();
        await loadSavingsGoals();

        if (typeof loadNotifications === "function") {
            await loadNotifications();
        }

    } catch (error) {
        console.error("Dashboard loading error:", error);

        const message = dashboardText(
            "load_error",
            "Unable to load dashboard information. Please log in and try again."
        );

        const list = document.getElementById("recentTransactionsList");

        if (list) {
            list.textContent = message;
        }
    }
}

// --------------------------------------------
// FINANCIAL SUMMARY
// --------------------------------------------

async function loadFinancialSummary() {
    try {
        const result = await api("GET", "/api/summary");
        const week = result.this_week || {};

        const income = Number(week.earned || 0);
        const expense = Number(week.spent || 0);
        const savings = Number(
            week.saved !== undefined ? week.saved : income - expense
        );

        const incomeElement = document.getElementById("weeklyIncome");
        const expenseElement = document.getElementById("weeklyExpense");
        const savingsElement = document.getElementById("weeklySavings");

        if (incomeElement) {
            incomeElement.textContent = formatDashboardMoney(income);
        }

        if (expenseElement) {
            expenseElement.textContent = formatDashboardMoney(expense);
        }

        if (savingsElement) {
            savingsElement.textContent = formatDashboardMoney(savings);
        }

    } catch (error) {
        console.error("Financial summary error:", error);
    }
}

// --------------------------------------------
// RECENT TRANSACTIONS
// --------------------------------------------

async function loadRecentTransactions() {
    const container = document.getElementById("recentTransactionsList");

    if (!container) return;

    try {
        const result = await api("GET", "/api/entries?days=7");

        dashboardEntries = Array.isArray(result)
            ? result
            : (result.entries || []);

        renderRecentTransactions();

        renderWeeklyChart();

    } catch (error) {
        console.error("Transaction loading error:", error);

        container.textContent = dashboardText(
            "load_error",
            "Unable to load transactions. Please log in and try again."
        );
    }
}

function renderRecentTransactions() {
    const container = document.getElementById("recentTransactionsList");

    if (!container) return;

    const recent = dashboardEntries.slice(0, 5);

    if (recent.length === 0) {
        container.innerHTML = `
            <p>${escapeDashboardHTML(
                dashboardText("no_transactions", "No transactions recorded yet.")
            )}</p>
        `;
        return;
    }

    container.innerHTML = recent.map(entry => {
        const isIncome = entry.type === "income";

        const typeLabel = isIncome
            ? dashboardText("income_label", "Income")
            : dashboardText("expense_label", "Expense");

        const amount = formatDashboardMoney(entry.amount);

        return `
            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                gap:12px;
                padding:14px 10px;
                border-bottom:1px solid #e5eee8;
            ">
                <div>
                    <strong>${escapeDashboardHTML(
                        entry.category || typeLabel
                    )}</strong>

                    <p style="margin:5px 0;color:#718278;font-size:13px;">
                        ${escapeDashboardHTML(entry.note || "")}
                    </p>

                    <small style="color:#718278;">
                        ${escapeDashboardHTML(entry.date || "")}
                    </small>
                </div>

                <strong style="color:${isIncome ? "#16834c" : "#c0392b"};">
                    ${isIncome ? "+" : "-"}${escapeDashboardHTML(amount)}
                </strong>
            </div>
        `;
    }).join("");
}

// --------------------------------------------
// WEEKLY INCOME VS EXPENSE CHART
// --------------------------------------------

function renderWeeklyChart() {
    const canvas = document.getElementById("weeklyFinanceChart");

    if (!canvas || typeof Chart === "undefined") return;

    const labels = [];
    const incomeData = [];
    const expenseData = [];

    const today = new Date();

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);

        const dateKey = [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-");

        labels.push(
            date.toLocaleDateString(
                currentDashboardLanguage() === "kn" ? "kn-IN" : "en-IN",
                { day: "numeric", month: "short" }
            )
        );

        const dayEntries = dashboardEntries.filter(entry => {
            return String(entry.date || "").slice(0, 10) === dateKey;
        });

        const income = dayEntries
            .filter(entry => entry.type === "income")
            .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

        const expense = dayEntries
            .filter(entry => entry.type === "expense")
            .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

        incomeData.push(income);
        expenseData.push(expense);
    }

    if (weeklyFinanceChart) {
        weeklyFinanceChart.destroy();
    }

    weeklyFinanceChart = new Chart(canvas, {
        type: "bar",

        data: {
            labels: labels,

            datasets: [
                {
                    label: dashboardText("income_label", "Income"),
                    data: incomeData,
                    backgroundColor: "#26966b",
                    borderRadius: 6
                },
                {
                    label: dashboardText("expense_label", "Expenses"),
                    data: expenseData,
                    backgroundColor: "#e67e73",
                    borderRadius: 6
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    position: "top"
                }
            },

            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => "₹" + value
                    }
                }
            }
        }
    });
}

// --------------------------------------------
// SAVINGS GOALS
// --------------------------------------------

async function loadSavingsGoals() {
    const container = document.getElementById("goalsList");

    if (!container) return;

    try {
        const result = await api("GET", "/api/goals");

        dashboardGoals = Array.isArray(result)
            ? result
            : (result.goals || []);

        renderSavingsGoals();

    } catch (error) {
        console.error("Goals loading error:", error);

        container.textContent = dashboardText(
            "goals_load_error",
            "Unable to load savings goals."
        );
    }
}

function renderSavingsGoals() {
    const container = document.getElementById("goalsList");

    if (!container) return;

    if (dashboardGoals.length === 0) {
        container.innerHTML = `
            <p>${escapeDashboardHTML(
                dashboardText(
                    "no_goals",
                    "You haven't created any savings goals yet. Start your first goal above!"
                )
            )}</p>
        `;
        return;
    }

    container.innerHTML = dashboardGoals.map(goal => {
        const title = goal.title || goal.name || dashboardText(
            "goal_default",
            "Savings Goal"
        );

        const target = Number(
            goal.target_amount ?? goal.target ?? 0
        );

        const saved = Number(
            goal.saved_amount ?? goal.saved ?? goal.current_amount ?? 0
        );

        const percent = Math.min(
            100,
            Math.max(0, Number(
                goal.percent ?? (target > 0 ? saved / target * 100 : 0)
            ))
        );

        return `
            <div class="goal-card">
                <h3>${escapeDashboardHTML(title)}</h3>

                <p>
                    ${escapeDashboardHTML(
                        dashboardText("saved_label", "Saved:")
                    )}
                    ${escapeDashboardHTML(formatDashboardMoney(saved))}
                </p>

                <p>
                    ${escapeDashboardHTML(
                        dashboardText("target_label", "Target:")
                    )}
                    ${escapeDashboardHTML(formatDashboardMoney(target))}
                </p>

                <div class="goal-progress-bg">
                    <div class="goal-progress-fill"
                         style="width:${percent}%;">
                    </div>
                </div>

                <p>
                    ${escapeDashboardHTML(
                        dashboardText("progress", "Progress:")
                    )}
                    ${Math.round(percent)}%
                </p>

                ${goal.deadline ? `
                    <p>
                        ${escapeDashboardHTML(
                            dashboardText("deadline_label", "Deadline:")
                        )}
                        ${escapeDashboardHTML(goal.deadline)}
                    </p>
                ` : ""}

                <div class="goal-actions">
                    <button type="button"
                        data-goal-action="contribute"
                        data-goal-id="${escapeDashboardHTML(goal.id)}">
                        ${escapeDashboardHTML(
                            dashboardText("add_money_label", "Add Money")
                        )}
                    </button>

                    <button type="button"
                        class="delete-goal"
                        data-goal-action="delete"
                        data-goal-id="${escapeDashboardHTML(goal.id)}">
                        ${escapeDashboardHTML(
                            dashboardText("delete_goal", "Delete")
                        )}
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

// --------------------------------------------
// CREATE SAVINGS GOAL
// --------------------------------------------

async function createSavingsGoal(event) {
    event.preventDefault();

    const titleInput = document.getElementById("goalTitle");
    const targetInput = document.getElementById("goalTarget");
    const deadlineInput = document.getElementById("goalDeadline");
    const message = document.getElementById("goalMessage");

    const title = titleInput.value.trim();
    const target = Number(targetInput.value);
    const deadline = deadlineInput.value;

    if (!title || !Number.isFinite(target) || target <= 0) {
        message.textContent = dashboardText(
            "invalid_goal",
            "Please enter valid goal details."
        );
        return;
    }

    message.textContent = dashboardText(
        "creating_goal",
        "Creating your goal..."
    );

    try {
        await api("POST", "/api/goals", {
            title: title,
            target_amount: target,
            deadline: deadline || null
        });

        message.textContent = dashboardText(
            "goal_created",
            "Savings goal created successfully!"
        );

        document.getElementById("goalForm").reset();

        await loadSavingsGoals();

    } catch (error) {
        console.error("Create goal error:", error);

        message.textContent = error.message ||
            dashboardText(
                "goal_create_error",
                "Unable to create savings goal."
            );
    }
}

// --------------------------------------------
// GOAL CONTRIBUTION AND DELETE
// --------------------------------------------

async function handleGoalAction(event) {
    const button = event.target.closest("[data-goal-action]");

    if (!button) return;

    const goalId = button.dataset.goalId;
    const action = button.dataset.goalAction;

    if (!goalId) return;

    if (action === "contribute") {
        const amount = Number(prompt(
            dashboardText(
                "contribution_prompt",
                "How much money would you like to add?"
            )
        ));

        if (!Number.isFinite(amount) || amount <= 0) {
            alert(dashboardText(
                "invalid_amount",
                "Please enter a valid amount."
            ));
            return;
        }

        try {
            await api("POST", `/api/goals/${goalId}/contribute`, {
                amount: amount
            });

            alert(dashboardText(
                "contribution_success",
                "Money added to your savings goal successfully!"
            ));

            await loadSavingsGoals();

        } catch (error) {
            console.error("Goal contribution error:", error);

            alert(error.message ||
                dashboardText(
                    "contribution_error",
                    "Unable to add money."
                ));
        }
    }

    if (action === "delete") {
        const confirmed = confirm(
            dashboardText(
                "delete_confirmation",
                "Are you sure you want to delete this goal:"
            ) + " " +
            (dashboardGoals.find(goal => String(goal.id) === String(goalId))?.title || "")
        );

        if (!confirmed) return;

        try {
            await api("DELETE", `/api/goals/${goalId}`);

            alert(dashboardText(
                "delete_success",
                "Savings goal deleted successfully."
            ));

            await loadSavingsGoals();

        } catch (error) {
            console.error("Delete goal error:", error);

            alert(error.message ||
                dashboardText(
                    "delete_error",
                    "Unable to delete goal."
                ));
        }
    }
}

// --------------------------------------------
// LANGUAGE CHANGE
// --------------------------------------------

document.addEventListener("languageChanged", function () {
    renderRecentTransactions();
    renderSavingsGoals();
    renderWeeklyChart();

    if (typeof loadNotifications === "function") {
        loadNotifications();
    }
});

// --------------------------------------------
// INITIALIZE DASHBOARD
// --------------------------------------------

document.addEventListener("DOMContentLoaded", function () {
    const goalForm = document.getElementById("goalForm");

    if (goalForm) {
        goalForm.addEventListener("submit", createSavingsGoal);
    }

    const goalsList = document.getElementById("goalsList");

    if (goalsList) {
        goalsList.addEventListener("click", handleGoalAction);
    }

    loadDashboard();
});
