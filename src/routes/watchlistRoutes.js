const express = require('express');
const router = express.Router();
const { addToWatchlist, getMyWatchlist, removeFromWatchlist } = require('../controllers/watchlistController');
const { requireAuth } = require('../middlewares/authMiddleware'); 

router.post('/', requireAuth, addToWatchlist); 
router.get('/', requireAuth, getMyWatchlist);  
router.delete('/:id_film', requireAuth, removeFromWatchlist); 

module.exports = router;