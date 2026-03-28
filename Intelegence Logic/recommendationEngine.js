/*
  recommendationEngine.js
  ─────────────────────────────────────────────────────────────
  Generates a personalised recommendation for each Serenity mode.
  Optionally factors in the user's stress check-in answers.

  Each recommendation includes:
    title      — short heading shown in the UI
    message    — calming, supportive paragraph
    techniques — array of specific techniques to try
    duration   — suggested session length
*/

const BASE_RECOMMENDATIONS = {

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
    title: 'Immediate Grounding',
    message:
      'You are safe. What you are feeling is temporary and it will pass. ' +
      'Your nervous system is doing its job — now we gently tell it that the danger has gone. ' +
      'Follow the guide one step at a time. You do not need to do anything except breathe.',
    techniques: [
      'Physiological sigh: two short inhales through the nose, one long exhale through the mouth',
      'Cold water on wrists or face to activate the dive reflex and slow heart rate',
      '5-4-3-2-1 sensory grounding — anchor yourself in the present moment',
      'Slow pulsing warm light (0.1 Hz) to match a calm resting breath rate',
      'Pink noise or low ocean sounds at a comfortable, steady volume'
    ],
    duration: '3–5 minutes'
  },

  focus: {
    title: 'Deep Work Flow State',
    message:
      'Flow is not forced — it is invited. The next few minutes will clear the mental clutter ' +
      'and set up the conditions your brain needs to enter sustained, effortless focus. ' +
      'Minimise interruptions and let Serenity do the rest.',
    techniques: [
      'Rhythmic breathing (5s in · 5s out) to steady your autonomic baseline',
      'Cool white or soft daylight-spectrum light to suppress melatonin',
      'Alpha-wave binaural beats (8–12 Hz) layered under light rain or cafe ambience',
      'Intention setting: write one clear sentence about what you will accomplish',
      'Remove all notifications for the session — even one ping breaks flow'
    ],
    duration: '8–12 minutes'
  }
};

/**
 * Returns a recommendation object for the given mode.
 * Optionally personalises it based on check-in answers.
 *
 * @param {string} mode        - 'exam' | 'sleep' | 'panic' | 'focus'
 * @param {object} [checkIn]   - optional answers from the stress check-in form
 * @returns {object}           - { title, message, techniques, duration }
 */
function getRecommendation(mode, checkIn = {}) {
  const base = BASE_RECOMMENDATIONS[mode];
  if (!base) return null;

  // Clone so we don't mutate the base object
  const rec = { ...base, techniques: [...base.techniques] };

  // ── Personalise based on check-in answers ────────────────

  // If stress level is very high (8+), prepend an urgent grounding note
  if (checkIn.stressLevel >= 8) {
    rec.message =
      'Your stress level is quite high right now — that takes courage to acknowledge. ' +
      rec.message;
    rec.techniques.unshift('Start here: take 3 slow breaths before anything else');
  }

  // If they slept very little (<5 hrs) and chose focus or exam mode
  if (
    checkIn.sleepLastNight !== undefined &&
    checkIn.sleepLastNight < 5 &&
    (mode === 'focus' || mode === 'exam')
  ) {
    rec.techniques.push(
      'Note: with limited sleep, shorter focused sprints (15 min on · 5 min off) work better than long sessions'
    );
  }

  // If energy is very low and they chose panic mode, add a gentle note
  if (checkIn.energyLevel !== undefined && checkIn.energyLevel <= 2 && mode === 'panic') {
    rec.techniques.push(
      'Your energy is low — be gentle with yourself. Rest after this session if you can'
    );
  }

  return rec;
}

module.exports = { getRecommendation };
