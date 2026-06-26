if (!window.$) {
  window.$ = (sel) => document.querySelector(sel);
}

if (!window.$$) {
  window.$$ = (sel) => document.querySelectorAll(sel);
}

function getCSRFToken() {
  const cookie = document.cookie
    .split("; ")
    .find(row => row.startsWith("csrftoken="));
  return cookie ? cookie.split("=")[1] : null;
}

async function jsonPost(url, body) {
  const csrf = getCSRFToken();
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(csrf ? { "X-CSRFToken": csrf } : {})
    },
    body: JSON.stringify(body || {})
  });
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json();
}

const isChartReady = () =>
  typeof window !== "undefined" &&
  typeof window.Chart !== "undefined";

(function midnightReset(){
  function msToMidnight(){
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24,0,0,0);
    return midnight - now;
  }
  setTimeout(() => location.reload(), msToMidnight() + 500);
})();

(function stepsBlocks(){
  const stepsEl   = $('#steps-count');
  const barEl     = $('#steps-progress');
  const goalEndEl = $('#steps-goal-end');
  const goalLabel = $('#steps-goal-label');

  if (!stepsEl) return;

  // Values come from server-rendered data attributes — no localStorage override
  const stepsToday = parseInt(stepsEl.dataset.steps || '0', 10);
  const stepsGoal  = parseInt(stepsEl.dataset.goal  || '10000', 10);

  stepsEl.textContent = stepsToday.toLocaleString();
  if (goalLabel) goalLabel.textContent = stepsGoal.toLocaleString();
  if (goalEndEl) goalEndEl.textContent = stepsGoal.toLocaleString();

  const pct = Math.max(0, Math.min(100, Math.round((stepsToday / stepsGoal) * 100)));
  if (barEl) barEl.style.width = pct + '%';
})();

(function visitCalendar(){
  const gridEl = document.getElementById('calendarGrid');
  if (!gridEl) return;

  const key = 'pivo_visit_dates';
  const today = new Date();
  const iso = today.toISOString().slice(0,10);
  const arr = JSON.parse(localStorage.getItem(key) || '[]');
  if (!arr.includes(iso)) {
    arr.push(iso);
    localStorage.setItem(key, JSON.stringify(arr));
  }
})();

(function waterWidget(){
  const container = $('#glasses-container');
  if (!container) return;

  const amountEl = $('#water-amount');
  const addBtn   = $('#addWaterBtn');
  const resetBtn = $('#resetWaterBtn');

  const key = `pivo_water_${new Date().toISOString().slice(0,10)}`;
  const get = () => parseInt(localStorage.getItem(key) || '0', 10);
  const set = (v) => { localStorage.setItem(key, String(v)); render(); };

  function render(){
    const ml = get();
    if (amountEl) amountEl.textContent = ml;
    container.innerHTML = '';
    const glasses = Math.min(16, Math.floor(ml / 200));
    for (let i = 0; i < 16; i++) {
      const g = document.createElement('div');
      g.className = 'glass';
      const f = document.createElement('div');
      f.className = 'glass-fill';
      f.style.height = i < glasses ? '90%' : '0%';
      g.appendChild(f);
      container.appendChild(g);
    }
  }

  addBtn?.addEventListener('click', () => set(get() + 200));
  resetBtn?.addEventListener('click', () => set(0));
  render();
})();
