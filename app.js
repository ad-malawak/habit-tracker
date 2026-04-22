// ── Firebase init ──────────────────────────────────────────────────────────
firebase.initializeApp({
  apiKey:            "AIzaSyALz8OhoNq6gH4IqXxpleRCWs83WOQRYrM",
  authDomain:        "habit-tracker-85028.firebaseapp.com",
  projectId:         "habit-tracker-85028",
  storageBucket:     "habit-tracker-85028.firebasestorage.app",
  messagingSenderId: "255942450065",
  appId:             "1:255942450065:web:537dfd48c4fdc03bab1830"
});

const auth = firebase.auth();
const db   = firebase.firestore();
let currentUser = null;
let demoMode    = false;
let demoEntries = [];

// ── Habit definitions ──────────────────────────────────────────────────────
const HABITS_TODAY = [
  { key: 'big_thing_today', label: "What's the one thing that'd make today a win?", type: 'text' },
];

const HABITS_YESTERDAY = [
  { key: 'big_thing_yesterday', label: 'Did you complete your BIG goal?',           type: 'yn', streakOn: 'yes', positiveOn: 'yes', streakLabel: 'BIG goal done',   iconKey: 'target',  pillShort: 'BIG goal' },
  { key: 'workout',             label: 'Did you work out?',                        type: 'yn', streakOn: 'yes', positiveOn: 'yes', streakLabel: 'Workouts',        iconKey: 'flame',   pillShort: 'Workout' },
  { key: 'sleep_7h',            label: 'Did you sleep at least 7 hours?',          type: 'yn', streakOn: 'yes', positiveOn: 'yes', streakLabel: 'Sleep 7h+',       iconKey: 'moon',    pillShort: 'Sleep' },
  { key: 'water_4l',            label: 'Did you drink 4 litres of water?',         type: 'yn', streakOn: 'yes', positiveOn: 'yes', streakLabel: 'Water 4L',        iconKey: 'drop',    pillShort: 'Water' },
  { key: 'alcohol',             label: 'Did you stay off alcohol?',                type: 'yn', streakOn: 'no',  positiveOn: 'no',  streakLabel: 'Sober days',      iconKey: 'glass',   pillShort: 'Sober', invertCopy: true },
  { key: 'vape',                label: 'Did you stay off the vape?',               type: 'yn', streakOn: 'no',  positiveOn: 'no',  streakLabel: 'Vape-free days', iconKey: 'wind',    pillShort: 'Vape-free', invertCopy: true },
];

const HABITS = [...HABITS_TODAY, ...HABITS_YESTERDAY];
const KEY    = 'habitTrackerData';

// Icons (small SVGs inline - keep it light)
const ICONS = {
  target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>',
  flame:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c.5 4 4 5 4 9a4 4 0 1 1-8 0c0-2 1-3 1-5"/><path d="M10 14a2 2 0 1 0 4 0c0-1.5-2-2-2-4"/></svg>',
  moon:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/></svg>',
  drop:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3s6 7 6 12a6 6 0 1 1-12 0c0-5 6-12 6-12z"/></svg>',
  glass:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h12l-1 8a5 5 0 0 1-10 0L6 4z"/><path d="M12 17v4"/><path d="M9 21h6"/></svg>',
  wind:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h10a3 3 0 1 0-3-3"/><path d="M3 12h15a3 3 0 1 1-3 3"/><path d="M3 16h8"/></svg>',
  check:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>',
  x:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  edit:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4v16h16v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  calendar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  sparkle:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z"/></svg>',
  download:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>',
};

// ── Local cache (fast reads) ───────────────────────────────────────────────
function load() {
  if (demoMode) return { entries: demoEntries };
  try { return JSON.parse(localStorage.getItem(KEY)) || { entries: [] }; }
  catch { return { entries: [] }; }
}

function setCache(entries) {
  localStorage.setItem(KEY, JSON.stringify({ entries }));
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function getToday() {
  return load().entries.find(e => e.date === todayStr()) || null;
}

function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return load().entries.find(e => e.date === d.toISOString().split('T')[0]) || null;
}

// ── Firestore ──────────────────────────────────────────────────────────────
const PRIMARY_UID = 'ndCwaAENrsTtgUzxsOGV8cE4Te92';

function entriesRef() {
  return db.collection('users').doc(PRIMARY_UID).collection('entries');
}

async function loadFromFirestore() {
  const snap = await entriesRef().get();
  const entries = snap.docs.map(d => d.data());
  setCache(entries);
}

async function writeEntry(entry) {
  const data = load();
  data.entries = data.entries.filter(e => e.date !== entry.date);
  data.entries.push(entry);
  setCache(data.entries);
  entriesRef().doc(entry.date).set(entry).catch(e => console.error('Firestore write failed:', e));
}

// ── Demo mode ──────────────────────────────────────────────────────────────
function generateDemoEntries() {
  const today = new Date();
  const bigThings = [
    'Finish Q2 marketing report', 'Review supplier quotes for next season',
    'Write 3 new product listings', 'Update Amazon PPC campaigns',
    'Call accountant about VAT return', 'Plan content calendar for next month',
    'Review warehouse inventory levels', 'Optimise product images for US store',
    'Reply to all customer reviews', 'Update pricing for German market',
    'Finalise packaging redesign brief', 'Prep agenda for Monday team call',
  ];
  const patterns = [
    [1,1,1,1,1,1],[1,0,1,1,1,1],[1,1,0,0,1,1],[0,0,1,1,0,1],[1,0,0,1,0,1],
    [1,1,1,1,1,1],[1,1,1,0,1,1],[1,0,1,1,1,1],[1,1,0,0,1,1],[1,1,1,1,1,1],
    [0,0,1,0,0,1],[1,0,0,1,0,1],[1,1,1,1,1,1],[1,1,1,0,1,1],[1,0,1,1,1,1],
    [1,1,0,0,1,1],[1,1,1,1,1,1],[0,0,1,0,0,1],[1,0,0,1,0,1],[1,1,1,1,1,1],
    [1,1,1,0,1,1],[1,0,1,1,1,1],[1,1,1,1,1,1],[1,1,0,0,1,1],[0,0,1,0,0,1],
    [1,0,0,1,0,1],[1,1,1,1,1,1],[1,1,1,0,1,1],[1,1,0,1,1,1],[1,0,1,1,1,1],
  ];
  return patterns.map((p, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (patterns.length - i));
    return {
      date: d.toISOString().split('T')[0],
      responses: {
        big_thing_today:      bigThings[i % bigThings.length],
        big_thing_yesterday:  p[0] ? 'yes' : 'no',
        workout:              p[1] ? 'yes' : 'no',
        sleep_7h:             p[2] ? 'yes' : 'no',
        water_4l:             p[3] ? 'yes' : 'no',
        alcohol:              p[4] ? 'no'  : 'yes',
        vape:                 p[5] ? 'no'  : 'yes',
      },
      completedAt: d.toISOString()
    };
  });
}

function enterDemoMode() {
  demoMode    = true;
  demoEntries = generateDemoEntries();
  document.getElementById('signInScreen').style.display  = 'none';
  document.getElementById('appScreen').style.display     = '';
  document.getElementById('demoNotice').style.display    = '';
  document.getElementById('userBar').innerHTML           = '';
  renderToday();
}

function exitDemoMode() {
  demoMode    = false;
  demoEntries = [];
  document.getElementById('signInScreen').style.display  = '';
  document.getElementById('appScreen').style.display     = 'none';
  document.getElementById('demoNotice').style.display    = 'none';
}

// ── Auth ───────────────────────────────────────────────────────────────────
function signIn() {
  auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(console.error);
}

function signOutUser() { auth.signOut(); }

auth.onAuthStateChanged(async user => {
  currentUser = user;
  if (user) {
    document.getElementById('signInScreen').style.display = 'none';
    document.getElementById('appScreen').style.display    = '';
    updateUserBar(user);
    try { await loadFromFirestore(); } catch(e) { console.error('Firestore load error:', e); }
    renderToday();
  } else {
    document.getElementById('signInScreen').style.display = '';
    document.getElementById('appScreen').style.display    = 'none';
    localStorage.removeItem(KEY);
  }
});

function updateUserBar(user) {
  const bar = document.getElementById('userBar');
  const name = (user.displayName || 'You').split(' ')[0];
  bar.innerHTML = `
    <div class="user-chip">
      <span>${name}</span>
      <span class="email">${user.email}</span>
      <button onclick="signOutUser()">Sign out</button>
    </div>`;
}

// ── Save entry ─────────────────────────────────────────────────────────────
function saveEntry(responses) {
  writeEntry({ date: todayStr(), responses, completedAt: new Date().toISOString() });
}

// ── Streaks ────────────────────────────────────────────────────────────────
function calcStreak(key, streakOn) {
  const entries = [...load().entries].sort((a, b) => new Date(b.date) - new Date(a.date));
  if (!entries.length) return { current: 0, best: 0 };

  let current = 0, best = 0, temp = 0, isCurrent = true;
  let expected = new Date(todayStr());

  for (const e of entries) {
    const d    = new Date(e.date);
    const diff = Math.round((expected - d) / 86400000);
    if (diff > 1) {
      if (isCurrent) { current = temp; isCurrent = false; }
      if (temp > best) best = temp;
      temp = 0;
      expected = new Date(d);
    }
    if (e.responses[key] === streakOn) temp++;
    else {
      if (isCurrent) { current = temp; isCurrent = false; }
      if (temp > best) best = temp;
      temp = 0;
    }
    expected.setDate(expected.getDate() - 1);
  }
  if (isCurrent) current = temp;
  if (temp > best) best = temp;
  return { current, best };
}

// Find the longest current streak across all habits.
// Prefer positive ("did X") habits over abstain ("stayed off X") habits
// so the hero highlights something motivating rather than a default-positive
// like vape-free or sober-days when nothing else is going.
function flagshipStreak() {
  const positive = HABITS_YESTERDAY.filter(h => !h.invertCopy);
  const abstain  = HABITS_YESTERDAY.filter(h =>  h.invertCopy);
  let best = { name: 'Getting started', current: 0, best: 0 };
  const pick = (pool) => {
    pool.forEach(h => {
      const s = calcStreak(h.key, h.streakOn);
      if (s.current > best.current) best = { name: h.streakLabel, ...s };
    });
  };
  pick(positive);
  // Only fall back to an abstain streak if no positive habit has a streak going
  if (best.current === 0) pick(abstain);
  return best;
}

// Total entries logged
function totalEntries() { return load().entries.length; }

// 7-day consistency
function last7DayScore() {
  const entries = load().entries;
  let hits = 0, total = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const e = entries.find(x => x.date === d.toISOString().split('T')[0]);
    if (e) {
      HABITS_YESTERDAY.forEach(h => {
        total++;
        if (e.responses[h.key] === h.streakOn) hits++;
      });
    }
  }
  return total ? Math.round((hits / total) * 100) : 0;
}

// ── Greeting ───────────────────────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours();
  if (h < 5)  return 'Still up?';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 22) return 'Good evening';
  return 'Nearly bedtime';
}

function firstName() {
  if (demoMode) return 'friend';
  if (currentUser && currentUser.displayName) return currentUser.displayName.split(' ')[0];
  return 'there';
}

// ── Tabs ───────────────────────────────────────────────────────────────────
function showTab(btn, tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('tab-today').style.display   = tab === 'today'   ? '' : 'none';
  document.getElementById('tab-history').style.display = tab === 'history' ? '' : 'none';
  if (tab === 'today')   renderToday();
  if (tab === 'history') renderHistory();
}

// ============================================================
//  TODAY TAB
// ============================================================
function renderToday() {
  const existing  = getToday();
  const yesterday = getYesterday();
  const entries   = load().entries;
  const flagship  = flagshipStreak();
  const total     = totalEntries();
  const weekPct   = last7DayScore();

  const dateFmt = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  let html = '';

  // ── Hero dashboard card ──
  html += `<div class="hero fade-in">
    <div class="hero-greeting">${greeting()}, ${firstName()}</div>
    <div class="hero-title">${heroCopy(existing, flagship, total)}</div>
    <div class="hero-date">${dateFmt}</div>
    <div class="hero-stats">
      <div class="hero-stat"><div class="n">${flagship.current}</div><div class="l">${flagship.name} streak</div></div>
      <div class="hero-stat"><div class="n">${weekPct}%</div><div class="l">Last 7 days</div></div>
      <div class="hero-stat"><div class="n">${total}</div><div class="l">Total entries</div></div>
    </div>
  </div>`;

  // ── Completion state OR log form ──
  if (existing && allAnswered(existing)) {
    html += completionCardHtml(existing);
  } else {
    if (existing) {
      html += `<div class="logged-banner fade-in">${ICONS.check}You've already started today. Finish or update below.</div>`;
    }
    html += logFormHtml(existing, yesterday);
  }

  document.getElementById('tab-today').innerHTML = html;

  // Fire confetti if just completed
  if (window._justCompleted) {
    window._justCompleted = false;
    launchConfetti();
  }

  // Count-up animation on hero stats
  animateCountUps();
}

function heroCopy(existing, flagship, total) {
  if (total === 0)   return `Let's lay down your <em>first day</em>.`;
  if (existing && allAnswered(existing)) return `Today is <em>sorted</em>. Nicely done.`;
  if (flagship.current >= 7) return `You're <em>${flagship.current} days</em> into ${flagship.name.toLowerCase()}.`;
  if (flagship.current >= 3) return `${flagship.current} days strong on <em>${flagship.name.toLowerCase()}</em>.`;
  return `Here's your <em>check-in</em>.`;
}

function allAnswered(entry) {
  return HABITS.every(h => entry.responses[h.key] != null && entry.responses[h.key] !== '');
}

function logFormHtml(existing, yesterday) {
  const todayVal = existing ? (existing.responses.big_thing_today || '') : '';
  const dateFmt = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const yfmt = (() => {
    const d = new Date(); d.setDate(d.getDate()-1);
    return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  })();

  let html = `<div class="card big-thing-card fade-in">
    <div class="eyebrow">Today · ${dateFmt}</div>
    <div class="big-thing-label">${HABITS_TODAY[0].label}</div>
    <input type="text" class="big-thing-input" id="q_big_thing_today" placeholder="e.g. Ship the landing page copy"
      value="${todayVal.replace(/"/g,'&quot;')}">
  </div>`;

  html += `<div class="card fade-in">
    <div class="eyebrow">Looking back · ${yfmt}</div>`;

  if (yesterday && yesterday.responses.big_thing_today) {
    html += `<div class="yday-goal">
      <div class="yday-goal-icon">${ICONS.sparkle}</div>
      <div class="yday-goal-body">
        <div class="yday-goal-label">Yesterday's goal</div>
        <div class="yday-goal-text">"${yesterday.responses.big_thing_today}"</div>
      </div>
    </div>`;
  }

  html += `<div class="q-list stagger">`;
  HABITS_YESTERDAY.forEach(h => {
    const val = existing ? existing.responses[h.key] : null;
    html += habitRow(h, val, 'yn_');
  });
  html += `</div>`;

  if (demoMode) {
    html += `<div style="text-align:center;padding:16px 0 4px;color:var(--ink-soft);font-size:14px;font-weight:600">Sign in to log your own habits</div>`;
  } else {
    html += `<button class="btn-primary" onclick="submitLog()" style="margin-top:18px">
      ${ICONS.check} Save today's log
    </button>`;
  }

  html += `</div>`;
  return html;
}

function habitRow(h, val, idPrefix) {
  const yesOn = val === 'yes' ? 'on yes' : '';
  const noOn  = val === 'no'  ? 'on no'  : '';
  let rowCls = '';
  if (val) {
    const good = val === h.positiveOn;
    rowCls = good ? 'answered-yes' : 'answered-no';
  }
  return `<div class="q-row ${rowCls}" id="row_${idPrefix}${h.key}">
    <div class="q-text">${h.label}</div>
    <div class="yn-seg">
      <button class="yn-btn ${yesOn}" id="${idPrefix}${h.key}_yes" onclick="selectYN('${h.key}','yes','${idPrefix}')">Yes</button>
      <button class="yn-btn ${noOn}"  id="${idPrefix}${h.key}_no"  onclick="selectYN('${h.key}','no','${idPrefix}')">No</button>
    </div>
  </div>`;
}

function selectYN(key, clickedVal, idPrefix) {
  const h = HABITS.find(h => h.key === key);
  const row = document.getElementById(`row_${idPrefix}${key}`);
  ['yes','no'].forEach(v => {
    const btn = document.getElementById(`${idPrefix}${key}_${v}`);
    btn.classList.remove('on','yes','no');
    if (v === clickedVal) {
      btn.classList.add('on', v);
    }
  });
  row.classList.remove('answered-yes','answered-no');
  const good = clickedVal === h.positiveOn;
  row.classList.add(good ? 'answered-yes' : 'answered-no');
}

function submitLog() {
  const responses = {};
  for (const h of HABITS) {
    if (h.type === 'text') {
      const val = document.getElementById(`q_${h.key}`).value.trim();
      if (!val) { alert('Please fill in: ' + h.label); return; }
      responses[h.key] = val;
    } else {
      const yesSelected = document.getElementById(`yn_${h.key}_yes`).classList.contains('on');
      const noSelected  = document.getElementById(`yn_${h.key}_no`).classList.contains('on');
      if (!yesSelected && !noSelected) { alert('Please answer: ' + h.label); return; }
      responses[h.key] = yesSelected ? 'yes' : 'no';
    }
  }
  saveEntry(responses);
  window._justCompleted = true;
  renderToday();
}

// ── Completion card ────────────────────────────────────────────────────────
function completionCardHtml(entry) {
  const hits  = HABITS_YESTERDAY.filter(h => entry.responses[h.key] === h.streakOn).length;
  const total = HABITS_YESTERDAY.length;
  const pct   = Math.round((hits / total) * 100);
  const goal  = entry.responses.big_thing_today || '';

  let msg = 'All done for today. Rest easy.';
  if (pct === 100) msg = 'A perfect day on the habits. That\'s the stuff.';
  else if (pct >= 67) msg = 'Solid progress - most habits hit.';
  else if (pct >= 33) msg = 'Some habits were off. Tomorrow\'s a clean slate.';

  return `<div class="completion fade-in">
    <div class="confetti" id="confettiHost"></div>
    <div class="tick-wrap">
      <svg viewBox="0 0 50 50"><path class="tick-path" d="M13 26 L22 35 L37 17"/></svg>
    </div>
    <h2>Today - logged.</h2>
    <p>${msg}</p>
    ${goal ? `<div class="quoted">
      <div class="q-eyebrow">Your one thing today</div>
      "${goal}"
    </div>` : ''}
    <div class="completion-actions">
      <button class="btn-ghost" onclick="editToday()">${ICONS.edit} Edit today</button>
      <button class="btn-ghost" onclick="document.querySelectorAll('.tab')[1].click()">${ICONS.calendar} View history</button>
    </div>
  </div>`;
}

function editToday() { openEdit(todayStr()); }

function launchConfetti() {
  const host = document.getElementById('confettiHost');
  if (!host) return;
  const colors = ['#f2a89e','#c6e1de','#efe4d4','#3b8a73'];
  for (let i = 0; i < 24; i++) {
    const s = document.createElement('span');
    s.style.left  = (10 + Math.random() * 80) + '%';
    s.style.bottom = (20 + Math.random() * 30) + '%';
    s.style.background = colors[i % colors.length];
    s.style.setProperty('--dx', (Math.random() * 60 - 30) + 'px');
    s.style.animationDelay = (Math.random() * 0.3) + 's';
    s.style.width  = s.style.height = (4 + Math.random() * 6) + 'px';
    host.appendChild(s);
    setTimeout(() => s.remove(), 2000);
  }
}

function animateCountUps() {
  document.querySelectorAll('.hero-stat .n').forEach(el => {
    const raw = el.textContent.trim();
    const isPct = raw.endsWith('%');
    const target = parseInt(raw, 10);
    if (isNaN(target)) return;
    const duration = 600;
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = Math.round(target * eased);
      el.textContent = val + (isPct ? '%' : '');
      if (t < 1) requestAnimationFrame(step);
    }
    el.textContent = '0' + (isPct ? '%' : '');
    requestAnimationFrame(step);
  });
}

// ============================================================
//  HISTORY TAB
// ============================================================
let gridRange = 60; // days shown in contribution grid

function renderHistory() {
  const entries = load().entries;
  const ynHabits = HABITS.filter(h => h.type === 'yn');

  if (!entries.length) {
    document.getElementById('tab-history').innerHTML = `
      <div class="empty fade-in">
        <div class="empty-emoji">${ICONS.calendar}</div>
        <h3>No history yet</h3>
        <p>Once you log a few days, you'll see your streaks, a habit heat-grid and all your entries here.</p>
      </div>`;
    return;
  }

  const flagship = flagshipStreak();
  let html = '';

  // ── Streaks hero ──
  html += `<div class="streaks-hero fade-in">
    <div class="streak-flagship">
      <div class="flag-eyebrow">Longest current streak</div>
      <h3>${flagship.name}</h3>
      <div class="big-num" id="flagshipNum"><span data-target="${flagship.current}">0</span><span class="unit">days</span></div>
      <div class="best-line">Personal best · <b>${flagship.best} days</b></div>
    </div>
    <div class="streak-list">`;

  HABITS_YESTERDAY.forEach(h => {
    const s = calcStreak(h.key, h.streakOn);
    html += `<div class="streak-row">
      <div class="r-icon">${ICONS[h.iconKey] || ICONS.sparkle}</div>
      <div class="r-body">
        <div class="r-label">${h.streakLabel}</div>
        <div class="r-best">Best · ${s.best} days</div>
      </div>
      <div class="r-val">${s.current}<span class="unit">d</span></div>
    </div>`;
  });

  html += `</div></div>`;

  // ── Contribution grid ──
  html += `<div class="card grid-card fade-in">
    <h3>Habit grid</h3>
    <div class="sub">One row per habit · last ${gridRange} days · click a day to edit</div>
    <div class="habit-grid">`;

  ynHabits.forEach(h => {
    html += `<div class="hg-label">${h.streakLabel}</div>
      <div class="hg-cells" style="grid-template-columns: repeat(${gridRange}, 1fr)">`;
    for (let i = gridRange - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const e = entries.find(x => x.date === dStr);
      const isToday = dStr === todayStr() ? ' today-outline' : '';
      if (!e) {
        html += `<div class="hg-cell none${isToday}" title="${dStr} · no entry"></div>`;
      } else {
        const good = e.responses[h.key] === h.streakOn;
        html += `<div class="hg-cell ${good ? 'good' : 'bad'}${isToday}"
          onclick="openEdit('${dStr}')"
          title="${dStr} · ${good ? 'Hit' : 'Missed'}"></div>`;
      }
    }
    html += `</div>`;
  });

  html += `</div>
    <div class="grid-foot">
      <div class="grid-legend">
        <span class="grid-legend-swatch"><b style="background:var(--oatmeal)"></b>No entry</span>
        <span class="grid-legend-swatch"><b style="background:var(--spirulina)"></b>Hit</span>
        <span class="grid-legend-swatch"><b style="background:var(--berry)"></b>Missed</span>
      </div>
      <div class="grid-range-pills">
        <button class="${gridRange===30?'on':''}" onclick="setGridRange(30)">30d</button>
        <button class="${gridRange===60?'on':''}" onclick="setGridRange(60)">60d</button>
        <button class="${gridRange===90?'on':''}" onclick="setGridRange(90)">90d</button>
      </div>
    </div>
  </div>`;

  // ── Recent entries card list ──
  const sorted = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
  html += `<div class="recent-head">
    <h3>All entries</h3>
    <div style="display:flex;gap:10px;align-items:center">
      <span class="count">${sorted.length} logged</span>
      ${demoMode ? '' : `<button class="btn-ghost" onclick="exportData()">${ICONS.download} Export</button>`}
    </div>
  </div>`;

  html += `<div class="entry-list stagger">`;
  sorted.forEach(e => {
    const d = new Date(e.date + 'T12:00:00');
    const day = d.getDate();
    const mon = d.toLocaleDateString('en-GB', { month: 'short' });
    const hits = ynHabits.filter(h => e.responses[h.key] === h.streakOn).length;
    const pills = ynHabits.map(h => {
      const good = e.responses[h.key] === h.streakOn;
      return `<span class="entry-pill ${good ? 'good' : 'bad'}">${good ? ICONS.check : ICONS.x}${h.pillShort}</span>`;
    }).join('');
    html += `<div class="entry-card" onclick="${demoMode ? '' : `openEdit('${e.date}')`}"
      style="${demoMode ? 'cursor:default' : ''}">
      <div class="entry-date">
        <div class="d">${day}</div>
        <div class="m">${mon}</div>
      </div>
      <div class="entry-body">
        <div class="entry-goal" title="${(e.responses.big_thing_today||'').replace(/"/g,'&quot;')}">${e.responses.big_thing_today || '-'}</div>
        <div class="entry-pills">${pills}</div>
      </div>
      <div class="entry-score">${hits}<small>of ${ynHabits.length}</small></div>
    </div>`;
  });
  html += `</div>`;

  document.getElementById('tab-history').innerHTML = html;

  // count-up on flagship
  const flagEl = document.querySelector('#flagshipNum span[data-target]');
  if (flagEl) {
    const target = parseInt(flagEl.dataset.target, 10);
    const dur = 700, start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      flagEl.textContent = Math.round(target * eased);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
}

function setGridRange(n) { gridRange = n; renderHistory(); }

// ============================================================
//  EDIT MODAL
// ============================================================
function openEdit(dateStr) {
  const data      = load();
  const entry     = data.entries.find(e => e.date === dateStr);
  if (!entry) return;

  const prevDate  = new Date(dateStr + 'T12:00:00');
  prevDate.setDate(prevDate.getDate() - 1);
  const prevEntry = data.entries.find(e => e.date === prevDate.toISOString().split('T')[0]) || null;

  const fmt  = new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const yprev = new Date(dateStr + 'T12:00:00'); yprev.setDate(yprev.getDate() - 1);
  const yfmt = yprev.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  document.getElementById('modalTitle').textContent = fmt;

  let html = `<div class="card big-thing-card">
    <div class="eyebrow">Big thing for this day</div>
    <div class="big-thing-label">${HABITS_TODAY[0].label}</div>
    <input type="text" class="big-thing-input" id="edit_q_big_thing_today" placeholder="Type your answer…"
      value="${(entry.responses.big_thing_today||'').replace(/"/g,'&quot;')}">
  </div>
  <div class="card">
    <div class="eyebrow">Looking back · ${yfmt}</div>`;

  if (prevEntry && prevEntry.responses.big_thing_today) {
    html += `<div class="yday-goal">
      <div class="yday-goal-icon">${ICONS.sparkle}</div>
      <div class="yday-goal-body">
        <div class="yday-goal-label">Goal that day was</div>
        <div class="yday-goal-text">"${prevEntry.responses.big_thing_today}"</div>
      </div>
    </div>`;
  }

  html += `<div class="q-list">`;
  HABITS_YESTERDAY.forEach(h => {
    const val = entry.responses[h.key] || null;
    html += habitRow(h, val, 'edit_yn_');
  });
  html += `</div></div>
    <button class="btn-primary" onclick="saveEdit('${dateStr}')">
      ${ICONS.check} Save changes
    </button>`;

  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('editModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function saveEdit(dateStr) {
  const responses = {};
  for (const h of HABITS) {
    if (h.type === 'text') {
      const val = document.getElementById(`edit_q_${h.key}`).value.trim();
      if (!val) { alert('Please fill in: ' + h.label); return; }
      responses[h.key] = val;
    } else {
      const yesSelected = document.getElementById(`edit_yn_${h.key}_yes`).classList.contains('on');
      const noSelected  = document.getElementById(`edit_yn_${h.key}_no`).classList.contains('on');
      if (!yesSelected && !noSelected) { alert('Please answer: ' + h.label); return; }
      responses[h.key] = yesSelected ? 'yes' : 'no';
    }
  }
  const data  = load();
  const idx   = data.entries.findIndex(e => e.date === dateStr);
  const entry = idx > -1
    ? { ...data.entries[idx], responses, editedAt: new Date().toISOString() }
    : { date: dateStr, responses, completedAt: new Date().toISOString() };

  writeEntry(entry);
  closeModal();
  renderHistory();
  if (dateStr === todayStr()) renderToday();
}

function closeModal() {
  document.getElementById('editModal').classList.remove('open');
  document.body.style.overflow = '';
}

function handleOverlayClick(e) {
  if (e.target === document.getElementById('editModal')) closeModal();
}

function exportData() {
  const blob = new Blob([JSON.stringify(load(), null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `habits-${todayStr()}.json`;
  a.click();
}
