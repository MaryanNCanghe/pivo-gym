if (!window.$) {
  window.$ = (sel) => document.querySelector(sel);
}

if (!window.$$) {
  window.$$ = (sel) => document.querySelectorAll(sel);
}

(function waterWidget(){
  const addBtn   = $('#addWaterBtn');
  const resetBtn = $('#resetWaterBtn');
  const amountEl = $('#water-amount');
  const container= $('#glasses-container');
  if (!container) return;

  const todayKey = (() => {
    const d = new Date();
    return `pivo_water_${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  })();

  const get = () => parseInt(localStorage.getItem(todayKey) || '0', 10);
  const set = (ml) => { localStorage.setItem(todayKey, String(ml)); render(); };

  function render() {
    const ml = get();
    if (amountEl) amountEl.textContent = ml;
    container.innerHTML = '';
    const glasses = Math.min(16, Math.floor(ml / 200));
    for (let i = 0; i < 16; i++) {
      const g = document.createElement('div'); g.className = 'glass';
      const fill = document.createElement('div'); fill.className = 'glass-fill';
      fill.style.height = i < glasses ? '90%' : '0%';
      g.appendChild(fill); container.appendChild(g);
    }
  }
  addBtn   && addBtn.addEventListener('click', () => set(get() + 200));
  resetBtn && resetBtn.addEventListener('click', () => set(0));
  render();
})();
