const EX_API = {
  search: "/api/exercises/search/"
};

function closeModal() {
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
    if (!items.length && data.seeded === false) {
      container.innerHTML = '<p style="color:var(--muted);">Exercise library is loading — check back in a minute after the first deploy.</p>';
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
    renderExerciseCards(items);
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
              ? item.url.endsWith(".mp4")
                ? `<video autoplay muted loop><source src="${item.url}"></video>`
                : `<img src="${item.url}" alt="${item.name}" loading="lazy">`
              : ""}
            ${item.url ? '<span class="ex-vid-badge">3D · Video</span>' : ""}
          </div>

          <div class="card-body">
            <h6>${item.name}</h6>
            <div class="exercise-tags">
              ${item.category ? `<span>${item.category}</span>` : ""}
              ${item.target   ? `<span>${item.target}</span>`   : ""}
              ${item.equipment ? `<span>${item.equipment}</span>` : ""}
            </div>
          </div>

        </div>
      `).join("")}
    </div>
  `;
}

function openExercise(ex) {
  const container = document.getElementById("exercise-full");
  const steps = Array.isArray(ex.instructions) && ex.instructions.length
    ? `<div class="ex-steps-label">How to do it</div>
       <ol class="ex-steps-list">${ex.instructions.map(s => `<li>${s}</li>`).join("")}</ol>`
    : "";

  const ytQuery = encodeURIComponent(ex.name + " tutorial for women");
  const ytUrl = `https://www.youtube.com/results?search_query=${ytQuery}`;

  container.innerHTML = `
    <h5 class="ex-modal-title">${ex.name}</h5>
    <div class="ex-modal-badges">
      ${ex.category  ? `<span class="badge">${ex.category}</span>`  : ""}
      ${ex.target    ? `<span class="badge">${ex.target}</span>`    : ""}
      ${ex.equipment ? `<span class="badge">${ex.equipment}</span>` : ""}
      ${ex.level     ? `<span class="badge">${ex.level}</span>`     : ""}
    </div>
    ${ex.url ? `
      <div class="ex-demo-label">3D Animation Demo</div>
      ${ex.url.endsWith(".mp4")
        ? `<video controls autoplay class="ex-modal-media"><source src="${ex.url}"></video>`
        : `<img src="${ex.url}" class="ex-modal-media" alt="${ex.name} demo">`
      }
    ` : ""}
    <a href="${ytUrl}" target="_blank" rel="noopener" class="ex-yt-btn">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0;">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
      Watch Coaching Video on YouTube
    </a>
    ${steps}
  `;

  document.getElementById("exercise-modal").classList.remove("hidden");
}
