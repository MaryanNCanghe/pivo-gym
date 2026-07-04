const EX_API = {
  search: "/api/exercises/search/"
};

let _animInterval = null;

function closeModal() {
  if (_animInterval) { clearInterval(_animInterval); _animInterval = null; }
  document.getElementById("exercise-modal").classList.add("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
  loadInitialExercises();
  initSearchForm();

  document.getElementById("close-exercise")
    ?.addEventListener("click", closeModal);

  document.getElementById("exercise-modal")
    ?.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeModal();
    });
});

async function loadInitialExercises() {
  const container = document.getElementById("exercise-results");
  container.innerHTML = "<p>Loading…</p>";
  try {
    const res = await fetch(`${EX_API.search}?limit=50`);
    const data = await res.json();
    const items = Array.isArray(data) ? data : data.items || [];
    if (!items.length) {
      container.innerHTML = data.seeded === false
        ? '<p style="color:var(--muted);">Exercise library is loading — check back in a minute after the first deploy.</p>'
        : '<p style="color:var(--muted);">No exercises found.</p>';
    } else {
      renderExerciseCards(items);
    }
  } catch {
    container.innerHTML = "Failed to load exercises.";
  }
}

function initSearchForm() {
  const form = document.getElementById("exercise-search-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const container = document.getElementById("exercise-results");
    container.innerHTML = "<p>Searching…</p>";
    const params = new URLSearchParams(new FormData(form));
    params.set("limit", "50");
    const res = await fetch(`${EX_API.search}?${params}`);
    const data = await res.json();
    const items = Array.isArray(data) ? data : data.items || [];
    if (!items.length) {
      container.innerHTML = '<p style="color:var(--muted);">No exercises found for that search.</p>';
    } else {
      renderExerciseCards(items);
    }
  });
}

function renderExerciseCards(items) {
  const container = document.getElementById("exercise-results");
  container.innerHTML = `
    <div class="exercise-grid">
      ${items.map(item => `
        <div class="exercise-card"
          onclick='openExercise(${JSON.stringify(item).replace(/"/g, "&quot;")})'>
          <div class="exercise-media">
            ${item.url
              ? `<img src="${item.url}" alt="${item.name}" loading="lazy">`
              : ""}
            ${item.url ? '<span class="ex-vid-badge">3D · Demo</span>' : ""}
          </div>
          <div class="card-body">
            <h6>${item.name}</h6>
            <div class="exercise-tags">
              ${item.category  ? `<span>${item.category}</span>`  : ""}
              ${item.target    ? `<span>${item.target}</span>`    : ""}
              ${item.equipment ? `<span>${item.equipment}</span>` : ""}
            </div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function openExercise(ex) {
  if (_animInterval) { clearInterval(_animInterval); _animInterval = null; }

  const container = document.getElementById("exercise-full");
  const steps = Array.isArray(ex.instructions) && ex.instructions.length
    ? `<div class="ex-steps-label">How to do it</div>
       <ol class="ex-steps-list">${ex.instructions.map(s => `<li>${s}</li>`).join("")}</ol>`
    : "";

  container.innerHTML = `
    <h5 class="ex-modal-title">${ex.name}</h5>
    <div class="ex-modal-badges">
      ${ex.category  ? `<span class="badge">${ex.category}</span>`  : ""}
      ${ex.target    ? `<span class="badge">${ex.target}</span>`    : ""}
      ${ex.equipment ? `<span class="badge">${ex.equipment}</span>` : ""}
      ${ex.level     ? `<span class="badge">${ex.level}</span>`     : ""}
    </div>
    ${ex.url ? `
      <div class="ex-demo-label">Exercise Demo</div>
      <img id="exDemoImg" src="${ex.url}" class="ex-modal-media" alt="${ex.name}">
    ` : ""}
    ${steps}
  `;

  // Animate between frame 0 and frame 1 to create motion effect
  if (ex.url && ex.url2 && ex.url !== ex.url2) {
    const frames = [ex.url, ex.url2];
    let frame = 0;
    const img = document.getElementById("exDemoImg");
    _animInterval = setInterval(() => {
      frame = 1 - frame;
      img.src = frames[frame];
    }, 700);
  }

  document.getElementById("exercise-modal").classList.remove("hidden");
}
