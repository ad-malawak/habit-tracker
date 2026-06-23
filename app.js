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
  { key: 'alcohol',             label: 'Did you stay off alcohol?',                type: 'yn', streakOn: 'yes', positiveOn: 'yes', streakLabel: 'Sober days',      iconKey: 'glass',   pillShort: 'Sober' },
  { key: 'vape',                label: 'Did you stay off the vape?',               type: 'yn', streakOn: 'yes', positiveOn: 'yes', streakLabel: 'Vape-free days', iconKey: 'wind',    pillShort: 'Vape-free' },
];

const HABITS = [...HABITS_TODAY, ...HABITS_YESTERDAY];
const KEY    = 'habitTrackerData';

// Respect the user's OS-level reduced-motion preference
const REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

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
  chevronLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  chevronRight:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
  quote: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h5v5l-3 5H6l3-5H7V7zm9 0h5v5l-3 5h-3l3-5h-2V7z"/></svg>',
};

// ── Daily quotes ───────────────────────────────────────────────────────────
// Seed set (the user's own principles). Expanded with their Notion content +
// optional book lines once supplied. category drives the eyebrow label.
const QUOTES = [
  // Life & happiness
  { text: "You, and all your problems, are tiny in the grand scheme of the universe. That's not frightening, it's freeing.", category: "Keep perspective" },
  { text: "There are more stars in the universe than grains of sand on any beach, more than words or sounds ever uttered by all the humans who ever lived.", category: "Keep perspective", source: "Neil deGrasse Tyson, Astrophysics for People in a Hurry" },
  { text: "Enjoy the present, without anxious dependence upon the future. The greatest blessings of mankind are within us and within our reach.", category: "Live in the present", source: "Seneca" },
  { text: "Make decisions as if you're 80, looking back. Would you regret having tried, or not having tried?", category: "Minimise regret" },
  { text: "Spend time with the people who give you energy, not the ones who take it.", category: "Protect your energy" },
  { text: "The more you earn, the more you spend. Aim for fulfilment in the places money can't reach.", category: "Money isn't the metric" },
  { text: "Be interested, and be interesting. The people you're drawn to listen well, ask good questions, and see the world a little differently.", category: "Be interested, be interesting" },
  { text: "There are many paths to success. Keep your head up, the opportunity beside you might not be obvious.", category: "Stay open" },
  { text: "Success cannot be pursued; it must ensue, as the unintended side effect of one's dedication to a cause greater than oneself.", category: "On success", source: "Viktor Frankl, Man's Search for Meaning" },
  { text: "Everyone meets fortunate situations. The 'lucky' ones are simply those with the courage to act on them.", category: "On luck" },
  { text: "More conversations, more luck.", category: "On luck" },
  { text: "Be impeccable with your word. Never use it against yourself or to spread poison about others. You are the author of your own story.", category: "The Four Agreements", source: "don Miguel Ruiz" },
  { text: "Don't take anything personally. Always assume positive intent.", category: "The Four Agreements", source: "don Miguel Ruiz" },
  { text: "Don't make assumptions. Everyone has their own story, so don't judge what you don't understand.", category: "The Four Agreements", source: "don Miguel Ruiz" },
  { text: "Always do your best. If you leave nothing on the table, failure is nothing to fear.", category: "The Four Agreements", source: "don Miguel Ruiz" },
  { text: "Be like a candle. In good times the flame won't grow; in hard times it won't shrink. It just keeps burning.", category: "Steady flame", source: "Hector Bellerin, High Performance" },
  { text: "Get 1% better every day and you end the year about 37 times better off.", category: "Compound the small wins" },
  { text: "Channel your energy into positivity. Be the positive energy people want to be around.", category: "Be the energy" },
  // Work, life balance & career
  { text: "The working week is at least five of your seven days. Do something meaningful, don't settle for what doesn't excite you.", category: "On work" },
  { text: "Work is a vehicle: new people, new places, new perspectives. As life narrows, it's one of the rare ways to keep meeting the world.", category: "On work" },
  { text: "The magic is when work and life become one and the same: great people, meaningful work, the thing you happily talk about at the weekend.", category: "On work" },
  { text: "You can't give family, friends, health and work your all at once. Pick two, do them well, and tell the rest when their turn will come.", category: "The Four Burners" },
  { text: "Everyone has their own path. Don't compare.", category: "Run your own race" },
  { text: "It always seems impossible until it's done.", category: "On courage", source: "Nelson Mandela, Long Walk to Freedom" },
];

let quoteIdx = 0;

// Stable index for the day so the "quote of the day" only changes at midnight.
function quoteOfDayIndex() {
  const s = todayStr();
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return QUOTES.length ? h % QUOTES.length : 0;
}

function quoteCardHtml() {
  if (!QUOTES.length) return '';
  const q = QUOTES[quoteIdx];
  return `<div class="quote-card fade-in" id="quoteCard">
    <div class="quote-glyph">${ICONS.quote}</div>
    <div class="quote-inner" id="quoteInner">
      ${q.category ? `<div class="quote-eyebrow">${q.category}</div>` : ''}
      <div class="quote-text">${q.text}</div>
      ${q.source ? `<div class="quote-source">&mdash; ${q.source}</div>` : ''}
    </div>
    <div class="quote-foot">
      <button class="quote-nav" onclick="quoteStep(-1)" aria-label="Previous quote">${ICONS.chevronLeft}</button>
      <span class="quote-count">${quoteIdx + 1} / ${QUOTES.length}</span>
      <button class="quote-nav" onclick="quoteStep(1)" aria-label="Next quote">${ICONS.chevronRight}</button>
    </div>
  </div>`;
}

function quoteStep(dir) {
  const n = QUOTES.length;
  if (!n) return;
  quoteIdx = (quoteIdx + dir + n) % n;
  const inner = document.getElementById('quoteInner');
  const card  = document.getElementById('quoteCard');
  const q = QUOTES[quoteIdx];
  const fill = () => {
    inner.innerHTML =
      (q.category ? `<div class="quote-eyebrow">${q.category}</div>` : '') +
      `<div class="quote-text">${q.text}</div>` +
      (q.source ? `<div class="quote-source">&mdash; ${q.source}</div>` : '');
    const count = card.querySelector('.quote-count');
    if (count) count.textContent = `${quoteIdx + 1} / ${n}`;
  };
  if (REDUCED || !inner) { fill(); return; }
  inner.classList.add('swap-out');
  setTimeout(() => { fill(); inner.classList.remove('swap-out'); inner.classList.add('swap-in');
    setTimeout(() => inner.classList.remove('swap-in'), 260); }, 130);
}

// Touch swipe on the quote card -> step through quotes
function bindQuoteSwipe() {
  const card = document.getElementById('quoteCard');
  if (!card) return;
  let x0 = null;
  card.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  card.addEventListener('touchend', e => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) quoteStep(dx < 0 ? 1 : -1);
    x0 = null;
  }, { passive: true });
}

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
        alcohol:              p[4] ? 'yes' : 'no',
        vape:                 p[5] ? 'yes' : 'no',
      },
      completedAt: d.toISOString()
    };
  });
}

function enterDemoMode() {
  demoMode    = true;
  demoEntries = generateDemoEntries();
  gridOffset  = 0;
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
  gridOffset  = 0;
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

// Per-day habit scores for the last n days (null = no entry that day)
function dailyScores(n = 7) {
  const entries = load().entries, out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split('T')[0];
    const e = entries.find(x => x.date === dStr);
    out.push({
      date: dStr,
      day: d.toLocaleDateString('en-GB', { weekday: 'narrow' }),
      score: e ? HABITS_YESTERDAY.filter(h => e.responses[h.key] === h.streakOn).length : null
    });
  }
  return out;
}

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
function showTab(tab) {
  document.querySelectorAll('.tab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === tab));
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
  liveAnswers = existing ? { ...existing.responses } : {};
  let html = '';

  // ── Hero dashboard card with activity ring ──
  html += `<div class="hero fade-in">
    <div class="hero-flex">
      <div class="hero-text">
        <div class="hero-greeting">${greeting()}, ${firstName()}</div>
        <div class="hero-title">${heroCopy(existing, flagship, total)}</div>
        <div class="hero-date">${dateFmt}</div>
      </div>
      <div class="ring-wrap" id="todayRing">
        ${ringSvg(null, { ids: true })}
        <div class="ring-center">
          <div class="ring-count" id="ringCount">0<span>/6</span></div>
          <div class="ring-label">yesterday</div>
        </div>
      </div>
    </div>
    <div class="hero-stats">
      <div class="hero-stat"><div class="n">${flagship.current}</div><div class="l">${flagship.name} streak</div></div>
      <div class="hero-stat"><div class="n">${weekPct}%</div><div class="l">Last 7 days</div></div>
      <div class="hero-stat"><div class="n">${total}</div><div class="l">Total entries</div></div>
    </div>
  </div>`;

  // ── Completion state OR log form ──
  if (existing && allAnswered(existing)) {
    html += completionCardHtml(existing);
    quoteIdx = quoteOfDayIndex();
    html += quoteCardHtml();
  } else {
    if (existing) {
      html += `<div class="logged-banner fade-in">${ICONS.check}You've already started today. Finish or update below.</div>`;
    }
    html += logFormHtml(existing, yesterday);
  }

  document.getElementById('tab-today').innerHTML = html;

  // Fire confetti if just completed
  if (window._justCompleted) {
    const wasPerfect = !!window._justCompletedPerfect;
    window._justCompleted = false;
    window._justCompletedPerfect = false;
    launchConfetti(wasPerfect);
  }

  // Count-up animation on hero stats
  animateCountUps();

  // Draw the ring (staggered segment sweep on first paint)
  requestAnimationFrame(() => updateRing(true));

  // Enable swipe browsing on the quote card if present
  bindQuoteSwipe();
}

function heroCopy(existing, flagship, total) {
  if (total === 0)   return `Let's lay down your <em>first day</em>.`;
  if (existing && isPerfectDay(existing)) return `Yesterday was <em>perfect</em>. Six for six.`;
  if (existing && allAnswered(existing)) return `Today is <em>sorted</em>. Nicely done.`;
  if (flagship.current >= 7) return `You're <em>${flagship.current} days</em> into ${flagship.name.toLowerCase()}.`;
  if (flagship.current >= 3) return `${flagship.current} days strong on <em>${flagship.name.toLowerCase()}</em>.`;
  return `Here's your <em>check-in</em>.`;
}

function allAnswered(entry) {
  return HABITS.every(h => entry.responses[h.key] != null && entry.responses[h.key] !== '');
}

// True only when every yes/no habit hit its positive answer.
function isPerfectDay(entry) {
  if (!entry || !entry.responses) return false;
  return HABITS_YESTERDAY.every(h => entry.responses[h.key] === h.streakOn);
}

// ── Activity ring ──────────────────────────────────────────────────────────
// Live state for the Today ring: mirrors the form's answers before save.
let liveAnswers = {};

function arcPath(cx, cy, r, a0, a1) {              // angles in degrees, 0 = 12 o'clock
  const rad = a => (a - 90) * Math.PI / 180;
  const x0 = cx + r * Math.cos(rad(a0)), y0 = cy + r * Math.sin(rad(a0));
  const x1 = cx + r * Math.cos(rad(a1)), y1 = cy + r * Math.sin(rad(a1));
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

// Segmented ring SVG, one arc per yes/no habit.
// opts.ids   — give each segment an id so updateRing() can drive it live
// opts.static — bake in answer state with no transitions (history mini rings)
function ringSvg(answers, opts = {}) {
  const n = HABITS_YESTERDAY.length;
  const gap = 8, span = 360 / n;
  let segs = '';
  HABITS_YESTERDAY.forEach((h, i) => {
    const d = arcPath(60, 60, 50, i * span + gap / 2, (i + 1) * span - gap / 2);
    let state = '';
    if (opts.static && answers && answers[h.key] != null) {
      state = answers[h.key] === h.streakOn ? ' lit hit' : ' lit miss';
    }
    segs += `<path class="ring-track" d="${d}"></path>`;
    segs += `<path class="ring-seg${state}"${opts.ids ? ` id="ringSeg_${h.key}"` : ''} d="${d}" pathLength="1"></path>`;
  });
  return `<svg class="ring-svg${opts.static ? ' static' : ''}" viewBox="0 0 120 120" aria-hidden="true">${segs}</svg>`;
}

// Sync the Today ring with liveAnswers. Class toggles only — never re-renders
// the form, so the yn_* DOM ids submitLog depends on stay intact.
function updateRing(stagger) {
  let hits = 0;
  HABITS_YESTERDAY.forEach((h, i) => {
    const seg = document.getElementById(`ringSeg_${h.key}`);
    if (!seg) return;
    const val  = liveAnswers[h.key];
    const good = val === h.streakOn;
    if (val != null && good) hits++;
    seg.style.transitionDelay = (stagger && !REDUCED) ? (i * 0.08) + 's' : '0s';
    seg.classList.toggle('lit',  val != null);
    seg.classList.toggle('hit',  val != null && good);
    seg.classList.toggle('miss', val != null && !good);
  });
  const wrap  = document.getElementById('todayRing');
  const count = document.getElementById('ringCount');
  if (wrap)  wrap.classList.toggle('ring--perfect', hits === HABITS_YESTERDAY.length);
  if (count) count.innerHTML = `${hits}<span>/6</span>`;
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

  // Drive the Today ring live (today form only — never the edit modal)
  if (idPrefix === 'yn_') {
    liveAnswers[key] = clickedVal;
    updateRing();
  }
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
  window._justCompletedPerfect = isPerfectDay({ responses });
  renderToday();
}

// ── Completion card ────────────────────────────────────────────────────────
function completionCardHtml(entry) {
  const hits    = HABITS_YESTERDAY.filter(h => entry.responses[h.key] === h.streakOn).length;
  const total   = HABITS_YESTERDAY.length;
  const pct     = Math.round((hits / total) * 100);
  const goal    = entry.responses.big_thing_today || '';
  const perfect = isPerfectDay(entry);

  let title = 'Today - logged.';
  let msg   = 'All done for today. Rest easy.';
  if (perfect) {
    title = 'Yesterday - perfect.';
    msg   = 'Six for six. Take the win.';
  } else if (pct >= 67) msg = 'Solid progress - most habits hit.';
  else if (pct >= 33)   msg = 'Some habits were off. Tomorrow\'s a clean slate.';

  return `<div class="completion ${perfect ? 'completion--perfect' : ''} fade-in">
    ${perfect ? `<div class="perfect-badge">${ICONS.sparkle}<span>Perfect day</span></div>` : ''}
    <div class="tick-wrap">
      <svg viewBox="0 0 50 50"><path class="tick-path" d="M13 26 L22 35 L37 17"/></svg>
    </div>
    <h2>${title}</h2>
    <p>${msg}</p>
    ${goal ? `<div class="quoted">
      <div class="q-eyebrow">Your one thing today</div>
      "${goal}"
    </div>` : ''}
    <div class="completion-actions">
      <button class="btn-ghost" onclick="editToday()">${ICONS.edit} Edit today</button>
      <button class="btn-ghost" onclick="showTab('history')">${ICONS.calendar} View history</button>
    </div>
  </div>`;
}

function editToday() { openEdit(todayStr()); }

// Full-screen canvas confetti: two bottom-corner cannons, gravity + drag.
function launchConfetti(perfect) {
  if (REDUCED) return;
  const old = document.getElementById('confettiCanvas');
  if (old) old.remove();
  const canvas = document.createElement('canvas');
  canvas.id = 'confettiCanvas';
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:200;pointer-events:none;';
  document.body.appendChild(canvas);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = window.innerWidth, H = window.innerHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const colors = perfect
    ? ['#f0c14b','#fae5a4','#c79018','#efe4d4','#c6e1de']
    : ['#3b8a73','#c6e1de','#efe4d4','#3d7c85'];
  const N = perfect ? 160 : 70;
  const parts = [];
  for (let i = 0; i < N; i++) {
    const fromLeft = i % 2 === 0;
    parts.push({
      x: fromLeft ? -10 : W + 10,
      y: H * (0.55 + Math.random() * 0.35),
      vx: (fromLeft ? 1 : -1) * (4 + Math.random() * 8),
      vy: -(9 + Math.random() * 8),
      w: 6 + Math.random() * 6,
      h: 4 + Math.random() * 4,
      rot: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.3,
      c: colors[i % colors.length],
    });
  }

  const t0 = performance.now();
  let raf;
  function frame(t) {
    ctx.clearRect(0, 0, W, H);
    let alive = false;
    for (const p of parts) {
      p.vy += 0.25; p.vx *= 0.99;
      p.x += p.vx; p.y += p.vy; p.rot += p.spin;
      if (p.y < H + 20) alive = true;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (alive && t - t0 < 3500) raf = requestAnimationFrame(frame);
    else { cancelAnimationFrame(raf); canvas.remove(); }
  }
  raf = requestAnimationFrame(frame);
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
let gridWindow = 14; // days shown per page in the contribution grid
let gridOffset = 0;  // pages back from today (0 = window ending today)

// The YYYY-MM-DD strings for the current grid window, oldest -> newest.
function windowDates() {
  const out = [];
  const start = gridWindow - 1 + gridOffset * gridWindow;
  for (let i = start; i >= gridOffset * gridWindow; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    out.push(d.toISOString().split('T')[0]);
  }
  return out;
}

function fmtShort(dStr) {
  return new Date(dStr + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

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
  const MILESTONES = [7, 30, 50, 100];
  const nextMs = MILESTONES.find(m => flagship.best < m);
  const msChips = MILESTONES.map(m => {
    const done = flagship.best >= m;
    return `<span class="ms-chip${done ? ' done' : ''}${m === nextMs ? ' next' : ''}">${done ? ICONS.check : ''}${m}d</span>`;
  }).join('');

  html += `<div class="streaks-hero fade-in">
    <div class="streak-flagship">
      <div class="flag-eyebrow">Longest current streak</div>
      <h3>${flagship.name}</h3>
      <div class="big-num" id="flagshipNum"><span data-target="${flagship.current}">0</span><span class="unit">days</span></div>
      <div class="best-line">Personal best · <b>${flagship.best} days</b></div>
      <div class="ms-chips">${msChips}</div>
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

  // ── 7-day bar chart ──
  const scores = dailyScores(7);
  html += `<div class="card week-chart fade-in">
    <h3>Last 7 days</h3>
    <div class="sub">Habits hit per day${demoMode ? '' : ' · tap a bar to edit'}</div>
    <div class="week-bars">` +
    scores.map(s => {
      const pct = s.score == null ? 0 : (s.score / HABITS_YESTERDAY.length) * 100;
      const cls = s.score == null ? 'ghost' : (s.score === HABITS_YESTERDAY.length ? 'gold' : 'ok');
      const isToday = s.date === todayStr();
      return `<div class="week-bar-col${isToday ? ' is-today' : ''}"
        ${demoMode ? '' : `onclick="openEdit('${s.date}')"`}
        title="${s.date} · ${s.score == null ? 'no entry' : s.score + ' of ' + HABITS_YESTERDAY.length}">
        <div class="week-bar-val">${s.score == null ? '·' : s.score}</div>
        <div class="week-bar-track"><div class="week-bar ${cls}" style="height:${Math.max(pct, 7)}%"></div></div>
        <div class="week-bar-day">${s.day}</div>
      </div>`;
    }).join('') +
  `</div></div>`;

  // ── Contribution grid (paged window) ──
  const dates = windowDates();
  const colTemplate = `grid-template-columns: repeat(${gridWindow}, 1fr)`;
  const rangeLabel = `${fmtShort(dates[0])} – ${fmtShort(dates[dates.length - 1])}`;

  html += `<div class="card grid-card fade-in">
    <h3>Habit grid</h3>
    <div class="sub">Click a day to edit · use Prev/Next to travel back in time</div>
    <div class="habit-grid">`;

  // Perfect-days header row
  html += `<div class="hg-label hg-label--perfect">Perfect days</div>
    <div class="hg-cells hg-cells--perfect" style="${colTemplate}">`;
  dates.forEach(dStr => {
    const e = entries.find(x => x.date === dStr);
    const perfect = isPerfectDay(e);
    const isToday = dStr === todayStr() ? ' today-outline' : '';
    html += `<div class="hg-perfect${perfect ? ' is-perfect' : ''}${isToday}"
      ${perfect ? `onclick="openEdit('${dStr}')"` : ''}
      title="${dStr} · ${perfect ? 'Perfect day' : (e ? 'Not perfect' : 'No entry')}"></div>`;
  });
  html += `</div>`;

  ynHabits.forEach(h => {
    html += `<div class="hg-label">${h.streakLabel}</div>
      <div class="hg-cells" style="${colTemplate}">`;
    dates.forEach(dStr => {
      const e = entries.find(x => x.date === dStr);
      const isToday = dStr === todayStr() ? ' today-outline' : '';
      if (!e) {
        const addable = !demoMode;
        html += `<div class="hg-cell none${isToday}${addable ? ' addable' : ''}"
          ${addable ? `onclick="openEdit('${dStr}')"` : ''}
          title="${dStr} · ${addable ? 'click to log this day' : 'no entry'}"></div>`;
      } else {
        const good = e.responses[h.key] === h.streakOn;
        html += `<div class="hg-cell ${good ? 'good' : 'bad'}${isToday}"
          onclick="openEdit('${dStr}')"
          title="${dStr} · ${good ? 'Hit' : 'Missed'}"></div>`;
      }
    });
    html += `</div>`;
  });

  html += `</div>
    <div class="grid-foot">
      <div class="grid-legend">
        <span class="grid-legend-swatch"><b style="background:var(--oatmeal)"></b>No entry</span>
        <span class="grid-legend-swatch"><b style="background:var(--spirulina)"></b>Hit</span>
        <span class="grid-legend-swatch"><b style="background:var(--berry)"></b>Missed</span>
        <span class="grid-legend-swatch"><b style="background:var(--gold);box-shadow:0 0 0 1px var(--gold-deep)"></b>Perfect day</span>
      </div>
      <div class="grid-pager">
        <button class="grid-pager-btn" onclick="pageGrid(1)" aria-label="Earlier days">${ICONS.chevronLeft} Prev</button>
        <span class="grid-pager-range">${rangeLabel}</span>
        <button class="grid-pager-btn" onclick="pageGrid(-1)" ${gridOffset === 0 ? 'disabled' : ''} aria-label="More recent days">Next ${ICONS.chevronRight}</button>
      </div>
    </div>
  </div>`;

  // ── Recent entries card list ──
  const sorted = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
  html += `<div class="recent-head">
    <h3>All entries</h3>
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <span class="count">${sorted.length} logged</span>
      ${demoMode ? '' : `<label class="btn-ghost" style="cursor:pointer;position:relative;overflow:hidden">${ICONS.calendar} Log a past day<input type="date" max="${todayStr()}" onchange="openEdit(this.value); this.value='';" style="position:absolute;inset:0;opacity:0;cursor:pointer"></label>`}
      ${demoMode ? '' : `<button class="btn-ghost" onclick="exportData()">${ICONS.download} Export</button>`}
    </div>
  </div>`;

  html += `<div class="entry-list stagger">`;
  sorted.forEach(e => {
    const d = new Date(e.date + 'T12:00:00');
    const day = d.getDate();
    const mon = d.toLocaleDateString('en-GB', { month: 'short' });
    const hits = ynHabits.filter(h => e.responses[h.key] === h.streakOn).length;
    const perfect = isPerfectDay(e);
    const pillsHtml = ynHabits.map(h => {
      const good = e.responses[h.key] === h.streakOn;
      return `<span class="entry-pill ${good ? 'good' : 'bad'}">${good ? ICONS.check : ICONS.x}${h.pillShort}</span>`;
    }).join('') + (perfect ? `<span class="entry-pill perfect">${ICONS.sparkle}Perfect</span>` : '');
    html += `<div class="entry-card ${perfect ? 'entry-card--perfect' : ''}" onclick="${demoMode ? '' : `openEdit('${e.date}')`}"
      style="${demoMode ? 'cursor:default' : ''}">
      <div class="entry-date">
        <div class="d">${day}</div>
        <div class="m">${mon}</div>
      </div>
      <div class="entry-body">
        <div class="entry-goal" title="${(e.responses.big_thing_today||'').replace(/"/g,'&quot;')}">${e.responses.big_thing_today || '-'}</div>
        <div class="entry-pills">${pillsHtml}</div>
      </div>
      <div class="entry-score">
        <div class="ring-wrap ring-mini${perfect ? ' ring--perfect' : ''}">
          ${ringSvg(e.responses, { static: true })}
          <div class="ring-center"><span class="mini-n">${hits}</span></div>
        </div>
      </div>
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

// dir = +1 to go back in time (older), -1 to move toward today
function pageGrid(dir) {
  gridOffset = Math.max(0, gridOffset + dir);
  renderHistory();
}

// ============================================================
//  EDIT MODAL
// ============================================================
function openEdit(dateStr) {
  if (!dateStr) return;
  const data      = load();
  const existing  = data.entries.find(e => e.date === dateStr);
  const isNew     = !existing;
  const entry     = existing || { date: dateStr, responses: {} };

  const prevDate  = new Date(dateStr + 'T12:00:00');
  prevDate.setDate(prevDate.getDate() - 1);
  const prevEntry = data.entries.find(e => e.date === prevDate.toISOString().split('T')[0]) || null;

  const fmt  = new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const yprev = new Date(dateStr + 'T12:00:00'); yprev.setDate(yprev.getDate() - 1);
  const yfmt = yprev.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  document.getElementById('modalTitle').textContent = (isNew ? 'Add entry · ' : '') + fmt;

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
  // iOS-proof scroll lock: overflow:hidden alone doesn't stop touch scroll
  window._lockScrollY = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${window._lockScrollY}px`;
  document.body.style.width = '100%';
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
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  window.scrollTo(0, window._lockScrollY || 0);
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

// ── Mobile keyboard handling ───────────────────────────────────────────────
// Hide the fixed bottom bar while a text input is focused (iOS keyboard
// pushes fixed elements mid-screen otherwise).
document.addEventListener('focusin', e => {
  if (e.target.matches('input')) document.body.classList.add('kbd-open');
});
document.addEventListener('focusout', () => {
  document.body.classList.remove('kbd-open');
});
