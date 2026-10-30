/**
 * SoundWave Mobile Types & Interfaces
 */

/**
 * @typedef {Object} Track
 * @property {string} id - Unique YouTube video ID
 * @property {string} title - Song title
 * @property {string} artist - Artist or channel name
 * @property {string} coverArt - High resolution thumbnail URL
 * @property {number} durationSeconds - Song duration in seconds
 * @property {string} [timestamp] - Formatted duration string (e.g. "3:45")
 * @property {string} [streamUrl] - Resolved direct audio stream URL
 * @property {number} [bitrate] - Audio stream bitrate in kbps
 */

/**
 * @typedef {Object} User
 * @property {number} id - User ID in MySQL
 * @property {string} username - User handle
 * @property {string} email - User email address
 * @property {string} [token] - JWT session token
 */

/**
 * @typedef {Object} Playlist
 * @property {number} id - Playlist ID
 * @property {number} userId - Owner user ID
 * @property {string} title - Playlist name
 * @property {Track[]} [tracks] - Songs inside playlist
 */

module.exports = {
  // Common constants
  DEFAULT_EMULATOR_URL: 'http://10.0.2.2:3000',
  DEFAULT_LOCAL_URL: 'http://localhost:3000',
};

