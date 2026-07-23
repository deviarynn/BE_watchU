const express = require('express');
const router = express.Router();
const { getUserReviews, createReview, updateReview, deleteReview } = require('../controllers/reviewController');
const { requireAuth } = require('../middlewares/authMiddleware');

router.get('/me', requireAuth, getUserReviews);

router.post('/', requireAuth, createReview);             
router.put('/:id_review', requireAuth, updateReview);    
router.delete('/:id_review', requireAuth, deleteReview);
module.exports = router;