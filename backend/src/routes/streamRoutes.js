const express = require('express');
const router = express.Router();
const streamController = require('../controllers/streamController');

// Search tracks
router.get('/search', streamController.searchTracks);

// Resolve audio stream URL
router.get('/stream/:videoId', streamController.getStreamUrl);

// Proxy audio stream pipe (fallback)
router.get('/stream/pipe/:videoId', streamController.pipeAudioStream);

module.exports = router;
