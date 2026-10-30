/**
 * SoundWave TrackPlayer Background Playback Service
 * Registered with TrackPlayer.registerPlaybackService(() => playbackService)
 */

module.exports = async function playbackService() {
  // If running in React Native environment, TrackPlayer is loaded
  let TrackPlayer;
  try {
    TrackPlayer = require('react-native-track-player');
    const { Event } = TrackPlayer;

    TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
    TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
    TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
    TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());
    TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.destroy());
    TrackPlayer.addEventListener(Event.RemoteSeek, (event) => TrackPlayer.seekTo(event.position));
  } catch (e) {
    // Graceful fallback for non-native test environments
  }
};
