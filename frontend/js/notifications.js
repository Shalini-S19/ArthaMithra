
const notificationContainer = document.getElementById("notifications");

function showNotification(message, type = "info") {
    const item = document.createElement("div");
    item.className = "notification-item";
    item.textContent = message;

    item.style.padding = "12px";
    item.style.marginBottom = "10px";
    item.style.borderRadius = "10px";
    item.style.background = type === "warning" ? "#fff3cd" : "#e9f7ef";
    item.style.color = "#183d32";

    notificationContainer.appendChild(item);
}

function getToday() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getCurrentMonth() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getBudgetKey() {
    const date = new Date();

    return `arthamitra_budget_${date.getFullYear()}_${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getEntriesArray(result) {
    return Array.isArray(result)
        ? result
        : (result.entries || []);
}

async function checkEntryReminders(entries) {
    const today = getToday();

    const todayIncome = entries.some(entry =>
        entry.type === "income" &&
        entry.date === today
    );

    const todayExpense = entries.some(entry =>
        entry.type === "expense" &&
        entry.date === today
    );

    if (!todayIncome) {
        showNotification(
            "💰 Remember to enter your income for today.",
            "warning"
        );
    }

    if (!todayExpense) {
        showNotification(
            "💸 Remember to update your expenses for today.",
            "warning"
        );
    }
}

function checkBudgetReminder(entries) {
    const budget = Number(localStorage.getItem(getBudgetKey())) || 0;

    if (budget <= 0) return;

    const currentMonth = getCurrentMonth();

    const expenses = entries
        .filter(entry =>
            entry.type === "expense" &&
            String(entry.date || "").startsWith(currentMonth)
        )
        .reduce((total, entry) =>
            total + Number(entry.amount || 0), 0
        );

    const percentage = (expenses / budget) * 100;

    if (percentage >= 100) {
        showNotification(
            "🚨 Your monthly budget has been exceeded!",
            "warning"
        );
    } else if (percentage >= 80) {
        showNotification(
            "⚠️ You have used 80% or more of your monthly budget.",
            "warning"
        );
    }
}

async function checkGoalReminders() {
    try {
        const result = await api("GET", "/api/goals");

        const goals = Array.isArray(result)
            ? result
            : (result.goals || []);

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
                showNotification(
                    `⏰ Your goal "${goal.title}" deadline has passed.`,
                    "warning"
                );
            } else if (daysLeft <= 7) {
                showNotification(
                    `🎯 Your goal "${goal.title}" is due in ${daysLeft} day(s).`,
                    "warning"
                );
            }
        });

    } catch (error) {
        console.error("Goal reminder error:", error);
    }
}

async function loadNotifications() {
    if (!notificationContainer) return;

    notificationContainer.replaceChildren();

    try {
        const result = await api("GET", "/api/entries?days=3650");
        const entries = getEntriesArray(result);

        await checkEntryReminders(entries);
        checkBudgetReminder(entries);
        await checkGoalReminders();

        if (notificationContainer.children.length === 0) {
            notificationContainer.textContent =
                "🎉 You're all caught up!";
        }

    } catch (error) {
        console.error("Notification error:", error);

        notificationContainer.textContent =
            "Unable to load notifications. Please refresh.";
    }
}

loadNotifications();
