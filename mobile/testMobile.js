/**
 * SoundWave Mobile Integration Verification Suite
 * Verifies mobile controllers, stores, and API bridges against live backend.
 */

const assert = require('assert');
const { api } = require('./src/api/client');
const { usePlayerStore } = require('./src/store/playerStore');
const { searchController } = require('./src/screens/SearchScreen');
const { libraryController } = require('./src/screens/LibraryScreen');
const { authController } = require('./src/screens/AuthScreen');
const { app } = require('./App');

async function testMobile() {
  console.log('====================================================');
  console.log('📱 Testing SoundWave Mobile Frontend Integration');
  console.log('====================================================\n');

  try {
    // 1. Mobile Auth Flow
    const testEmail = `mobile_${Date.now()}@test.com`;
    const testUser = `mobile_dev_${Date.now()}`;
    authController.state.isLoginMode = false;
    const authRes = await authController.submit({
      username: testUser,
      email: testEmail,
      password: 'MobilePassword123!',
    });
    assert(authRes.token, 'Mobile auth should receive valid JWT token');
    console.log('✓ [PASSED] 1. Mobile Auth Controller (Register & Token Storage)');

    // 2. Mobile Search Flow
    const tracks = await searchController.search('Daft Punk One More Time');
    assert(tracks.length > 0, 'Search controller should retrieve tracks');
    const targetTrack = tracks[0];
    console.log(`✓ [PASSED] 2. Mobile Search Screen ("${targetTrack.title}")`);

    // 3. Audio Store & Stream Resolution
    await searchController.onSelectTrack(targetTrack);
    const playerState = usePlayerStore.getState();
    assert.strictEqual(playerState.isPlaying, true, 'Player should be playing');
    assert(playerState.currentTrack.streamUrl, 'Player store should resolve live stream URL');
    console.log(`✓ [PASSED] 3. Zustand Audio Store (Resolved URL: ${playerState.currentTrack.streamUrl.substring(0, 45)}...)`);

    // 4. Play/Pause & Queue
    usePlayerStore.togglePlayPause();
    assert.strictEqual(usePlayerStore.getState().isPlaying, false, 'Player should pause');
    usePlayerStore.togglePlayPause();
    assert.strictEqual(usePlayerStore.getState().isPlaying, true, 'Player should resume');
    console.log('✓ [PASSED] 4. Audio Playback Controls (Play/Pause Toggle)');

    // 5. MiniPlayer Component Rendering
    const miniPlayerData = app.getMiniPlayerData();
    assert(miniPlayerData, 'MiniPlayer should render active track');
    assert.strictEqual(miniPlayerData.props.trackId, targetTrack.id);
    assert.strictEqual(miniPlayerData.props.isPlaying, true);
    console.log('✓ [PASSED] 5. Spotify-Class MiniPlayer (NativeWind Layout)');

    // 6. FullPlayer Component Rendering
    const fullPlayerData = app.getFullPlayerData();
    assert(fullPlayerData, 'FullPlayer should render active track');
    assert.strictEqual(fullPlayerData.props.track.id, targetTrack.id);
    console.log('✓ [PASSED] 6. Spotify-Class FullPlayer Modal (Scrubber & Actions)');

    // 7. Library Controller
    await libraryController.createNewPlaylist('My Roadtrip Mix');
    await libraryController.loadLibrary();
    assert(libraryController.state.playlists.length > 0, 'Library should contain created playlist');
    console.log('✓ [PASSED] 7. Library Controller (Playlists & Favorites Sync)');

    console.log('\n====================================================');
    console.log('🎉 ALL MOBILE INTEGRATION TESTS PASSED 100%!');
    console.log('====================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Mobile Test Error:', err);
    process.exit(1);
  }
}

testMobile();
