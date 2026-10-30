# SoundWave — Audio Streaming Bridge API

## Project Overview
SoundWave is a high-performance audio streaming backend and WampServer bridge built with Node.js and Express. It enables mobile applications (such as an Android client via `10.0.2.2:3000` emulator loopback) and web clients to search music, resolve and pipe direct audio streams, manage user authentication, maintain playlists, and cache song metadata in MySQL.

## Core Architecture
- **Runtime:** Node.js (Express 4.x)
- **Database:** MySQL (WampServer `soundwave_db`, UTF8mb4)
- **Audio Extraction:** YouTube streaming bridge (`@distube/ytdl-core`, `youtubei.js`, `play-dl`, `yt-search`)
- **Authentication:** JWT (JSON Web Tokens) with `bcryptjs` password hashing
- **Client Targets:** Web browsers, Android Emulator (`10.0.2.2`), Local LAN devices

## Non-Negotiable Engineering Principles
1. **Always Use Parameterized Queries:** Prevent SQL injection by never interpolating user input directly into SQL queries.
2. **Deterministic Stream Error Handling:** Audio streams must always attach error listeners (`.on('error')`) to prevent unhandled stream crashes from taking down the Express process.
3. **Emulator Compatibility:** All responses and URLs must correctly account for Android emulator network routing (`10.0.2.2` vs `localhost`).
4. **Context Isolation:** Agents should execute one task at a time, check deterministic backpressure, update state, and commit atomically.
