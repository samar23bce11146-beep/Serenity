const express = require('express');
const router  = express.Router();
const Session = require('../models/Session');
const { getRecommendation } = require('../utils/recommendationEngine');

/*
  POST /api/sessions
  ──────────────────────────────────────────────────────────────
  Called when the user clicks a mode button on the Serenity hero.

  Frontend sends:
    {
      mode: "exam" | "sleep" | "panic" | "focus",
      checkIn: {                    ← optional (future survey sections)
        stressLevel: 7,
        energyLevel: 4,
        sleepLastNight: 6,
        notes: "feeling overwhelmed before my exam"
      },
      userId: "..."                 ← optional (once login is added)
    }

  Backend responds:
    {
      sessionId: "...",
      mode: "exam",
      recommendation: {
        title: "Pre-Exam Calm & Focus",
        message: "...",
        techniques: [...],
        duration: "5–8 minutes"
      },
      createdAt: "..."
    }
*/
router.post('/', async (req, res) => {
  try {
    const { mode, checkIn, userId } = req.body;

    // Validate mode
    const validModes = ['exam', 'sleep', 'panic', 'focus'];
    if (!mode || !validModes.includes(mode)) {
      return res.status(400).json({
        error: `Invalid mode. Must be one of: ${validModes.join(', ')}`
      });
    }

    // Generate recommendation (personalised if checkIn provided)
    const recommendation = getRecommendation(mode, checkIn || {});

    // Save to database
    const session = new Session({
      mode,
      checkIn: checkIn || {},
      recommendation,
      userId: userId || null
    });
    await session.save();

    // Return to frontend
    res.status(201).json({
      sessionId:      session._id,
      mode:           session.mode,
      recommendation: session.recommendation,
      createdAt:      session.createdAt
    });

  } catch (err) {
    console.error('Error creating session:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

/*
  GET /api/sessions
  ──────────────────────────────────────────────────────────────
  Returns all past sessions (for a future history/dashboard page).
  Optional query params:
    ?userId=xxx   — filter by user
    ?mode=exam    — filter by mode
*/
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.mode)   filter.mode   = req.query.mode;

    const sessions = await Session.find(filter)
      .sort({ createdAt: -1 })
      .select('mode recommendation.title createdAt userId');

    res.json({ count: sessions.length, sessions });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

/*
  GET /api/sessions/:id
  ──────────────────────────────────────────────────────────────
  Returns a single full session (for a recap or share page).
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
