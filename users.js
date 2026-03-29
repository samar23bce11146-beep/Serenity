const express      = require('express');
const router       = express.Router();
const BreathingLog = require('../models/BreathingLog');

/*
  POST /api/breathing-logs
  ─────────────────────────────────────────────────────────────
  Called when the user exits the panic breathing takeover overlay
  by clicking "I feel grounded now" (or closes it another way).

  The AdaptiveEngine in script.js runs the 4-7-8 cycle on a
  19-second loop. Frontend should track start time and cycles,
  then POST this data when the overlay is dismissed.

  Frontend sends:
    {
      sessionId: "...",        ← the panic session ID from POST /api/sessions
      cyclesCompleted: 2,      ← how many full 19s cycles ran
      durationSeconds: 38,     ← total time in overlay
      exitReason: "user-grounded"
    }
*/
router.post('/', async (req, res) => {
  try {
    const { sessionId, cyclesCompleted, durationSeconds, exitReason, userId } = req.body;

    const log = new BreathingLog({
      sessionId:       sessionId  || null,
      cyclesCompleted: cyclesCompleted  || 0,
      durationSeconds: durationSeconds  || 0,
      exitReason:      exitReason || 'user-grounded',
      userId:          userId     || null
    });
    await log.save();

    res.status(201).json({
      message: 'Breathing session logged.',
      logId:   log._id,
      cyclesCompleted: log.cyclesCompleted,
      durationSeconds: log.durationSeconds
    });

  } catch (err) {
    console.error('Error logging breathing session:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

/*
  GET /api/breathing-logs
  Returns all breathing logs. Filter by ?sessionId=xxx
*/
router.get('/', async (req, res) => {
  try {
    const filter = req.query.sessionId ? { sessionId: req.query.sessionId } : {};
    const logs   = await BreathingLog.find(filter).sort({ createdAt: -1 });
    res.json({ count: logs.length, logs });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
