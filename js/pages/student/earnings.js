import { setActiveNav, wireLogout } from "../../components/navbar.js";
import { $ } from "../../utils/dom.js";
import { authService } from "../../services/auth.service.js";

const MOCK_TRANSACTIONS = [
  {
    id: 1,
    title: "Event Crew - Career Fair 2026",
    date: "2026-03-20",
    amount: 150.00,
    type: "both",
    status: "released",
    badgeClass: "completed",
    typeLabel: "Salary + Commitment"
  },
  {
    id: 2,
    title: "Library Assistant (IRC)",
    date: "2026-03-15",
    amount: 200.00,
    type: "salary",
    status: "released",
    badgeClass: "completed",
    typeLabel: "Salary"
  },
  {
    id: 3,
    title: "Social Media Creator",
    date: "2026-03-22",
    amount: 300.00,
    type: "salary",
    status: "pending",
    badgeClass: "pending",
    typeLabel: "Salary"
  },
  {
    id: 4,
    title: "Lab Assistant - Chemistry Dept",
    date: "2026-03-10",
    amount: 20.00,
    type: "commitment",
    status: "refund",
    badgeClass: "refunded",
    typeLabel: "Commitment Fee"
  },
  {
    id: 5,
    title: "Research Participant",
    date: "2026-03-05",
    amount: 50.00,
    type: "salary",
    status: "unpaid",
    badgeClass: "unpaid",
    typeLabel: "Salary"
  },
  {
    id: 6,
    title: "Poster Design - Tech Conf",
    date: "2026-03-24",
    amount: 15.00,
    type: "commitment",
    status: "pending",
    badgeClass: "held",
    typeLabel: "Commitment Fee"
  },
  {
    id: 7,
    title: "Tutor Session - Calculus",
    date: "2026-03-01",
    amount: 100.00,
    type: "salary",
    status: "cancel",
    badgeClass: "cancelled",
    typeLabel: "Salary"
  }
];

function renderTransactions(list) {
  const container = $("#earningsList");
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `<p class="muted" style="text-align:center; padding: 20px;">No transactions match your filters.</p>`;
    return;
  }

  container.innerHTML = list.map(t => {
    const isPositive = ["released", "refund"].includes(t.status);
    const color = t.status === "cancel" ? "#B91C1C" : (isPositive ? "#15803D" : "#B45309");
    const prefix = isPositive ? "+ " : "";

    return `
      <div class="card pad" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <div>
          <h3 style="margin:0;">${t.title}</h3>
          <p class="muted" style="margin:4px 0 0 0;">Date: ${t.date}</p>
          <span class="badge outline" style="font-size: 10px; margin-top: 4px;">${t.typeLabel}</span>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: bold; color: ${color};">${prefix}RM ${t.amount.toFixed(2)}</div>
          <span class="badge ${t.badgeClass}">${t.status.charAt(0).toUpperCase() + t.status.slice(1)}</span>
        </div>
      </div>
    `;
  }).join("");
}

function filterData() {
  const typeVal = $("#typeFilter").value;
  const statusVal = $("#statusFilter").value;

  const filtered = MOCK_TRANSACTIONS.filter(t => {
    const matchType = typeVal === "all" || t.type === typeVal;
    const matchStatus = statusVal === "all" || t.status === statusVal;
    return matchType && matchStatus;
  });

  renderTransactions(filtered);
}

async function init() {
  await authService.requireAuth("student");
  setActiveNav();
  wireLogout();

  renderTransactions(MOCK_TRANSACTIONS);

  $("#typeFilter").addEventListener("change", filterData);
  $("#statusFilter").addEventListener("change", filterData);
}

document.addEventListener("DOMContentLoaded", init);
