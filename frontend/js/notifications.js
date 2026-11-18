
"use strict";

// ======================================
// ARTHAMITRA NOTIFICATIONS
// ======================================

const notificationContainer =
    document.getElementById("notifications");

// ======================================
// TRANSLATION
// ======================================

function notificationText(key, fallback) {
    if (typeof t !== "function") return fallback;

    return t("notifications." + key, fallback) || fallback;
}

// ======================================
// DATE HELPERS
// ======================================

function notificationToday() {
    const date = new Date();

    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-");
}

function notificationMonth() {
    const date = new Date();

    return `${date.getFullYear()}-${String(
        date.getMonth() + 1
    ).padStart(2, "0")}`;
}

function notificationBudgetKey() {
    const date = new Date();

    return `arthamitra_budget_${date.getFullYear()}_${String(
        date.getMonth() + 1
    ).padStart(2, "0")}`;
}

// ======================================
// RESPONSE HELPERS
// ======================================

function notificationEntries(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.entries)) return payload.entries;

    return [];
}

function notificationGoals(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.goals)) return payload.goals;

    return [];
}

// ======================================
// DISPLAY NOTIFICATION
// ======================================

function addNotification(message, type = "info") {
    if (!notificationContainer) return;

    const item = document.createElement("div");

    item.className = "notification-item";
    item.textContent = message;

    if (type === "warning") {
        item.classList.add("warning");
    }

    notificationContainer.appendChild(item);
}

// ======================================
// DAILY REMINDERS
// ======================================

function checkDailyReminders(entries) {
    const today = notificationToday();

    const hasIncome = entries.some(entry =>
        entry.type === "income" &&
        String(entry.date || "").slice(0, 10) === today
    );

    const hasExpense = entries.some(entry =>
        entry.type === "expense" &&
        String(entry.date || "").slice(0, 10) === today
    );

    if (!hasIncome) {
        addNotification(
            notificationText(
                "income_reminder",
                "💰 Remember to record your income for today."
            )
        );
    }

    if (!hasExpense) {
        addNotification(
            notificationText(
                "expense_reminder",
                "💸 Remember to record your expenses for today."
            )
        );
    }
}

// ======================================
// MONTHLY BUDGET ALERTS
// ======================================

function checkMonthlyBudget(entries) {
    const budget = Number(
        localStorage.getItem(notificationBudgetKey())
    ) || 0;

    if (budget <= 0) return;

    const month = notificationMonth();

    const expenses = entries
        .filter(entry =>
            entry.type === "expense" &&
            String(entry.date || "").startsWith(month)
        )
        .reduce(
            (total, entry) =>
                total + Number(entry.amount || 0),
            0
        );

    const percentage = expenses / budget * 100;

    if (percentage >= 100) {
        addNotification(
            notificationText(
                "budget_exceeded",
                "🚨 Your monthly budget has been exceeded!"
            ),
            "warning"
        );
    } else if (percentage >= 80) {
        addNotification(
            notificationText(
                "budget_warning",
                "⚠️ You have spent 80% or more of your monthly budget."
            ),
            "warning"
        );
    }
}

// ======================================
// SAVINGS GOAL DEADLINE ALERTS
// ======================================

function checkGoalDeadlines(goals) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    goals.forEach(goal => {
        if (!goal.deadline) return;

        const deadline = new Date(
            goal.deadline + "T00:00:00"
        );

        if (Number.isNaN(deadline.getTime())) return;

        const saved = Number(goal.saved || 0);
        const target = Number(goal.target || 0);

        // Do not remind users about completed goals.
        if (target > 0 && saved >= target) return;

        const daysLeft = Math.ceil(
            (deadline.getTime() - today.getTime()) /
            86400000
        );

        if (daysLeft < 0) {
            addNotification(
                notificationText(
                    "goal_overdue",
                    "⏰ The deadline for this savings goal has passed."
                ) + " " + goal.title,
                "warning"
            );
        } else if (daysLeft <= 7) {
            addNotification(
                notificationText(
                    "goal_approaching",
                    "🎯 Your savings goal deadline is approaching."
                ) + " " + goal.title,
                "warning"
            );
        }
    });
}

// ======================================
// LOAD NOTIFICATIONS
// ======================================

async function loadNotifications() {
    if (!notificationContainer) return;

    notificationContainer.replaceChildren();

    try {
        const [entriesResponse, goalsResponse] =
            await Promise.all([
                api("GET", "/api/entries?days=3650"),
                api("GET", "/api/goals")
            ]);

        const entries = notificationEntries(entriesResponse);
        const goals = notificationGoals(goalsResponse);

        checkDailyReminders(entries);
        checkMonthlyBudget(entries);
        checkGoalDeadlines(goals);

        if (notificationContainer.children.length === 0) {
            notificationContainer.textContent =
                notificationText(
                    "all_caught_up",
                    "🎉 You're all caught up! No new reminders."
                );
        }

    } catch (error) {
        console.error("Notification loading error:", error);

        notificationContainer.textContent =
            notificationText(
                "load_error",
                "Unable to load notifications. Please refresh."
            );
    }
}

// ======================================
// LANGUAGE CHANGE
// ======================================

document.addEventListener("languageChanged", function() {
    loadNotifications();
});

// ======================================
// INITIALIZE
// ======================================

loadNotifications();
