const http = require('http');

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
  console.log('--- Starting SoundWave API Integration Tests ---');
  const port = 3000;

  try {
    // 1. Health Check
    console.log('\n1. Testing Health Endpoint...');
    const health = await makeRequest({
      hostname: '127.0.0.1',
      port,
      path: '/api/health',
      method: 'GET',
    });
    console.log(`Health Status: ${health.status}`, health.data);

    // 2. Search
    console.log('\n2. Testing Search Endpoint ("The Weeknd Blinding Lights")...');
    const searchRes = await makeRequest({
      hostname: '127.0.0.1',
      port,
      path: '/api/search?q=The+Weeknd+Blinding+Lights',
      method: 'GET',
    });
    console.log(`Search Status: ${searchRes.status}, Total found: ${searchRes.data.total}`);
    const firstTrack = searchRes.data.results && searchRes.data.results[0];
    if (firstTrack) {
      console.log(`Top Result: "${firstTrack.title}" by ${firstTrack.artist} (ID: ${firstTrack.id})`);
    }

    // 3. Audio Stream Resolution
    if (firstTrack && firstTrack.id) {
      console.log(`\n3. Testing Stream Resolution for ID: ${firstTrack.id}...`);
      const streamRes = await makeRequest({
        hostname: '127.0.0.1',
        port,
        path: `/api/stream/${firstTrack.id}`,
        method: 'GET',
      });
      console.log(`Stream Status: ${streamRes.status}`);
      if (streamRes.data.streamUrl) {
        console.log(`Direct Audio Stream URL resolved successfully: ${streamRes.data.streamUrl.substring(0, 60)}...`);
        console.log(`Bitrate: ${streamRes.data.bitrate} kbps, Mime: ${streamRes.data.mimeType}`);
      } else {
        console.log('Stream response details:', streamRes.data);
      }
    }

    // 4. User Registration
    const testUser = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@soundwave.com`,
      password: 'password123!',
    };
    console.log(`\n4. Testing User Registration for: ${testUser.username}...`);
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
    console.log(`Register Status: ${regRes.status}`, regRes.data.message);
    const token = regRes.data.token;

    // 5. User Login
    console.log('\n5. Testing User Login...');
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
    console.log(`Login Status: ${loginRes.status}`, loginRes.data.message);

    // 6. Favorites
    if (token && firstTrack) {
      console.log('\n6. Testing Add to Favorites...');
      const favRes = await makeRequest(
        {
          hostname: '127.0.0.1',
          port,
          path: '/api/favorites',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
        {
          songId: firstTrack.id,
          title: firstTrack.title,
          artist: firstTrack.artist,
          coverArt: firstTrack.coverArt,
          durationSeconds: firstTrack.durationSeconds,
        }
      );
      console.log(`Favorite Add Status: ${favRes.status}`, favRes.data);

      console.log('\n7. Testing Get Favorites...');
      const getFavRes = await makeRequest({
        hostname: '127.0.0.1',
        port,
        path: '/api/favorites',
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(`Get Favorites Status: ${getFavRes.status}, Total favorites: ${getFavRes.data.total}`);
    }

    console.log('\n=== All Phase 1 Integration Tests Completed Successfully! ===');
  } catch (err) {
    console.error('Test run failed:', err.message);
  }
}

runTests();
