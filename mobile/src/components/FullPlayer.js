import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';

const { usePlayerStore } = require('../store/playerStore');
const { api } = require('../api/client');

export default function FullPlayer({ visible, onClose }) {
  const [playerState, setPlayerState] = useState(usePlayerStore.getState());
  const [showLyrics, setShowLyrics] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [lyricsData, setLyricsData] = useState(null);

  useEffect(() => {
    const unsubscribe = usePlayerStore.subscribe((state) => {
      setPlayerState({ ...state });
    });
    return () => unsubscribe();
  }, []);

  const track = playerState.currentTrack;

  // Load lyrics when modal or track changes
  useEffect(() => {
    if (track && visible) {
      api.getLyrics(track.id, track.title, track.artist)
        .then((res) => setLyricsData(res))
        .catch(() => setLyricsData(null));
    }
  }, [track?.id, visible]);

  if (!track) return null;

  const isPlaying = playerState.isPlaying;
  const isFav = usePlayerStore.isFavorite(track.id);
  const isShuffle = playerState.isShuffle;
  const repeatMode = playerState.repeatMode;
  const position = playerState.positionSeconds || 0;
  const duration = playerState.durationSeconds || 180;
  const progressPercent = Math.min(100, Math.max(0, (position / duration) * 100));

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSeek = (evt) => {
    const { locationX } = evt.nativeEvent;
    // Assuming width approx 320 for slider container
    const width = 320;
    const ratio = Math.max(0, Math.min(1, locationX / width));
    usePlayerStore.seekTo(Math.floor(ratio * duration));
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#121212" />

        {/* Top Navigation Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.minimizeBtn}>
            <Text style={styles.minimizeIcon}>⌵</Text>
          </TouchableOpacity>
          <View style={styles.headerContext}>
            <Text style={styles.contextSub}>PLAYING FROM PLAYLIST</Text>
            <Text style={styles.contextTitle} numberOfLines={1}>
              SoundWave Top Hits
            </Text>
          </View>
          <TouchableOpacity style={styles.moreBtn}>
            <Text style={styles.moreIcon}>⋮</Text>
          </TouchableOpacity>
        </View>

        {/* Center View: Normal Art OR Lyrics View */}
        {showLyrics ? (
          <View style={styles.lyricsCard}>
            <View style={styles.lyricsHeader}>
              <Text style={styles.lyricsTitle}>Lyrics</Text>
              <TouchableOpacity onPress={() => setShowLyrics(false)}>
                <Text style={styles.lyricsClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.lyricsScroll}>
              {(lyricsData?.lines || []).map((line, idx) => {
                const isLineActive = position >= line.time && (idx === lyricsData.lines.length - 1 || position < lyricsData.lines[idx + 1]?.time);
                return (
                  <Text
                    key={idx}
                    style={[
                      styles.lyricsLine,
                      isLineActive && styles.lyricsLineActive,
                    ]}>
                    {line.text}
                  </Text>
                );
              })}
            </ScrollView>
          </View>
        ) : (
          /* Album Artwork */
          <View style={styles.artContainer}>
            <Image
              source={{
                uri: track.thumbnail || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&h=500',
              }}
              style={styles.albumArt}
            />
          </View>
        )}

        {/* Track Info Row */}
        <View style={styles.trackInfoRow}>
          <View style={styles.titleArtistCol}>
            <Text style={styles.trackTitle} numberOfLines={1}>
              {track.title}
            </Text>
            <Text style={styles.trackArtist} numberOfLines={1}>
              {track.artist}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.favButton}
            onPress={() => usePlayerStore.toggleFavorite(track.id)}>
            <Text style={[styles.favIcon, isFav && styles.favIconActive]}>
              {isFav ? '💚' : '🤍'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Scrubber / Seek Bar */}
        <View style={styles.scrubberContainer}>
          <TouchableOpacity
            style={styles.sliderTrack}
            activeOpacity={1}
            onPress={handleSeek}>
            <View style={[styles.sliderFill, { width: `${progressPercent}%` }]} />
            <View style={[styles.sliderThumb, { left: `${progressPercent}%` }]} />
          </TouchableOpacity>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>

        {/* Master Audio Controls */}
        <View style={styles.controlsRow}>
          {/* Shuffle Toggle */}
          <TouchableOpacity
            style={styles.modeBtn}
            onPress={() => usePlayerStore.toggleShuffle()}>
            <Text style={[styles.modeIcon, isShuffle && styles.modeIconActive]}>
              🔀
            </Text>
            {isShuffle && <View style={styles.activeDot} />}
          </TouchableOpacity>

          {/* Previous Button */}
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => usePlayerStore.previous()}>
            <Text style={styles.skipIcon}>⏮</Text>
          </TouchableOpacity>

          {/* Large Circular Play/Pause */}
          <TouchableOpacity
            style={styles.mainPlayBtn}
            activeOpacity={0.8}
            onPress={() => usePlayerStore.togglePlayPause()}>
            <Text style={styles.mainPlayIcon}>{isPlaying ? '❚❚' : '▶'}</Text>
          </TouchableOpacity>

          {/* Next Button */}
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => usePlayerStore.next()}>
            <Text style={styles.skipIcon}>⏭</Text>
          </TouchableOpacity>

          {/* Repeat Toggle */}
          <TouchableOpacity
            style={styles.modeBtn}
            onPress={() => usePlayerStore.cycleRepeat()}>
            <Text
              style={[
                styles.modeIcon,
                repeatMode !== 'off' && styles.modeIconActive,
              ]}>
              {repeatMode === 'one' ? '🔂' : '🔁'}
            </Text>
            {repeatMode !== 'off' && <View style={styles.activeDot} />}
          </TouchableOpacity>
        </View>

        {/* Bottom Utility Actions */}
        <View style={styles.bottomUtilities}>
          <TouchableOpacity
            style={styles.connectPill}
            onPress={() => alert('SoundWave Connect: Playing to iQOO Neo 10R')}>
            <Text style={styles.connectIcon}>🔊</Text>
            <Text style={styles.connectText}>SoundWave Connect</Text>
          </TouchableOpacity>

          <View style={styles.utilityActionsRight}>
            <TouchableOpacity
              style={[styles.utilBtn, showLyrics && styles.utilBtnActive]}
              onPress={() => setShowLyrics(!showLyrics)}>
              <Text style={styles.utilBtnText}>Lyrics</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.utilBtn, showQueue && styles.utilBtnActive]}
              onPress={() => setShowQueue(true)}>
              <Text style={styles.utilBtnText}>Queue</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Queue Modal Drawer */}
        <Modal
          visible={showQueue}
          animationType="slide"
          onRequestClose={() => setShowQueue(false)}>
          <SafeAreaView style={styles.queueContainer}>
            <View style={styles.queueHeader}>
              <TouchableOpacity onPress={() => setShowQueue(false)}>
                <Text style={styles.queueClose}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.queueHeaderTitle}>Play Queue</Text>
              <TouchableOpacity onPress={() => usePlayerStore.clearQueue()}>
                <Text style={styles.queueClear}>Clear</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.queueScroll}>
              <Text style={styles.queueSection}>Now Playing</Text>
              <View style={styles.queueCurrentRow}>
                <Image
                  source={{ uri: track.thumbnail }}
                  style={styles.queueThumb}
                />
                <View style={styles.queueInfo}>
                  <Text style={[styles.queueTitle, { color: '#1db954' }]} numberOfLines={1}>
                    {track.title}
                  </Text>
                  <Text style={styles.queueArtist}>{track.artist}</Text>
                </View>
              </View>

              <Text style={styles.queueSection}>Up Next</Text>
              {(playerState.queue || [])
                .slice(playerState.currentIndex + 1)
                .map((qTrack, qIdx) => (
                  <TouchableOpacity
                    key={qIdx}
                    style={styles.queueRow}
                    onPress={() => usePlayerStore.playTrack(qTrack)}>
                    <Text style={styles.queueIdx}>{qIdx + 1}</Text>
                    <Image
                      source={{ uri: qTrack.thumbnail }}
                      style={styles.queueThumb}
                    />
                    <View style={styles.queueInfo}>
                      <Text style={styles.queueTitle} numberOfLines={1}>
                        {qTrack.title}
                      </Text>
                      <Text style={styles.queueArtist}>{qTrack.artist}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() =>
                        usePlayerStore.removeFromQueue(playerState.currentIndex + 1 + qIdx)
                      }>
                      <Text style={styles.queueRemove}>✕</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginBottom: 20,
  },
  minimizeBtn: {
    padding: 8,
  },
  minimizeIcon: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '300',
  },
  headerContext: {
    alignItems: 'center',
    maxWidth: '70%',
  },
  contextSub: {
    color: '#b3b3b3',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  contextTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  moreBtn: {
    padding: 8,
  },
  moreIcon: {
    color: '#ffffff',
    fontSize: 22,
  },
  artContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  albumArt: {
    width: 310,
    height: 310,
    borderRadius: 12,
    backgroundColor: '#282828',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  lyricsCard: {
    flex: 1,
    backgroundColor: '#252525',
    borderRadius: 12,
    padding: 20,
    marginVertical: 10,
  },
  lyricsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  lyricsTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  lyricsClose: {
    color: '#b3b3b3',
    fontSize: 16,
  },
  lyricsScroll: {
    flex: 1,
  },
  lyricsLine: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 30,
    marginBottom: 12,
  },
  lyricsLineActive: {
    color: '#1db954',
  },
  trackInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  titleArtistCol: {
    flex: 1,
    marginRight: 16,
  },
  trackTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  trackArtist: {
    color: '#b3b3b3',
    fontSize: 15,
  },
  favButton: {
    padding: 8,
  },
  favIcon: {
    fontSize: 24,
    opacity: 0.7,
  },
  favIconActive: {
    opacity: 1,
  },
  scrubberContainer: {
    marginBottom: 16,
  },
  sliderTrack: {
    width: '100%',
    height: 4,
    backgroundColor: '#4f4f4f',
    borderRadius: 2,
    position: 'relative',
    justifyContent: 'center',
  },
  sliderFill: {
    height: 4,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    marginLeft: -6,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    color: '#b3b3b3',
    fontSize: 11,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  modeBtn: {
    padding: 8,
    alignItems: 'center',
  },
  modeIcon: {
    fontSize: 20,
    opacity: 0.6,
  },
  modeIconActive: {
    opacity: 1,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1db954',
    marginTop: 2,
  },
  skipBtn: {
    padding: 8,
  },
  skipIcon: {
    color: '#ffffff',
    fontSize: 28,
  },
  mainPlayBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainPlayIcon: {
    color: '#000000',
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  bottomUtilities: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  connectPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  connectText: {
    color: '#1db954',
    fontSize: 12,
    fontWeight: '600',
  },
  utilityActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  utilBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#282828',
    marginLeft: 8,
  },
  utilBtnActive: {
    backgroundColor: '#1db954',
  },
  utilBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  queueContainer: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 20,
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  queueClose: {
    color: '#ffffff',
    fontSize: 20,
    padding: 4,
  },
  queueHeaderTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  queueClear: {
    color: '#b3b3b3',
    fontSize: 14,
    fontWeight: '600',
  },
  queueScroll: {
    flex: 1,
  },
  queueSection: {
    color: '#b3b3b3',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 18,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  queueCurrentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f1f1f',
    padding: 10,
    borderRadius: 6,
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#181818',
  },
  queueIdx: {
    color: '#777777',
    fontSize: 12,
    width: 24,
  },
  queueThumb: {
    width: 44,
    height: 44,
    borderRadius: 4,
    marginRight: 12,
  },
  queueInfo: {
    flex: 1,
  },
  queueTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  queueArtist: {
    color: '#b3b3b3',
    fontSize: 12,
  },
  queueRemove: {
    color: '#777777',
    fontSize: 16,
    padding: 8,
  },
});

