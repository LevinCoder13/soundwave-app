import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';

const { api } = require('../api/client');
const { usePlayerStore } = require('../store/playerStore');

export default function LibraryScreen() {
  const [filter, setFilter] = useState('Playlists'); // 'Playlists' | 'Artists' | 'Downloaded'
  const [playlists, setPlaylists] = useState([]);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  const playerState = usePlayerStore.getState();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [plistRes, favRes] = await Promise.all([
        api.getPlaylists().catch(() => ({ playlists: [] })),
        api.getFavorites().catch(() => ({ favorites: [] })),
      ]);
      setPlaylists(plistRes.playlists || []);
      setFavoritesCount((favRes.favorites || []).length);
    } catch (e) {
      console.warn('Library load error:', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreatePlaylist = async () => {
    if (!newTitle.trim()) return;
    try {
      const res = await api.createPlaylist(newTitle.trim());
      if (res && res.playlist) {
        setPlaylists([res.playlist, ...playlists]);
        setNewTitle('');
        setIsCreateModalOpen(false);
      }
    } catch (e) {
      console.warn('Create playlist error:', e.message);
    }
  };

  const handlePlayLikedSongs = async () => {
    try {
      const favRes = await api.getFavorites();
      const tracks = favRes.favorites || [];
      if (tracks.length > 0) {
        usePlayerStore.setQueue(tracks, 0);
      }
    } catch (e) {
      console.warn('Play favorites error:', e.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>L</Text>
          </View>
          <Text style={styles.title}>Your Library</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsCreateModalOpen(true)}>
          <Text style={styles.addIcon}>＋</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Pills */}
      <View style={styles.filterRow}>
        {['Playlists', 'Artists', 'Downloaded'].map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.filterPill, filter === item && styles.activeFilterPill]}
            onPress={() => setFilter(item)}>
            <Text style={[styles.filterText, filter === item && styles.activeFilterText]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#1db954" size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer}>
          {/* Pinned Liked Songs Item */}
          <TouchableOpacity
            style={styles.likedSongsRow}
            activeOpacity={0.7}
            onPress={handlePlayLikedSongs}>
            <View style={styles.likedBadge}>
              <Text style={styles.likedHeart}>🤍</Text>
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>Liked Songs</Text>
              <Text style={styles.rowSubtitle}>📌 Pinned • {favoritesCount} songs</Text>
            </View>
          </TouchableOpacity>

          {/* User Playlists */}
          {playlists.map((pl) => (
            <TouchableOpacity
              key={pl.id}
              style={styles.playlistRow}
              activeOpacity={0.7}
              onPress={() => setSelectedPlaylist(pl)}>
              <View style={styles.playlistThumb}>
                <Text style={styles.playlistThumbIcon}>🎵</Text>
              </View>
              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {pl.title}
                </Text>
                <Text style={styles.rowSubtitle}>
                  Playlist • SoundWave User
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Artists Sample View */}
          {filter === 'Artists' && (
            <View style={styles.artistsSection}>
              {['The Weeknd', 'Daft Punk', 'Taylor Swift'].map((art, idx) => (
                <View key={idx} style={styles.artistRow}>
                  <View style={styles.artistThumb}>
                    <Text style={styles.artistThumbText}>🎤</Text>
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowTitle}>{art}</Text>
                    <Text style={styles.rowSubtitle}>Artist</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      )}

      {/* Create Playlist Modal */}
      <Modal
        visible={isCreateModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCreateModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Give your playlist a name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="My playlist"
              placeholderTextColor="#777777"
              value={newTitle}
              onChangeText={setNewTitle}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setIsCreateModalOpen(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCreate}
                onPress={handleCreatePlaylist}>
                <Text style={styles.modalCreateText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#535353',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  addButton: {
    padding: 6,
  },
  addIcon: {
    fontSize: 24,
    color: '#ffffff',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#282828',
    marginRight: 8,
  },
  activeFilterPill: {
    backgroundColor: '#ffffff',
  },
  filterText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  activeFilterText: {
    color: '#000000',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  likedSongsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  likedBadge: {
    width: 60,
    height: 60,
    borderRadius: 4,
    backgroundColor: '#450af5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  likedHeart: {
    fontSize: 24,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  playlistThumb: {
    width: 60,
    height: 60,
    borderRadius: 4,
    backgroundColor: '#282828',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  playlistThumbIcon: {
    fontSize: 22,
  },
  rowInfo: {
    flex: 1,
  },
  rowTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  rowSubtitle: {
    color: '#b3b3b3',
    fontSize: 12,
  },
  artistsSection: {
    marginTop: 8,
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  artistThumb: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#282828',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  artistThumbText: {
    fontSize: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#282828',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#1db954',
    color: '#ffffff',
    fontSize: 16,
    paddingVertical: 8,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalCancel: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  modalCancelText: {
    color: '#b3b3b3',
    fontSize: 14,
    fontWeight: '600',
  },
  modalCreate: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#1db954',
    borderRadius: 20,
  },
  modalCreateText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
});
