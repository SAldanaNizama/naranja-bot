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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS link_clicks (
      id SERIAL PRIMARY KEY,
      session_id TEXT NOT NULL,
      url TEXT NOT NULL,
      link_label TEXT,
      clicked_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_link_clicks_session ON link_clicks(session_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_link_clicks_url ON link_clicks(url);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_link_clicks_at ON link_clicks(clicked_at);`);
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

export const saveLinkClick = async (sessionId, url, linkLabel = null) => {
  await initPromise;
  const query = `
    INSERT INTO link_clicks (session_id, url, link_label)
    VALUES ($1, $2, $3)
  `;
  return pool.query(query, [sessionId, url, linkLabel]);
};

export const getLinkClickStats = async () => {
  await initPromise;
  const query = `
    SELECT 
      url,
      link_label,
      COUNT(*) as clicks,
      MAX(clicked_at) as last_clicked
    FROM link_clicks
    GROUP BY url, link_label
    ORDER BY clicks DESC
  `;
  const { rows } = await pool.query(query);
  return rows;
};

export const getLinkClicksBySession = async (sessionId) => {
  await initPromise;
  const query = `
    SELECT * FROM link_clicks
    WHERE session_id = $1
    ORDER BY clicked_at DESC
  `;
  const { rows } = await pool.query(query, [sessionId]);
  return rows;
};

export default pool;
