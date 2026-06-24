document.addEventListener("DOMContentLoaded", () => {
  const datePicker = document.getElementById("datePicker");
  const mealsTable = document.getElementById("mealsTable");
  const form = document.getElementById("quickMealForm");
  const resetBtn = document.getElementById("resetDayBtn");

  const calLeftEl = document.getElementById("calories-left");
  const proLeftEl = document.getElementById("pro-left");
  const carbLeftEl = document.getElementById("carb-left");
  const fatLeftEl = document.getElementById("fat-left");

  const proBar = document.querySelector(".macro-row.protein .bar div");
  const carbBar = document.querySelector(".macro-row.carbs .bar div");
  const fatBar = document.querySelector(".macro-row.fat .bar div");

  const canvas = document.getElementById("macrosChart");
  let chart = null;

  const csrftoken =
    document.cookie.match(/csrftoken=([^;]+)/)?.[1] || "";

  const today = new Date().toISOString().slice(0, 10);
  datePicker.value = today;

  function drawDonut(dataset, empty = false) {
    if (chart) chart.destroy();

    chart = new Chart(canvas, {
      type: "doughnut",
      data: {
        datasets: [{
          data: empty ? [1] : dataset,
          backgroundColor: empty
            ? ["#fce4ef"]
            : ["#e91e8c", "#f8bbd9", "#9c27b0"],
          borderWidth: empty ? 2 : 0,
          borderColor: "#f5c6dc",
          cutout: "70%"
        }]
      },
      options: {
        responsive: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: !empty }
        }
      }
    });
  }

  function render(summary, goal) {
    const remainingCalories = Math.max(
      0,
      (goal.calories || 0) - (summary.calories || 0)
    );

    calLeftEl.textContent = remainingCalories;

   const pLeft = Math.max(0, goal.protein - summary.protein);
const cLeft = Math.max(0, goal.carbs - summary.carbs);
const fLeft = Math.max(0, goal.fat - summary.fat);

proLeftEl.textContent = `${pLeft}g`;
carbLeftEl.textContent = `${cLeft}g`;
fatLeftEl.textContent = `${fLeft}g`;

proBar.style.width = goal.protein
  ? `${Math.min(100, (summary.protein / goal.protein) * 100)}%`
  : "0%";

carbBar.style.width = goal.carbs
  ? `${Math.min(100, (summary.carbs / goal.carbs) * 100)}%`
  : "0%";

fatBar.style.width = goal.fat
  ? `${Math.min(100, (summary.fat / goal.fat) * 100)}%`
  : "0%";

    if (summary.calories > 0) {
      drawDonut(
        [summary.protein, summary.carbs, summary.fat],
        false
      );
    } else {
      drawDonut([1], true);
    }
  }

  async function loadDay(date) {
  const res = await fetch(`/meals/day/?date=${date}`);
  const data = await res.json();

  render(data.summary, data.goal);

  document.getElementById("goal-cal").value = data.goal.calories || "";
  document.getElementById("goal-pro").value = data.goal.protein || "";
  document.getElementById("goal-carb").value = data.goal.carbs || "";
  document.getElementById("goal-fat").value = data.goal.fat || "";

  mealsTable.innerHTML = "";

  if (!data.meals.length) {
    mealsTable.innerHTML = `
      <tr>
        <td colspan="5" class="text-muted-pivo text-center">
          No meals logged
        </td>
      </tr>`;
    return;
  }

  data.meals.forEach(m => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${m.name}</td>
      <td>${m.calories}</td>
      <td>${m.protein}</td>
      <td>${m.carbs}</td>
      <td>${m.fat}</td>
    `;
mealsTable.prepend(tr);
 });
}

  document.getElementById("save-goals").onclick = async () => {
    await fetch("/meals/goals/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrftoken
      },
      body: JSON.stringify({
        calories: Number(document.getElementById("goal-cal").value || 0),
        protein_g: Number(document.getElementById("goal-pro").value || 0),
        carbs_g: Number(document.getElementById("goal-carb").value || 0),
        fat_g: Number(document.getElementById("goal-fat").value || 0)
      })
    });

    loadDay(datePicker.value);
  };

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const fd = new FormData(form);

    await fetch("/meals/log/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrftoken
      },
      body: JSON.stringify({
        name: fd.get("name"),
        calories: Number(fd.get("calories")),
        protein_g: Number(fd.get("protein")),
        carbs_g: Number(fd.get("carbs")),
        fat_g: Number(fd.get("fat")),
        logged_at: datePicker.value
      })
    });

    form.reset();
    loadDay(datePicker.value);
  });

  resetBtn.onclick = async () => {
  await fetch("/meals/clear-today/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrftoken
    },
    body: JSON.stringify({
      date: datePicker.value
    })
  });

  loadDay(datePicker.value);
};


document.getElementById("prevDay").onclick = (e) => {
  e.preventDefault();

  const d = new Date(datePicker.value);
  d.setDate(d.getDate() - 1);
  datePicker.value = d.toISOString().slice(0, 10);
  loadDay(datePicker.value);
};

document.getElementById("nextDay").onclick = (e) => {
  e.preventDefault();

  const d = new Date(datePicker.value);
  d.setDate(d.getDate() + 1);
  datePicker.value = d.toISOString().slice(0, 10);
  loadDay(datePicker.value);
};

  datePicker.onchange = () => loadDay(datePicker.value);

  drawDonut([1], true);

if (datePicker.value) {
  loadDay(datePicker.value);
}

  // ── Food search ──────────────────────────────────────────────
  const foodSearchInput = document.getElementById("foodSearchInput");
  const foodSearchBtn = document.getElementById("foodSearchBtn");
  const foodSearchResults = document.getElementById("foodSearchResults");

  async function runFoodSearch() {
    const q = foodSearchInput.value.trim();
    if (!q) return;
    foodSearchResults.innerHTML = "<li class='text-muted-pivo' style='padding:.4rem 0'>Searching…</li>";
    try {
      const res = await fetch(`/meals/search/?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      foodSearchResults.innerHTML = "";
      if (!data.results || !data.results.length) {
        foodSearchResults.innerHTML = "<li class='text-muted-pivo' style='padding:.4rem 0'>No results found.</li>";
        return;
      }
      data.results.forEach(item => {
        const li = document.createElement("li");
        li.className = "food-result-item";
        li.innerHTML = `
          <div class="food-result-info">
            <span class="food-result-name">${item.name}</span>
            <span class="food-result-macros text-muted-pivo">${item.calories} kcal &middot; P:${item.protein}g &middot; C:${item.carbs}g &middot; F:${item.fat}g</span>
          </div>
          <button class="btn-primary-min food-log-btn">Log</button>
        `;
        li.querySelector(".food-log-btn").onclick = async () => {
          await fetch("/meals/log/", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-CSRFToken": csrftoken },
            body: JSON.stringify({
              name: item.name,
              calories: item.calories,
              protein_g: item.protein,
              carbs_g: item.carbs,
              fat_g: item.fat,
              logged_at: datePicker.value,
            }),
          });
          foodSearchResults.innerHTML = "";
          foodSearchInput.value = "";
          loadDay(datePicker.value);
        };
        foodSearchResults.appendChild(li);
      });
    } catch {
      foodSearchResults.innerHTML = "<li class='text-muted-pivo' style='padding:.4rem 0'>Search failed.</li>";
    }
  }

  foodSearchBtn.onclick = runFoodSearch;
  foodSearchInput.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); closeDropdown(); runFoodSearch(); }
    if (e.key === "Escape") closeDropdown();
  });

  // ── Live search dropdown ──────────────────────────────────────────
  const searchDropdown = document.getElementById("searchDropdown");
  let dropdownTimer = null;

  function closeDropdown() {
    searchDropdown.hidden = true;
    searchDropdown.innerHTML = "";
  }

  function renderDropdown(items) {
    searchDropdown.innerHTML = "";
    if (!items.length) {
      searchDropdown.innerHTML = '<div class="search-dropdown-hint">No results found</div>';
      searchDropdown.hidden = false;
      return;
    }
    items.slice(0, 6).forEach(item => {
      const div = document.createElement("div");
      div.className = "search-dropdown-item";
      div.innerHTML = `
        <div class="search-dropdown-info">
          <div class="search-dropdown-name">${item.name}</div>
          <div class="search-dropdown-macros">${item.calories} kcal &middot; P:${item.protein}g &middot; C:${item.carbs}g &middot; F:${item.fat}g</div>
        </div>
        <button class="search-dropdown-log">Log</button>
      `;
      div.querySelector(".search-dropdown-log").addEventListener("click", async e => {
        e.stopPropagation();
        await fetch("/meals/log/", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-CSRFToken": csrftoken },
          body: JSON.stringify({
            name: item.name,
            calories: item.calories,
            protein_g: item.protein,
            carbs_g: item.carbs,
            fat_g: item.fat,
            logged_at: datePicker.value,
          }),
        });
        closeDropdown();
        foodSearchInput.value = "";
        foodSearchResults.innerHTML = "";
        loadDay(datePicker.value);
      });
      searchDropdown.appendChild(div);
    });
    searchDropdown.hidden = false;
  }

  foodSearchInput.addEventListener("input", () => {
    clearTimeout(dropdownTimer);
    const q = foodSearchInput.value.trim();
    if (q.length < 2) { closeDropdown(); return; }
    searchDropdown.innerHTML = '<div class="search-dropdown-hint">Searching…</div>';
    searchDropdown.hidden = false;
    dropdownTimer = setTimeout(async () => {
      try {
        const res = await fetch(`/meals/search/?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        renderDropdown(data.results || []);
      } catch {
        closeDropdown();
      }
    }, 380);
  });

  document.addEventListener("click", e => {
    if (!foodSearchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
      closeDropdown();
    }
  });

  // ── Food scanner ─────────────────────────────────────────────
  const scanBtn = document.getElementById("scanBtn");
  const scanCameraBtn = document.getElementById("scanCameraBtn");
  const scanCameraInput = document.getElementById("scanCameraInput");
  const scanFileInput = document.getElementById("scanFileInput");
  const scanPreview = document.getElementById("scanPreview");
  const scanThumb = document.getElementById("scanThumb");
  const scanSpinner = document.getElementById("scanSpinner");
  const scanResult = document.getElementById("scanResult");
  const scanResultName = document.getElementById("scanResultName");
  const scanResultMacros = document.getElementById("scanResultMacros");
  const scanLogBtn = document.getElementById("scanLogBtn");
  const scanRescanBtn = document.getElementById("scanRescanBtn");

  let scanData = null;

  scanBtn.onclick = () => scanFileInput.click();
  if (scanCameraBtn) scanCameraBtn.onclick = () => scanCameraInput.click();
  if (scanCameraInput) scanCameraInput.onchange = async () => {
    const file = scanCameraInput.files[0];
    if (!file) return;
    scanFileInput.dispatchEvent(new Event("change"));
    const dt = new DataTransfer();
    dt.items.add(file);
    scanFileInput.files = dt.files;
    scanFileInput.dispatchEvent(new Event("change"));
    scanCameraInput.value = "";
  };

  scanRescanBtn.onclick = () => {
    scanPreview.hidden = true;
    scanResult.hidden = true;
    scanSpinner.hidden = true;
    scanThumb.src = "";
    scanFileInput.value = "";
    scanData = null;
  };

  scanFileInput.onchange = async () => {
    const file = scanFileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      // dataUrl = "data:image/jpeg;base64,..."
      const base64 = dataUrl.split(",")[1];
      const mimeType = file.type || "image/jpeg";

      scanThumb.src = dataUrl;
      scanPreview.hidden = false;
      scanSpinner.hidden = false;
      scanResult.hidden = true;
      scanBtn.disabled = true;

      try {
        const res = await fetch("/meals/scan/", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-CSRFToken": csrftoken },
          body: JSON.stringify({ image: base64, mime_type: mimeType }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        scanData = data;
        scanResultName.textContent = data.name;
        scanResultMacros.textContent = `${data.calories} kcal · P:${data.protein}g · C:${data.carbs}g · F:${data.fat}g`;
        scanResult.hidden = false;
      } catch (err) {
        scanResultName.textContent = "Could not analyze image.";
        scanResultMacros.textContent = err.message || "";
        scanResult.hidden = false;
      } finally {
        scanSpinner.hidden = true;
        scanBtn.disabled = false;
      }
    };
    reader.readAsDataURL(file);
  };

  scanLogBtn.onclick = async () => {
    if (!scanData) return;
    await fetch("/meals/log/", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRFToken": csrftoken },
      body: JSON.stringify({
        name: scanData.name,
        calories: scanData.calories,
        protein_g: scanData.protein,
        carbs_g: scanData.carbs,
        fat_g: scanData.fat,
        logged_at: datePicker.value,
      }),
    });
    scanPreview.hidden = true;
    scanResult.hidden = true;
    scanThumb.src = "";
    scanFileInput.value = "";
    scanData = null;
    loadDay(datePicker.value);
  };
});
