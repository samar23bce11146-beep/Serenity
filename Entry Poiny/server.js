const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// ── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // set your frontend URL in .env
  credentials: true
}));
app.use(express.json());

// ── Database ─────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/serenity')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ── Routes ───────────────────────────────────────────────────
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/users',    require('./routes/users'));

// ── Health check ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: '🌿 Serenity API is running', version: '1.0.0' });
});

// ── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
