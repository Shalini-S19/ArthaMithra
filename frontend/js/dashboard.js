
/* =====================================
   ARTHAMITHRA DASHBOARD DESIGN
===================================== */

.dashboard-container {
    width: min(1100px, 92%);
    margin: 28px auto 110px;
}

/* Dashboard sections */

.dashboard-section {
    background: #ffffff;
    padding: 24px;
    margin-bottom: 26px;
    border-radius: 18px;
    border: 1px solid #e2eee6;
    box-shadow: 0 5px 18px rgba(18, 60, 50, 0.06);
}

.dashboard-container section > h2 {
    color: #123c32;
    font-size: 21px;
    margin-bottom: 18px;
}

/* Welcome card */

.dashboard-container > .dashboard-section:first-child {
    background: linear-gradient(120deg, #176b4b, #123c32);
    color: white;
    padding: 32px;
}

.dashboard-container > .dashboard-section:first-child h1 {
    font-size: 29px;
    margin-bottom: 8px;
}

.dashboard-container > .dashboard-section:first-child p {
    color: #d4e9dd;
    margin: 0;
}

/* Financial summary */

.summary-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
}

.summary-card {
    background: #ffffff;
    border: 1px solid #e1ece5;
    border-radius: 15px;
    padding: 22px;
    box-shadow: 0 4px 14px rgba(18, 60, 50, 0.05);
}

.summary-card h3 {
    color: #123c32;
    font-size: 17px;
    margin-bottom: 12px;
}

.summary-card p {
    color: #63796e;
    font-size: 14px;
    margin-top: 10px;
}

/* Quick actions - FIXED CLASS NAME */

.quick-actions {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 13px;
}

.quick-actions button,
.dashboard-section > button {
    background: #e8f5ed;
    color: #176b4b;
    border: 1px solid #c8e2d1;
    padding: 15px 12px;
    border-radius: 11px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    transition: 0.2s ease;
}

.quick-actions button:hover,
.dashboard-section > button:hover {
    background: #176b4b;
    color: white;
    transform: translateY(-2px);
}

/* Chart */

#weeklyChart {
    position: relative;
    width: 100%;
    height: 320px;
    margin-top: 15px;
}

#weeklyFinanceChart {
    width: 100% !important;
    height: 100% !important;
}

/* Recent transactions */

#recentTransactionsList > div {
    transition: 0.2s ease;
}

#recentTransactionsList > div:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(18, 60, 50, 0.08);
}

/* Savings goals */

#goalForm {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
    margin-bottom: 20px;
}

#goalForm input {
    width: 100%;
    padding: 13px;
    border: 1px solid #d5e5da;
    border-radius: 9px;
    font-size: 14px;
}

#goalForm input:focus {
    outline: none;
    border-color: #176b4b;
}

#goalForm button {
    grid-column: 1 / -1;
    background: #176b4b;
    color: white;
    border: none;
    padding: 14px;
    border-radius: 10px;
    font-weight: bold;
    cursor: pointer;
}

.goal-card {
    padding: 20px;
    margin: 15px 0;
    border: 1px solid #dce9e0;
    border-radius: 14px;
    background: #fafffb;
}

.goal-card h3 {
    color: #123c32;
    margin-bottom: 12px;
}

.goal-progress-bg {
    width: 100%;
    height: 10px;
    background: #e2eee6;
    border-radius: 20px;
    overflow: hidden;
    margin: 12px 0;
}

.goal-progress-fill {
    height: 100%;
    background: #26966b;
    border-radius: 20px;
}

.goal-actions {
    display: flex;
    gap: 10px;
    margin-top: 14px;
}

.goal-actions button {
    padding: 9px 15px;
    border: none;
    border-radius: 8px;
    background: #176b4b;
    color: white;
    cursor: pointer;
}

.goal-actions .delete-goal {
    background: #b42318;
}

/* Bottom navigation */

.bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    background: white;
    border-top: 1px solid #dce9e0;
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 12px 5px;
    z-index: 100;
    box-shadow: 0 -3px 12px rgba(18, 60, 50, 0.05);
}

.bottom-nav button {
    border: none;
    background: transparent;
    color: #176b4b;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    padding: 7px;
}

/* Notifications */

#notificationsList {
    color: #456457;
    line-height: 1.8;
}

/* Responsive design */

@media (max-width: 750px) {

    .summary-grid {
        grid-template-columns: 1fr;
    }

    .quick-actions {
        grid-template-columns: repeat(2, 1fr);
    }

    #goalForm {
        grid-template-columns: 1fr;
    }

    .dashboard-container {
        width: 94%;
        margin-top: 18px;
    }

    .dashboard-section {
        padding: 18px;
    }

    .dashboard-container > .dashboard-section:first-child h1 {
        font-size: 23px;
    }

    #weeklyChart {
        height: 250px;
    }

    .bottom-nav button {
        font-size: 13px;
    }
}
