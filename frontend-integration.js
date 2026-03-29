const express = require('express');
const router  = express.Router();
const Session = require('../models/Session');
const { getRecommendation, getAdaptiveState } = require('../utils/recommendationEngine');

/*
  POST /api/sessions
  ─────────────────────────────────────────────────────────────
  Called when a mode button is clicked on the Serenity hero.
  The updated frontend uses <button data-mode="..."> elements
  instead of anchor tags, handled by the AdaptiveEngine class.

  Frontend sends:
    {
      mode: "exam" | "sleep" | "panic" | "focus",
      checkIn: { stressLevel, energyLevel, sleepLastNight, notes },  ← optional
      userId: "..."  ← optional, once login is added
    }

  Backend responds:
    {
      sessionId: "...",
      mode: "exam",
      adaptiveState: "neutral",        ← tells frontend what body state to apply
      breathingTakeoverTriggered: false,
      recommendation: { title, message, techniques, duration },
      createdAt: "..."
    }

  The frontend AdaptiveEngine uses adaptiveState to call:
    this.setState(data.adaptiveState)
  which handles the body attribute and panic overlay automatically.
*/
router.post('/', async (req, res) => {
  try {
    const { mode, checkIn, userId } = req.body;

    const validModes = ['exam', 'sleep', 'panic', 'focus', 'neutral'];
    if (!mode || !validModes.includes(mode)) {
      return res.status(400).json({ error: `Invalid mode. Must be one of: ${validModes.join(', ')}` });
    }

    const adaptiveState             = getAdaptiveState(mode);
    const breathingTakeoverTriggered = mode === 'panic';
    const recommendation            = getRecommendation(mode, checkIn || {});

    const session = new Session({
      mode,
      adaptiveState,
      breathingTakeoverTriggered,
      checkIn:        checkIn || {},
      recommendation,
      userId:         userId || null
    });
    await session.save();

    res.status(201).json({
      sessionId:                session._id,
      mode:                     session.mode,
      adaptiveState,
      breathingTakeoverTriggered,
      recommendation,
      createdAt:                session.createdAt
    });

  } catch (err) {
    console.error('Error creating session:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

/*
  GET /api/sessions
  Returns all sessions. Filter by ?userId=xxx or ?mode=panic
*/
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.mode)   filter.mode   = req.query.mode;

    const sessions = await Session.find(filter).sort({ createdAt: -1 })
      .select('mode adaptiveState breathingTakeoverTriggered recommendation.title createdAt');

    res.json({ count: sessions.length, sessions });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

/*
  GET /api/sessions/:id
  Returns a single full session by ID.
*/
router.get('/:id', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found.' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
