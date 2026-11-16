
async function loadDashboard() {
    try {
        // Check whether the user is logged in
        const profile = await api("GET", "/api/me");
        const user = profile.user || profile;

        document.getElementById("userName").textContent =
            user.name || "Friend";

        // Load weekly financial summary
        const summary = await api("GET", "/api/summary");
        const week = summary.this_week || {};

        document.getElementById("totalIncome").textContent =
            formatMoney(week.earned);

        document.getElementById("totalExpense").textContent =
            formatMoney(week.spent);

        document.getElementById("totalSavings").textContent =
            formatMoney(week.saved);

        // Load savings goals
        await loadGoals();

    } catch (error) {
        console.error("Dashboard error:", error);

        if (error.message.toLowerCase().includes("login") ||
            error.message.includes("401")) {
            window.location.href = "/";
            return;
        }

        document.getElementById("notifications").textContent =
            "Unable to load dashboard data. Please refresh the page.";
    }
}

function formatMoney(amount) {
    return "₹" + Number(amount || 0).toLocaleString("en-IN");
}

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
        container.textContent = "Unable to load savings goals.";
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

// Temporary navigation until we create the other screens
function openFeature(feature) {
    if (feature === "home") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
    }

    alert("The " + feature + " section will be added in the next steps!");
}

// Start dashboard
loadDashboard();
