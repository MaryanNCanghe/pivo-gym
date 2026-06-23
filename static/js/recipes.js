(function () {
  "use strict";

  // Active filter state
  let activeGoal = "all";
  let activeMeal = "all";

  function applyFilters() {
    document.querySelectorAll("#defaultGrid .recipe-card").forEach(function (card) {
      const goalMatch = activeGoal === "all" || card.dataset.goal === activeGoal;
      const mealMatch = activeMeal === "all" || card.dataset.meal === activeMeal;
      card.style.display = goalMatch && mealMatch ? "" : "none";
    });
  }

  // Goal filter buttons
  document.querySelectorAll("#goalFilters .filter-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll("#goalFilters .filter-btn").forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      activeGoal = btn.dataset.value;
      applyFilters();
    });
  });

  // Meal type filter buttons
  document.querySelectorAll("#mealFilters .filter-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll("#mealFilters .filter-btn").forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      activeMeal = btn.dataset.value;
      applyFilters();
    });
  });

  // Add Recipe form toggle
  var toggleBtn = document.getElementById("addRecipeToggle");
  var cancelBtn = document.getElementById("addRecipeCancel");
  var addForm   = document.getElementById("addRecipeForm");

  if (toggleBtn && addForm) {
    toggleBtn.addEventListener("click", function () {
      var hidden = addForm.hasAttribute("hidden");
      if (hidden) {
        addForm.removeAttribute("hidden");
        toggleBtn.textContent = "✕ Cancel";
      } else {
        addForm.setAttribute("hidden", "");
        toggleBtn.textContent = "＋ Add Recipe";
      }
    });
  }

  if (cancelBtn && addForm) {
    cancelBtn.addEventListener("click", function () {
      addForm.setAttribute("hidden", "");
      if (toggleBtn) toggleBtn.textContent = "＋ Add Recipe";
    });
  }

  // Expand / collapse recipe details
  document.querySelectorAll(".expand-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var card   = btn.closest(".recipe-card");
      var expand = card.querySelector(".recipe-expand");
      if (!expand) return;

      var isOpen = !expand.hasAttribute("hidden");
      if (isOpen) {
        expand.setAttribute("hidden", "");
        btn.textContent = "See recipe ›";
      } else {
        expand.removeAttribute("hidden");
        btn.textContent = "Hide recipe ‹";
      }
    });
  });
})();
