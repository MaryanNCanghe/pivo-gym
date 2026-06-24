import { createMacrosDonut } from "/static/js/charts/macrosDonut.js";

async function loadHomeDonut() {
  const canvas = document.getElementById("macrosChart");
  if (!canvas || typeof Chart === "undefined") return;

  try {
    const res = await fetch("/meals/day/", { cache: "no-store" });
    const data = await res.json();
    const summary = data.summary || {};

    createMacrosDonut(canvas, {
      protein: summary.protein || 0,
      carbs: summary.carbs || 0,
      fat: summary.fat || 0
    });

    const el = document.getElementById("calories-left");
    if (el) {
      el.textContent =
        Math.max(0, data.goal.calories - (summary.calories || 0));
    }

  } catch (err) {
    console.error("Home donut error:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadHomeDonut);
