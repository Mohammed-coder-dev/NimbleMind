require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data", "decisions.json");

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ── Helpers ───────────────────────────────────────────────────────────────────
function readData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET all decisions
app.get("/api/decisions", (req, res) => {
  const { tag, due } = req.query;
  let decisions = readData();

  if (tag) {
    decisions = decisions.filter((d) =>
      d.tags.map((t) => t.toLowerCase()).includes(tag.toLowerCase())
    );
  }

  if (due === "today") {
    const today = new Date().toISOString().split("T")[0];
    decisions = decisions.filter((d) => d.reviewDate === today);
  } else if (due === "overdue") {
    const today = new Date().toISOString().split("T")[0];
    decisions = decisions.filter(
      (d) => d.reviewDate && d.reviewDate < today && !d.outcome
    );
  }

  res.json(decisions);
});

// GET single decision
app.get("/api/decisions/:id", (req, res) => {
  const decisions = readData();
  const decision = decisions.find((d) => d.id === req.params.id);
  if (!decision) return res.status(404).json({ error: "Decision not found" });
  res.json(decision);
});

// POST create decision
app.post("/api/decisions", (req, res) => {
  const { title, context, alternatives, confidenceScore, reviewDate, tags } =
    req.body;

  if (!title || !context) {
    return res.status(400).json({ error: "title and context are required" });
  }

  const decision = {
    id: uuidv4(),
    title,
    context,
    alternatives: alternatives || [],
    confidenceScore: confidenceScore ?? null,
    reviewDate: reviewDate || null,
    tags: tags || [],
    outcome: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const decisions = readData();
  decisions.unshift(decision);
  writeData(decisions);

  res.status(201).json(decision);
});

// PATCH update decision (supports partial update & outcome logging)
app.patch("/api/decisions/:id", (req, res) => {
  const decisions = readData();
  const index = decisions.findIndex((d) => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Decision not found" });

  const allowed = [
    "title",
    "context",
    "alternatives",
    "confidenceScore",
    "reviewDate",
    "tags",
    "outcome",
  ];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) {
      decisions[index][field] = req.body[field];
    }
  });

  decisions[index].updatedAt = new Date().toISOString();
  writeData(decisions);
  res.json(decisions[index]);
});

// DELETE decision
app.delete("/api/decisions/:id", (req, res) => {
  const decisions = readData();
  const filtered = decisions.filter((d) => d.id !== req.params.id);
  if (filtered.length === decisions.length) {
    return res.status(404).json({ error: "Decision not found" });
  }
  writeData(filtered);
  res.json({ message: "Decision deleted" });
});

// GET stats summary
app.get("/api/stats", (req, res) => {
  const decisions = readData();
  const today = new Date().toISOString().split("T")[0];

  const total = decisions.length;
  const resolved = decisions.filter((d) => d.outcome).length;
  const overdue = decisions.filter(
    (d) => d.reviewDate && d.reviewDate < today && !d.outcome
  ).length;
  const dueToday = decisions.filter((d) => d.reviewDate === today).length;
  const avgConfidence =
    decisions.length > 0
      ? (
          decisions
            .filter((d) => d.confidenceScore !== null)
            .reduce((sum, d) => sum + d.confidenceScore, 0) /
          decisions.filter((d) => d.confidenceScore !== null).length
        ).toFixed(1)
      : null;

  const tagCounts = {};
  decisions.forEach((d) =>
    d.tags.forEach((t) => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    })
  );

  res.json({ total, resolved, overdue, dueToday, avgConfidence, tagCounts });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Decision Tracker running at http://localhost:${PORT}`);
});