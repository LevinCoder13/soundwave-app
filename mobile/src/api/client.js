/**
 * SoundWave Mobile API Client Bridge
 * Supports Wi-Fi Direct LAN (192.168.1.13:3000), USB ADB reverse (127.0.0.1:3000),
 * and Android Emulator loopback (10.0.2.2:3000).
 */

class SoundWaveApiClient {
  /**
   * @param {Object} [config]
   * @param {string} [config.baseUrl]
   * @param {string} [config.authToken]
   */
  constructor(config = {}) {
    // Default to the Wi-Fi LAN IP so the phone works completely untethered without USB
    this.baseUrl = config.baseUrl || 'http://192.168.1.13:3000';
    this.fallbackUrls = [
      'http://192.168.1.13:3000',
      'http://127.0.0.1:3000',
      'http://10.0.2.2:3000',
    ];
    this.authToken = config.authToken || null;
  }

  setToken(token) {
    this.authToken = token;
  }

  setBaseUrl(url) {
    if (url) {
      this.baseUrl = url.replace(/\/+$/, '');
    }
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  /**
   * Automatically discovers the fastest working backend address
   */
  async autoDetectHost() {
    for (const host of this.fallbackUrls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);
        const res = await fetch(`${host}/api/health`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          this.baseUrl = host;
          console.log(`[SoundWave Client] Connected to backend at: ${host}`);
          return host;
        }
      } catch (err) {
        // try next
      }
    }
    return this.baseUrl;
  }

  /**
   * Low-level HTTP request helper using standard fetch
   * @private
   */
  async _request(endpoint, { method = 'GET', body = null, headers = {} } = {}) {
    const cleanBase = this.baseUrl.replace(/\/+$/, '');
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${cleanBase}${cleanEndpoint}`;

    const requestHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...headers,
    };

    if (this.authToken && !requestHeaders['Authorization']) {
      requestHeaders['Authorization'] = `Bearer ${this.authToken}`;
    }

    const options = {
      method,
      headers: requestHeaders,
    };

    if (body && method !== 'GET' && method !== 'HEAD') {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      const contentType = response.headers.get('content-type') || '';

      let data;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const err = new Error(data && data.error ? data.error : `HTTP ${response.status}`);
        err.status = response.status;
        err.data = data;
        throw err;
      }

      return data;
    } catch (error) {
      // If primary network fails, try health check and auto-detect
      if (error.message && error.message.includes('Network request failed')) {
        await this.autoDetectHost();
      }
      throw error;
    }
  }

  // --- API Methods ---

  async checkHealth() {
    return this._request('/api/health');
  }

  // --- Browse & Curated Feed ---
  async getFeaturedFeed() {
    return this._request('/api/browse/featured');
  }

  async getCategories() {
    return this._request('/api/browse/categories');
  }

  async getLyrics(trackId, title = '', artist = '') {
    return this._request(`/api/browse/lyrics/${encodeURIComponent(trackId)}?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`);
  }

  // --- Search & Streaming ---
  async searchTracks(query) {
    return this._request(`/api/search?q=${encodeURIComponent(query)}`);
  }

  async getStreamUrl(videoId) {
    return this._request(`/api/stream/${encodeURIComponent(videoId)}`);
  }

  // --- Auth ---
  async register(username, email, password) {
    const res = await this._request('/api/auth/register', {
      method: 'POST',
      body: { username, email, password },
    });
    if (res && res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async login(username, password) {
    const res = await this._request('/api/auth/login', {
      method: 'POST',
      body: { username, password },
    });
    if (res && res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  // --- Favorites ---
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

  // --- Playlists ---
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
