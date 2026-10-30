const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

const { testConnection } = require('./src/config/db');
const { createRateLimiter } = require('./src/middleware/rateLimiter');
const streamRoutes = require('./src/routes/streamRoutes');
const authRoutes = require('./src/routes/authRoutes');
const favoritesRoutes = require('./src/routes/favoritesRoutes');
const playlistRoutes = require('./src/routes/playlistRoutes');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Global API rate limiter (120 requests per minute per IP)
app.use('/api', createRateLimiter({ windowMs: 60 * 1000, max: 120 }));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const isDbConnected = await testConnection();
  res.json({
    status: 'online',
    appName: 'SoundWave Streaming Bridge',
    timestamp: new Date().toISOString(),
    database: {
      type: 'MySQL (WampServer)',
      connected: isDbConnected,
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3306,
      name: process.env.DB_NAME || 'soundwave_db',
    },
    emulatorLoopback: 'http://10.0.2.2:3000',
  });
});

// Root welcome endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to SoundWave Audio Streaming Bridge API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      search: '/api/search?q={query}',
      stream: '/api/stream/:videoId',
      auth: '/api/auth (register, login, me)',
      favorites: '/api/favorites',
      playlists: '/api/playlists',
    },
  });
});

// API Routes
app.use('/api', streamRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/playlists', playlistRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err.stack || err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start Server on 0.0.0.0 so emulator (10.0.2.2) and LAN devices can connect
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`====================================================`);
  console.log(` SoundWave Audio Streaming Bridge Active`);
  console.log(` Local:            http://localhost:${PORT}`);
  console.log(` Android Emulator: http://10.0.2.2:${PORT}`);
  console.log(`====================================================`);
  
  // Test DB connection on startup
  await testConnection();
});
