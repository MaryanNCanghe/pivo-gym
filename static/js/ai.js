if (!window.$) {
  window.$ = (sel) => document.querySelector(sel);
}

if (!window.$$) {
  window.$$ = (sel) => document.querySelectorAll(sel);
}


function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
  return null;
}
const CSRF = getCookie('csrftoken');

async function jsonPost(url, body) {
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(CSRF ? { 'X-CSRFToken': CSRF } : {})
    },
    body: JSON.stringify(body || {})
  });
  if (!resp.ok) throw new Error(await resp.text());
  const text = await resp.text();
  try { return text ? JSON.parse(text) : {}; } catch { return {}; }
}

const INTENTS = {
  workout: {
    keywords: ['workout','train','exercise','routine','program','session','hiit','cardio','strength','mobility','bodyweight','dumbbell','kettlebell','band'],
    replies: [
      "Here's a simple 20-minute routine: 3 rounds - 12 squats, 10 push-ups, 30s plank, 12 glute bridges.",
      "Quick dumbbell circuit: goblet squats, bent-over rows, overhead press, RDLs - 10-12 reps x 3 rounds.",
      "Low-impact: 15-min brisk walk + 5-min stretch (hamstrings, hips, chest).",
      "Mobility flow: neck circles, T-spine rotations, hip openers, hamstring stretch - 2 sets of 30-45s."
    ],
    extras: [
      "Warm up 3-5 min first (joint circles + light marching).",
      "Keep rest to ~45-60s to maintain pace.",
      "Focus on smooth tempo and full range of motion."
    ]
  },
  meal: {
    keywords: ['meal','food','eat','recipe','snack','breakfast','lunch','dinner','nutrition','protein','macro','calories'],
    replies: [
      "Balanced plate: lean protein + slow carbs + plenty of veggies.",
      "High-protein snack: Greek yogurt + fruit + nuts, or eggs on whole-grain toast.",
      "Post-workout: protein + carbs, e.g., tuna sandwich, or yogurt with granola and berries.",
      "Light option: tuna/bean salad with mixed greens and olive oil + lemon."
    ],
    extras: [
      "Hydrate before eating. Thirst can feel like hunger.",
      "Add fiber (veggies/fruit) to stay full longer.",
      "Prioritize protein at each meal to support recovery."
    ]
  },
  recovery: {
    keywords: ['recover','recovery','sore','rest','sleep','stretch','mobility','relax','stress','burnout'],
    replies: [
      "Do 5-10 minutes of gentle stretching and hydrate.",
      "Try a 10-minute mobility flow: cat-cow, child's pose, hip flexor and hamstring stretches.",
      "For stress: 2 minutes of slow breathing (inhale 4s, exhale 6-8s)."
    ],
    extras: [
      "Aim for 7-9 hours of sleep tonight.",
      "Light walk + stretch is great active recovery.",
      "Keep caffeine earlier in the day to help sleep quality."
    ]
  },
  weight: {
    keywords: ['weight','lose','fat','cut','deficit','fat loss'],
    replies: [
      "Sustainable fat loss: daily walking, higher protein, more veggies, consistent sleep.",
      "Keep meals mostly whole foods and watch liquid calories.",
      "Plan snacks: fruit + yogurt, eggs, or cottage cheese."
    ],
    extras: [
      "Late cravings? Try water/herbal tea first.",
      "Consistency matters more than perfection."
    ]
  },
  muscle: {
    keywords: ['muscle','bulk','gain','hypertrophy','build','mass'],
    replies: [
      "For muscle: 8-12 reps per set, controlled tempo, progressive overload.",
      "Simple strength split: squat/hinge/push/pull/core - 3-4 sets each.",
      "Add post-workout protein (eggs, chicken, tofu, or a shake)."
    ],
    extras: [
      "Aim for ~1.6-2.2 g protein/kg bodyweight (if appropriate).",
      "Track lifts weekly and push a little further."
    ]
  },
  motivation: {
    keywords: ['motivation','motivate','inspire','consistent','discipline','focus','habit'],
    replies: [
      "You're doing great — show up today and keep it simple.",
      "Consistency beats intensity. Even 10 minutes counts.",
      "One small win today: short walk, a balanced meal, or a stretch break."
    ],
    extras: [
      "Set a tiny goal and check it off — momentum is powerful.",
      "Tie the habit to an existing routine (after coffee → 10 squats)."
    ]
  },
  general: {
    keywords: ['advice','tips','health','habit','daily','plan','check‑in'],
    replies: [
      "Hydrate, move a little, and choose one balanced meal — that's a win.",
      "Small steps add up. Try 10 minutes of movement today.",
      "Be kind to yourself. Progress grows from consistency."
    ],
    extras: [
      "Block 10-20 minutes on your calendar for movement.",
      "Prep a protein source in advance to make meals easier."
    ]
  }
};

function nextFromPool(intent, type) {
  const key = `pivo_ai_idx_${intent}_${type}`;
  const arr = INTENTS[intent][type] || [];
  if (!arr.length) return '';

  let idx = Number(sessionStorage.getItem(key));
  if (!Number.isFinite(idx) || idx < 0 || idx >= arr.length) {
    idx = Math.floor(Math.random() * arr.length);
  } else {
    idx = (idx + 1) % arr.length;
  }
  sessionStorage.setItem(key, String(idx));
  return arr[idx];
}

function detectIntents(text) {
  const t = (text || '').toLowerCase();
  const matched = [];
  for (const [key, cfg] of Object.entries(INTENTS)) {
    if (cfg.keywords.some(k => t.includes(k))) matched.push(key);
  }
  return matched.length ? matched : ['general'];
}

function offlineReply(prompt) {
  const intents = detectIntents(prompt);
  const topIntents = intents.slice(0, 2);

  const parts = [];
  for (const intent of topIntents) {
    const main = nextFromPool(intent, 'replies');
    if (main) parts.push(main);

    if (Math.random() < 0.6) {
      const tip = nextFromPool(intent, 'extras');
      if (tip) parts.push(tip);
    }
  }

  if (!intents.includes('motivation') && Math.random() < 0.5) {
    parts.push(nextFromPool('motivation', 'replies'));
  }

  return parts.filter(Boolean).join(' ');
}

function escapeHtml(str) {
  return (str || '').replace(/[&<>"']/g, (m) => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[m]));
}

function appendMsg(container, who, html) {
  const el = document.createElement('div');
  el.className = `ai-msg ${who}`;
  const label = who === 'me' ? 'You' : 'PIVO';
  el.innerHTML = `<span class="ai-sender">${label}</span>${html}`;
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
  return el;
}

(function aiChat(){
  const form = $('#aiForm');
  const out  = $('#aiOutput');
  if (!form || !out) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const prompt = (new FormData(form).get('prompt') || '').toString().trim();
    if (!prompt) return;

    appendMsg(out, 'me', `<p>${escapeHtml(prompt)}</p>`);

    try {
      const data = await jsonPost('/ai/suggest/', { prompt });
      const serverReply = (data.reply || '').trim();

      if (serverReply) {
        const intents = detectIntents(prompt);
        const intentForTip = intents[0] || 'general';
        const tip = nextFromPool(intentForTip, 'extras') || nextFromPool('general', 'extras');

        const combined = tip ? `${serverReply} ${tip}` : serverReply;
        appendMsg(out, 'bot', `<p>${combined.replace(/\n/g,'<br>')}</p>`);
      } else {
        appendMsg(out, 'bot', `<p>${offlineReply(prompt)}</p>`);
      }
    } catch(_) {
      appendMsg(out, 'bot', `<p>${offlineReply(prompt)}</p>`);
    }

    form.reset();
  });
})();
