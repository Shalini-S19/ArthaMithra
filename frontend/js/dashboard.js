
// ============================================
// ARTHAMITHRA - COMPLETE DASHBOARD JAVASCRIPT
// ENGLISH + KANNADA SUPPORT
// USERNAME AND GREETING FIXED
// ============================================

let weeklyFinanceChart = null;
let dashboardGoals = [];
let dashboardEntries = [];

// ============================================
// TRANSLATION HELPERS
// ============================================

function currentDashboardLanguage() {
    return typeof getCurrentLanguage === "function"
        ? getCurrentLanguage()
        : (localStorage.getItem("lang") || "en");
}

function dashboardText(key, english, kannada) {
    const lang = currentDashboardLanguage();

    if (lang === "kn" && kannada) {
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
        income: {
            en: "Income",
            kn: "ಆದಾಯ"
        },
        expense: {
            en: "Expense",
            kn: "ವೆಚ್ಚ"
        },
        no_transactions: {
            en: "No transactions recorded yet.",
            kn: "ಇನ್ನೂ ಯಾವುದೇ ವಹಿವಾಟು ದಾಖಲಾಗಿಲ್ಲ."
        },
        add_money: {
            en: "Add Money",
            kn: "ಹಣ ಸೇರಿಸಿ"
        }
    };

    const lang = currentDashboardLanguage();

    return translations[key]?.[lang] ||
        translations[key]?.en ||
        key;
}

// ============================================
// SAFE HTML
// ============================================

function escapeDashboardHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

// ============================================
// CURRENCY FORMAT
// ============================================

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

// ============================================
// NAVIGATION
// ============================================

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

// ============================================
// GET USER NAME
// ============================================

function getDashboardUserName(profile) {
    const user =
        profile?.user ||
        profile?.data?.user ||
        profile?.data ||
        profile?.profile ||
        profile?.me ||
        profile;

    const name =
        user?.name ||
        user?.full_name ||
        user?.fullName ||
        user?.username ||
        user?.first_name ||
        user?.firstName ||
        user?.display_name ||
        user?.displayName ||
        profile?.name ||
        profile?.full_name ||
        "";

    return String(name).trim();
}

// ============================================
// DISPLAY GREETING
// ============================================

function displayDashboardGreeting(name) {
    const nameElement = document.getElementById("userName");

    if (!nameElement) return;

    nameElement.textContent = name || "Friend";

    // Ensure the name is visible
    nameElement.style.display = "inline";
    nameElement.style.visibility = "visible";
    nameElement.style.opacity = "1";
    nameElement.style.color = "#ffffff";
    nameElement.style.fontWeight = "bold";

    const welcomeCard = nameElement.closest(".welcome-card");

    if (welcomeCard) {
        welcomeCard.style.background =
            "linear-gradient(120deg, #176b4b, #123c32)";

        welcomeCard.style.color = "#ffffff";

        const heading = welcomeCard.querySelector("h1");

        if (heading) {
            heading.style.display = "block";
            heading.style.visibility = "visible";
            heading.style.opacity = "1";
            heading.style.color = "#ffffff";
            heading.style.fontSize = "27px";
            heading.style.marginBottom = "10px";
        }

        const paragraph = welcomeCard.querySelector("p");

        if (paragraph) {
            paragraph.style.color = "#ffffff";
            paragraph.style.visibility = "visible";
        }
    }
}

// ============================================
// LOAD DASHBOARD
// ============================================

async function loadDashboard() {
    // Show greeting immediately
    displayDashboardGreeting("Friend");

    try {
        const profile = await api("GET", "/api/me");

        console.log("Dashboard profile response:", profile);

        const userName = getDashboardUserName(profile);

        displayDashboardGreeting(userName || "Friend");

        await loadFinancialSummary();
        await loadRecentTransactions();
        await loadSavingsGoals();

    } catch (error) {
        console.error("Dashboard loading error:", error);

        displayDashboardGreeting("Friend");

        const message = dashboardText(
            "load_error",
            "Unable to load dashboard information. Please log in and try again.",
            "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಮಾಹಿತಿಯನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಲಾಗಿನ್ ಮಾಡಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ."
        );

        const list = document.getElementById("recentTransactionsList");

        if (list) {
            list.textContent = message;
        }
    }
}

// ============================================
// FINANCIAL SUMMARY
// ============================================

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

// ============================================
// RECENT TRANSACTIONS
// ============================================

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
            "Unable to load transactions. Please log in and try again.",
            "ವಹಿವಾಟುಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಲಾಗಿನ್ ಮಾಡಿ."
        );
    }
}

function renderRecentTransactions() {
    const container = document.getElementById("recentTransactionsList");

    if (!container) return;

    const recent = dashboardEntries.slice(0, 5);

    if (recent.length === 0) {
        container.textContent = financeText("no_transactions");
        return;
    }

    container.innerHTML = recent.map(entry => {
        const isIncome = entry.type === "income";

        const typeLabel = isIncome
            ? financeText("income")
            : financeText("expense");

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
                    <strong>
                        ${escapeDashboardHTML(entry.category || typeLabel)}
                    </strong>

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

// ============================================
// WEEKLY INCOME VS EXPENSE CHART
// ============================================

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
                {
                    day: "numeric",
                    month: "short"
                }
            )
        );

        const dayEntries = dashboardEntries.filter(entry =>
            String(entry.date || "").slice(0, 10) === dateKey
        );

        const income = dayEntries
            .filter(entry => entry.type === "income")
            .reduce((sum, entry) =>
                sum + Number(entry.amount || 0), 0
            );

        const expense = dayEntries
            .filter(entry => entry.type === "expense")
            .reduce((sum, entry) =>
                sum + Number(entry.amount || 0), 0
            );

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

// ============================================
// SAVINGS GOALS
// ============================================

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
            "Unable to load savings goals.",
            "ಉಳಿತಾಯ ಗುರಿಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ."
        );
    }
}

function renderSavingsGoals() {
    const container = document.getElementById("goalsList");

    if (!container) return;

    if (dashboardGoals.length === 0) {
        container.textContent = dashboardText(
            "no_goals",
            "You haven't created any savings goals yet. Start your first goal above!",
            "ನೀವು ಇನ್ನೂ ಯಾವುದೇ ಉಳಿತಾಯ ಗುರಿಗಳನ್ನು ರಚಿಸಿಲ್ಲ. ನಿಮ್ಮ ಮೊದಲ ಗುರಿಯನ್ನು ರಚಿಸಿ!"
        );
        return;
    }

    container.innerHTML = dashboardGoals.map(goal => {
        const title = goal.title || goal.name ||
            dashboardText("goal_default", "Savings Goal", "ಉಳಿತಾಯ ಗುರಿ");

        const target = Number(
            goal.target_amount ?? goal.target ?? 0
        );

        const saved = Number(
            goal.saved_amount ?? goal.saved ?? goal.current_amount ?? 0
        );

        const percent = Math.min(
            100,
            Math.max(
                0,
                Number(goal.percent ?? (
                    target > 0 ? saved / target * 100 : 0
                ))
            )
        );

        return `
            <div class="goal-card">
                <h3>${escapeDashboardHTML(title)}</h3>

                <p>
                    ${escapeDashboardHTML(
                        dashboardText("saved_label", "Saved:", "ಉಳಿಸಿದ ಮೊತ್ತ:")
                    )}
                    ${escapeDashboardHTML(formatDashboardMoney(saved))}
                </p>

                <p>
                    ${escapeDashboardHTML(
                        dashboardText("target_label", "Target:", "ಗುರಿ ಮೊತ್ತ:")
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
                        dashboardText("progress", "Progress:", "ಪ್ರಗತಿ:")
                    )}
                    ${Math.round(percent)}%
                </p>

                ${goal.deadline ? `
                    <p>
                        ${escapeDashboardHTML(
                            dashboardText("deadline_label", "Deadline:", "ಕೊನೆಯ ದಿನಾಂಕ:")
                        )}
                        ${escapeDashboardHTML(goal.deadline)}
                    </p>
                ` : ""}

                <div class="goal-actions">
                    <button type="button"
                        data-goal-action="contribute"
                        data-goal-id="${escapeDashboardHTML(goal.id)}">
                        ${escapeDashboardHTML(financeText("add_money"))}
                    </button>

                    <button type="button"
                        class="delete-goal"
                        data-goal-action="delete"
                        data-goal-id="${escapeDashboardHTML(goal.id)}">
                        ${escapeDashboardHTML(
                            dashboardText("delete_goal", "Delete", "ಅಳಿಸಿ")
                        )}
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

// ============================================
// CREATE SAVINGS GOAL
// ============================================

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
            "Please enter valid goal details.",
            "ದಯವಿಟ್ಟು ಸರಿಯಾದ ಗುರಿ ವಿವರಗಳನ್ನು ನಮೂದಿಸಿ."
        );
        return;
    }

    message.textContent = dashboardText(
        "creating_goal",
        "Creating your goal...",
        "ನಿಮ್ಮ ಗುರಿಯನ್ನು ರಚಿಸಲಾಗುತ್ತಿದೆ..."
    );

    try {
        await api("POST", "/api/goals", {
            title: title,
            target_amount: target,
            deadline: deadline || null
        });

        message.textContent = dashboardText(
            "goal_created",
            "Savings goal created successfully!",
            "ಉಳಿತಾಯ ಗುರಿಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ರಚಿಸಲಾಗಿದೆ!"
        );

        document.getElementById("goalForm").reset();

        await loadSavingsGoals();

    } catch (error) {
        console.error("Create goal error:", error);

        message.textContent = error.message ||
            dashboardText(
                "goal_create_error",
                "Unable to create savings goal.",
                "ಉಳಿತಾಯ ಗುರಿಯನ್ನು ರಚಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ."
            );
    }
}

// ============================================
// GOAL CONTRIBUTION AND DELETE
// ============================================

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
                "How much money would you like to add?",
                "ನೀವು ಎಷ್ಟು ಹಣವನ್ನು ಸೇರಿಸಲು ಬಯಸುತ್ತೀರಿ?"
            )
        ));

        if (!Number.isFinite(amount) || amount <= 0) {
            alert(dashboardText(
                "invalid_amount",
                "Please enter a valid amount.",
                "ದಯವಿಟ್ಟು ಸರಿಯಾದ ಮೊತ್ತವನ್ನು ನಮೂದಿಸಿ."
            ));
            return;
        }

        try {
            await api("POST", `/api/goals/${goalId}/contribute`, {
                amount: amount
            });

            alert(dashboardText(
                "contribution_success",
                "Money added to your savings goal successfully!",
                "ನಿಮ್ಮ ಉಳಿತಾಯ ಗುರಿಗೆ ಹಣವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ!"
            ));

            await loadSavingsGoals();

        } catch (error) {
            console.error("Goal contribution error:", error);

            alert(error.message || dashboardText(
                "contribution_error",
                "Unable to add money.",
                "ಹಣವನ್ನು ಸೇರಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ."
            ));
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
                "ಈ ಉಳಿತಾಯ ಗುರಿಯನ್ನು ಅಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿದ್ದೀರಾ?"
            ) + " " + (goal?.title || "")
        );

        if (!confirmed) return;

        try {
            await api("DELETE", `/api/goals/${goalId}`);

            alert(dashboardText(
                "delete_success",
                "Savings goal deleted successfully.",
                "ಉಳಿತಾಯ ಗುರಿಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಅಳಿಸಲಾಗಿದೆ."
            ));

            await loadSavingsGoals();

        } catch (error) {
            console.error("Delete goal error:", error);

            alert(error.message || dashboardText(
                "delete_error",
                "Unable to delete goal.",
                "ಗುರಿಯನ್ನು ಅಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ."
            ));
        }
    }
}

// ============================================
// LANGUAGE CHANGE
// ============================================

document.addEventListener("languageChanged", function() {
    renderRecentTransactions();
    renderSavingsGoals();
    renderWeeklyChart();
});

// ============================================
// INITIALIZE DASHBOARD
// ============================================

document.addEventListener("DOMContentLoaded", function() {
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
