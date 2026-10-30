const { pool } = require('../config/db');

/**
 * Get all favorites for the authenticated user
 * GET /api/favorites
 */
async function getFavorites(req, res) {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT 
         s.id, 
         s.title, 
         s.artist, 
         s.cover_art_url AS coverArt, 
         s.duration_seconds AS durationSeconds,
         f.created_at AS favoritedAt
       FROM favorites f
       INNER JOIN songs_cache s ON f.song_id = s.id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`,
      [userId]
    );

    return res.json({
      total: rows.length,
      favorites: rows,
    });
  } catch (err) {
    console.error('[Favorites Get Error]:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve favorites', details: err.message });
  }
}

/**
 * Add a song to user's favorites
 * POST /api/favorites
 * Body: { songId, title, artist, coverArt, durationSeconds }
 */
async function addFavorite(req, res) {
  try {
    const userId = req.user.id;
    const { songId, title, artist, coverArt, durationSeconds } = req.body;

    if (!songId) {
      return res.status(400).json({ error: 'songId is required' });
    }

    // Ensure song is cached in songs_cache
    if (title || artist) {
      await pool.query(
        `INSERT INTO songs_cache (id, title, artist, cover_art_url, duration_seconds)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           title = COALESCE(VALUES(title), title),
           artist = COALESCE(VALUES(artist), artist),
           cover_art_url = COALESCE(VALUES(cover_art_url), cover_art_url),
           duration_seconds = COALESCE(VALUES(duration_seconds), duration_seconds)`,
        [
          songId,
          title || 'Unknown Title',
          artist || 'Unknown Artist',
          coverArt || '',
          parseInt(durationSeconds, 10) || 0,
        ]
      );
    }

    // Insert into favorites table
    await pool.query(
      'INSERT IGNORE INTO favorites (user_id, song_id) VALUES (?, ?)',
      [userId, songId]
    );

    return res.status(201).json({
      message: 'Track added to favorites',
      songId,
      isFavorite: true,
    });
  } catch (err) {
    console.error('[Favorites Add Error]:', err.message);
    return res.status(500).json({ error: 'Failed to add favorite', details: err.message });
  }
}

/**
 * Remove a song from user's favorites
 * DELETE /api/favorites/:songId
 */
async function removeFavorite(req, res) {
  try {
    const userId = req.user.id;
    const { songId } = req.params;

    if (!songId) {
      return res.status(400).json({ error: 'songId parameter is required' });
    }

    await pool.query(
      'DELETE FROM favorites WHERE user_id = ? AND song_id = ?',
      [userId, songId]
    );

    return res.json({
      message: 'Track removed from favorites',
      songId,
      isFavorite: false,
    });
  } catch (err) {
    console.error('[Favorites Remove Error]:', err.message);
    return res.status(500).json({ error: 'Failed to remove favorite', details: err.message });
  }
}

/**
 * Check if a track is favorited by the user
 * GET /api/favorites/check/:songId
 */
async function checkFavorite(req, res) {
  try {
    const userId = req.user.id;
    const { songId } = req.params;

    const [rows] = await pool.query(
      'SELECT 1 FROM favorites WHERE user_id = ? AND song_id = ? LIMIT 1',
      [userId, songId]
    );

    return res.json({
      songId,
      isFavorite: rows.length > 0,
    });
  } catch (err) {
    console.error('[Favorites Check Error]:', err.message);
    return res.status(500).json({ error: 'Failed to check favorite status', details: err.message });
  }
}

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite,
};
