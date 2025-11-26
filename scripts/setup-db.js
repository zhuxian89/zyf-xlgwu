const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(process.cwd(), 'game.db');

console.log('Setting up database at:', dbPath);

try {
    // Remove existing db to start fresh if needed, or just open it
    // fs.unlinkSync(dbPath); 
} catch (e) { }

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT DEFAULT 'Player',
    coins INTEGER DEFAULT 0,
    total_earned INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject TEXT,
    type TEXT,
    content TEXT,
    answer TEXT,
    reward INTEGER,
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_type TEXT,
    item_id TEXT,
    quantity INTEGER
  );
  
  -- Insert default user if not exists
  INSERT OR IGNORE INTO users (id, name, coins) VALUES (1, 'Little Hero', 100);
`);

console.log('Database setup complete!');
