document.addEventListener("DOMContentLoaded", () => {
  loadMonthlyChart();
});

async function loadMonthlyChart() {
  if (typeof Chart === "undefined") return;

  try {
    const res = await fetch("/api/dashboard/month/", { cache: "no-store" });
    const data = await res.json();

    const avgEl = document.getElementById("avg-workout-duration");
    if (avgEl && data.avgDuration) {
      avgEl.textContent = `${data.avgDuration} min`;
    }

    const canvas = document.getElementById("dashboardChart");
    if (!canvas) return;

    new Chart(canvas.getContext("2d"), {
      type: "bar",
      data: {
        labels: data.labels,
        datasets: [
          {
            type: "line",
            label: "Workout (min)",
            data: data.workouts,
            borderColor: "#e91e8c",
            backgroundColor: "rgba(233,30,140,0.12)",
            borderWidth: 2.5,
            tension: 0.4,
            pointRadius: data.workouts.map(v => v > 0 ? 3 : 0),
            pointBackgroundColor: "#e91e8c",
            fill: true,
            yAxisID: "yWork"
          },
          {
            type: "line",
            label: "Steps",
            data: data.steps,
            borderColor: "#f04aa0",
            backgroundColor: "rgba(240,74,160,0.07)",
            borderWidth: 2,
            tension: 0.35,
            pointRadius: 0,
            yAxisID: "ySteps"
          },
          {
            type: "line",
            label: "Weight",
            data: data.weight,
            borderColor: "#b98ea7",
            borderWidth: 1.8,
            borderDash: [4, 4],
            tension: 0.3,
            pointRadius: 0,
            yAxisID: "yWeight"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            position: "bottom",
            labels: { usePointStyle: true, boxWidth: 6, padding: 12 }
          },
          tooltip: {
            backgroundColor: "#fff",
            titleColor: "#333",
            bodyColor: "#333",
            borderColor: "#f5c6dc",
            borderWidth: 1,
            callbacks: {
              label: function(ctx) {
                if (ctx.dataset.label === "Workout (min)") {
                  return ctx.raw > 0 ? `Workout: ${ctx.raw} min` : "";
                }
                if (ctx.dataset.label === "Steps") {
                  return `Steps: ${ctx.raw.toLocaleString()}`;
                }
                if (ctx.dataset.label === "Weight") {
                  return `Weight: ${ctx.raw} kg`;
                }
              }
            }
          }
        },
        scales: {
          yWork: {
            position: "left",
            min: 0,
            grid: { color: "rgba(0,0,0,0.04)" },
            ticks: { color: "#e91e8c", callback: v => v ? `${v}m` : "" },
            title: { display: true, text: "Workout (min)", color: "#e91e8c", font: { size: 11 } }
          },
          ySteps: {
            display: false
          },
          yWeight: {
            display: false
          },
          x: {
            grid: { display: false },
            ticks: { color: "#9a958f", maxRotation: 0, autoSkip: true, maxTicksLimit: 10 }
          }
        }
      }
    });
  } catch (err) {
    console.error("Chart error:", err);
  }
}
