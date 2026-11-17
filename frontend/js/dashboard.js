
// ======================================
// ARTHAMITRA DASHBOARD
// ======================================

async function loadDashboard() {
    try {
        const profile = await api("GET", "/api/me");
        const user = profile.user || profile;

        document.getElementById("userName").textContent =
            user.name || "Friend";

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
        console.error("Dashboard error:", error);

        if (
            error.message.includes("401") ||
            error.message.toLowerCase().includes("login")
        ) {
            window.location.href = "/";
            return;
        }

        document.getElementById("notifications").textContent =
            "Unable to load dashboard data. Please refresh.";
    }
}

// FORMAT MONEY
function formatMoney(amount) {
    return "₹" + Number(amount || 0).toLocaleString("en-IN");
}

// ======================================
// CREATE SAVINGS GOAL
// ======================================

const goalForm = document.getElementById("goalForm");

goalForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const title = document.getElementById("goalTitle").value.trim();
    const target = Number(document.getElementById("goalTarget").value);
    const deadline = document.getElementById("goalDeadline").value;
    const message = document.getElementById("goalMessage");

    if (!title || !Number.isFinite(target) || target <= 0) {
        message.textContent = "Please enter valid goal details.";
        message.style.color = "#b42318";
        return;
    }

    try {
        message.textContent = "Creating your goal...";
        message.style.color = "#176b4b";

        const body = { title, target };

        if (deadline) {
            body.deadline = deadline;
        }

        await api("POST", "/api/goals", body);

        message.textContent =
            "Savings goal created successfully! 🎉";

        goalForm.reset();
        await loadGoals();

    } catch (error) {
        console.error("Create goal error:", error);

        message.textContent =
            error.message || "Unable to create savings goal.";

        message.style.color = "#b42318";
    }
});

// ======================================
// LOAD SAVINGS GOALS
// ======================================

async function loadGoals() {
    const container = document.getElementById("goalsContainer");

    try {
        const result = await api("GET", "/api/goals");

        const goals = Array.isArray(result)
            ? result
            : (result.goals || []);

        container.replaceChildren();

        if (goals.length === 0) {
            container.textContent =
                "You haven't created any savings goals yet. Start your first goal above!";
            return;
        }

        goals.forEach(goal => {
            const card = document.createElement("div");
            card.className = "goal-card";

            const title = document.createElement("h3");
            title.textContent = "🎯 " + (goal.title || "Savings Goal");

            const saved = Number(goal.saved || 0);
            const target = Number(goal.target || 0);

            const percent = target > 0
                ? Math.min(100, Math.max(0, saved / target * 100))
                : 0;

            const amounts = document.createElement("p");
            amounts.textContent =
                "Saved: " + formatMoney(saved) +
                " / Target: " + formatMoney(target);

            const progressBg = document.createElement("div");
            progressBg.className = "goal-progress-bg";

            const progressFill = document.createElement("div");
            progressFill.className = "goal-progress-fill";
            progressFill.style.width = percent + "%";

            progressBg.appendChild(progressFill);

            const progressText = document.createElement("p");
            progressText.textContent =
                "Progress: " + Math.round(percent) + "%";

            const deadline = document.createElement("p");

            if (goal.deadline) {
                deadline.textContent = "Deadline: " + goal.deadline;
            }

            const actions = document.createElement("div");
            actions.className = "goal-actions";

            const addButton = document.createElement("button");
            addButton.textContent = "➕ Add Money";
            addButton.disabled = percent >= 100;

            addButton.addEventListener("click", () => {
                contributeToGoal(goal.id, goal.title);
            });

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "🗑️ Delete";
            deleteButton.className = "delete-goal";

            deleteButton.addEventListener("click", () => {
                deleteGoal(goal.id, goal.title);
            });

            actions.append(addButton, deleteButton);

            if (percent >= 100) {
                const completed = document.createElement("p");
                completed.textContent = "🎉 Goal completed!";
                completed.style.color = "#176b4b";
                card.appendChild(completed);
            }

            card.append(
                title,
                amounts,
                progressBg,
                progressText,
                deadline,
                actions
            );

            container.appendChild(card);
        });

    } catch (error) {
        console.error("Load goals error:", error);
        container.textContent = "Unable to load savings goals.";
    }
}

// ======================================
// ADD MONEY TO SAVINGS GOAL
// ======================================

async function contributeToGoal(goalId, goalTitle) {
    const amountInput = prompt(
        "How much money do you want to add to " +
        goalTitle + "? (₹)"
    );

    if (amountInput === null) return;

    const amount = Number(amountInput);

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    try {
        await api(
            "POST",
            "/api/goals/" + encodeURIComponent(goalId) + "/contribute",
            { amount }
        );

        alert("Money added to your savings goal successfully! 🎉");

        await loadGoals();

    } catch (error) {
        console.error("Contribution error:", error);
        alert(error.message || "Unable to add money.");
    }
}

// ======================================
// DELETE SAVINGS GOAL
// ======================================

async function deleteGoal(goalId, goalTitle) {
    const confirmed = confirm(
        "Are you sure you want to delete the goal: " +
        goalTitle + "?"
    );

    if (!confirmed) return;

    try {
        await api(
            "DELETE",
            "/api/goals/" + encodeURIComponent(goalId)
        );

        alert("Savings goal deleted successfully.");

        await loadGoals();

    } catch (error) {
        console.error("Delete goal error:", error);
        alert(error.message || "Unable to delete goal.");
    }
}

// ======================================
// DASHBOARD NAVIGATION
// ======================================

function openFeature(feature) {
    switch (feature) {

        case "home":
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
            break;

        case "income":
            window.location.href = "finance.html?type=income";
            break;

        case "expense":
            window.location.href = "finance.html?type=expense";
            break;

        case "finance":
            window.location.href = "finance.html";
            break;

        case "budget":
            window.location.href = "budget.html";
            break;

        case "goals":
            document.getElementById("goalsList")
                ?.scrollIntoView({ behavior: "smooth" });
            break;

        // FIXED GOVERNMENT SCHEMES NAVIGATION
        case "schemes":
            window.location.href = "schemes.html";
            break;

        case "lessons":
            document.getElementById("lessons")
                ?.scrollIntoView({ behavior: "smooth" });
            break;

        case "profile":
            window.location.href = "index.html";
            break;

        default:
            alert("This feature will be added soon!");
    }
}

// ======================================
// LOGOUT
// ======================================

document.getElementById("logoutBtn").addEventListener(
    "click",
    async () => {
        try {
            await api("POST", "/api/logout");
            window.location.href = "/";

        } catch (error) {
            alert("Unable to logout. Please try again.");
        }
    }
);

// ======================================
// INITIALIZE DASHBOARD
// ======================================

loadDashboard();
