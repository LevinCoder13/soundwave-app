const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'soundwave_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
};

// Create the connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection helper
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`[Database] Successfully connected to MySQL at ${dbConfig.host}:${dbConfig.port} (database: ${dbConfig.database})`);
    connection.release();
    return true;
  } catch (err) {
    console.error(`[Database Error] Could not connect to MySQL at ${dbConfig.host}:${dbConfig.port}:`, err.message);
    return false;
  }
}

module.exports = {
  pool,
  testConnection,
  dbConfig,
};
