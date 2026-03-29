/* =============================================================
   frontend-integration.js — Serenity v2
   ─────────────────────────────────────────────────────────────
   Paste these additions into script.js to connect the updated
   Serenity Adaptive Engine frontend to the v2 backend.

   Three connection points:

   1. Mode buttons  → POST /api/sessions
   2. Notify forms  → POST /api/notify
   3. End takeover  → POST /api/breathing-logs
   ============================================================= */

const API_BASE = 'http://localhost:5000/api';

/* ── 1. Mode button → backend session ──────────────────────── */
/*
   In the AdaptiveEngine class, the panic and focus btn listeners
   call this.setState(). Add startSession() calls there too.

   For exam and sleep buttons, add new listeners alongside the
   existing panic/focus ones inside init():

   document.querySelectorAll('.mode-btn--exam, [data-mode="exam"]').forEach(btn => {
     btn.addEventListener('click', () => startSession('exam'));
   });
   document.querySelectorAll('.mode-btn--sleep, [data-mode="sleep"]').forEach(btn => {
     btn.addEventListener('click', () => startSession('sleep'));
   });

   And add startSession(mode) calls inside the existing panic/focus handlers.
*/

async function startSession(mode) {
  try {
    const res  = await fetch(`${API_BASE}/sessions`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ mode })
    });
    const data = await res.json();

    // Store session ID so breathing log can reference it
    sessionStorage.setItem('serenity_session_id', data.sessionId);
    sessionStorage.setItem('serenity_mode', mode);

    // For exam and sleep — display recommendation in #begin section
    if (mode === 'exam' || mode === 'sleep') {
      displayRecommendation(data.recommendation);
      document.getElementById('begin')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // For panic and focus — AdaptiveEngine already handles the UI state.
    // The recommendation is stored in DB and shown after takeover ends.
    if (mode === 'panic') {
      sessionStorage.setItem('serenity_panic_start', Date.now());
      sessionStorage.setItem('serenity_panic_recommendation', JSON.stringify(data.recommendation));
    }

    console.log(`[Serenity] Session started:`, data);
  } catch (err) {
    console.error('[Serenity] Failed to start session:', err);
  }
}

/* ── 2. Show recommendation card in #begin ──────────────────── */

function displayRecommendation(rec) {
  if (!rec) return;
  const beginSection = document.getElementById('begin');
  if (!beginSection) return;

  const existing = beginSection.querySelector('.serenity-recommendation');
  if (existing) existing.remove();

  const inner = beginSection.querySelector('.placeholder-section__inner');
  inner.insertAdjacentHTML('beforeend', `
    <div class="serenity-recommendation" style="
      margin-top: 24px;
      background: rgba(255,255,255,0.55);
      backdrop-filter: blur(14px);
      border: 1px solid rgba(255,255,255,0.7);
      border-radius: var(--radius-card);
      padding: 32px;
      max-width: 520px;
      text-align: left;
      width: 100%;
    ">
      <p style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--sage);font-weight:500;margin-bottom:8px;">Your Session</p>
      <h3 style="font-family:'Fraunces',serif;font-weight:300;font-size:1.4rem;margin-bottom:12px;color:var(--ink);">${rec.title}</h3>
      <p style="font-size:0.92rem;color:var(--ink-soft);line-height:1.7;margin-bottom:20px;">${rec.message}</p>
      <ul style="list-style:none;display:flex;flex-direction:column;gap:10px;margin-bottom:16px;">
        ${rec.techniques.map(t => `
          <li style="display:flex;gap:10px;align-items:flex-start;font-size:0.875rem;color:var(--ink-soft);">
            <span style="color:var(--sage);flex-shrink:0;">✦</span><span>${t}</span>
          </li>`).join('')}
      </ul>
      <p style="font-size:0.78rem;color:var(--sage);font-weight:500;">⏱ Suggested duration: ${rec.duration}</p>
    </div>
  `);
}

/* ── 3. Notify Me forms → backend ───────────────────────────── */
/*
   Add this to DOMContentLoaded in script.js, after new AdaptiveEngine().

   Maps each section's form to its section ID for the backend.
*/

const SECTION_MAP = {
  'light-therapy':   'light-therapy',
  'sound-therapy':   'sound-therapy',
  'breathing-section': 'breathing',
  'quick-calm':      'quick-calm'
};

document.querySelectorAll('.notify-form').forEach(form => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailInput = form.querySelector('input[type="email"]');
    const btn        = form.querySelector('button[type="submit"]');
    const email      = emailInput?.value?.trim();

    // Find which section this form belongs to
    const sectionEl = form.closest('section[id]');
    const section   = SECTION_MAP[sectionEl?.id];

    if (!email || !section) return;

    btn.disabled    = true;
    btn.textContent = 'Saving...';

    try {
      const res  = await fetch(`${API_BASE}/notify`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, section })
      });
      const data = await res.json();

      btn.textContent  = data.alreadySignedUp ? 'Already signed up ✓' : 'You\'re on the list ✓';
      emailInput.value = '';
    } catch (err) {
      btn.textContent = 'Try again';
      btn.disabled    = false;
      console.error('[Serenity] Notify signup failed:', err);
    }
  });
});

/* ── 4. Breathing takeover exit → log to backend ────────────── */
/*
   In AdaptiveEngine, find the endTakeoverBtn listener and add this:

   this.endTakeoverBtn.addEventListener('click', () => {
     logBreathingSession();   ← ADD THIS
     if(this.simulator) this.simulator.value = 'neutral';
     this.setState('neutral');
   });
*/

async function logBreathingSession() {
  const startTime  = parseInt(sessionStorage.getItem('serenity_panic_start') || '0');
  const sessionId  = sessionStorage.getItem('serenity_session_id');
  const now        = Date.now();
  const durationSeconds = startTime ? Math.round((now - startTime) / 1000) : 0;
  const cyclesCompleted = Math.floor(durationSeconds / 19);

  try {
    await fetch(`${API_BASE}/breathing-logs`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ sessionId, cyclesCompleted, durationSeconds, exitReason: 'user-grounded' })
    });

    // Show the post-panic recommendation in #begin after grounding
    const storedRec = sessionStorage.getItem('serenity_panic_recommendation');
    if (storedRec) {
      displayRecommendation(JSON.parse(storedRec));
      sessionStorage.removeItem('serenity_panic_recommendation');
    }
  } catch (err) {
    console.error('[Serenity] Failed to log breathing session:', err);
  }
}
