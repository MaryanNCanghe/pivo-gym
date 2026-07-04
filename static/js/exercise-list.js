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
            ${
              item.url
                ? item.url.endsWith(".mp4")
                  ? `<video autoplay muted loop>
                       <source src="${item.url}">
                     </video>`
                  : `<img src="${item.url}">`
                : ""
            }
          </div>

          <div class="card-body">
            <h6>${item.name}</h6>

            <div class="exercise-tags">
              ${item.category ? `<span>${item.category}</span>` : ""}
              ${item.target ? `<span>${item.target}</span>` : ""}
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
    ? `<ol style="padding-left:1.2rem;margin-top:.75rem;font-size:.85rem;color:var(--pebble);line-height:1.6;">${ex.instructions.map(s => `<li>${s}</li>`).join("")}</ol>`
    : "";

  container.innerHTML = `
    <h5 style="font-weight:700;margin-bottom:.5rem;">${ex.name}</h5>
    <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.75rem;">
      ${ex.category ? `<span class="badge">${ex.category}</span>` : ""}
      ${ex.target ? `<span class="badge">${ex.target}</span>` : ""}
      ${ex.equipment ? `<span class="badge">${ex.equipment}</span>` : ""}
      ${ex.level ? `<span class="badge">${ex.level}</span>` : ""}
    </div>
    ${ex.url
      ? ex.url.endsWith(".mp4")
        ? `<video controls autoplay style="width:100%;border-radius:10px;"><source src="${ex.url}"></video>`
        : `<img src="${ex.url}" style="width:100%;border-radius:10px;">`
      : ""}
    ${steps}
  `;

  document.getElementById("exercise-modal").classList.remove("hidden");
}
