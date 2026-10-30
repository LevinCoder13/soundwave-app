/**
 * SoundWave Mobile Audio Store (Zustand-pattern)
 * Spotify-class queue management, shuffle/repeat modes, scrubber position, and stream resolution.
 */

const { api } = require('../api/client');

class PlayerStore {
  constructor() {
    this.state = {
      currentTrack: null,
      isPlaying: false,
      isLoadingStream: false,
      queue: [],
      originalQueue: [], // Unshuffled queue
      currentIndex: -1,
      isShuffle: false,
      repeatMode: 'off', // 'off' | 'all' | 'one'
      favorites: new Set(),
      positionSeconds: 0,
      durationSeconds: 0,
      error: null,
    };
    this.listeners = new Set();
    this._progressTimer = null;
    this._startProgressTicker();
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
   * Internal clock ticker that updates elapsed time during playback
   * @private
   */
  _startProgressTicker() {
    if (this._progressTimer) clearInterval(this._progressTimer);
    this._progressTimer = setInterval(() => {
      if (this.state.isPlaying && this.state.currentTrack) {
        const nextPos = this.state.positionSeconds + 1;
        const dur = this.state.durationSeconds || 180;
        if (nextPos >= dur) {
          // Track ended - trigger autoplay advance
          this._handleTrackEnd();
        } else {
          this.setState({ positionSeconds: nextPos });
        }
      }
    }, 1000);
  }

  /**
   * Handles auto-advance when a track finishes
   * @private
   */
  async _handleTrackEnd() {
    if (this.state.repeatMode === 'one') {
      this.setState({ positionSeconds: 0 });
      return;
    }

    const { queue, currentIndex, repeatMode } = this.state;
    if (queue.length === 0) return;

    if (currentIndex < queue.length - 1) {
      await this.playTrack(queue[currentIndex + 1]);
    } else if (repeatMode === 'all') {
      await this.playTrack(queue[0]);
    } else {
      // Autoplay recommendations if queue ended
      this.setState({ isPlaying: false, positionSeconds: 0 });
      this._autoplayRadio();
    }
  }

  /**
   * Autoplay recommendations when user reaches end of queue
   * @private
   */
  async _autoplayRadio() {
    try {
      const artist = this.state.currentTrack?.artist || 'Popular';
      const searchRes = await api.searchTracks(`${artist} mix`);
      const suggestions = (searchRes.results || []).filter(
        (t) => !this.state.queue.some((q) => q.id === t.id)
      );
      if (suggestions.length > 0) {
        const nextTrack = suggestions[0];
        const newQueue = [...this.state.queue, nextTrack];
        this.setState({ queue: newQueue });
        await this.playTrack(nextTrack);
      }
    } catch (e) {
      // ignore
    }
  }

  /**
   * Play a track: Resolves audio stream URL from backend bridge if not yet resolved
   * @param {Object} track
   * @param {Array} [newQueue] Optional list to replace current queue
   */
  async playTrack(track, newQueue = null) {
    if (!track || !track.id) return;

    this.setState({ isLoadingStream: true, error: null });

    try {
      let resolvedTrack = { ...track };

      // If stream URL is missing, resolve it via SoundWave backend bridge
      if (!resolvedTrack.streamUrl) {
        try {
          const streamData = await api.getStreamUrl(track.id);
          resolvedTrack = {
            ...resolvedTrack,
            streamUrl: streamData.streamUrl,
            bitrate: streamData.bitrate,
            mimeType: streamData.mimeType,
            durationSeconds: streamData.durationSeconds || resolvedTrack.durationSeconds || 215,
          };
        } catch (streamErr) {
          console.warn('[PlayerStore] Stream resolution fallback:', streamErr.message);
          resolvedTrack.durationSeconds = resolvedTrack.durationSeconds || 215;
        }
      }

      let queue = newQueue ? [...newQueue] : [...this.state.queue];
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
        originalQueue: newQueue ? [...newQueue] : (this.state.originalQueue.length ? this.state.originalQueue : queue),
        currentIndex: index,
        durationSeconds: resolvedTrack.durationSeconds || 215,
        positionSeconds: 0,
      });

      return resolvedTrack;
    } catch (err) {
      console.error('[PlayerStore Error] Failed to play track:', err.message);
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

  seekTo(seconds) {
    const clamped = Math.max(0, Math.min(seconds, this.state.durationSeconds || 0));
    this.setState({ positionSeconds: clamped });
  }

  toggleShuffle() {
    const nextShuffle = !this.state.isShuffle;
    if (nextShuffle) {
      // Shuffle queue keeping current track at current index
      const { queue, currentIndex } = this.state;
      const current = queue[currentIndex];
      const other = queue.filter((_, i) => i !== currentIndex);
      // Fisher-Yates shuffle
      for (let i = other.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [other[i], other[j]] = [other[j], other[i]];
      }
      const shuffled = [current, ...other];
      this.setState({
        isShuffle: true,
        queue: shuffled,
        currentIndex: 0,
      });
    } else {
      // Restore original queue
      const { originalQueue, currentTrack } = this.state;
      const index = originalQueue.findIndex((t) => t.id === currentTrack?.id);
      this.setState({
        isShuffle: false,
        queue: [...originalQueue],
        currentIndex: index !== -1 ? index : 0,
      });
    }
  }

  cycleRepeat() {
    const modes = ['off', 'all', 'one'];
    const curIdx = modes.indexOf(this.state.repeatMode);
    const nextMode = modes[(curIdx + 1) % modes.length];
    this.setState({ repeatMode: nextMode });
  }

  async next() {
    if (this.state.repeatMode === 'one') {
      this.setState({ positionSeconds: 0 });
      return;
    }

    const { queue, currentIndex, repeatMode } = this.state;
    if (queue.length === 0) return;

    if (currentIndex < queue.length - 1) {
      await this.playTrack(queue[currentIndex + 1]);
    } else if (repeatMode === 'all') {
      await this.playTrack(queue[0]);
    } else {
      this._autoplayRadio();
    }
  }

  async previous() {
    // If more than 3 seconds in, restart track like Spotify
    if (this.state.positionSeconds > 3) {
      this.setState({ positionSeconds: 0 });
      return;
    }

    const { queue, currentIndex } = this.state;
    if (queue.length === 0) return;

    const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    await this.playTrack(queue[prevIndex]);
  }

  addToQueue(track) {
    if (!track) return;
    const queue = [...this.state.queue, track];
    const originalQueue = [...this.state.originalQueue, track];
    this.setState({ queue, originalQueue });
  }

  playNext(track) {
    if (!track) return;
    const { queue, currentIndex } = this.state;
    const newQueue = [...queue];
    newQueue.splice(currentIndex + 1, 0, track);
    this.setState({ queue: newQueue });
  }

  removeFromQueue(index) {
    const { queue, currentIndex } = this.state;
    if (index === currentIndex) return; // Cannot remove currently playing
    const newQueue = queue.filter((_, i) => i !== index);
    const newIndex = index < currentIndex ? currentIndex - 1 : currentIndex;
    this.setState({ queue: newQueue, currentIndex: newIndex });
  }

  clearQueue() {
    const { currentTrack } = this.state;
    this.setState({
      queue: currentTrack ? [currentTrack] : [],
      originalQueue: currentTrack ? [currentTrack] : [],
      currentIndex: currentTrack ? 0 : -1,
    });
  }

  setQueue(tracks, startIndex = 0) {
    this.setState({
      queue: tracks,
      originalQueue: [...tracks],
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
