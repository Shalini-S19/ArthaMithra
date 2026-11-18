
// ======================================
// ARTHAMITRA DASHBOARD
// ======================================

"use strict";

// ======================================
// TRANSLATION HELPER
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

function showGoalMessage(message, isError = false) {
    const element = document.getElementById("goalMessage");
    if (!element) return;

    element.textContent = message;
    element.style.color = isError ? "#b42318" : "#176b4b";
}

// ======================================
// LOAD DASHBOARD
// ======================================

async function loadDashboard() {
    try {
        const profile = await api("GET", "/api/me");
        const user = profile.user || profile;

        const nameElement = document.getElementById("userName");

        if (nameElement) {
            nameElement.textContent = user.name || "Friend";
        }

        const summary = await api("GET", "/api/summary");
        const week = summary.this_week || {};

        document.getElementById("totalIncome").textContent =
            formatMoney(week.earned);

        document.getElementById("totalExpense").textContent =
            formatMoney(week.spent);

        document.getElementById("totalSavings").textContent =
            formatMoney(week.saved);

        await loadGoals();

    } catch (error) {
        console.error("Dashboard loading error:", error);

        const container = document.getElementById("goalsContainer");

        if (container) {
            container.textContent = dashboardText(
                "load_error",
                "Unable to load dashboard. Please try again."
            );
        }
    }
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
    const container = document.getElementById("goalsContainer");
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
    loadGoals();
});

// ======================================
// INITIALIZE DASHBOARD
// ======================================

loadDashboard();
