/**
 * SoundWave Spotify-Class MiniPlayer & FullPlayer Components
 * Implements the NativeWind Tailwind UI specification from the Technical Architecture Guide.
 */

/**
 * MiniPlayer Component Definition
 *
 * Visual Layout:
 * +-------------------------------------------------------------------+
 * | [Artwork] Track Title (Bold White)                   [Play/Pause] |
 * |           Artist Name (Muted Gray)                                |
 * +-------------------------------------------------------------------+
 */

const MiniPlayerConfig = {
  containerStyle: 'h-16 bg-neutral-900 border-t border-neutral-800 flex-row items-center px-4 justify-between',
  artworkStyle: 'w-12 h-12 rounded-md bg-neutral-800',
  titleStyle: 'text-white font-bold text-sm',
  artistStyle: 'text-neutral-400 text-xs',
  controlButtonStyle: 'p-2',
  playIconStyle: 'text-emerald-500 font-bold text-lg',
};

/**
 * Pure function renderer for MiniPlayer (usable across both React Native and test runners)
 */
function renderMiniPlayer(props = {}) {
  const { track, isPlaying = false, onTogglePlay, onExpand } = props;
  if (!track) return null;

  return {
    type: 'MiniPlayer',
    props: {
      trackId: track.id,
      title: track.title,
      artist: track.artist,
      artwork: track.coverArt || track.artwork,
      isPlaying,
      styles: MiniPlayerConfig,
    },
    actions: {
      togglePlay: onTogglePlay,
      expand: onExpand,
    },
  };
}

/**
 * FullPlayer Modal Specification
 */
const FullPlayerConfig = {
  containerStyle: 'flex-1 bg-black px-6 pt-12 pb-8 justify-between',
  artworkStyle: 'w-72 h-72 rounded-2xl self-center my-8 shadow-2xl',
  titleStyle: 'text-white font-bold text-2xl mb-1',
  artistStyle: 'text-neutral-400 text-base',
  scrubberTrackStyle: 'h-1 bg-neutral-700 rounded-full w-full my-4',
  scrubberProgressStyle: 'h-1 bg-emerald-500 rounded-full',
  controlsRowStyle: 'flex-row items-center justify-around mt-6',
  playButtonStyle: 'w-16 h-16 bg-emerald-500 rounded-full items-center justify-center',
};

function renderFullPlayer(props = {}) {
  const { track, isPlaying = false, positionSeconds = 0, onTogglePlay, onNext, onPrevious } = props;
  if (!track) return null;

  return {
    type: 'FullPlayer',
    props: {
      track,
      isPlaying,
      positionSeconds,
      durationSeconds: track.durationSeconds || 0,
      styles: FullPlayerConfig,
    },
    actions: {
      togglePlay: onTogglePlay,
      next: onNext,
      previous: onPrevious,
    },
  };
}

module.exports = {
  MiniPlayerConfig,
  FullPlayerConfig,
  renderMiniPlayer,
  renderFullPlayer,
};
