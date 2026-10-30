/**
 * SoundWave Search Screen
 * Real-time track search via SoundWave Node.js bridge.
 */

const { api } = require('../api/client');
const { usePlayerStore } = require('../store/playerStore');

class SearchScreenController {
  constructor() {
    this.state = {
      query: '',
      results: [],
      isLoading: false,
      error: null,
      recentSearches: ['The Weeknd', 'Daft Punk', 'Billie Eilish'],
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

  async search(query) {
    if (!query || query.trim() === '') {
      this.state.results = [];
      this.state.query = '';
      this.notify();
      return;
    }

    this.state.isLoading = true;
    this.state.query = query;
    this.state.error = null;
    this.notify();

    try {
      const data = await api.searchTracks(query);
      this.state.results = data.results || [];
      this.state.isLoading = false;

      // Add to recent searches if not present
      if (!this.state.recentSearches.includes(query.trim())) {
        this.state.recentSearches.unshift(query.trim());
        if (this.state.recentSearches.length > 5) {
          this.state.recentSearches.pop();
        }
      }
      this.notify();
      return this.state.results;
    } catch (err) {
      this.state.isLoading = false;
      this.state.error = err.message;
      this.notify();
      throw err;
    }
  }

  async onSelectTrack(track) {
    // Play track through global audio store
    return usePlayerStore.playTrack(track);
  }

  async onToggleFavorite(track) {
    const isFav = usePlayerStore.isFavorite(track.id);
    if (isFav) {
      await api.removeFavorite(track.id);
      usePlayerStore.toggleFavorite(track.id);
    } else {
      await api.addFavorite(track.id);
      usePlayerStore.toggleFavorite(track.id);
    }
    this.notify();
  }
}

module.exports = {
  SearchScreenController,
  searchController: new SearchScreenController(),
};
