const { Ytdl, chooseFormat } = require('@distube/ytdl-core');
const yts = require('yt-search');
const { pool } = require('../config/db');

// Instantiate singleton Ytdl instance
const ytdl = new Ytdl();

// YouTube 11-character video ID regex
const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

function isValidVideoId(id) {
  return typeof id === 'string' && YOUTUBE_ID_REGEX.test(id);
}

/**
 * Search tracks using yt-search
 * GET /api/search?q=query
 */
async function searchTracks(req, res) {
  try {
    const query = req.query.q || req.query.query;
    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Search query "q" is required' });
    }

    const searchResults = await yts(query.trim());
    const videos = (searchResults.videos || []).slice(0, 25).map((v) => ({
      id: v.videoId,
      title: v.title,
      artist: v.author ? v.author.name : 'Unknown Artist',
      coverArt: v.thumbnail || v.image,
      durationSeconds: v.seconds || 0,
      timestamp: v.timestamp || '0:00',
    }));

    return res.json({
      query: query.trim(),
      total: videos.length,
      results: videos,
    });
  } catch (err) {
    console.error('[Search Error]:', err.message);
    return res.status(500).json({ error: 'Search failed', details: err.message });
  }
}

/**
 * Resolve direct audio stream URL and cache metadata into MySQL
 * GET /api/stream/:videoId
 */
async function getStreamUrl(req, res) {
  try {
    const { videoId } = req.params;
    if (!videoId) {
      return res.status(400).json({ error: 'videoId parameter is required' });
    }

    if (!isValidVideoId(videoId)) {
      return res.status(400).json({ error: 'Invalid YouTube video ID format' });
    }

    const info = await ytdl.getInfo(videoId);

    // Pick highest quality audio stream
    let format = null;
    try {
      format = chooseFormat(info.formats, {
        quality: 'highestaudio',
        filter: { hasAudio: true, hasVideo: false },
      });
    } catch (e) {
      // Fallback to any format with audio
      const audioFormats = info.formats.filter((f) => f.hasAudio);
      if (audioFormats.length > 0) {
        format = audioFormats[0];
      }
    }

    if (!format || !format.url) {
      return res.status(404).json({ error: 'No playable audio stream format found' });
    }

    const title = info.videoDetails.title || 'Unknown Track';
    const artist = info.videoDetails.author ? info.videoDetails.author.name : 'Unknown Artist';
    const coverArt =
      info.videoDetails.thumbnails && info.videoDetails.thumbnails.length > 0
        ? info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url
        : '';
    const duration = parseInt(info.videoDetails.lengthSeconds, 10) || 0;

    // Cache metadata into MySQL songs_cache table
    try {
      await pool.query(
        `INSERT INTO songs_cache (id, title, artist, cover_art_url, duration_seconds)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           title = VALUES(title),
           artist = VALUES(artist),
           cover_art_url = VALUES(cover_art_url),
           duration_seconds = VALUES(duration_seconds)`,
        [videoId, title, artist, coverArt, duration]
      );
    } catch (dbErr) {
      console.warn('[Cache Warning] Could not save song metadata to MySQL:', dbErr.message);
    }

    return res.json({
      id: videoId,
      streamUrl: format.url,
      title,
      artist,
      coverArt,
      durationSeconds: duration,
      mimeType: format.mimeType,
      bitrate: format.audioBitrate,
    });
  } catch (err) {
    console.error(`[Stream Error videoId=${req.params.videoId}]:`, err.message);
    return res.status(500).json({ error: 'Failed to resolve audio stream', details: err.message });
  }
}

/**
 * Pipe direct audio stream to client (server proxy fallback)
 * GET /api/stream/pipe/:videoId
 */
async function pipeAudioStream(req, res) {
  try {
    const { videoId } = req.params;
    if (!isValidVideoId(videoId)) {
      return res.status(400).json({ error: 'Invalid YouTube video ID format' });
    }

    res.header('Content-Type', 'audio/webm');
    res.header('Accept-Ranges', 'bytes');

    const audioStream = await ytdl.download(videoId, {
      quality: 'highestaudio',
      filter: { hasAudio: true, hasVideo: false },
    });

    audioStream.on('error', (streamErr) => {
      console.error('[Stream Controller Pipe Error]:', streamErr.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Streaming proxy error', details: streamErr.message });
      } else {
        res.end();
      }
    });

    audioStream.pipe(res);
  } catch (err) {
    console.error('[Pipe Error]:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Streaming proxy error', details: err.message });
    }
  }
}

module.exports = {
  searchTracks,
  getStreamUrl,
  pipeAudioStream,
};
