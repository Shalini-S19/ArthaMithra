
"use strict";

/* =========================================
   ARTHAMITHRA DASHBOARD
   English + Kannada
========================================= */

let weeklyFinanceChart = null;
let dashboardGoals = [];
let dashboardEntries = [];

/* =========================================
   LANGUAGE HELPERS
========================================= */

function currentDashboardLanguage() {
    return typeof getCurrentLanguage === "function"
        ? getCurrentLanguage()
        : (localStorage.getItem("lang") || "en");
}

function dashboardText(key, english, kannada) {
    if (currentDashboardLanguage() === "kn" && kannada) {
        return kannada;
    }

    if (typeof t === "function") {
        const translated = t("dashboard." + key, "");
        if (translated && translated !== "dashboard." + key) {
            return translated;
        }
    }

    return english;
}

function financeText(key) {
    const translations = {
        income: { en: "Income", kn: "ಆದಾಯ" },
        expense: { en: "Expense", kn: "ಖರ್ಚು" },
        no_transactions: {
            en: "No transactions recorded yet.",
            kn: "ಇನ್ನೂ ಯಾವುದೇ ವಹಿವಾಟು ದಾಖಲಾಗಿಲ್ಲ."
        },
        add_money: { en: "Add Money", kn: "ಹಣ ಸೇರಿಸಿ" }
    };

    const lang = currentDashboardLanguage();
    return translations[key]?.[lang] || translations[key]?.en || key;
}

/* =========================================
   SAFE HTML
========================================= */

function escapeDashboardHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

/* =========================================
   CURRENCY
========================================= */

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

/* =========================================
   NAVIGATION
========================================= */

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
    } else {
        window.location.href = destination;
    }
}

/* =========================================
   USERNAME AND GREETING
========================================= */

function getDashboardUserName(profile) {
    const user =
        profile?.user ||
        profile?.data?.user ||
        profile?.data ||
        profile?.profile ||
        profile?.me ||
        profile;

    return String(
        user?.name ||
        user?.full_name ||
        user?.fullName ||
        user?.username ||
        user?.first_name ||
        user?.firstName ||
        user?.display_name ||
        user?.displayName ||
        ""
    ).trim();
}

function displayDashboardGreeting(name) {
    const nameElement = document.getElementById("userName");

    if (!nameElement) return;

    nameElement.textContent = name || "Friend";

    nameElement.style.display = "inline";
    nameElement.style.visibility = "visible";
    nameElement.style.opacity = "1";
    nameElement.style.color = "#ffffff";
    nameElement.style.fontWeight = "bold";

    const card = nameElement.closest(".welcome-card");

    if (card) {
        card.style.background =
            "linear-gradient(120deg, #176b4b, #123c32)";

        card.style.color = "#ffffff";

        const heading = card.querySelector("h1");

        if (heading) {
            heading.style.color = "#ffffff";
            heading.style.visibility = "visible";
            heading.style.opacity = "1";
        }

        const paragraph = card.querySelector("p");

        if (paragraph) {
            paragraph.style.color = "#ffffff";
        }
    }
}

/* =========================================
   LOAD DASHBOARD
========================================= */

async function loadDashboard() {
    displayDashboardGreeting("Friend");

    try {
        const profile = await api("GET", "/api/me");

        console.log("Dashboard profile:", profile);

        const name = getDashboardUserName(profile);

        displayDashboardGreeting(name || "Friend");

    } catch (error) {
        console.error("Profile loading error:", error);
        displayDashboardGreeting("Friend");
    }

    await Promise.allSettled([
        loadFinancialSummary(),
        loadRecentTransactions(),
        loadSavingsGoals()
    ]);
}

/* =========================================
   FINANCIAL SUMMARY
========================================= */

async function loadFinancialSummary() {
    try {
        const result = await api("GET", "/api/summary");
        const week = result.this_week || {};

        const income = Number(week.earned || 0);
        const expense = Number(week.spent || 0);

        const savings = Number(
            week.saved !== undefined
                ? week.saved
                : income - expense
        );

        const incomeElement =
            document.getElementById("weeklyIncome");

        const expenseElement =
            document.getElementById("weeklyExpense");

        const savingsElement =
            document.getElementById("weeklySavings");

        if (incomeElement) {
            incomeElement.textContent =
                formatDashboardMoney(income);
        }

        if (expenseElement) {
            expenseElement.textContent =
                formatDashboardMoney(expense);
        }

        if (savingsElement) {
            savingsElement.textContent =
                formatDashboardMoney(savings);
        }

    } catch (error) {
        console.error("Summary loading error:", error);
    }
}

/* =========================================
   RECENT TRANSACTIONS
========================================= */

async function loadRecentTransactions() {
    const container =
        document.getElementById("recentTransactionsList");

    if (!container) return;

    try {
        const result = await api("GET", "/api/entries?days=7");

        dashboardEntries = Array.isArray(result)
            ? result
            : (Array.isArray(result.entries) ? result.entries : []);

        renderRecentTransactions();
        renderWeeklyChart();

    } catch (error) {
        console.error("Transaction loading error:", error);

        container.textContent = dashboardText(
            "load_error",
            "Unable to load transactions.",
            "ವಹಿವಾಟುಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ."
        );
    }
}

function renderRecentTransactions() {
    const container =
        document.getElementById("recentTransactionsList");

    if (!container) return;

    const recent = dashboardEntries.slice(0, 5);

    if (!recent.length) {
        container.textContent = financeText("no_transactions");
        return;
    }

    container.innerHTML = recent.map(entry => {
        const isIncome = entry.type === "income";

        const label = isIncome
            ? financeText("income")
            : financeText("expense");

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
                    <strong>
                        ${escapeDashboardHTML(entry.category || label)}
                    </strong>

                    <p style="
                        margin:5px 0;
                        color:#718278;
                        font-size:13px;
                    ">
                        ${escapeDashboardHTML(entry.note || "")}
                    </p>

                    <small style="color:#718278;">
                        ${escapeDashboardHTML(entry.date || "")}
                    </small>
                </div>

                <strong style="
                    color:${isIncome ? "#16834c" : "#c0392b"};
                ">
                    ${isIncome ? "+" : "-"}${escapeDashboardHTML(
                        formatDashboardMoney(entry.amount)
                    )}
                </strong>
            </div>
        `;
    }).join("");
}

/* =========================================
   WEEKLY INCOME VS EXPENSE CHART
========================================= */

function renderWeeklyChart() {
    const canvas =
        document.getElementById("weeklyFinanceChart");

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
                currentDashboardLanguage() === "kn"
                    ? "kn-IN"
                    : "en-IN",
                {
                    day: "numeric",
                    month: "short"
                }
            )
        );

        const entries = dashboardEntries.filter(entry =>
            String(entry.date || "").slice(0, 10) === dateKey
        );

        incomeData.push(
            entries
                .filter(entry => entry.type === "income")
                .reduce(
                    (sum, entry) =>
                        sum + Number(entry.amount || 0),
                    0
                )
        );

        expenseData.push(
            entries
                .filter(entry => entry.type === "expense")
                .reduce(
                    (sum, entry) =>
                        sum + Number(entry.amount || 0),
                    0
                )
        );
    }

    if (weeklyFinanceChart) {
        weeklyFinanceChart.destroy();
    }

    weeklyFinanceChart = new Chart(canvas, {
        type: "bar",

        data: {
            labels,

            datasets: [
                {
                    label: financeText("income"),
                    data: incomeData,
                    backgroundColor: "#26966b",
                    borderRadius: 6
                },
                {
                    label: financeText("expense"),
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
                    grace: "10%",

                    ticks: {
                        precision: 0,
                        callback: value => "₹" + value
                    }
                }
            }
        }
    });
}

/* =========================================
   LOAD SAVINGS GOALS
========================================= */

async function loadSavingsGoals() {
    const container = document.getElementById("goalsList");

    if (!container) return;

    try {
        const result = await api("GET", "/api/goals");

        dashboardGoals = Array.isArray(result)
            ? result
            : (Array.isArray(result.goals) ? result.goals : []);

        renderSavingsGoals();

    } catch (error) {
        console.error("Goals loading error:", error);

        container.textContent = dashboardText(
            "goals_load_error",
            "Unable to load savings goals.",
            "ಉಳಿತಾಯ ಗುರಿಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ."
        );
    }
}

/* =========================================
   DISPLAY SAVINGS GOALS
========================================= */

function renderSavingsGoals() {
    const container = document.getElementById("goalsList");

    if (!container) return;

    if (!dashboardGoals.length) {
        container.textContent = dashboardText(
            "no_goals",
            "You haven't created any savings goals yet. Start your first goal above!",
            "ನೀವು ಇನ್ನೂ ಯಾವುದೇ ಉಳಿತಾಯ ಗುರಿಗಳನ್ನು ರಚಿಸಿಲ್ಲ. ನಿಮ್ಮ ಮೊದಲ ಗುರಿಯನ್ನು ರಚಿಸಿ!"
        );

        return;
    }

    container.innerHTML = dashboardGoals.map(goal => {
        const title = goal.title || "Savings Goal";

        const target = Number(
            goal.target ?? goal.target_amount ?? 0
        );

        const saved = Number(
            goal.saved ?? goal.saved_amount ?? 0
        );

        const percent = target > 0
            ? Math.min(100, Math.max(0, saved / target * 100))
            : 0;

        return `
            <div class="goal-card">

                <h3>${escapeDashboardHTML(title)}</h3>

                <p>
                    ${escapeDashboardHTML(
                        dashboardText(
                            "saved_label",
                            "Saved:",
                            "ಉಳಿತಾಯ:"
                        )
                    )}
                    ${escapeDashboardHTML(formatDashboardMoney(saved))}
                </p>

                <p>
                    ${escapeDashboardHTML(
                        dashboardText(
                            "target_label",
                            "Target:",
                            "ಗುರಿ:"
                        )
                    )}
                    ${escapeDashboardHTML(formatDashboardMoney(target))}
                </p>

                <div class="goal-progress-bg">
                    <div
                        class="goal-progress-fill"
                        style="width:${percent}%;">
                    </div>
                </div>

                <p>
                    ${escapeDashboardHTML(
                        dashboardText(
                            "progress",
                            "Progress:",
                            "ಪ್ರಗತಿ:"
                        )
                    )}
                    ${Math.round(percent)}%
                </p>

                ${goal.deadline ? `
                    <p>
                        ${escapeDashboardHTML(
                            dashboardText(
                                "deadline_label",
                                "Deadline:",
                                "ಗಡುವು:"
                            )
                        )}
                        ${escapeDashboardHTML(goal.deadline)}
                    </p>
                ` : ""}

                <div class="goal-actions">

                    <button
                        type="button"
                        data-goal-action="contribute"
                        data-goal-id="${escapeDashboardHTML(goal.id)}">

                        ${escapeDashboardHTML(financeText("add_money"))}

                    </button>

                    <button
                        type="button"
                        class="delete-goal"
                        data-goal-action="delete"
                        data-goal-id="${escapeDashboardHTML(goal.id)}">

                        ${escapeDashboardHTML(
                            dashboardText(
                                "delete_goal",
                                "Delete",
                                "ಅಳಿಸಿ"
                            )
                        )}

                    </button>

                </div>
            </div>
        `;
    }).join("");
}

/* =========================================
   CREATE SAVINGS GOAL
   IMPORTANT: BACKEND EXPECTS "target"
========================================= */

async function createSavingsGoal(event) {
    event.preventDefault();

    const titleInput = document.getElementById("goalTitle");
    const targetInput = document.getElementById("goalTarget");
    const deadlineInput = document.getElementById("goalDeadline");
    const message = document.getElementById("goalMessage");

    if (!titleInput || !targetInput || !message) return;

    const title = titleInput.value.trim();
    const targetValue = targetInput.value.trim();
    const target = Number(targetValue);
    const deadline = deadlineInput?.value || "";

    if (
        !title ||
        !targetValue ||
        !Number.isFinite(target) ||
        target <= 0
    ) {
        message.textContent = dashboardText(
            "invalid_goal",
            "Please enter a valid goal name and target amount.",
            "ದಯವಿಟ್ಟು ಸರಿಯಾದ ಗುರಿಯ ಹೆಸರು ಮತ್ತು ಮೊತ್ತವನ್ನು ನಮೂದಿಸಿ."
        );

        return;
    }

    if (target > 10000000) {
        message.textContent =
            "Maximum target amount is ₹1,00,00,000.";

        return;
    }

    const submitButton = document.querySelector(
        '#goalForm button[type="submit"]'
    );

    if (submitButton) {
        submitButton.disabled = true;
    }

    message.textContent = dashboardText(
        "creating_goal",
        "Creating your savings goal...",
        "ನಿಮ್ಮ ಉಳಿತಾಯ ಗುರಿಯನ್ನು ರಚಿಸಲಾಗುತ್ತಿದೆ..."
    );

    try {
        // IMPORTANT:
        // Backend expects "target", NOT "target_amount".

        const payload = {
            title: title,
            target: target,
            deadline: deadline || null
        };

        console.log("Creating savings goal:", payload);

        await api("POST", "/api/goals", payload);

        message.textContent = dashboardText(
            "goal_created",
            "Savings goal created successfully! 🎉",
            "ಉಳಿತಾಯ ಗುರಿಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ರಚಿಸಲಾಗಿದೆ! 🎉"
        );

        document.getElementById("goalForm").reset();

        await loadSavingsGoals();

    } catch (error) {
        console.error("Create savings goal error:", error);

        message.textContent = error.message ||
            dashboardText(
                "goal_create_error",
                "Unable to create savings goal. Please try again.",
                "ಉಳಿತಾಯ ಗುರಿಯನ್ನು ರಚಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ."
            );

    } finally {
        if (submitButton) {
            submitButton.disabled = false;
        }
    }
}

/* =========================================
   ADD MONEY / DELETE SAVINGS GOAL
========================================= */

async function handleGoalAction(event) {
    const button = event.target.closest("[data-goal-action]");

    if (!button) return;

    const goalId = button.dataset.goalId;
    const action = button.dataset.goalAction;

    if (!goalId) return;

    if (action === "contribute") {
        const input = prompt(
            dashboardText(
                "contribution_prompt",
                "How much money would you like to add?",
                "ನೀವು ಎಷ್ಟು ಹಣವನ್ನು ಸೇರಿಸಲು ಬಯಸುತ್ತೀರಿ?"
            )
        );

        if (input === null) return;

        const amount = Number(input);

        if (!Number.isFinite(amount) || amount <= 0) {
            alert(
                dashboardText(
                    "invalid_amount",
                    "Please enter a valid amount.",
                    "ದಯವಿಟ್ಟು ಸರಿಯಾದ ಮೊತ್ತವನ್ನು ನಮೂದಿಸಿ."
                )
            );

            return;
        }

        try {
            await api(
                "POST",
                `/api/goals/${encodeURIComponent(goalId)}/contribute`,
                { amount: amount }
            );

            alert(
                dashboardText(
                    "contribution_success",
                    "Money added successfully!",
                    "ಹಣವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ!"
                )
            );

            await loadSavingsGoals();

        } catch (error) {
            console.error("Contribution error:", error);
            alert(error.message || "Unable to add money.");
        }
    }

    if (action === "delete") {
        const goal = dashboardGoals.find(
            item => String(item.id) === String(goalId)
        );

        const confirmed = confirm(
            dashboardText(
                "delete_confirmation",
                "Are you sure you want to delete this goal?",
                "ಈ ಗುರಿಯನ್ನು ಅಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ?"
            ) + " " + (goal?.title || "")
        );

        if (!confirmed) return;

        try {
            await api(
                "DELETE",
                `/api/goals/${encodeURIComponent(goalId)}`
            );

            alert(
                dashboardText(
                    "delete_success",
                    "Savings goal deleted successfully.",
                    "ಉಳಿತಾಯ ಗುರಿಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಅಳಿಸಲಾಗಿದೆ."
                )
            );

            await loadSavingsGoals();

        } catch (error) {
            console.error("Delete goal error:", error);
            alert(error.message || "Unable to delete goal.");
        }
    }
}

/* =========================================
   LANGUAGE CHANGE
========================================= */

document.addEventListener("languageChanged", function() {
    renderRecentTransactions();
    renderSavingsGoals();
    renderWeeklyChart();
});

/* =========================================
   INITIALIZE DASHBOARD
========================================= */

document.addEventListener("DOMContentLoaded", function() {
    const goalForm = document.getElementById("goalForm");

    if (goalForm) {
        goalForm.addEventListener(
            "submit",
            createSavingsGoal
        );
    }

    const goalsList = document.getElementById("goalsList");

    if (goalsList) {
        goalsList.addEventListener(
            "click",
            handleGoalAction
        );
    }

    loadDashboard();
});
