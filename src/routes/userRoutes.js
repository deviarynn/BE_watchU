const express = require('express');
const router = express.Router();
const { checkAndSyncProfile } = require('../controllers/userController');
const { requireAuth } = require('../middlewares/authMiddleware');

router.get('/check-profile', requireAuth, checkAndSyncProfile);

module.exports = router; 
