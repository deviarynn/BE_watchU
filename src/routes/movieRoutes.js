const express = require('express');
const router = express.Router();
const { getAllMovies, getMovieById } = require('../controllers/movieController');

router.get('/', getAllMovies);         
router.get('/detail/:id_film', getMovieById);

module.exports = router;