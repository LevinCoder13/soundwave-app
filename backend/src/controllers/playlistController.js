const { pool } = require('../config/db');

/**
 * Get all playlists for the authenticated user
 * GET /api/playlists
 */
async function getUserPlaylists(req, res) {
  try {
    const userId = req.user.id;
    const [playlists] = await pool.query(
      `SELECT p.id, p.title, p.created_at, COUNT(pt.song_id) AS track_count
       FROM playlists p
       LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
       WHERE p.user_id = ?
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [userId]
    );

    return res.json({ playlists });
  } catch (err) {
    console.error('[Playlist Error]:', err.message);
    return res.status(500).json({ error: 'Failed to fetch playlists', details: err.message });
  }
}

/**
 * Create a new playlist
 * POST /api/playlists
 */
async function createPlaylist(req, res) {
  try {
    const userId = req.user.id;
    const { title } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Playlist title is required' });
    }

    const [result] = await pool.query(
      'INSERT INTO playlists (user_id, title) VALUES (?, ?)',
      [userId, title.trim()]
    );

    return res.status(201).json({
      message: 'Playlist created successfully',
      playlist: {
        id: result.insertId,
        user_id: userId,
        title: title.trim(),
      },
    });
  } catch (err) {
    console.error('[Playlist Create Error]:', err.message);
    return res.status(500).json({ error: 'Failed to create playlist', details: err.message });
  }
}

/**
 * Get playlist details and its tracks
 * GET /api/playlists/:id
 */
async function getPlaylistById(req, res) {
  try {
    const userId = req.user.id;
    const playlistId = req.params.id;

    const [playlists] = await pool.query(
      'SELECT id, title, created_at FROM playlists WHERE id = ? AND user_id = ? LIMIT 1',
      [playlistId, userId]
    );

    if (playlists.length === 0) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    const [tracks] = await pool.query(
      `SELECT s.id, s.title, s.artist, s.cover_art_url AS coverArt, s.duration_seconds AS durationSeconds, pt.added_at
       FROM playlist_tracks pt
       INNER JOIN songs_cache s ON pt.song_id = s.id
       WHERE pt.playlist_id = ?
       ORDER BY pt.added_at ASC`,
      [playlistId]
    );

    return res.json({
      playlist: playlists[0],
      tracks,
    });
  } catch (err) {
    console.error('[Playlist Details Error]:', err.message);
    return res.status(500).json({ error: 'Failed to fetch playlist details', details: err.message });
  }
}

/**
 * Add track to playlist
 * POST /api/playlists/:id/tracks
 */
async function addTrackToPlaylist(req, res) {
  try {
    const userId = req.user.id;
    const playlistId = req.params.id;
    const { songId, title, artist, coverArt, durationSeconds } = req.body;

    // Verify ownership
    const [playlists] = await pool.query(
      'SELECT id FROM playlists WHERE id = ? AND user_id = ? LIMIT 1',
      [playlistId, userId]
    );

    if (playlists.length === 0) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    // Cache song if info provided
    if (title || artist) {
      await pool.query(
        `INSERT INTO songs_cache (id, title, artist, cover_art_url, duration_seconds)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           title = COALESCE(VALUES(title), title),
           artist = COALESCE(VALUES(artist), artist),
           cover_art_url = COALESCE(VALUES(cover_art_url), cover_art_url),
           duration_seconds = COALESCE(VALUES(duration_seconds), duration_seconds)`,
        [songId, title || 'Unknown Title', artist || 'Unknown Artist', coverArt || '', parseInt(durationSeconds, 10) || 0]
      );
    }

    await pool.query(
      'INSERT IGNORE INTO playlist_tracks (playlist_id, song_id) VALUES (?, ?)',
      [playlistId, songId]
    );

    return res.status(201).json({ message: 'Track added to playlist', playlistId, songId });
  } catch (err) {
    console.error('[Add Track Error]:', err.message);
    return res.status(500).json({ error: 'Failed to add track to playlist', details: err.message });
  }
}

/**
 * Remove track from playlist
 * DELETE /api/playlists/:id/tracks/:songId
 */
async function removeTrackFromPlaylist(req, res) {
  try {
    const userId = req.user.id;
    const playlistId = req.params.id;
    const songId = req.params.songId;

    const [playlists] = await pool.query(
      'SELECT id FROM playlists WHERE id = ? AND user_id = ? LIMIT 1',
      [playlistId, userId]
    );

    if (playlists.length === 0) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    await pool.query(
      'DELETE FROM playlist_tracks WHERE playlist_id = ? AND song_id = ?',
      [playlistId, songId]
    );

    return res.json({ message: 'Track removed from playlist', playlistId, songId });
  } catch (err) {
    console.error('[Remove Track Error]:', err.message);
    return res.status(500).json({ error: 'Failed to remove track', details: err.message });
  }
}

module.exports = {
  getUserPlaylists,
  createPlaylist,
  getPlaylistById,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
};
