import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from 'react-native';

const { api } = require('../api/client');
const { usePlayerStore } = require('../store/playerStore');

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All'); // 'All' | 'Songs' | 'Artists'
  const playerState = usePlayerStore.getState();

  // Load categories
  useEffect(() => {
    api.getCategories()
      .then((res) => {
        if (res && res.categories) {
          setCategories(res.categories);
        }
      })
      .catch(() => {});
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const data = await api.searchTracks(query.trim());
        setResults(data.results || []);
      } catch (e) {
        console.warn('Search error:', e.message);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const handlePlayTrack = (track) => {
    usePlayerStore.playTrack(track, results);
  };

  const handleCategoryPress = (category) => {
    setQuery(category.name);
  };

  const topResult = results.length > 0 ? results[0] : null;

  return (
    <View style={styles.container}>
      {/* Search Header Bar */}
      <View style={styles.searchHeader}>
        <Text style={styles.screenTitle}>Search</Text>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="What do you want to listen to?"
            placeholderTextColor="#777777"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearButton}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* When Empty: Show "Browse all" Categories */}
      {query.trim().length === 0 ? (
        <ScrollView contentContainerStyle={styles.browseContainer}>
          <Text style={styles.browseTitle}>Browse all</Text>
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryCard, { backgroundColor: cat.color }]}
                activeOpacity={0.8}
                onPress={() => handleCategoryPress(cat)}>
                <Text style={styles.categoryName}>{cat.name}</Text>
                <Text style={styles.categoryEmoji}>{cat.icon}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ height: 120 }} />
        </ScrollView>
      ) : (
        /* When Query Exists: Show Results */
        <ScrollView contentContainerStyle={styles.resultsContainer}>
          {/* Filter Pills */}
          <View style={styles.filterRow}>
            {['All', 'Songs', 'Artists'].map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterPill,
                  activeFilter === filter && styles.activeFilterPill,
                ]}
                onPress={() => setActiveFilter(filter)}>
                <Text
                  style={[
                    styles.filterText,
                    activeFilter === filter && styles.activeFilterText,
                  ]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {isSearching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#1db954" size="large" />
            </View>
          ) : (
            <>
              {/* Top Result Card */}
              {topResult && activeFilter === 'All' && (
                <View style={styles.topResultSection}>
                  <Text style={styles.sectionHeading}>Top result</Text>
                  <TouchableOpacity
                    style={styles.topResultCard}
                    activeOpacity={0.8}
                    onPress={() => handlePlayTrack(topResult)}>
                    <Image
                      source={{
                        uri: topResult.thumbnail || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300',
                      }}
                      style={styles.topResultImage}
                    />
                    <Text style={styles.topResultTitle} numberOfLines={2}>
                      {topResult.title}
                    </Text>
                    <View style={styles.topResultFooter}>
                      <Text style={styles.topResultBadge}>Song • {topResult.artist}</Text>
                      <View style={styles.topPlayCircle}>
                        <Text style={styles.topPlayTriangle}>▶</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              {/* Songs List */}
              <Text style={styles.sectionHeading}>Songs</Text>
              {results.map((item, idx) => {
                const isCurrent = playerState.currentTrack?.id === item.id;
                const isFav = usePlayerStore.isFavorite(item.id);

                return (
                  <TouchableOpacity
                    key={item.id || idx}
                    style={styles.trackRow}
                    activeOpacity={0.7}
                    onPress={() => handlePlayTrack(item)}>
                    <Image
                      source={{
                        uri: item.thumbnail || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&h=100',
                      }}
                      style={styles.trackThumb}
                    />
                    <View style={styles.trackInfo}>
                      <Text
                        style={[
                          styles.trackTitle,
                          isCurrent && styles.trackTitleActive,
                        ]}
                        numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.trackArtist} numberOfLines={1}>
                        {item.artist}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.heartButton}
                      onPress={() => usePlayerStore.toggleFavorite(item.id)}>
                      <Text style={[styles.heartIcon, isFav && styles.heartIconActive]}>
                        {isFav ? '💚' : '🤍'}
                      </Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}

              <View style={{ height: 120 }} />
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  searchHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#282828',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 46,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  clearButton: {
    padding: 6,
  },
  clearIcon: {
    color: '#b3b3b3',
    fontSize: 14,
  },
  browseContainer: {
    paddingHorizontal: 16,
  },
  browseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginVertical: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    height: 96,
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  categoryEmoji: {
    fontSize: 28,
    alignSelf: 'flex-end',
    opacity: 0.85,
  },
  resultsContainer: {
    paddingHorizontal: 16,
  },
  filterRow: {
    flexDirection: 'row',
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
    backgroundColor: '#1db954',
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
  topResultSection: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  topResultCard: {
    backgroundColor: '#181818',
    borderRadius: 8,
    padding: 16,
  },
  topResultImage: {
    width: 90,
    height: 90,
    borderRadius: 6,
    marginBottom: 12,
  },
  topResultTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  topResultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topResultBadge: {
    color: '#b3b3b3',
    fontSize: 12,
  },
  topPlayCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1db954',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  topPlayTriangle: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  trackThumb: {
    width: 48,
    height: 48,
    borderRadius: 4,
    backgroundColor: '#282828',
    marginRight: 12,
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  trackTitleActive: {
    color: '#1db954',
  },
  trackArtist: {
    color: '#b3b3b3',
    fontSize: 12,
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
});
