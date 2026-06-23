document.addEventListener("DOMContentLoaded", async () => {

  console.log("✅ log-workout.js running");

  const container = document.getElementById("workout-list");
  if (!container) return;

  container.innerHTML = `<p>Loading workouts...</p>`;

  try {
    const res = await fetch("/api/workouts/list/");
    const data = await res.json();

    if (!data.workouts || !data.workouts.length) {
      container.innerHTML = `<div>No workouts yet.</div>`;
      return;
    }

    container.innerHTML = data.workouts.map(w => `
      <div class="workout-card">

        <div class="workout-top">

          <div class="workout-info">
            <h4>${w.name}</h4>
            <span>Days: ${w.days.join(", ")}</span>
          </div>

          <div class="workout-actions">

            <button class="btn-view"
              onclick="toggleWorkout(${w.id}, this)">
              View
            </button>

            <a href="/add-workout/?id=${w.id}" class="btn-outline-min">
              Edit
            </a>

            <button class="btn-delete"
              onclick="deleteWorkout(${w.id})">
              Delete
            </button>

          </div>

        </div>

        <div id="workout-expand-${w.id}" class="workout-expand"></div>

      </div>
    `).join("");

  } catch (err) {
    console.error(err);
    container.innerHTML = `Failed to load workouts.`;
  }
});

async function toggleWorkout(id, btn) {

  const el = document.getElementById(`workout-expand-${id}`);

  if (el.classList.contains("open")) {
    el.classList.remove("open");
    el.innerHTML = "";
    btn.textContent = "View";
    return;
  }

  btn.textContent = "Hide";
  el.classList.add("open");
  el.innerHTML = "Loading...";

  try {
    const res = await fetch(`/api/workouts/get/${id}/`);
    const data = await res.json();

    el.innerHTML = `
      <div class="workout-details">

        ${data.exercises.map(ex => `
          <div class="exercise-row">

            <strong>${ex.name}</strong>

            <div class="exercise-sets-view">
              ${(ex.sets || []).map(s => `
                <span class="set-pill">
                  ${s.reps} reps • ${s.weight_value}kg
                </span>
              `).join("")}
            </div>

          </div>
        `).join("")}

      </div>
    `;

  } catch (err) {
    console.error(err);
    el.innerHTML = "Failed to load workout.";
  }
}

async function deleteWorkout(id) {
  if (!confirm("Delete this workout?")) return;

  await fetch(`/api/workouts/delete/${id}/`, {
    method: "POST",
    headers: {
      "X-CSRFToken": getCSRFToken()
    }
  });

  window.location.reload();
}

function getCSRFToken() {
  return document.cookie
    .split("; ")
    .find(row => row.startsWith("csrftoken="))
    ?.split("=")[1];
}
