# Serenity Backend v2 🌿

Backend for the **Serenity Adaptive Interaction Engine** — updated to match the v2 frontend.

---

## What's new in v2

| Feature | v1 | v2 |
|---|---|---|
| Mode buttons | `<a>` anchor tags | `<button>` elements via AdaptiveEngine class |
| Panic mode | Scrolls to #begin | Triggers breathing takeover overlay |
| Focus mode | Scrolls to #begin | Sets body[data-user-state="focus"] |
| Notify forms | Not present | Email capture per section → NotifySignup model |
| Breathing logs | Not present | Logs 4-7-8 sessions → BreathingLog model |
| Adaptive state | Not tracked | Returns adaptiveState for frontend to apply |

---

## Project Structure

```
serenity-v2-backend/
├── server.js
├── package.json
├── .env.example
│
├── models/
│   ├── Session.js          ← mode + adaptiveState + breathingTakeoverTriggered
│   ├── NotifySignup.js     ← email + section (light-therapy, sound-therapy, etc.)
│   ├── BreathingLog.js     ← panic breathing session duration + cycles
│   └── User.js             ← accounts (future login)
│
├── routes/
│   ├── sessions.js         ← POST/GET /api/sessions
│   ├── notify.js           ← POST/GET /api/notify
│   ├── breathingLogs.js    ← POST/GET /api/breathing-logs
│   └── users.js            ← register, login, profile
│
└── utils/
    └── recommendationEngine.js  ← mode → recommendation + adaptiveState
```

---

## API Reference

### Sessions
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/sessions` | Create session, get recommendation + adaptiveState |
| GET | `/api/sessions` | List all sessions |
| GET | `/api/sessions/:id` | Get one session |

**POST /api/sessions — Request:**
```json
{ "mode": "panic" }
```
**POST /api/sessions — Response:**
```json
{
  "sessionId": "...",
  "mode": "panic",
  "adaptiveState": "panic",
  "breathingTakeoverTriggered": true,
  "recommendation": { "title": "You made it through.", ... },
  "createdAt": "..."
}
```

### Notify Signups
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/notify` | Save email for a section |
| GET | `/api/notify?section=light-therapy` | List signups |

**POST /api/notify — Request:**
```json
{ "email": "user@example.com", "section": "light-therapy" }
```

### Breathing Logs
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/breathing-logs` | Log a completed panic breathing session |
| GET | `/api/breathing-logs` | List all logs |

### Users (future login)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/users/register` | Create account |
| POST | `/api/users/login` | Login, get JWT |
| GET | `/api/users/profile` | Get profile (auth required) |

---

## Setup

```bash
npm install
cp .env.example .env   # fill in MONGO_URI
npm run dev
```

## Connecting to the frontend
See `frontend-integration.js` for all three connection points:
1. Mode buttons → `startSession(mode)`
2. Notify forms → auto-wired to all `.notify-form` elements
3. Breathing takeover exit → `logBreathingSession()`
