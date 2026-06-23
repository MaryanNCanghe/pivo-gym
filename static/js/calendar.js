if (!window.$) {
  window.$ = (sel) => document.querySelector(sel);
}

if (!window.$$) {
  window.$$ = (sel) => document.querySelectorAll(sel);
}


(function midnightReset(){
  function msToMidnight(){
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24,0,0,0);
    return midnight - now;
  }
  setTimeout(() => { location.reload(); }, msToMidnight() + 500);
})();

(function visitCalendar(){
  const monthEl = document.getElementById('calendar-month');
  const yearEl  = document.getElementById('calendar-year');
  const gridEl  = document.getElementById('calendarGrid');
  if (!gridEl) return;

  (function markToday() {
    const key = 'pivo_visit_dates';
    const d = new Date();
    const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const arr = JSON.parse(localStorage.getItem(key) || '[]');
    if (!arr.includes(iso)) {
      arr.push(iso);
      localStorage.setItem(key, JSON.stringify(arr));
    }
  })();

  const visitedCountEl = document.getElementById('visited-count');
  const prevBtn = document.getElementById('prevMonthBtn');
  const nextBtn = document.getElementById('nextMonthBtn');

  let view = (() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  })();

  const visitedSet = () => new Set(JSON.parse(localStorage.getItem('pivo_visit_dates') || '[]'));

  function render() {
    const first = new Date(view.y, view.m, 1);
    const last  = new Date(view.y, view.m + 1, 0);
    const start = (first.getDay() + 6) % 7;
    const days  = last.getDate();

    if (monthEl) monthEl.textContent = first.toLocaleString(undefined, { month: 'long' });
    if (yearEl)  yearEl.textContent  = String(view.y);

    gridEl.innerHTML = '';

    ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach(w => {
      const h = document.createElement('div');
      h.className = 'calendar-weekday';
      h.textContent = w;
      gridEl.appendChild(h);
    });

    for (let i = 0; i < start; i++) {

const empty = document.createElement('div');
empty.className = 'calendar-cell empty';
gridEl.appendChild(empty);
    }

    let count = 0;
    const vs = visitedSet();

    for (let d = 1; d <= days; d++) {
      const cell = document.createElement('div');
      cell.className = 'calendar-cell';

      const date = document.createElement('div');
      date.className = 'date';
      date.textContent = d;

      const iso = `${view.y}-${String(view.m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      if (vs.has(iso)) {
        cell.classList.add('visited');
        count++;
      }

      cell.appendChild(date);
      gridEl.appendChild(cell);
    }

    if (visitedCountEl) visitedCountEl.textContent = count;
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      view.m -= 1;
      if (view.m < 0) { view.m = 11; view.y -= 1; }
      render();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      view.m += 1;
      if (view.m > 11) { view.m = 0; view.y += 1; }
      render();
    });
  }

  render();
})();
