/**
 * SoundWave Mobile Audio Store (Zustand-pattern)
 * Manages playback state, playlist queue, stream resolution, and audio controls.
 */

const { api } = require('../api/client');

class PlayerStore {
  constructor() {
    this.state = {
      currentTrack: null,
      isPlaying: false,
      isLoadingStream: false,
      queue: [],
      currentIndex: -1,
      favorites: new Set(),
      positionSeconds: 0,
      durationSeconds: 0,
      error: null,
    };
    this.listeners = new Set();
  }

  getState() {
    return this.state;
  }

  setState(partial) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((listener) => listener(this.state));
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Play a track: Resolves audio stream URL from backend bridge if not yet resolved
   * @param {Object} track
   */
  async playTrack(track) {
    if (!track || !track.id) return;

    this.setState({ isLoadingStream: true, error: null });

    try {
      let resolvedTrack = { ...track };

      // If stream URL is missing, resolve it via SoundWave backend bridge
      if (!resolvedTrack.streamUrl) {
        const streamData = await api.getStreamUrl(track.id);
        resolvedTrack = {
          ...resolvedTrack,
          streamUrl: streamData.streamUrl,
          bitrate: streamData.bitrate,
          mimeType: streamData.mimeType,
          durationSeconds: streamData.durationSeconds || resolvedTrack.durationSeconds || 0,
        };
      }

      // Add to queue if not present
      const queue = [...this.state.queue];
      let index = queue.findIndex((t) => t.id === track.id);
      if (index === -1) {
        queue.push(resolvedTrack);
        index = queue.length - 1;
      } else {
        queue[index] = resolvedTrack;
      }

      this.setState({
        currentTrack: resolvedTrack,
        isPlaying: true,
        isLoadingStream: false,
        queue,
        currentIndex: index,
        durationSeconds: resolvedTrack.durationSeconds || 0,
        positionSeconds: 0,
      });

      return resolvedTrack;
    } catch (err) {
      console.error('[PlayerStore Error] Failed to resolve stream:', err.message);
      this.setState({
        isLoadingStream: false,
        isPlaying: false,
        error: err.message,
      });
      throw err;
    }
  }

  togglePlayPause() {
    if (!this.state.currentTrack) return;
    this.setState({ isPlaying: !this.state.isPlaying });
  }

  pause() {
    this.setState({ isPlaying: false });
  }

  resume() {
    if (this.state.currentTrack) {
      this.setState({ isPlaying: true });
    }
  }

  async next() {
    const { queue, currentIndex } = this.state;
    if (queue.length === 0) return;
    const nextIndex = (currentIndex + 1) % queue.length;
    await this.playTrack(queue[nextIndex]);
  }

  async previous() {
    const { queue, currentIndex } = this.state;
    if (queue.length === 0) return;
    const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    await this.playTrack(queue[prevIndex]);
  }

  setQueue(tracks, startIndex = 0) {
    this.setState({
      queue: tracks,
      currentIndex: startIndex,
    });
    if (tracks[startIndex]) {
      this.playTrack(tracks[startIndex]);
    }
  }

  toggleFavorite(trackId) {
    const favorites = new Set(this.state.favorites);
    if (favorites.has(trackId)) {
      favorites.delete(trackId);
    } else {
      favorites.add(trackId);
    }
    this.setState({ favorites });
  }

  isFavorite(trackId) {
    return this.state.favorites.has(trackId);
  }
}

// Singleton store instance
const usePlayerStore = new PlayerStore();

module.exports = {
  usePlayerStore,
  PlayerStore,
};
