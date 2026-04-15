const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

let db;
(async () => {
  db = await open({
    filename: path.join(__dirname, 'dev.db'),
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS User (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS Journal (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      stage INTEGER,
      emotion TEXT,
      notes TEXT DEFAULT '',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES User(id)
    );
  `);
  console.log('Database initialized from dev.db');
})();

app.post('/api/users', async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Username is required' });
  
  try {
    let user = await db.get('SELECT * FROM User WHERE username = ?', [username]);
    if (!user) {
      const result = await db.run('INSERT INTO User (username) VALUES (?)', [username]);
      user = { id: result.lastID, username };
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/journals', async (req, res) => {
  const { userId, stage, emotion, notes } = req.body;
  try {
    const result = await db.run(
      'INSERT INTO Journal (userId, stage, emotion, notes) VALUES (?, ?, ?, ?)',
      [Number(userId), Number(stage), emotion, notes]
    );
    res.json({ id: result.lastID, userId, stage, emotion, notes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/journals/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const journals = await db.all('SELECT * FROM Journal WHERE userId = ? ORDER BY createdAt DESC', [Number(userId)]);
    res.json(journals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
