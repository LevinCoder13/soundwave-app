/**
 * SoundWave Library Screen
 * Displays user's playlists, liked songs, and cache statistics.
 */

const { api } = require('../api/client');
const { usePlayerStore } = require('../store/playerStore');

class LibraryScreenController {
  constructor() {
    this.state = {
      playlists: [],
      favorites: [],
      activeTab: 'playlists', // 'playlists' | 'favorites'
      isLoading: false,
      error: null,
    };
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((fn) => fn(this.state));
  }

  setTab(tab) {
    this.state.activeTab = tab;
    this.notify();
  }

  async loadLibrary() {
    this.state.isLoading = true;
    this.notify();

    try {
      const [playlistsRes, favoritesRes] = await Promise.allSettled([
        api.getPlaylists(),
        api.getFavorites(),
      ]);

      if (playlistsRes.status === 'fulfilled') {
        this.state.playlists = playlistsRes.value.playlists || [];
      }

      if (favoritesRes.status === 'fulfilled') {
        this.state.favorites = favoritesRes.value.favorites || [];
      }

      this.state.isLoading = false;
      this.notify();
    } catch (err) {
      this.state.isLoading = false;
      this.state.error = err.message;
      this.notify();
    }
  }

  async createNewPlaylist(title) {
    const res = await api.createPlaylist(title);
    if (res.playlist) {
      this.state.playlists.unshift(res.playlist);
      this.notify();
    }
    return res;
  }

  async deletePlaylist(playlistId) {
    await api.deletePlaylist ? api.deletePlaylist(playlistId) : null;
    this.state.playlists = this.state.playlists.filter((p) => p.id !== playlistId);
    this.notify();
  }

  playTrack(track) {
    return usePlayerStore.playTrack(track);
  }
}

module.exports = {
  LibraryScreenController,
  libraryController: new LibraryScreenController(),
};
