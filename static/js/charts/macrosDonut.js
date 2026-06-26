export function createMacrosDonut(canvas, data) {
  if (!canvas || typeof Chart === "undefined") return;

  const protein = Number(data.protein || 0);
  const carbs   = Number(data.carbs || 0);
  const fat     = Number(data.fat || 0);

  const empty = protein === 0 && carbs === 0 && fat === 0;

  return new Chart(canvas, {
    type: "doughnut",

    data: {
      datasets: [{
        data: empty ? [1] : [protein, carbs, fat],

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

  tooltip: {
    enabled: !empty,

    callbacks: {
      label: function(ctx) {

        const labels = ["Protein", "Carbs", "Fat"];
        const value = ctx.raw;

        if (empty) return "";

        return `${labels[ctx.dataIndex]}: ${value}g`;
      }
    }
  }
}
    }



  });
}