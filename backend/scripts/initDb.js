const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function initDatabase() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT, 10) || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'soundwave_db';

  console.log(`[InitDB] Connecting to MySQL server at ${host}:${port} as ${user}...`);

  let connection;
  try {
    // Connect without selecting database first
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true,
    });

    console.log('[InitDB] Connected. Creating database and executing schema...');

    const schemaPath = path.resolve(__dirname, '../schema.sql');
    const sqlContent = fs.readFileSync(schemaPath, 'utf8');

    await connection.query(sqlContent);
    console.log(`[InitDB] Success! Database '${database}' and tables initialized successfully.`);
  } catch (error) {
    console.error('[InitDB Error] Failed to initialize database:', error.message);
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDatabase();
