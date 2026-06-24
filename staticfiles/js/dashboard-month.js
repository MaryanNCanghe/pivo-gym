document.addEventListener("DOMContentLoaded", () => {
  loadMonthlyChart();
});

async function loadMonthlyChart() {
  if (typeof Chart === "undefined") return;

  try {
    const res = await fetch("/api/dashboard/month/", {
      cache: "no-store"
    });
    const data = await res.json();

    const canvas = document.getElementById("dashboardChart");
    if (!canvas) return;

    new Chart(canvas.getContext("2d"), {
  type: "bar",

  data: {
    labels: data.labels,

    datasets: [
      {
        type: "bar",
        label: "Workouts",
        data: data.workouts,
        backgroundColor: data.workouts.map(v =>
          v ? "#8b9978" : "rgba(139,153,120,0.08)"
        ),
        borderRadius: 6,
        barThickness: 6,
        categoryPercentage: 0.6,
        yAxisID: "yWork"
      },

      {
        type: "line",
        label: "Steps",
        data: data.steps,
        borderColor: "#8b9978",
        backgroundColor: "rgba(139,153,120,0.15)",
        borderWidth: 2.5,
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

    interaction: {
      mode: "index",
      intersect: false
    },

    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          boxWidth: 6,
          padding: 12
        }
      },

      tooltip: {
        backgroundColor: "#fff",
        titleColor: "#333",
        bodyColor: "#333",
        borderColor: "#ddd",
        borderWidth: 1,

        callbacks: {
          label: function(ctx) {
            if (ctx.dataset.label === "Workouts") {
              return ctx.raw ? "Workout ✅" : "";
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

      ySteps: {
        position: "left",
        grid: {
          color: "rgba(0,0,0,0.05)",
        },
        ticks: {
          callback: v => v >= 1000 ? v / 1000 + "k" : v
        },
        title: {
          display: true,
          text: "Steps",
          color: "#7a7a7a",
          font: {
            size: 11
          }
        }
      },

      yWork: {
        display: false,
        min: 0,
        max: 1
      },

      yWeight: {
        display: false
      },

      x: {
        grid: {
          display: false
        },
        ticks: {
          color: "#9a958f",
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 10
        }
      }
    }
  }
});
  } catch (err) {
    console.error("Chart error:", err);
  }
}
