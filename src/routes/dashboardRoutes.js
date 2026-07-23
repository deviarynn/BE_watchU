const express = require('express');
const router = express.Router();
const { getDashboardStats, getLatestReviews } = require('../controllers/dashboardController');

router.get('/stats', getDashboardStats);
router.get('/reviews/latest', getLatestReviews);

module.exports = router;