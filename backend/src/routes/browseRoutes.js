const express = require('express');
const router = express.Router();
const { getFeaturedFeed, getCategories, getLyrics } = require('../controllers/browseController');

// Curated home feed & categories
router.get('/featured', getFeaturedFeed);
router.get('/categories', getCategories);
router.get('/lyrics/:id', getLyrics);

module.exports = router;

