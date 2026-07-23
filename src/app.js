require('dotenv').config();
const express = require('express');
const cors = require('cors');

const movieRoutes = require('./routes/movieRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const userRoutes = require('./routes/userRoutes');
const watchlistRoutes = require('./routes/watchlistRoutes');
const likeRoutes = require('./routes/likeRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const recommendRoutes = require('./routes/recommendRoutes'); // ← BARU

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/movies', movieRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/recommend', recommendRoutes); 

app.get('/', (req, res) => {
  res.status(200).json({ status: 'Aman Dong!', project: 'Capstone Review Film - Dicoding 2026' });
});

app.listen(PORT, () => {
  console.log(`Server Backend berjalan di port http://localhost:${PORT}`);
});
