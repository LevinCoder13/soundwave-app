/**
 * SoundWave Mobile API Client Bridge
 * Supports Android Emulator loopback (10.0.2.2:3000), physical devices, and web.
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

class SoundWaveApiClient {
  /**
   * @param {Object} [config]
   * @param {string} [config.baseUrl]
   * @param {string} [config.authToken]
   */
  constructor(config = {}) {
    // Default to localhost, with option to switch to 10.0.2.2 for Android emulator
    this.baseUrl = config.baseUrl || process.env.SOUNDWAVE_API_URL || 'http://127.0.0.1:3000';
    this.authToken = config.authToken || null;
  }

  setToken(token) {
    this.authToken = token;
  }

  setBaseUrl(url) {
    this.baseUrl = url;
  }

  /**
   * Low-level HTTP request helper
   * @private
   */
  async _request(endpoint, { method = 'GET', body = null, headers = {} } = {}) {
    const fullUrl = new URL(endpoint, this.baseUrl);
    const isHttps = fullUrl.protocol === 'https:';
    const transport = isHttps ? https : http;

    const requestHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...headers,
    };

    if (this.authToken && !requestHeaders['Authorization']) {
      requestHeaders['Authorization'] = `Bearer ${this.authToken}`;
    }

    const payload = body ? JSON.stringify(body) : null;
    if (payload) {
      requestHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const options = {
      hostname: fullUrl.hostname,
      port: fullUrl.port || (isHttps ? 443 : 80),
      path: `${fullUrl.pathname}${fullUrl.search}`,
      method,
      headers: requestHeaders,
    };

    return new Promise((resolve, reject) => {
      const req = transport.request(options, (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = rawData ? JSON.parse(rawData) : {};
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else {
              const err = new Error(parsed.error || `HTTP ${res.statusCode}`);
              err.status = res.statusCode;
              err.data = parsed;
              reject(err);
            }
          } catch (e) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(rawData);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${rawData}`));
            }
          }
        });
      });

      req.on('error', (err) => reject(err));

      if (payload) {
        req.write(payload);
      }
      req.end();
    });
  }

  // --- API Methods ---

  async checkHealth() {
    return this._request('/api/health');
  }

  async searchTracks(query) {
    return this._request(`/api/search?q=${encodeURIComponent(query)}`);
  }

  async getStreamUrl(videoId) {
    return this._request(`/api/stream/${encodeURIComponent(videoId)}`);
  }

  async register(username, email, password) {
    const res = await this._request('/api/auth/register', {
      method: 'POST',
      body: { username, email, password },
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async login(username, password) {
    const res = await this._request('/api/auth/login', {
      method: 'POST',
      body: { username, password },
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async getFavorites() {
    return this._request('/api/favorites');
  }

  async addFavorite(songId) {
    return this._request(`/api/favorites/${encodeURIComponent(songId)}`, {
      method: 'POST',
    });
  }

  async removeFavorite(songId) {
    return this._request(`/api/favorites/${encodeURIComponent(songId)}`, {
      method: 'DELETE',
    });
  }

  async getPlaylists() {
    return this._request('/api/playlists');
  }

  async createPlaylist(title) {
    return this._request('/api/playlists', {
      method: 'POST',
      body: { title },
    });
  }

  async updatePlaylist(playlistId, title) {
    return this._request(`/api/playlists/${playlistId}`, {
      method: 'PATCH',
      body: { title },
    });
  }

  async deletePlaylist(playlistId) {
    return this._request(`/api/playlists/${playlistId}`, {
      method: 'DELETE',
    });
  }

  async addTrackToPlaylist(playlistId, songId) {
    return this._request(`/api/playlists/${playlistId}/tracks`, {
      method: 'POST',
      body: { songId },
    });
  }

  async removeTrackFromPlaylist(playlistId, songId) {
    return this._request(`/api/playlists/${playlistId}/tracks/${songId}`, {
      method: 'DELETE',
    });
  }
}

// Export singleton and class
const defaultClient = new SoundWaveApiClient();

module.exports = {
  SoundWaveApiClient,
  api: defaultClient,
};

