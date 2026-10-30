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
- [x] Auth verification middleware (`src/middleware/auth.js`).
- [x] Favorites management (`GET /api/favorites`, `POST /api/favorites/:songId`, `DELETE /api/favorites/:songId`).

## Phase 3: Playlist System & Song Metadata Cache (IN PROGRESS)
- [x] Playlist CRUD endpoints (`GET /api/playlists`, `POST /api/playlists`, `DELETE /api/playlists/:id`).
- [x] Playlist tracks junction management (`POST /api/playlists/:id/tracks`).
- [ ] Automated metadata caching in `songs_cache` on search and stream resolution.
- [ ] Track reordering within playlists.

## Phase 4: Production Hardening, Quality Gates & Autonomous Test Harness (CURRENT)
- [x] Ralph-style test-driven execution loop script (`scripts/ralph-loop.ps1`).
- [x] Roo Code custom modes specification (`.roomodes`).
- [x] CodeRabbit-style static security and quality gate (`scripts/code-review.js`).
- [ ] Rate-limiting middleware for search & streaming endpoints.
- [ ] Automated integration test runner with mock database fallback.

