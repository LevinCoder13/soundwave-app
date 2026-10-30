import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

const { usePlayerStore } = require('../store/playerStore');

export default function MiniPlayer({ onPressExpand }) {
  const playerState = usePlayerStore.getState();
  const track = playerState.currentTrack;

  if (!track) return null;

  const isPlaying = playerState.isPlaying;
  const isFav = usePlayerStore.isFavorite(track.id);
  const position = playerState.positionSeconds || 0;
  const duration = playerState.durationSeconds || 180;
  const progressPercent = Math.min(100, Math.max(0, (position / duration) * 100));

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.95}
      onPress={onPressExpand}>
      {/* Top Hairline Progress Bar */}
      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
      </View>

      <View style={styles.contentRow}>
        {/* Track Thumbnail */}
        <Image
          source={{
            uri: track.thumbnail || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&h=100',
          }}
          style={styles.thumbnail}
        />

        {/* Title & Artist */}
        <View style={styles.trackDetails}>
          <Text style={styles.title} numberOfLines={1}>
            {track.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {track.artist}
          </Text>
        </View>

        {/* Favorite Heart */}
        <TouchableOpacity
          style={styles.heartButton}
          onPress={() => usePlayerStore.toggleFavorite(track.id)}>
          <Text style={[styles.heartIcon, isFav && styles.heartIconActive]}>
            {isFav ? '💚' : '🤍'}
          </Text>
        </TouchableOpacity>

        {/* Play/Pause Button */}
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => usePlayerStore.togglePlayPause()}>
          <Text style={styles.playIcon}>{isPlaying ? '❚❚' : '▶'}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 56, // Sits directly above bottom navigation bar
    left: 8,
    right: 8,
    height: 58,
    backgroundColor: '#222222',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  progressBarTrack: {
    width: '100%',
    height: 2,
    backgroundColor: '#3e3e3e',
  },
  progressBarFill: {
    height: 2,
    backgroundColor: '#1db954',
  },
  contentRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  thumbnail: {
    width: 42,
    height: 42,
    borderRadius: 4,
    backgroundColor: '#333333',
    marginRight: 10,
  },
  trackDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  artist: {
    color: '#b3b3b3',
    fontSize: 11,
  },
  heartButton: {
    padding: 8,
  },
  heartIcon: {
    fontSize: 16,
    opacity: 0.6,
  },
  heartIconActive: {
    opacity: 1,
  },
  playButton: {
    padding: 8,
    marginLeft: 4,
  },
  playIcon: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
