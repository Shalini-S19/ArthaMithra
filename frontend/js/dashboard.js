
// ======================================
// ARTHAMITRA DASHBOARD
// ======================================

"use strict";

// ======================================
// TRANSLATION HELPERS
// ======================================

function dashboardText(key, fallback) {
    if (typeof t !== "function") return fallback;
    return t("dashboard." + key, fallback) || fallback;
}

function goalText(key, fallback) {
    if (typeof t !== "function") return fallback;
    return t("goal_status." + key, fallback) || fallback;
}

// ======================================
// FORMAT HELPERS
// ======================================

function formatMoney(amount) {
    return "₹" + Number(amount || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 2
    });
}

function getGoalList(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.goals)) return payload.goals;
    return [];
}

function setDashboardValue(ids, value) {
    ids.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
}

function getGoalContainer() {
    return document.getElementById("goalsContainer") ||
           document.getElementById("goalsList");
}

function showGoalMessage(message, isError = false) {
    const element = document.getElementById("goalMessage");
    if (!element) return;

    element.textContent = message;
    element.style.color = isError ? "#b42318" : "#176b4b";
}

// ======================================
// TRANSACTION DATA
// ======================================

let dashboardEntries = [];
let weeklyFinanceChart = null;

// ======================================
// GET LAST 7 DAYS
// ======================================

function getLastSevenDays() {
    const days = [];

    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - i);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        days.push({
            key: `${year}-${month}-${day}`,
            label: date.toLocaleDateString(
                localStorage.getItem("lang") === "kn" ? "kn-IN" : "en-IN",
                { day: "numeric", month: "short" }
            )
        });
    }

    return days;
}

// ======================================
// LOAD DASHBOARD SUMMARY
// ======================================

async function loadDashboard() {
    try {
        // Load user profile
        const profile = await api("GET", "/api/me");
        const user = profile.user || profile;

        const nameElement = document.getElementById("userName");

        if (nameElement) {
            nameElement.textContent = user.name || "Friend";
        }

        // Load weekly summary
        const summary = await api("GET", "/api/summary");
        const week = summary.this_week || {};

        setDashboardValue(
            ["weeklyIncome", "totalIncome"],
            formatMoney(week.earned)
        );

        setDashboardValue(
            ["weeklyExpense", "totalExpense"],
            formatMoney(week.spent)
        );

        setDashboardValue(
            ["weeklySavings", "totalSavings"],
            formatMoney(week.saved)
        );

        // Load remaining dashboard features
        await Promise.all([
            loadGoals(),
            loadTransactionAnalytics()
        ]);

    } catch (error) {
        console.error("Dashboard loading error:", error);

        const container = getGoalContainer();

        if (container) {
            container.textContent = dashboardText(
                "load_error",
                "Unable to load dashboard. Please try again."
            );
        }
    }
}

// ======================================
// LOAD TRANSACTIONS FOR CHART AND HISTORY
// ======================================

async function loadTransactionAnalytics() {
    const recentContainer = document.getElementById(
        "recentTransactionsList"
    );

    if (recentContainer) {
        recentContainer.textContent = "Loading transactions...";
    }

    try {
        const response = await api("GET", "/api/entries?days=7");

        dashboardEntries = Array.isArray(response)
            ? response
            : (response.entries || []);

        renderWeeklyChart();
        renderRecentTransactions();

    } catch (error) {
        console.error("Transaction analytics error:", error);

        const chartContainer = document.getElementById("weeklyChart");

        if (chartContainer) {
            chartContainer.textContent =
                "Unable to load financial chart.";
        }

        if (recentContainer) {
            recentContainer.textContent =
                "Unable to load recent transactions.";
        }
    }
}

// ======================================
// RENDER INCOME VS EXPENSES CHART
// ======================================

function renderWeeklyChart() {
    const canvas = document.getElementById("weeklyFinanceChart");
    const chartContainer = document.getElementById("weeklyChart");

    if (!canvas) return;

    if (typeof Chart === "undefined") {
        if (chartContainer) {
            chartContainer.textContent =
                "Chart library could not be loaded.";
        }
        return;
    }

    const days = getLastSevenDays();

    const incomeData = days.map(day => {
        return dashboardEntries
            .filter(entry =>
                entry.date === day.key &&
                entry.type === "income"
            )
            .reduce((total, entry) =>
                total + Number(entry.amount || 0), 0
            );
    });

    const expenseData = days.map(day => {
        return dashboardEntries
            .filter(entry =>
                entry.date === day.key &&
                entry.type === "expense"
            )
            .reduce((total, entry) =>
                total + Number(entry.amount || 0), 0
            );
    });

    if (weeklyFinanceChart) {
        weeklyFinanceChart.destroy();
    }

    weeklyFinanceChart = new Chart(canvas, {
        type: "bar",

        data: {
            labels: days.map(day => day.label),

            datasets: [
                {
                    label: "Income",
                    data: incomeData,
                    backgroundColor: "#26966b",
                    borderRadius: 6
                },
                {
                    label: "Expenses",
                    data: expenseData,
                    backgroundColor: "#e16b6b",
                    borderRadius: 6
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: true,

            plugins: {
                legend: {
                    position: "top"
                },

                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label +
                                ": " + formatMoney(context.raw);
                        }
                    }
                }
            },

            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return "₹" +
                                Number(value).toLocaleString("en-IN");
                        }
                    }
                }
            }
        }
    });
}

// ======================================
// RENDER RECENT TRANSACTIONS
// ======================================

function renderRecentTransactions() {
    const container = document.getElementById(
        "recentTransactionsList"
    );

    if (!container) return;

    container.replaceChildren();

    if (dashboardEntries.length === 0) {
        const message = document.createElement("p");

        message.textContent =
            "No transactions recorded in the last 7 days.";

        container.appendChild(message);
        return;
    }

    // Display latest 5 transactions
    const recentEntries = [...dashboardEntries]
        .sort((a, b) => {
            const dateComparison =
                String(b.date || "").localeCompare(String(a.date || ""));

            if (dateComparison !== 0) return dateComparison;

            return Number(b.id || 0) - Number(a.id || 0);
        })
        .slice(0, 5);

    recentEntries.forEach(entry => {
        const card = document.createElement("div");

        card.style.padding = "14px";
        card.style.marginBottom = "10px";
        card.style.border = "1px solid #dce9e0";
        card.style.borderRadius = "12px";
        card.style.background = "#ffffff";

        const isIncome = entry.type === "income";

        const heading = document.createElement("h3");

        heading.textContent =
            (isIncome ? "💰 Income" : "💸 Expense") +
            " - " +
            (entry.category || "Other");

        heading.style.color = isIncome ? "#176b4b" : "#b42318";

        const amount = document.createElement("p");

        amount.textContent = formatMoney(entry.amount);
        amount.style.fontWeight = "bold";
        amount.style.fontSize = "18px";
        amount.style.color = isIncome ? "#176b4b" : "#b42318";

        const date = document.createElement("small");
        date.textContent = entry.date || "";

        const note = document.createElement("p");
        note.textContent = entry.note || "";

        card.append(heading, amount, date);

        if (entry.note) {
            card.appendChild(note);
        }

        container.appendChild(card);
    });
}

// ======================================
// CREATE SAVINGS GOAL
// ======================================

const goalForm = document.getElementById("goalForm");

if (goalForm) {
    goalForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const title = document.getElementById("goalTitle").value.trim();

        const target = Number(
            document.getElementById("goalTarget").value
        );

        const deadline =
            document.getElementById("goalDeadline").value;

        if (!title || !Number.isFinite(target) || target <= 0) {
            showGoalMessage(
                dashboardText(
                    "invalid_goal",
                    "Please enter valid goal details."
                ),
                true
            );
            return;
        }

        const submitButton = goalForm.querySelector(
            'button[type="submit"]'
        );

        if (submitButton) submitButton.disabled = true;

        showGoalMessage(
            dashboardText("creating_goal", "Creating your goal...")
        );

        try {
            await api("POST", "/api/goals", {
                title,
                target,
                deadline: deadline || null
            });

            goalForm.reset();

            showGoalMessage(
                dashboardText(
                    "goal_created",
                    "Savings goal created successfully! 🎉"
                )
            );

            await loadGoals();

        } catch (error) {
            console.error("Goal creation error:", error);

            showGoalMessage(
                dashboardText(
                    "goal_create_error",
                    "Unable to create savings goal."
                ),
                true
            );

        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
}

// ======================================
// LOAD SAVINGS GOALS
// ======================================

async function loadGoals() {
    const container = getGoalContainer();

    if (!container) return;

    container.textContent = dashboardText(
        "loading_goals",
        "Loading your goals..."
    );

    try {
        const response = await api("GET", "/api/goals");
        const goals = getGoalList(response);

        container.replaceChildren();

        if (goals.length === 0) {
            const emptyMessage = document.createElement("p");

            emptyMessage.textContent = dashboardText(
                "no_goals",
                "You have not created any savings goals yet."
            );

            container.appendChild(emptyMessage);
            return;
        }

        goals.forEach(goal => {
            container.appendChild(createGoalCard(goal));
        });

    } catch (error) {
        console.error("Goals loading error:", error);

        container.textContent = dashboardText(
            "goals_load_error",
            "Unable to load savings goals."
        );
    }
}

// ======================================
// CREATE GOAL CARD
// ======================================

function createGoalCard(goal) {
    const card = document.createElement("article");
    card.className = "goal-card";

    const target = Number(goal.target || 0);
    const saved = Number(goal.saved || 0);

    const percentage = target > 0
        ? Math.min(100, Math.round(saved / target * 100))
        : 0;

    const title = document.createElement("h3");
    title.textContent = goal.title || "Savings Goal";

    const savedText = document.createElement("p");

    savedText.textContent =
        dashboardText("saved_label", "Saved:") + " " +
        formatMoney(saved);

    const targetText = document.createElement("p");

    targetText.textContent =
        dashboardText("target_label", "Target:") + " " +
        formatMoney(target);

    const progressText = document.createElement("p");

    progressText.textContent =
        dashboardText("progress", "Progress:") + " " +
        percentage + "%";

    const progressBackground = document.createElement("div");
    progressBackground.className = "goal-progress-bg";

    const progressFill = document.createElement("div");
    progressFill.className = "goal-progress-fill";
    progressFill.style.width = percentage + "%";

    progressBackground.appendChild(progressFill);

    const deadlineText = document.createElement("p");

    if (goal.deadline) {
        deadlineText.textContent =
            dashboardText("deadline_label", "Deadline:") + " " +
            goal.deadline;
    }

    const statusText = document.createElement("p");
    statusText.className = "goal-message";

    const statusKey = goal.status || "on_track";

    const statusFallbacks = {
        completed: "Goal completed!",
        overdue: "Deadline has passed",
        due_soon: "Deadline approaching",
        on_track: "You're on track"
    };

    statusText.textContent = goalText(
        statusKey,
        statusFallbacks[statusKey] || "You're on track"
    );

    const actions = document.createElement("div");
    actions.className = "goal-actions";

    if (saved < target) {
        const addButton = document.createElement("button");

        addButton.type = "button";
        addButton.textContent = goalText("add_money", "Add Money");

        addButton.addEventListener("click", function() {
            contributeToGoal(goal.id);
        });

        actions.appendChild(addButton);
    }

    const deleteButton = document.createElement("button");

    deleteButton.type = "button";
    deleteButton.className = "delete-goal";
    deleteButton.textContent = dashboardText("delete_goal", "Delete");

    deleteButton.addEventListener("click", function() {
        deleteGoal(goal.id, goal.title);
    });

    actions.appendChild(deleteButton);

    card.append(
        title,
        savedText,
        targetText,
        progressText,
        progressBackground
    );

    if (goal.deadline) {
        card.appendChild(deadlineText);
    }

    card.append(statusText, actions);

    return card;
}

// ======================================
// ADD MONEY TO GOAL
// ======================================

async function contributeToGoal(goalId) {
    const amountText = prompt(
        dashboardText(
            "contribution_prompt",
            "How much money would you like to add?"
        )
    );

    if (amountText === null) return;

    const amount = Number(amountText);

    if (!Number.isFinite(amount) || amount <= 0) {
        alert(
            dashboardText(
                "invalid_amount",
                "Please enter a valid amount."
            )
        );
        return;
    }

    try {
        await api(
            "POST",
            "/api/goals/" + encodeURIComponent(goalId) + "/contribute",
            { amount }
        );

        alert(
            dashboardText(
                "contribution_success",
                "Money added to your savings goal! 🎉"
            )
        );

        await loadGoals();

    } catch (error) {
        console.error("Contribution error:", error);

        alert(
            dashboardText(
                "contribution_error",
                "Unable to add money."
            )
        );
    }
}

// ======================================
// DELETE GOAL
// ======================================

async function deleteGoal(goalId, title) {
    const confirmation = confirm(
        dashboardText(
            "delete_confirmation",
            "Are you sure you want to delete this goal:"
        ) + " " + title + "?"
    );

    if (!confirmation) return;

    try {
        await api(
            "DELETE",
            "/api/goals/" + encodeURIComponent(goalId)
        );

        alert(
            dashboardText(
                "delete_success",
                "Savings goal deleted successfully."
            )
        );

        await loadGoals();

    } catch (error) {
        console.error("Goal deletion error:", error);

        alert(
            dashboardText(
                "delete_error",
                "Unable to delete the goal."
            )
        );
    }
}

// ======================================
// NAVIGATION
// ======================================

function openFeature(feature) {
    const pages = {
        home: "dashboard.html",
        income: "finance.html?type=income",
        expense: "finance.html?type=expense",
        finance: "finance.html",
        budget: "budget.html",
        goals: "dashboard.html#goalsList",
        schemes: "schemes.html",
        lessons: "learn.html",
        profile: "profile.html"
    };

    if (pages[feature]) {
        window.location.href = pages[feature];
    } else {
        alert(
            dashboardText(
                "feature_coming",
                "This feature is coming soon!"
            )
        );
    }
}

// ======================================
// LOGOUT
// ======================================

const logoutButton = document.getElementById("logoutBtn");

if (logoutButton) {
    logoutButton.addEventListener("click", async function() {
        try {
            await api("POST", "/api/logout");
            window.location.href = "index.html";

        } catch (error) {
            console.error("Logout error:", error);

            alert(
                dashboardText(
                    "logout_error",
                    "Unable to log out. Please try again."
                )
            );
        }
    });
}

// ======================================
// LANGUAGE CHANGE
// ======================================

document.addEventListener("languageChanged", function() {
    renderWeeklyChart();
    renderRecentTransactions();
    loadGoals();
});

// ======================================
// INITIALIZE DASHBOARD
// ======================================

loadDashboard();
