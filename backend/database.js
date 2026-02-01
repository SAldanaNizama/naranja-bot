import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'chats.db'));

// Crear tabla si no existe
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    message TEXT NOT NULL,
    is_user INTEGER NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_session_id ON messages(session_id);
  CREATE INDEX IF NOT EXISTS idx_timestamp ON messages(timestamp);
`);

export const saveMessage = (sessionId, message, isUser, metadata = null) => {
  const stmt = db.prepare(`
    INSERT INTO messages (session_id, message, is_user, metadata)
    VALUES (?, ?, ?, ?)
  `);
  
  return stmt.run(sessionId, message, isUser ? 1 : 0, metadata ? JSON.stringify(metadata) : null);
};

export const getMessagesBySession = (sessionId) => {
  const stmt = db.prepare(`
    SELECT * FROM messages
    WHERE session_id = ?
    ORDER BY timestamp ASC
  `);
  
  return stmt.all(sessionId);
};

export const getAllSessions = () => {
  const stmt = db.prepare(`
    SELECT 
      session_id,
      COUNT(*) as message_count,
      MIN(timestamp) as first_message,
      MAX(timestamp) as last_message
    FROM messages
    GROUP BY session_id
    ORDER BY last_message DESC
  `);
  
  return stmt.all();
};

export default db;
