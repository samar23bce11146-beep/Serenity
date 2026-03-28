const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'serenity_secret_change_this_in_production';

/*
  POST /api/users/register
  ──────────────────────────────────────────────────────────────
  Creates a new Serenity account.

  Body: { name, email, password }
  Returns: { token, user: { id, name, email } }
*/
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email, and password are required.' });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(409).json({ error: 'An account with that email already exists.' });

    const user  = new User({ name, email, password });
    await user.save();

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Account created. Welcome to Serenity 🌿',
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

/*
  POST /api/users/login
  ──────────────────────────────────────────────────────────────
  Logs in with email + password.

  Body: { email, password }
  Returns: { token, user: { id, name, email } }
*/
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Welcome back 🌿',
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

/*
  GET /api/users/profile
  ──────────────────────────────────────────────────────────────
  Returns the logged-in user's profile.
  Requires: Authorization: Bearer <token> header
*/
router.get('/profile', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer '))
      return res.status(401).json({ error: 'No token provided.' });

    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    const user    = await User.findById(decoded.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found.' });

    res.json({ user });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
});

module.exports = router;
