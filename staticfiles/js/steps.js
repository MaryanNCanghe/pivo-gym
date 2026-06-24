const $  = (sel) => document.querySelector(sel);
const isChartReady = () => typeof window.Chart !== "undefined";

function parseArray(raw, fallback) {
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) && arr.length ? arr : fallback;
  } catch {
    return fallback;
  }
}

function todayString() {
  return new Date().toISOString().split("T")[0];
}

function millisUntilMidnight() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  return midnight - now;
}

function initStepsUI() {
  const stepsEl   = $("#steps-count");
  const barEl     = $("#steps-progress");
  const goalEndEl = $("#steps-goal-end");
  const goalOut   = $("#stepsGoalOut");
  const form      = $("#stepsGoalForm");

  if (!stepsEl) return;

  const savedGoal = parseInt(localStorage.getItem("pivo_steps_goal") || "0", 10);
  if (savedGoal > 0) stepsEl.dataset.goal = savedGoal;

  let stepsToday = parseInt(stepsEl.dataset.steps || "0", 10);
  let stepsGoal  = parseInt(stepsEl.dataset.goal || "10000", 10);

  const lastDate = localStorage.getItem("pivo_steps_last_date");
  const today = todayString();

  if (lastDate !== today) {
    stepsToday = 0;
    stepsEl.dataset.steps = "0";
    localStorage.setItem("pivo_steps_last_date", today);
  }

  stepsEl.textContent = stepsToday.toLocaleString();
  goalOut.textContent = stepsGoal.toLocaleString();
  goalEndEl.textContent = stepsGoal.toLocaleString();

  const pct = Math.round((stepsToday / Math.max(1, stepsGoal)) * 100);
  barEl.style.width = pct + "%";

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const newGoal = parseInt(fd.get("goal") || "0", 10);
    if (!newGoal || newGoal < 1000) return;

    localStorage.setItem("pivo_steps_goal", newGoal);
    stepsGoal = newGoal;

    goalOut.textContent = newGoal.toLocaleString();
    goalEndEl.textContent = newGoal.toLocaleString();

    const newPct = Math.round((stepsToday / newGoal) * 100);
    barEl.style.width = newPct + "%";

    form.reset();
  });

  setTimeout(() => {
    stepsEl.dataset.steps = "0";
    stepsEl.textContent = "0";
    barEl.style.width = "0%";
    localStorage.setItem("pivo_steps_last_date", todayString());

    setInterval(() => {
      stepsEl.dataset.steps = "0";
      stepsEl.textContent = "0";
      barEl.style.width = "0%";
      localStorage.setItem("pivo_steps_last_date", todayString());
    }, 86400000);

  }, millisUntilMidnight());
}

function initWeeklyChart() {
  const canvas = document.getElementById("weeklyChart");
  if (!canvas || typeof Chart === "undefined") return;

  const labels = JSON.parse(canvas.dataset.labels || '["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]');

  const rawSteps = JSON.parse(canvas.dataset.steps || "[]");
  const steps = Array.isArray(rawSteps) && rawSteps.length
    ? rawSteps
    : [0,0,0,0,0,0,0];

  while (steps.length < 7) steps.push(0);
  if (steps.length > 7) steps.length = 7;

  new Chart(canvas.getContext("2d"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Steps",
          data: steps,
          borderColor: "#8b9978",
          backgroundColor: "rgba(139,153,120,0.25)",
          tension: 0.35,
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } },
      scales: {
        y: {
          beginAtZero: true,
          min: 0,
          suggestedMax: Math.max(...steps, 1000),
          title: { display: true, text: "Steps" }
        }
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initStepsUI();
  initWeeklyChart();
});
