import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

const { api } = require('../api/client');
const { usePlayerStore } = require('../store/playerStore');

export default function HomeScreen({ onOpenSettings }) {
  const [feed, setFeed] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const playerState = usePlayerStore.getState();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    let mounted = true;
    api.getFeaturedFeed()
      .then((res) => {
        if (mounted && res && res.feed) {
          setFeed(res.feed);
        }
      })
      .catch((err) => console.warn('Feed fetch error:', err.message))
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handlePlayCollection = async (item) => {
    try {
      // Search tracks matching collection title
      const res = await api.searchTracks(item.title || item.name);
      if (res.results && res.results.length > 0) {
        usePlayerStore.setQueue(res.results, 0);
      }
    } catch (e) {
      console.warn('Play collection error:', e.message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onOpenSettings}>
            <Text style={styles.headerIconText}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#1db954" size="large" />
        </View>
      ) : (
        <>
          {/* Quick-Access Grid (6 items in 2 columns) */}
          <View style={styles.quickGrid}>
            {(feed?.quickAccess || []).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.quickTile}
                activeOpacity={0.8}
                onPress={() => handlePlayCollection(item)}>
                <Image source={{ uri: item.cover }} style={styles.quickTileImage} />
                <View style={styles.quickTileTextContainer}>
                  <Text style={styles.quickTileTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                </View>
                <View style={styles.quickPlayCircle}>
                  <Text style={styles.quickPlayTriangle}>▶</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Carousel: Made For You */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Made For You</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
            {(feed?.madeForYou || []).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => handlePlayCollection(item)}>
                <Image source={{ uri: item.cover }} style={styles.cardImage} />
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.cardSubtitle} numberOfLines={2}>
                  {item.subtitle}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Carousel: Today's Top Hits / Charts */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Charts & Trending</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
            {(feed?.topCharts || []).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => handlePlayCollection(item)}>
                <View style={styles.chartImageWrapper}>
                  <Image source={{ uri: item.cover }} style={styles.cardImage} />
                  {item.badge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.cardSubtitle} numberOfLines={2}>
                  {item.subtitle}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Carousel: Popular Artists (Circular) */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Artists</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
            {(feed?.popularArtists || []).map((artist) => (
              <TouchableOpacity
                key={artist.id}
                style={styles.artistCard}
                activeOpacity={0.7}
                onPress={() => handlePlayCollection(artist)}>
                <Image source={{ uri: artist.image }} style={styles.artistImage} />
                <Text style={styles.artistName} numberOfLines={1}>
                  {artist.name}
                </Text>
                <Text style={styles.artistType}>{artist.type}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Carousel: Moods & Playlists */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Moods & Chill</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
            {(feed?.moodPlaylists || []).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => handlePlayCollection(item)}>
                <Image source={{ uri: item.cover }} style={styles.cardImage} />
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.cardSubtitle} numberOfLines={2}>
                  {item.subtitle}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Bottom spacing for miniplayer */}
          <View style={{ height: 120 }} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.4,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#282828',
  },
  headerIconText: {
    fontSize: 16,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickTile: {
    width: '48.5%',
    height: 56,
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  quickTileImage: {
    width: 56,
    height: 56,
  },
  quickTileTextContainer: {
    flex: 1,
    paddingHorizontal: 8,
  },
  quickTileTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  quickPlayCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1db954',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  quickPlayTriangle: {
    color: '#000000',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 1,
  },
  sectionHeader: {
    marginVertical: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  carousel: {
    marginBottom: 16,
  },
  card: {
    width: 140,
    marginRight: 14,
  },
  cardImage: {
    width: 140,
    height: 140,
    borderRadius: 6,
    backgroundColor: '#282828',
    marginBottom: 8,
  },
  chartImageWrapper: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: '#1db954',
    fontSize: 9,
    fontWeight: '800',
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardSubtitle: {
    color: '#b3b3b3',
    fontSize: 11,
    lineHeight: 14,
  },
  artistCard: {
    width: 120,
    marginRight: 14,
    alignItems: 'center',
  },
  artistImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#282828',
    marginBottom: 8,
  },
  artistName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  artistType: {
    color: '#b3b3b3',
    fontSize: 11,
    textAlign: 'center',
  },
});

