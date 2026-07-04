function getCSRFToken() {
  return document.cookie
    .split("; ")
    .find(row => row.startsWith("csrftoken="))
    ?.split("=")[1];
}

let exercises = [];
let workoutId = null;

async function searchExercises(q) {
  if (!q.trim()) return;

  const res = await fetch(`/api/exercises/search/?q=${encodeURIComponent(q)}`);
  const data = await res.json();

  renderSearchResults(data.items || []);
}

function renderSearchResults(items) {
  const container = document.getElementById("exercise-results");

  if (!items.length) {
    container.innerHTML = `<p style="color:var(--muted);font-size:.85rem;padding:.5rem 0;">No results found.</p>`;
    return;
  }

  container.innerHTML = `<ul class="ex-result-list">${items.map((ex, i) => `
    <li class="ex-result-item" data-index="${i}">
      <span class="ex-result-name">${ex.name}</span>
      <div class="ex-result-actions">
        <button class="ex-preview-btn" onclick='togglePreview(${i})' title="Preview">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/></svg>
        </button>
        <button class="ex-add-btn" onclick='addExercise(${JSON.stringify(ex).replace(/"/g, "&quot;")})'>Add</button>
      </div>
    </li>
    <li class="ex-preview-row hidden" id="preview-${i}">
      <div class="ex-preview-media">${ex.url ? `<img src="${ex.url}" alt="${ex.name}">` : '<span style="color:var(--muted);font-size:.8rem;">No preview</span>'}</div>
      <div class="ex-preview-tags">
        ${ex.category ? `<span>${ex.category}</span>` : ""}
        ${ex.target ? `<span>${ex.target}</span>` : ""}
        ${ex.equipment ? `<span>${ex.equipment}</span>` : ""}
      </div>
    </li>
  `).join("")}</ul>`;

  window._exResults = items;
}

function togglePreview(index) {
  const row = document.getElementById(`preview-${index}`);
  if (!row) return;
  row.classList.toggle("hidden");
}

function addExercise(ex) {
  exercises.push({
    api_id: ex.id,
    name: ex.name,
    category: ex.category,
    equipment: ex.equipment,
    target: ex.target,
    media_url: ex.url,
    sets: []
  });

  renderSelectedExercises();
}

function renderSelectedExercises() {
  const ul = document.getElementById("selected-exercises");

  ul.innerHTML = exercises.map((ex, i) => `
    <li class="exercise-item">

      <div class="exercise-header">

        <strong>${ex.name}</strong>

        <div class="exercise-actions">

          <button onclick="openMedia('${ex.media_url}')">
            Preview
          </button>

          <button class="remove-ex-btn"
            onclick="removeExercise(${i})">
            ✕
          </button>

        </div>

      </div>

      <button class="add-set-btn" onclick="addSet(${i})">
        Add set
      </button>

      <ul class="exercise-sets">
        ${ex.sets.map((s, si) => `
          <li>
            <input type="number" value="${s.reps}"
              onchange="updateSet(${i}, ${si}, 'reps', this.value)">
            <span>reps</span>

            <input type="number" value="${s.weight_value}"
              onchange="updateSet(${i}, ${si}, 'weight_value', this.value)">
            <span>kg</span>

            <button onclick="removeSet(${i}, ${si})">✕</button>
          </li>
        `).join("")}
      </ul>

    </li>
  `).join("");
}


function addSet(i) {
  exercises[i].sets.push({
    reps: 8,
    weight_value: 0,
    weight_unit: "kg"
  });

  renderSelectedExercises();
}

function updateSet(exIndex, setIndex, field, value) {
  exercises[exIndex].sets[setIndex][field] = parseFloat(value) || 0;
}

function removeSet(exIndex, setIndex) {
  exercises[exIndex].sets.splice(setIndex, 1);
  renderSelectedExercises();
}

function removeExercise(index) {
  exercises.splice(index, 1);
  renderSelectedExercises();
}


function openMedia(url) {
  document.getElementById("media-container").innerHTML = renderMedia(url);
  document.getElementById("media-modal").classList.remove("hidden");
}

async function loadWorkout(id) {
  try {
    const res = await fetch(`/api/workouts/get/${id}/`);
    const data = await res.json();

    document.getElementById("workout-name").value = data.name;

    document.querySelectorAll(".day-btn").forEach(btn => {
      if (data.days.includes(btn.dataset.day)) {
        btn.classList.add("active");
      }
    });

    exercises = data.exercises.map(ex => ({
      api_id: ex.api_id,
      name: ex.name,
      category: ex.category,
      equipment: ex.equipment,
      target: ex.target,
      media_url: ex.media_url,
      sets: ex.sets || []
    }));

    renderSelectedExercises();

  } catch (err) {
    console.error("Failed to load workout:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {

  console.log("✅ add-workout.js running");

  const params = new URLSearchParams(window.location.search);
  workoutId = params.get("id");

  if (workoutId) {
    loadWorkout(workoutId);
  }

  document.querySelectorAll(".day-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("active");
    });
  });

  document.getElementById("close-media")
    ?.addEventListener("click", () => {
      document.getElementById("media-modal").classList.add("hidden");
    });

  document.querySelector(".media-backdrop")
    ?.addEventListener("click", () => {
      document.getElementById("media-modal").classList.add("hidden");
    });

  let searchTimeout;
  document.getElementById("exercise-search")
    ?.addEventListener("input", e => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        searchExercises(e.target.value);
      }, 400);
    });

  document.getElementById("save-workout-btn")
    ?.addEventListener("click", async () => {

      const name = document.getElementById("workout-name").value.trim();
      const days = [...document.querySelectorAll(".day-btn.active")]
        .map(b => b.dataset.day);

      if (!name || !days.length) {
        alert("Workout name and days required");
        return;
      }

      const url = workoutId
        ? `/api/workouts/update/${workoutId}/`
        : `/api/workouts/save/`;

      await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCSRFToken()
        },
        body: JSON.stringify({ name, days, exercises })
      });

      window.location.href = "/log-workout/";
    });

});
