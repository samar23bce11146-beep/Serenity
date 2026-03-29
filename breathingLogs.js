/*
  recommendationEngine.js — v2
  ─────────────────────────────────────────────────────────────
  Updated to match the Serenity Adaptive Interaction Engine frontend.

  Key v2 changes:
  - panic mode no longer routes to Begin section — it triggers the
    breathing takeover overlay instead. The recommendation here is
    stored in the DB and shown AFTER the user exits the takeover.
  - focus mode sets body[data-user-state="focus"] on the frontend.
    Recommendation is minimal — keep the user in flow state.
  - exam and sleep recommendations are unchanged and shown in Begin.
  - neutral state returns a gentle baseline recommendation.
*/

const RECOMMENDATIONS = {

  exam: {
    title: 'Pre-Exam Calm & Focus',
    message:
      'It is completely normal to feel pressure before an exam. Your mind is sharp and ready. ' +
      'The next few minutes are about channelling that energy into clear, focused thought — ' +
      'not eliminating the feeling, but working with it.',
    techniques: [
      'Box breathing (4 counts in · 4 hold · 4 out · 4 hold) — repeat 4 times',
      'Progressive muscle relaxation — clench and release your hands slowly',
      '5-4-3-2-1 grounding: name 5 things you see, 4 you feel, 3 you hear',
      'Soft blue or green light exposure for 3–5 minutes to boost alertness',
      'Low-frequency binaural beats (40 Hz gamma) to sharpen concentration'
    ],
    duration: '5–8 minutes'
  },

  sleep: {
    title: 'Gentle Wind-Down',
    message:
      'Sleep anxiety often comes from trying too hard to sleep. ' +
      'Serenity will guide you into a state where sleep can arrive naturally. ' +
      'There is nothing to do — just allow your body to soften.',
    techniques: [
      '4-7-8 breathing: inhale 4s · hold 7s · exhale 8s — repeat 3 times',
      'Body scan: slowly notice and release tension from toes to forehead',
      'Warm amber or dim red light to signal your brain that it is night',
      'Delta wave binaural beats (0.5–4 Hz) layered under rain or ocean sounds',
      'Visualise a calm, safe place in full sensory detail for 2–3 minutes'
    ],
    duration: '10–15 minutes'
  },

  panic: {
    // Shown AFTER the breathing takeover overlay is dismissed
    title: 'You made it through.',
    message:
      'That took real courage. Your nervous system has now been reset through the ' +
      '4-7-8 breathing technique — your heart rate has slowed and your cortisol is dropping. ' +
      'Take a moment before you continue. You are safe.',
    techniques: [
      'Stay off screens for the next 5 minutes if you can',
      'Drink a glass of cold water slowly',
      'Step outside or open a window for fresh air',
      'Write down one thing that is within your control right now',
      'Return to Serenity anytime you feel overwhelmed'
    ],
    duration: '5 minutes of quiet'
  },

  focus: {
    // Minimal — keep the user in deep work flow state
    title: 'Flow State Activated',
    message:
      'Your environment has been optimised for deep work. ' +
      'Serenity has set a focused ambient state. ' +
      'Silence notifications and let the next session begin.',
    techniques: [
      'Work in 90-minute focused sprints with 10-minute breaks',
      'Alpha-wave binaural beats (8–12 Hz) for sustained concentration',
      'Cool daylight-spectrum light to keep melatonin suppressed',
      'One clear intention: write what you will accomplish before you start'
    ],
    duration: '90-minute sprint'
  },

  neutral: {
    title: 'Welcome to Serenity',
    message:
      'You are at your baseline. Choose a mode above that matches how you are feeling ' +
      'right now — or simply explore the space at your own pace.',
    techniques: [
      'Try the Exam Stress mode before any high-pressure situation',
      'Use Sleep Anxiety mode 30 minutes before bed',
      'Tap Panic Mode any time you feel overwhelmed — it responds immediately',
      'Focus Mode works best at the start of a deep work session'
    ],
    duration: 'At your own pace'
  }
};

/**
 * Returns a recommendation for the given mode.
 * Optionally personalises based on check-in answers.
 *
 * @param {string} mode      - 'exam' | 'sleep' | 'panic' | 'focus' | 'neutral'
 * @param {object} checkIn   - optional stress check-in answers
 * @returns {object}         - { title, message, techniques, duration }
 */
function getRecommendation(mode, checkIn = {}) {
  const base = RECOMMENDATIONS[mode] || RECOMMENDATIONS['neutral'];
  const rec  = { ...base, techniques: [...base.techniques] };

  // Personalise based on check-in if provided
  if (checkIn.stressLevel >= 8) {
    rec.message = 'Your stress level is quite high right now — that takes courage to acknowledge. ' + rec.message;
    rec.techniques.unshift('Start here: take 3 slow breaths before anything else');
  }

  if (checkIn.sleepLastNight !== undefined && checkIn.sleepLastNight < 5 && (mode === 'focus' || mode === 'exam')) {
    rec.techniques.push('Note: with limited sleep, shorter sprints (15 min on · 5 min off) work better than long sessions');
  }

  return rec;
}

/**
 * Maps a frontend mode to the adaptive body state
 * that should be applied to <body data-user-state="...">
 *
 * panic → 'panic'  (triggers breathing takeover in AdaptiveEngine)
 * focus → 'focus'  (triggers focus UI state in AdaptiveEngine)
 * exam  → 'neutral' (no special UI state, just shows recommendation)
 * sleep → 'neutral' (no special UI state, just shows recommendation)
 */
function getAdaptiveState(mode) {
  const map = { panic: 'panic', focus: 'focus', exam: 'neutral', sleep: 'neutral', neutral: 'neutral' };
  return map[mode] || 'neutral';
}

module.exports = { getRecommendation, getAdaptiveState };
