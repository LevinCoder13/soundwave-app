/**
 * SoundWave Mobile App Root
 * Spotify-Class Dark Aesthetic with NativeWind Tailwind CSS
 */

const { usePlayerStore } = require('./src/store/playerStore');
const { searchController } = require('./src/screens/SearchScreen');
const { libraryController } = require('./src/screens/LibraryScreen');
const { authController } = require('./src/screens/AuthScreen');
const { renderMiniPlayer, renderFullPlayer } = require('./src/components/MiniPlayer');

class SoundWaveApp {
  constructor() {
    this.currentScreen = 'search'; // 'home' | 'search' | 'library' | 'auth'
    this.isFullPlayerVisible = false;
  }

  navigate(screenName) {
    this.currentScreen = screenName;
  }

  openFullPlayer() {
    this.isFullPlayerVisible = true;
  }

  closeFullPlayer() {
    this.isFullPlayerVisible = false;
  }

  getMiniPlayerData() {
    const playerState = usePlayerStore.getState();
    return renderMiniPlayer({
      track: playerState.currentTrack,
      isPlaying: playerState.isPlaying,
      onTogglePlay: () => usePlayerStore.togglePlayPause(),
      onExpand: () => this.openFullPlayer(),
    });
  }

  getFullPlayerData() {
    const playerState = usePlayerStore.getState();
    return renderFullPlayer({
      track: playerState.currentTrack,
      isPlaying: playerState.isPlaying,
      positionSeconds: playerState.positionSeconds,
      onTogglePlay: () => usePlayerStore.togglePlayPause(),
      onNext: () => usePlayerStore.next(),
      onPrevious: () => usePlayerStore.previous(),
    });
  }
}

const appInstance = new SoundWaveApp();

module.exports = {
  SoundWaveApp,
  app: appInstance,
};
