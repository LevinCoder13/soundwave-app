import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  StatusBar,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

const { api } = require('./src/api/client');
const { usePlayerStore } = require('./src/store/playerStore');

export default function App() {
  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'library'
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [playerState, setPlayerState] = useState(usePlayerStore.getState());
  const [isFullPlayerVisible, setIsFullPlayerVisible] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);

  // Subscribe to audio player store updates
  useEffect(() => {
    const unsubscribe = usePlayerStore.subscribe((state) => {
      setPlayerState({ ...state });
    });
    return () => unsubscribe();
  }, []);

  // Search handler
  const handleSearch = async (text) => {
    setQuery(text);
    if (!text.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const data = await api.searchTracks(text);
      setSearchResults(data.results || []);
    } catch (e) {
      console.warn('Search error:', e.message);
    } finally {
      setIsSearching(false);
    }
  };

  // Play track handler
  const handlePlayTrack = async (track) => {
    try {
      await usePlayerStore.playTrack(track);
    } catch (e) {
      console.warn('Play error:', e.message);
    }
  };

  // Toggle favorite
  const handleToggleFavorite = (trackId) => {
    usePlayerStore.toggleFavorite(trackId);
  };

  // Load playlists on library tab
  useEffect(() => {
    if (activeTab === 'library') {
      api.getPlaylists().then((res) => {
        setPlaylists(res.playlists || []);
      }).catch(() => {});
    }
  }, [activeTab]);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistTitle.trim()) return;
    try {
      const res = await api.createPlaylist(newPlaylistTitle.trim());
      if (res.playlist) {
        setPlaylists([res.playlist, ...playlists]);
        setNewPlaylistTitle('');
        setIsCreatingPlaylist(false);
      }
    } catch (e) {
      console.warn('Create playlist error:', e.message);
    }
  };

  const currentTrack = playerState.currentTrack;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoDot} />
          <Text style={styles.headerTitle}>SoundWave</Text>
        </View>
        <Text style={styles.headerSubtitle}>Spotify-Class Engine</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => setActiveTab('search')}
          style={[styles.tabButton, activeTab === 'search' && styles.activeTabButton]}>
          <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>
            Search
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('library')}
          style={[styles.tabButton, activeTab === 'library' && styles.activeTabButton]}>
          <Text style={[styles.tabText, activeTab === 'library' && styles.activeTabText]}>
            Library
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {activeTab === 'search' ? (
        <View style={styles.content}>
          {/* Search Box */}
          <View style={styles.searchBox}>
            <TextInput
              style={styles.searchInput}
              placeholder="What do you want to listen to?"
              placeholderTextColor="#B3B3B3"
              value={query}
              onChangeText={handleSearch}
            />
          </View>

          {isSearching && (
            <ActivityIndicator color="#1DB954" style={{ marginVertical: 12 }} />
          )}

          {/* Quick Query Pills */}
          {!query && (
            <View style={styles.pillsRow}>
              {['The Weeknd', 'Daft Punk', 'Billie Eilish', 'Coldplay'].map((artist) => (
                <TouchableOpacity
                  key={artist}
                  style={styles.pill}
                  onPress={() => handleSearch(artist)}>
                  <Text style={styles.pillText}>{artist}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Track List */}
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 100 }}
            renderItem={({ item }) => {
              const isPlayingThis = currentTrack && currentTrack.id === item.id && playerState.isPlaying;
              const isFav = playerState.favorites && playerState.favorites.has && playerState.favorites.has(item.id);

              return (
                <TouchableOpacity
                  style={styles.trackCard}
                  onPress={() => handlePlayTrack(item)}>
                  <Image
                    source={{ uri: item.coverArt || 'https://via.placeholder.com/60' }}
                    style={styles.trackArtwork}
                  />
                  <View style={styles.trackDetails}>
                    <Text
                      style={[styles.trackTitle, isPlayingThis && { color: '#1DB954' }]}
                      numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.trackArtist} numberOfLines={1}>
                      {item.artist}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleToggleFavorite(item.id)}
                    style={styles.heartButton}>
                    <Text style={{ fontSize: 18, color: isFav ? '#1DB954' : '#666' }}>
                      {isFav ? '♥' : '♡'}
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.libraryHeader}>
            <Text style={styles.sectionTitle}>Your Playlists</Text>
            <TouchableOpacity
              onPress={() => setIsCreatingPlaylist(!isCreatingPlaylist)}
              style={styles.addPlaylistButton}>
              <Text style={styles.addPlaylistButtonText}>+ New</Text>
            </TouchableOpacity>
          </View>

          {isCreatingPlaylist && (
            <View style={styles.newPlaylistForm}>
              <TextInput
                style={styles.newPlaylistInput}
                placeholder="Playlist name..."
                placeholderTextColor="#777"
                value={newPlaylistTitle}
                onChangeText={setNewPlaylistTitle}
              />
              <TouchableOpacity
                onPress={handleCreatePlaylist}
                style={styles.savePlaylistButton}>
                <Text style={styles.savePlaylistButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          )}

          <FlatList
            data={playlists}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ paddingBottom: 100 }}
            renderItem={({ item }) => (
              <View style={styles.playlistCard}>
                <View style={styles.playlistIcon}>
                  <Text style={{ color: '#1DB954', fontSize: 20 }}>♫</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.playlistTitle}>{item.title}</Text>
                  <Text style={styles.playlistSubtitle}>
                    {item.track_count || 0} tracks
                  </Text>
                </View>
              </View>
            )}
          />
        </View>
      )}

      {/* Persistent Bottom MiniPlayer */}
      {currentTrack && (
        <TouchableOpacity
          style={styles.miniPlayer}
          activeOpacity={0.9}
          onPress={() => setIsFullPlayerVisible(true)}>
          <Image
            source={{ uri: currentTrack.coverArt || 'https://via.placeholder.com/48' }}
            style={styles.miniPlayerArtwork}
          />
          <View style={styles.miniPlayerDetails}>
            <Text style={styles.miniPlayerTitle} numberOfLines={1}>
              {currentTrack.title}
            </Text>
            <Text style={styles.miniPlayerArtist} numberOfLines={1}>
              {currentTrack.artist}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.miniPlayerButton}
            onPress={() => usePlayerStore.togglePlayPause()}>
            <Text style={styles.playIconText}>
              {playerState.isPlaying ? '⏸' : '▶'}
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* Full-Screen Player Modal */}
      <Modal
        visible={isFullPlayerVisible}
        animationType="slide"
        onRequestClose={() => setIsFullPlayerVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <TouchableOpacity
            onPress={() => setIsFullPlayerVisible(false)}
            style={styles.modalCloseButton}>
            <Text style={styles.modalCloseText}>▼ Close</Text>
          </TouchableOpacity>

          {currentTrack && (
            <View style={styles.fullPlayerContent}>
              <Image
                source={{ uri: currentTrack.coverArt || 'https://via.placeholder.com/300' }}
                style={styles.fullPlayerArtwork}
              />
              <Text style={styles.fullPlayerTitle} numberOfLines={1}>
                {currentTrack.title}
              </Text>
              <Text style={styles.fullPlayerArtist} numberOfLines={1}>
                {currentTrack.artist}
              </Text>

              {/* Scrubber Placeholder */}
              <View style={styles.scrubber}>
                <View style={[styles.scrubberProgress, { width: '40%' }]} />
              </View>

              {/* Controls */}
              <View style={styles.fullPlayerControls}>
                <TouchableOpacity onPress={() => usePlayerStore.previous()}>
                  <Text style={styles.navButtonText}>⏮</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.mainPlayButton}
                  onPress={() => usePlayerStore.togglePlayPause()}>
                  <Text style={styles.mainPlayButtonText}>
                    {playerState.isPlaying ? '⏸' : '▶'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => usePlayerStore.next()}>
                  <Text style={styles.navButtonText}>⏭</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1DB954',
    marginRight: 8,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#B3B3B3',
    fontSize: 12,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#282828',
  },
  activeTabButton: {
    backgroundColor: '#1DB954',
  },
  tabText: {
    color: '#B3B3B3',
    fontWeight: '600',
    fontSize: 13,
  },
  activeTabText: {
    color: '#000',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchBox: {
    backgroundColor: '#282828',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginVertical: 10,
  },
  searchInput: {
    color: '#FFF',
    height: 44,
    fontSize: 14,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  pill: {
    backgroundColor: '#1E1E1E',
    borderColor: '#333',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  pillText: {
    color: '#CCC',
    fontSize: 12,
  },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#222',
  },
  trackArtwork: {
    width: 48,
    height: 48,
    borderRadius: 4,
    backgroundColor: '#282828',
  },
  trackDetails: {
    flex: 1,
    marginLeft: 12,
  },
  trackTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  trackArtist: {
    color: '#B3B3B3',
    fontSize: 12,
    marginTop: 2,
  },
  heartButton: {
    padding: 8,
  },
  libraryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addPlaylistButton: {
    backgroundColor: '#1DB954',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  addPlaylistButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  newPlaylistForm: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  newPlaylistInput: {
    flex: 1,
    backgroundColor: '#282828',
    color: '#FFF',
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 38,
  },
  savePlaylistButton: {
    backgroundColor: '#1DB954',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginLeft: 8,
    borderRadius: 6,
  },
  savePlaylistButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  playlistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#222',
  },
  playlistIcon: {
    width: 44,
    height: 44,
    borderRadius: 4,
    backgroundColor: '#282828',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  playlistSubtitle: {
    color: '#888',
    fontSize: 12,
  },
  miniPlayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#282828',
    borderTopWidth: 1,
    borderTopColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  miniPlayerArtwork: {
    width: 42,
    height: 42,
    borderRadius: 4,
  },
  miniPlayerDetails: {
    flex: 1,
    marginLeft: 10,
  },
  miniPlayerTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  miniPlayerArtist: {
    color: '#B3B3B3',
    fontSize: 11,
  },
  miniPlayerButton: {
    padding: 10,
  },
  playIconText: {
    color: '#1DB954',
    fontSize: 22,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  modalCloseButton: {
    alignSelf: 'center',
    padding: 10,
  },
  modalCloseText: {
    color: '#B3B3B3',
    fontSize: 14,
  },
  fullPlayerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullPlayerArtwork: {
    width: 280,
    height: 280,
    borderRadius: 12,
    marginBottom: 24,
  },
  fullPlayerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  fullPlayerArtist: {
    color: '#B3B3B3',
    fontSize: 15,
    marginTop: 4,
    textAlign: 'center',
  },
  scrubber: {
    width: '90%',
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    marginVertical: 24,
  },
  scrubberProgress: {
    height: '100%',
    backgroundColor: '#1DB954',
    borderRadius: 2,
  },
  fullPlayerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '80%',
  },
  navButtonText: {
    color: '#FFF',
    fontSize: 28,
  },
  mainPlayButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1DB954',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainPlayButtonText: {
    color: '#000',
    fontSize: 26,
    fontWeight: 'bold',
  },
});
