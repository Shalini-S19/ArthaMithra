
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

// Format currency
function formatMoney(amount) {
    return "₹" + Number(amount || 0).toLocaleString("en-IN");
}

// Load savings goals
async function loadGoals() {
    const container = document.getElementById("goalsList");

    try {
        const result = await api("GET", "/api/goals");
        const goals = result.goals || [];

        container.replaceChildren();

        if (goals.length === 0) {
            container.textContent =
                "You haven't created any savings goals yet.";
            return;
        }

        goals.forEach(goal => {
            const card = document.createElement("div");
            card.className = "goal-card";

            const title = document.createElement("h3");
            title.textContent = goal.title || "Savings goal";

            const target = document.createElement("p");
            target.textContent =
                "Target: " + formatMoney(goal.target);

            const progress = document.createElement("p");
            progress.textContent =
                "Progress: " + Number(goal.percent || 0) + "%";

            card.append(title, target, progress);
            container.appendChild(card);
        });

    } catch (error) {
        console.error("Goals error:", error);
        container.textContent = "Unable to load savings goals.";
    }
}

// Dashboard navigation
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
            window.location.href = "dashboard.html#goalsList";
            break;

        case "schemes":
            document.getElementById("schemes")?.scrollIntoView({
                behavior: "smooth"
            });
            break;

        case "profile":
            window.location.href = "index.html";
            break;

        default:
            alert("This feature will be added soon!");
    }
}

// Logout
document.getElementById("logoutBtn").addEventListener("click", async () => {
    try {
        await api("POST", "/api/logout");
        window.location.href = "/";
    } catch (error) {
        alert("Unable to logout. Please try again.");
    }
});

// Load dashboard
loadDashboard();
