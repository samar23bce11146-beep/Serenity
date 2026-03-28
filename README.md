# Serenity Backend 🌿

Backend API for **Serenity: Stress & Anxiety Reduction System**.  
Built with Node.js · Express · MongoDB.

---

## Project Structure

```
serenity-backend/
├── server.js                    ← Entry point
├── package.json
├── .env.example                 ← Copy to .env and fill in
│
├── models/
│   ├── Session.js               ← Stores mode + recommendation per visit
│   └── User.js                  ← User accounts (for future login)
│
├── routes/
│   ├── sessions.js              ← POST/GET /api/sessions
│   └── users.js                 ← POST /api/users/register + login
│
└── utils/
    └── recommendationEngine.js  ← Maps modes → personalised recommendations
```

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your .env file
cp .env.example .env
# Then edit .env with your MongoDB URI and a secret key

# 3. Start the server
npm run dev        # development (auto-restarts)
npm start          # production
```

---

## API Reference

### Sessions

| Method | Endpoint            | Description                        |
|--------|---------------------|------------------------------------|
| POST   | `/api/sessions`     | Create session, get recommendation |
| GET    | `/api/sessions`     | List all sessions                  |
| GET    | `/api/sessions/:id` | Get one session by ID              |

**POST /api/sessions — Request body:**
```json
{
  "mode": "exam",
  "checkIn": {
    "stressLevel": 7,
    "energyLevel": 5,
    "sleepLastNight": 6,
    "notes": "feeling nervous before my exam"
  }
}
```

**POST /api/sessions — Response:**
```json
{
  "sessionId": "64abc...",
  "mode": "exam",
  "recommendation": {
    "title": "Pre-Exam Calm & Focus",
    "message": "It is completely normal to feel pressure...",
    "techniques": ["Box breathing...", "Progressive muscle relaxation..."],
    "duration": "5–8 minutes"
  },
  "createdAt": "2025-01-01T10:00:00Z"
}
```

### Users (ready for when you add login)

| Method | Endpoint                | Description          |
|--------|-------------------------|----------------------|
| POST   | `/api/users/register`   | Create account       |
| POST   | `/api/users/login`      | Login, get JWT token |
| GET    | `/api/users/profile`    | Get profile (auth)   |

---

## Connecting to the Frontend

See `frontend-integration.js` for a ready-to-paste code snippet.  
The key change is one line in your `script.js` mode button handler:

```js
btn.addEventListener('click', () => {
  const mode = btn.dataset.mode;
  sessionStorage.setItem('serenity_mode', mode);
  setActiveMode(mode);
  startSession(mode);   // ← ADD THIS LINE
});
```
