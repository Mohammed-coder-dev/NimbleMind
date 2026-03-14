# Decision Tracker

A local decision-journaling web app. Log decisions with context, alternatives, confidence scores, and review dates — then revisit them later to evaluate your reasoning.

## Project Structure

```
├── server.js           # Express REST API
├── .env                # Environment variables
├── .gitignore
├── data/
│   └── decisions.json  # Auto-created on first run (gitignored)
└── public/
    ├── index.html
    ├── styles.css
    └── app.js
```

## Getting Started

```bash
npm install
npm start
```

Open http://localhost:3000

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/decisions` | List all decisions |
| GET | `/api/decisions?tag=work` | Filter by tag |
| GET | `/api/decisions?due=overdue` | Filter overdue (no outcome) |
| GET | `/api/decisions?due=today` | Due for review today |
| GET | `/api/decisions/:id` | Get single decision |
| POST | `/api/decisions` | Create decision |
| PATCH | `/api/decisions/:id` | Update / log outcome |
| DELETE | `/api/decisions/:id` | Delete decision |
| GET | `/api/stats` | Summary stats |

## Decision Schema

```json
{
  "id": "uuid",
  "title": "string",
  "context": "string",
  "alternatives": ["string"],
  "confidenceScore": 1–10,
  "reviewDate": "YYYY-MM-DD",
  "tags": ["string"],
  "outcome": "string | null",
  "createdAt": "ISO date",
  "updatedAt": "ISO date"
}
```

## Dependencies

- [express](https://expressjs.com/)
- [uuid](https://github.com/uuidjs/uuid)
- [dotenv](https://github.com/motdotla/dotenv)