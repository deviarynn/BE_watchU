const express = require('express');
const router = express.Router();
const {
  getHomeRecommendations,
  getGenreRecommendations,
  getSimilarMovies,
  getPersonalRecommendations,
  getMovieReviews,
  getReviewsSummary,
} = require('../utils/aiClient');

// GET /api/recommend/home
router.get('/home', async (req, res) => {
  const data = await getHomeRecommendations();
  res.json({ success: true, data });
});

// GET /api/recommend/genre/:genre  → /api/recommend/genre/Drama
router.get('/genre/:genre', async (req, res) => {
  const data = await getGenreRecommendations(req.params.genre);
  res.json({ success: true, data });
});

// GET /api/recommend/movie/:title  → /api/recommend/movie/Spirited Away
router.get('/movie/:title', async (req, res) => {
  const data = await getSimilarMovies(req.params.title);
  res.json({ success: true, data });
});

// GET /api/recommend/user/:user_id  → /api/recommend/user/15
router.get('/user/:user_id', async (req, res) => {
  const data = await getPersonalRecommendations(req.params.user_id);
  res.json({ success: true, data });
});

// GET /api/recommend/reviews/:title  → sentimen & review film dari AI
router.get('/reviews/:title', async (req, res) => {
  const data = await getMovieReviews(req.params.title);
  res.json({ success: true, data });
});

//GET /api/recommend/reviews/summary/:title
router.get('/reviews/summary/:title', async (req, res) => {
  try {
    const data = await getReviewsSummary(req.params.title);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/movie-detail-sentiment', async (req, res) => {
  try {
    const data = await getMovieReviews(req.body.title || req.body.judul_film);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
