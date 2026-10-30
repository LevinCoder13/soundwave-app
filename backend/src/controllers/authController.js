const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

function generateToken(user) {
  const secret = process.env.JWT_SECRET || 'soundwave_spotify_engine_secret_jwt_key_2026';
  const expiresIn = process.env.JWT_EXPIRES_IN || '30d';
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
    },
    secret,
    { expiresIn }
  );
}

/**
 * Register a new user
 * POST /api/auth/register
 */
async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const [existingUsers] = await pool.query(
      'SELECT id, username, email FROM users WHERE username = ? OR email = ? LIMIT 1',
      [username, email]
    );

    if (existingUsers.length > 0) {
      const match = existingUsers[0];
      if (match.email.toLowerCase() === email.toLowerCase()) {
        return res.status(409).json({ error: 'Email is already registered' });
      }
      return res.status(409).json({ error: 'Username is already taken' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email.toLowerCase(), passwordHash]
    );

    const newUser = {
      id: result.insertId,
      username,
      email: email.toLowerCase(),
    };

    const token = generateToken(newUser);

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: newUser,
    });
  } catch (err) {
    console.error('[Auth Register Error]:', err.message);
    return res.status(500).json({ error: 'Registration failed', details: err.message });
  }
}

/**
 * Log in an existing user
 * POST /api/auth/login
 */
async function login(req, res) {
  try {
    const { email, username, password } = req.body;
    const identifier = email || username || req.body.emailOrUsername;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email/username and password are required' });
    }

    // Query user by email or username
    const [users] = await pool.query(
      'SELECT id, username, email, password_hash FROM users WHERE email = ? OR username = ? LIMIT 1',
      [identifier, identifier]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
    };

    const token = generateToken(userData);

    return res.json({
      message: 'Login successful',
      token,
      user: userData,
    });
  } catch (err) {
    console.error('[Auth Login Error]:', err.message);
    return res.status(500).json({ error: 'Login failed', details: err.message });
  }
}

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
async function getProfile(req, res) {
  try {
    const userId = req.user.id;
    const [users] = await pool.query(
      'SELECT id, username, email, created_at FROM users WHERE id = ? LIMIT 1',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user: users[0] });
  } catch (err) {
    console.error('[Auth Profile Error]:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve profile', details: err.message });
  }
}

module.exports = {
  register,
  login,
  getProfile,
};
