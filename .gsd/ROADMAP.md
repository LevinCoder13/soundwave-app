# SoundWave Engineering Roadmap

## Phase 1: Core Audio Engine & Health Bridge (COMPLETED)
- [x] Express 4 server scaffold with CORS, logging, and JSON body parsing.
- [x] WampServer MySQL connection pool and schema initialization (`schema.sql`).
- [x] Health check endpoint (`GET /api/health`) reporting DB connectivity & loopback.
- [x] YouTube search resolution (`GET /api/search?q={query}`).
- [x] Audio streaming pipeline (`GET /api/stream/:videoId`).

## Phase 2: User Authentication & Personalization (COMPLETED)
- [x] User registration with bcrypt hashing (`POST /api/auth/register`).
- [x] User login returning JWT tokens (`POST /api/auth/login`).
- [x] Auth verification middleware (`src/middleware/authMiddleware.js`).
- [x] Favorites management (`GET /api/favorites`, `POST /api/favorites/:songId`, `DELETE /api/favorites/:songId`).

## Phase 3: Playlist System & Song Metadata Cache (COMPLETED)
- [x] Playlist CRUD endpoints (`GET /api/playlists`, `POST /api/playlists`, `DELETE /api/playlists/:id`).
- [x] Playlist tracks junction management (`POST /api/playlists/:id/tracks`).
- [x] Automated metadata caching in `songs_cache` on search and stream resolution (`streamController.js`).

## Phase 4: Production Hardening, Quality Gates & Autonomous Harness (COMPLETED)
- [x] Ralph-style test-driven execution loop script (`scripts/ralph-loop.ps1`, `scripts/ralph-loop.sh`).
- [x] Roo Code custom modes specification (`.roomodes`).
- [x] CodeRabbit-style static security and quality gate (`scripts/code-review.js`).
- [x] Rate-limiting middleware for search & streaming endpoints (`rateLimiter.js`).
- [x] Ytdl-core 5.2.0 upgrade resolving live audio stream URL generation.

## Phase 5: React Native Mobile Client & Player Architecture (ACTIVE)
- [ ] React Native project architecture, types, and theme configuration (`mobile/`).
- [ ] SoundWave API client bridge supporting Android emulator (`10.0.2.2:3000`) and local Wi-Fi.
- [ ] Zustand audio state store managing current track, queue, playback state, and stream resolution.
- [ ] Spotify-class MiniPlayer UI component (`src/components/MiniPlayer.tsx`) styled with NativeWind / Tailwind.
- [ ] Search & Library screens for browsing songs, streaming audio, and saving favorites.
