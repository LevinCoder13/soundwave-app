const express = require('express');
const router = express.Router();
const favoritesController = require('../controllers/favoritesController');
const { authenticateToken } = require('../middleware/authMiddleware');

// All favorites routes require authentication
router.use(authenticateToken);

router.get('/', favoritesController.getFavorites);
router.post('/', favoritesController.addFavorite);
router.delete('/:songId', favoritesController.removeFavorite);
router.get('/check/:songId', favoritesController.checkFavorite);

module.exports = router;
