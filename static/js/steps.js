document.addEventListener("DOMContentLoaded", () => {
  const stepsEl   = document.getElementById("steps-count");
  const barEl     = document.getElementById("steps-progress");
  const goalEndEl = document.getElementById("steps-goal-end");
  const goalOut   = document.getElementById("stepsGoalOut");
  const logForm   = document.getElementById("stepsLogForm");
  const goalForm  = document.getElementById("stepsGoalForm");
  const stepsSaved = document.getElementById("stepsSaved");

  if (!stepsEl) return;

  const csrf = () =>
    document.cookie.match(/csrftoken=([^;]+)/)?.[1] || "";

  let stepsToday = parseInt(stepsEl.dataset.steps || "0", 10);
  let stepsGoal  = parseInt(stepsEl.dataset.goal  || "10000", 10);

  function updateUI(steps, goal) {
    stepsToday = steps;
    stepsGoal  = goal || stepsGoal;

    stepsEl.textContent = stepsToday.toLocaleString();
    if (goalOut)   goalOut.textContent   = stepsGoal.toLocaleString();
    if (goalEndEl) goalEndEl.textContent = stepsGoal.toLocaleString();

    const pct = Math.min(100, Math.round((stepsToday / Math.max(1, stepsGoal)) * 100));
    if (barEl) barEl.style.width = pct + "%";
  }

  // Initial render from server-rendered values
  updateUI(stepsToday, stepsGoal);

  // ── Log steps ─────────────────────────────────────────────────────
  logForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("stepsInput");
    const val = parseInt(input.value || "0", 10);
    if (!val || val < 1) return;

    try {
      const res = await fetch("/steps/add/", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRFToken": csrf() },
        body: JSON.stringify({ steps: val }),
      });
      const data = await res.json();
      if (data.ok) {
        updateUI(data.steps, stepsGoal);
        input.value = "";
        if (stepsSaved) {
          stepsSaved.hidden = false;
          setTimeout(() => { stepsSaved.hidden = true; }, 2000);
        }
      }
    } catch (err) {
      console.error("Steps log error:", err);
    }
  });

  // ── Save goal (persists to DB via meal_goals endpoint) ────────────
  goalForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const val = parseInt(new FormData(goalForm).get("goal") || "0", 10);
    if (!val || val < 1000) return;

    try {
      await fetch("/meals/goals/", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRFToken": csrf() },
        body: JSON.stringify({ steps: val }),
      });
      updateUI(stepsToday, val);
      goalForm.reset();
    } catch (err) {
      console.error("Goal save error:", err);
    }
  });
});
