
"use strict";

const notificationContainer = document.getElementById("notifications");

function formatNotificationDate(date) {
    return date.toLocaleDateString("en-IN");
}

function getTodayKey() {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getMonthKey() {
    const date = new Date();

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getBudgetKey() {
    const date = new Date();

    return `arthamitra_budget_${date.getFullYear()}_${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getEntries(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.entries)) return payload.entries;
    return [];
}

function getGoals(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.goals)) return payload.goals;
    return [];
}

function addNotification(message, type = "info") {
    const item = document.createElement("div");

    item.className = "notification-item";
    item.textContent = message;

    item.style.padding = "14px";
    item.style.marginBottom = "10px";
    item.style.borderRadius = "12px";
    item.style.background =
        type === "warning" ? "#fff4e5" : "#eaf7ef";

    item.style.color =
        type === "warning" ? "#9a5700" : "#176b4b";

    item.style.border =
        "1px solid " +
        (type === "warning" ? "#f2d29e" : "#cce9d6");

    notificationContainer.appendChild(item);
}

function checkDailyReminders(entries) {
    const today = getTodayKey();

    const hasIncome = entries.some(entry =>
        entry.type === "income" &&
        entry.date === today
    );

    const hasExpense = entries.some(entry =>
        entry.type === "expense" &&
        entry.date === today
    );

    if (!hasIncome) {
        addNotification(
            "💰 Remember to record your income for today.",
            "info"
        );
    }

    if (!hasExpense) {
        addNotification(
            "💸 Remember to record your expenses for today.",
            "info"
        );
    }
}

function checkMonthlyBudget(entries) {
    const budget = Number(localStorage.getItem(getBudgetKey())) || 0;

    if (budget <= 0) return;

    const month = getMonthKey();

    const expenses = entries
        .filter(entry =>
            entry.type === "expense" &&
            String(entry.date || "").startsWith(month)
        )
        .reduce((total, entry) =>
            total + Number(entry.amount || 0), 0
        );

    const percentage = (expenses / budget) * 100;

    if (percentage >= 100) {
        addNotification(
            "🚨 Your monthly budget has been exceeded! Review your spending.",
            "warning"
        );
    } else if (percentage >= 80) {
        addNotification(
            "⚠️ Budget alert: You have spent " +
            Math.round(percentage) +
            "% of your monthly budget.",
            "warning"
        );
    }
}

function checkGoalDeadlines(goals) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    goals.forEach(goal => {
        if (!goal.deadline) return;

        const deadline = new Date(goal.deadline + "T00:00:00");

        if (Number.isNaN(deadline.getTime())) return;

        const daysLeft = Math.ceil(
            (deadline.getTime() - today.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        if (daysLeft < 0) {
            addNotification(
                `⏰ The deadline for "${goal.title}" has passed.`,
                "warning"
            );
        } else if (daysLeft <= 7) {
            addNotification(
                `🎯 Your goal "${goal.title}" deadline is approaching. ${daysLeft} day(s) remaining.`,
                "warning"
            );
        }
    });
}

async function loadNotifications() {
    if (!notificationContainer) return;

    notificationContainer.replaceChildren();

    try {
        const [entriesResponse, goalsResponse] = await Promise.all([
            api("GET", "/api/entries?days=3650"),
            api("GET", "/api/goals")
        ]);

        const entries = getEntries(entriesResponse);
        const goals = getGoals(goalsResponse);

        checkDailyReminders(entries);
        checkMonthlyBudget(entries);
        checkGoalDeadlines(goals);

        if (notificationContainer.children.length === 0) {
            notificationContainer.textContent =
                "🎉 You're all caught up!";
        }

    } catch (error) {
        console.error("Notification loading error:", error);

        notificationContainer.textContent =
            "Unable to load notifications. Please refresh.";
    }
}

loadNotifications();

async function loadNotifications() {
    const container = document.getElementById("notifications");
    if (!container) return;

    container.replaceChildren();

    function addNotification(message, type = "info") {
        const item = document.createElement("div");
        item.className = "notification-item";
        item.textContent = message;
        item.style.padding = "12px";
        item.style.marginBottom = "10px";
        item.style.borderRadius = "8px";
        item.style.background = type === "warning" ? "#fff3cd" : "#e8f5e9";
        container.appendChild(item);
    }

    try {
        const [entriesResult, goalsResult] = await Promise.all([
            api("GET", "/api/entries?days=3650"),
            api("GET", "/api/goals")
        ]);

        const entries = Array.isArray(entriesResult)
            ? entriesResult
            : (entriesResult.entries || []);

        const goals = Array.isArray(goalsResult)
            ? goalsResult
            : (goalsResult.goals || []);

        const today = new Date().toISOString().slice(0, 10);
        const month = today.slice(0, 7);

        const todayIncome = entries.some(entry =>
            entry.type === "income" && entry.date === today
        );

        const todayExpense = entries.some(entry =>
            entry.type === "expense" && entry.date === today
        );

        if (!todayIncome) {
            addNotification("💰 Remember to record your income today.");
        }

        if (!todayExpense) {
            addNotification("📝 Remember to record your expenses today.");
        }

        const budget = Number(
            localStorage.getItem("arthamitra_budget_" + month) || 0
        );

        const monthlyExpenses = entries
            .filter(entry =>
                entry.type === "expense" &&
                String(entry.date).startsWith(month)
            )
            .reduce((total, entry) => total + Number(entry.amount || 0), 0);

        if (budget > 0) {
            const percentage = monthlyExpenses / budget * 100;

            if (percentage >= 100) {
                addNotification("🚨 You have exceeded your monthly budget!", "warning");
            } else if (percentage >= 80) {
                addNotification("⚠️ You have used 80% or more of your monthly budget.", "warning");
            }
        }

        goals.forEach(goal => {
            if (!goal.deadline) return;

            const daysLeft = Math.ceil(
                (new Date(goal.deadline) - new Date(today)) / 86400000
            );

            if (daysLeft < 0) {
                addNotification("⏰ Deadline passed for your goal: " + goal.title, "warning");
            } else if (daysLeft <= 7) {
                addNotification("⏳ Your goal deadline is approaching: " + goal.title, "warning");
            }
        });

        if (container.children.length === 0) {
            addNotification("🎉 You're all caught up! No new reminders.");
        }

    } catch (error) {
        console.error("Notification error:", error);
        addNotification("Unable to load notifications. Please refresh.", "warning");
    }
}

loadNotifications();

