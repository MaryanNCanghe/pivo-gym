const EX_API = {
  search: "/api/exercises/search/"
};

document.addEventListener("DOMContentLoaded", () => {
  loadInitialExercises();
  initSearchForm();

  document.getElementById("close-exercise")
    ?.addEventListener("click", closeModal);

  document.querySelector(".media-backdrop")
    ?.addEventListener("click", closeModal);


document.getElementById("exercise-modal")
    ?.addEventListener("click", closeModal);

});

async function loadInitialExercises() {
  const container = document.getElementById("exercise-results");

  container.innerHTML = "<p>Loading…</p>";

  try {
    const res = await fetch(`${EX_API.search}?limit=50`);
    const data = await res.json();

    const items = Array.isArray(data) ? data : data.items || [];
    renderExerciseCards(items);

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

  container.innerHTML = `
    ${
      ex.url
        ? ex.url.endsWith(".mp4")
          ? `<video controls autoplay>
               <source src="${ex.url}">
             </video>`
          : `<img src="${ex.url}">`
        : ""
    }
  `;

  document.getElementById("exercise-modal")
    .classList.remove("hidden");
}
