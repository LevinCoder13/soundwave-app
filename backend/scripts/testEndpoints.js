const http = require('http');
const assert = require('assert');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 SoundWave Comprehensive Integration Test Suite');
  console.log('====================================================\n');
  const port = 3000;
  let passedCount = 0;

  function recordPass(testName) {
    passedCount++;
    console.log(`✓ [PASSED] ${testName}`);
  }

  try {
    // 1. Health Check
    const health = await makeRequest({ hostname: '127.0.0.1', port, path: '/api/health', method: 'GET' });
    assert.strictEqual(health.status, 200, 'Health check should return HTTP 200');
    assert.strictEqual(health.data.database.connected, true, 'Database must be connected');
    recordPass('1. Health Check & Database Connectivity');

    // 2. Search
    const searchRes = await makeRequest({
      hostname: '127.0.0.1',
      port,
      path: '/api/search?q=The+Weeknd+Blinding+Lights',
      method: 'GET',
    });
    assert.strictEqual(searchRes.status, 200, 'Search should return HTTP 200');
    assert(searchRes.data.results && searchRes.data.results.length > 0, 'Search results must be non-empty');
    const firstTrack = searchRes.data.results[0];
    recordPass(`2. YouTube Search Endpoint (Found ${searchRes.data.total} tracks)`);

    // 3. Audio Stream Resolution
    const streamRes = await makeRequest({
      hostname: '127.0.0.1',
      port,
      path: `/api/stream/${firstTrack.id}`,
      method: 'GET',
    });
    assert.strictEqual(streamRes.status, 200, 'Stream resolution must return HTTP 200');
    assert(streamRes.data.streamUrl && streamRes.data.streamUrl.startsWith('http'), 'Stream URL must be valid');
    recordPass(`3. Audio Stream Resolution (${streamRes.data.bitrate || 'Standard'} kbps)`);

    // 4. User Registration
    const timestamp = Date.now();
    const testUser = {
      username: `tester_${timestamp}`,
      email: `tester_${timestamp}@soundwave.test`,
      password: 'SecurePassword123!',
    };
    const regRes = await makeRequest(
      {
        hostname: '127.0.0.1',
        port,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      testUser
    );
    assert.strictEqual(regRes.status, 201, 'User registration must return HTTP 201');
    const token = regRes.data.token;
    assert(token, 'Registration must return JWT token');
    recordPass('4. User Registration');

    // 5. User Login
    const loginRes = await makeRequest(
      {
        hostname: '127.0.0.1',
        port,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: testUser.email, password: testUser.password }
    );
    assert.strictEqual(loginRes.status, 200, 'User login must return HTTP 200');
    assert(loginRes.data.token, 'Login must return valid JWT');
    recordPass('5. User Login');

    // 6. User Profile (/api/auth/me)
    const profileRes = await makeRequest({
      hostname: '127.0.0.1',
      port,
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(profileRes.status, 200, 'Profile must return HTTP 200');
    assert.strictEqual(profileRes.data.user.username, testUser.username);
    recordPass('6. User Profile (GET /api/auth/me)');

    // 7. Add to Favorites
    const addFavRes = await makeRequest(
      {
        hostname: '127.0.0.1',
        port,
        path: '/api/favorites',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      },
      {
        songId: firstTrack.id,
        title: firstTrack.title,
        artist: firstTrack.artist,
        coverArt: firstTrack.coverArt,
        durationSeconds: firstTrack.durationSeconds,
      }
    );
    assert.strictEqual(addFavRes.status, 201, 'Add favorite must return HTTP 201');
    recordPass('7. Add Track to Favorites');

    // 8. Check Favorite Status
    const checkFavRes = await makeRequest({
      hostname: '127.0.0.1',
      port,
      path: `/api/favorites/check/${firstTrack.id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(checkFavRes.status, 200);
    assert.strictEqual(checkFavRes.data.isFavorite, true);
    recordPass('8. Check Favorite Status');

    // 9. Get Favorites
    const getFavRes = await makeRequest({
      hostname: '127.0.0.1',
      port,
      path: '/api/favorites',
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(getFavRes.status, 200);
    assert(getFavRes.data.favorites.some((f) => f.id === firstTrack.id));
    recordPass('9. Retrieve User Favorites');

    // 10. Remove from Favorites
    const delFavRes = await makeRequest({
      hostname: '127.0.0.1',
      port,
      path: `/api/favorites/${firstTrack.id}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(delFavRes.status, 200);
    recordPass('10. Remove Track from Favorites');

    // 11. Create Playlist
    const createPlRes = await makeRequest(
      {
        hostname: '127.0.0.1',
        port,
        path: '/api/playlists',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      },
      { title: 'My Autonomous Playlist' }
    );
    assert.strictEqual(createPlRes.status, 201);
    const playlistId = createPlRes.data.playlist.id;
    recordPass(`11. Create Playlist (ID: ${playlistId})`);

    // 12. Update Playlist Title
    const updatePlRes = await makeRequest(
      {
        hostname: '127.0.0.1',
        port,
        path: `/api/playlists/${playlistId}`,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      },
      { title: 'Updated Autonomous Playlist' }
    );
    assert.strictEqual(updatePlRes.status, 200);
    assert.strictEqual(updatePlRes.data.title, 'Updated Autonomous Playlist');
    recordPass('12. Update Playlist Title');

    // 13. Add Track to Playlist
    const addTrackRes = await makeRequest(
      {
        hostname: '127.0.0.1',
        port,
        path: `/api/playlists/${playlistId}/tracks`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      },
      {
        songId: firstTrack.id,
        title: firstTrack.title,
        artist: firstTrack.artist,
        coverArt: firstTrack.coverArt,
        durationSeconds: firstTrack.durationSeconds,
      }
    );
    assert.strictEqual(addTrackRes.status, 201);
    recordPass('13. Add Track to Playlist');

    // 14. Get Playlist Details & Tracks
    const getPlRes = await makeRequest({
      hostname: '127.0.0.1',
      port,
      path: `/api/playlists/${playlistId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(getPlRes.status, 200);
    assert.strictEqual(getPlRes.data.tracks.length, 1);
    assert.strictEqual(getPlRes.data.tracks[0].id, firstTrack.id);
    recordPass('14. Get Playlist Details & Tracks');

    // 15. Remove Track from Playlist
    const removeTrackRes = await makeRequest({
      hostname: '127.0.0.1',
      port,
      path: `/api/playlists/${playlistId}/tracks/${firstTrack.id}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(removeTrackRes.status, 200);
    recordPass('15. Remove Track from Playlist');

    // 16. Delete Playlist
    const delPlRes = await makeRequest({
      hostname: '127.0.0.1',
      port,
      path: `/api/playlists/${playlistId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(delPlRes.status, 200);
    recordPass('16. Delete Playlist');

    console.log(`\n====================================================`);
    console.log(`🎉 ALL ${passedCount} INTEGRATION TESTS PASSED 100%!`);
    console.log(`====================================================`);
    process.exit(0);
  } catch (err) {
    console.error(`\n❌ [FAILED] Test Suite Aborted:`, err.message);
    process.exit(1);
  }
}

runTests();
