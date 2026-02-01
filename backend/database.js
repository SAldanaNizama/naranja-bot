import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'false'
    ? false
    : { rejectUnauthorized: false },
});

const initDb = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      session_id TEXT NOT NULL,
      message TEXT NOT NULL,
      is_user BOOLEAN NOT NULL,
      timestamp TIMESTAMPTZ DEFAULT NOW(),
      metadata JSONB
    );
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_session_id ON messages(session_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_timestamp ON messages(timestamp);`);
};

const initPromise = initDb();

export const saveMessage = async (sessionId, message, isUser, metadata = null) => {
  await initPromise;
  const query = `
    INSERT INTO messages (session_id, message, is_user, metadata)
    VALUES ($1, $2, $3, $4)
  `;
  const values = [sessionId, message, isUser, metadata];
  return pool.query(query, values);
};

export const getMessagesBySession = async (sessionId) => {
  await initPromise;
  const query = `
    SELECT * FROM messages
    WHERE session_id = $1
    ORDER BY timestamp ASC
  `;
  const { rows } = await pool.query(query, [sessionId]);
  return rows;
};

export const getAllSessions = async () => {
  await initPromise;
  const query = `
    SELECT 
      session_id,
      COUNT(*) as message_count,
      MIN(timestamp) as first_message,
      MAX(timestamp) as last_message
    FROM messages
    GROUP BY session_id
    ORDER BY last_message DESC
  `;
  const { rows } = await pool.query(query);
  return rows;
};

export default pool;
