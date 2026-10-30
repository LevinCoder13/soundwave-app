import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
} from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import MiniPlayer from './src/components/MiniPlayer';
import FullPlayer from './src/components/FullPlayer';
import SettingsModal from './src/components/SettingsModal';

const { api } = require('./src/api/client');
const { usePlayerStore } = require('./src/store/playerStore');

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'search' | 'library'
  const [playerState, setPlayerState] = useState(usePlayerStore.getState());
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Subscribe to audio player store updates
  useEffect(() => {
    const unsubscribe = usePlayerStore.subscribe((state) => {
      setPlayerState({ ...state });
    });

    // Auto-detect backend on launch
    api.autoDetectHost().catch(() => {});

    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      {/* Main Content Area */}
      <View style={styles.contentArea}>
        {activeTab === 'home' && (
          <HomeScreen onOpenSettings={() => setIsSettingsOpen(true)} />
        )}
        {activeTab === 'search' && <SearchScreen />}
        {activeTab === 'library' && <LibraryScreen />}
      </View>

      {/* Floating MiniPlayer */}
      {playerState.currentTrack && (
        <MiniPlayer onPressExpand={() => setIsFullPlayerOpen(true)} />
      )}

      {/* Spotify 3-Tab Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('home')}
          activeOpacity={0.7}>
          <Text
            style={[
              styles.navIcon,
              activeTab === 'home' && styles.navIconActive,
            ]}>
            🏠
          </Text>
          <Text
            style={[
              styles.navLabel,
              activeTab === 'home' && styles.navLabelActive,
            ]}>
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('search')}
          activeOpacity={0.7}>
          <Text
            style={[
              styles.navIcon,
              activeTab === 'search' && styles.navIconActive,
            ]}>
            🔍
          </Text>
          <Text
            style={[
              styles.navLabel,
              activeTab === 'search' && styles.navLabelActive,
            ]}>
            Search
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('library')}
          activeOpacity={0.7}>
          <Text
            style={[
              styles.navIcon,
              activeTab === 'library' && styles.navIconActive,
            ]}>
            📚
          </Text>
          <Text
            style={[
              styles.navLabel,
              activeTab === 'library' && styles.navLabelActive,
            ]}>
            Your Library
          </Text>
        </TouchableOpacity>
      </View>

      {/* Full-Screen Now Playing Modal */}
      <FullPlayer
        visible={isFullPlayerOpen}
        onClose={() => setIsFullPlayerOpen(false)}
      />

      {/* Settings & Server Bridge Modal */}
      <SettingsModal
        visible={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  contentArea: {
    flex: 1,
  },
  bottomNav: {
    height: 56,
    flexDirection: 'row',
    backgroundColor: '#121212',
    borderTopWidth: 1,
    borderTopColor: '#1e1e1e',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    fontSize: 18,
    opacity: 0.6,
    marginBottom: 2,
  },
  navIconActive: {
    opacity: 1,
  },
  navLabel: {
    color: '#b3b3b3',
    fontSize: 10,
    fontWeight: '600',
  },
  navLabelActive: {
    color: '#ffffff',
  },
});
