(() => {
  "use strict";

  const csrftoken = document.cookie.match(/csrftoken=([^;]+)/)?.[1];

  const jget = async (url) => {
    const r = await fetch(url, { credentials: "same-origin", cache: "no-store" });
    if (!r.ok) throw new Error(`GET ${url} failed`);
    return r.json();
  };

  const jpost = async (url, body) => {
    const r = await fetch(url, {
      method: "POST",
      credentials: "same-origin",
       cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrftoken,
      },
      body: JSON.stringify(body || {}),
    });
    if (!r.ok) throw new Error(`POST ${url} failed`);
    return r.json();
  };

  const API = {
    logSession: "/api/workouts/log-session/",
    summary: "/api/workouts/weekly-summary/",
    searchExercises: "/api/exercises/search/",
    featuredExercises: "/api/exercises/featured/",
  };

  function getSavedWeeklyGoal() {
    const g = localStorage.getItem("weeklyGoalTarget");
    return g ? parseInt(g, 10) : null;
  }

  function setSavedWeeklyGoal(val) {
    localStorage.setItem("weeklyGoalTarget", String(val));
  }

  function updateGoalUIFromSummary(summary) {
    const done = document.querySelector("#goal-done");
    const target = document.querySelector("#goal-target");
    const avgEl = document.querySelector("#avg-duration");

    if (done) done.textContent = summary.daysAchieved ?? 0;
    if (target) target.textContent = summary.weeklyGoal ?? 0;
    if (avgEl) avgEl.textContent = summary.avgDuration ? `${summary.avgDuration} min` : "—";
  }

  function initGoalSaving() {
    const btn = document.querySelector("#goal-save");
    if (!btn) return;

    const saved = getSavedWeeklyGoal();
    if (saved) {
      document.querySelector("#goal-input").value = saved;
      document.querySelector("#goal-target").textContent = saved;
    }

    btn.addEventListener("click", async () => {
      const input = document.querySelector("#goal-input");
      const v = parseInt(input.value || "0", 10);
      if (!v || v < 1 || v > 14) return;

      setSavedWeeklyGoal(v);
      document.querySelector("#goal-target").textContent = v;

      await refreshSummaryAndChart();
    });
  }

  let sessionStart = null;
  let timerInt = null;

  function updateTimerDisplay() {
    const out = document.querySelector("#timerDisplay");
    if (!out) return;

    if (!sessionStart) {
      out.textContent = "00:00";
      return;
    }

    const diff = Date.now() - sessionStart;
    const m = Math.floor(diff / 60000).toString().padStart(2, "0");
    const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, "0");
    out.textContent = `${m}:${s}`;
  }

  function startTimer() {
    sessionStart = Date.now();
    clearInterval(timerInt);
    timerInt = setInterval(updateTimerDisplay, 1000);
  }

  function stopTimer() {
    if (!sessionStart) return 0;
    const diff = Date.now() - sessionStart;
    sessionStart = null;
    clearInterval(timerInt);
    timerInt = null;
    updateTimerDisplay();
    return Math.floor(diff / 60000);
  }

  function initTimerUI() {
    const startBtn = document.querySelector("#logTodayBtn");
    const endBtn = document.querySelector("#completeDayBtn");
    if (!startBtn || !endBtn) return;

    startBtn.addEventListener("click", () => startTimer());

    endBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const durationMinutes = stopTimer();

      endBtn.disabled = true;
      try {
        const result = await jpost(API.logSession, { duration_minutes: durationMinutes });
        const done = document.querySelector("#goal-done");
        if (done && result.daysAchieved != null) {
          done.textContent = result.daysAchieved;
        }
        endBtn.textContent = "Session logged ✓";
        setTimeout(() => { endBtn.textContent = "Complete day"; endBtn.disabled = false; }, 2000);
        await refreshSummaryAndChart();
      } catch (err) {
        console.error("log-session failed:", err);
        endBtn.disabled = false;
      }
    });
    updateTimerDisplay();
  }


function initGoalToggle() {
  const toggleBtn = document.getElementById("goal-toggle");
  const input = document.getElementById("goal-input");
  const saveBtn = document.getElementById("goal-save");
  const targetSpan = document.getElementById("goal-target");

  let editing = false;

  if (!toggleBtn || !input || !saveBtn || !targetSpan) return;

  toggleBtn.addEventListener("click", () => {
    if (!editing) {
      input.value = targetSpan.textContent;

      targetSpan.hidden = true;
      input.hidden = false;
      saveBtn.hidden = false;

      toggleBtn.textContent = "Cancel";
      editing = true;

    } else {
      targetSpan.hidden = false;
      input.hidden = true;
      saveBtn.hidden = true;

      toggleBtn.textContent = "Edit your goal";
      editing = false;
    }
  });

  saveBtn.addEventListener("click", () => {
    const v = parseInt(input.value || "0", 10);
    if (!v || v < 1 || v > 14) return;

    targetSpan.textContent = v;

    targetSpan.hidden = false;
    input.hidden = true;
    saveBtn.hidden = true;

    toggleBtn.textContent = "Edit your goal";
    editing = false;
  });
}

  let chartRef = null;

  async function fetchSummary() {
    const data = await jget(API.summary);
    const savedGoal = getSavedWeeklyGoal();
    if (savedGoal) data.weeklyGoal = savedGoal;
    return data;
  }

  async function refreshSummaryAndChart() {
    const canvas = document.querySelector("#weeklyChart");

    const data = await fetchSummary();
    updateGoalUIFromSummary(data);

    if (!canvas || !window.Chart) return;

    const { labels, counts, weeklyGoal } = data;

    if (chartRef) {
      chartRef.data.labels = labels;
      chartRef.data.datasets[0].data = counts;
      chartRef.data.datasets[1].data = labels.map(() => weeklyGoal);
      chartRef.update();
      return;
    }

    chartRef = new Chart(canvas.getContext("2d"), {
      data: {
        labels,
        datasets: [
          {
            type: "bar",
            data: counts,
            backgroundColor: "#e91e8c33",
            borderColor: "#e91e8c",
            borderWidth: 1.5,
            borderRadius: 6,
          },
          {
            type: "line",
            data: labels.map(() => weeklyGoal),
            borderColor: "#f04aa0",
            borderWidth: 2,
            borderDash: [6, 6],
            pointRadius: 0,
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });
  }



  document.addEventListener("DOMContentLoaded", async () => {
    initGoalSaving();
    initGoalToggle();
    initTimerUI();
    await refreshSummaryAndChart();

    if (document.getElementById("exercise-results")) {
      initExerciseSearch();
      loadFeaturedExercises();
    }
  });
})();
