const db = require('../config/db');

// A. Get Dashboard Stats (Total Film, Total Ulasan, dsb)
const getDashboardStats = async (req, res) => {
  try {
    const filmCount = await db.query('SELECT COUNT(*) as total FROM movies');
    const reviewCount = await db.query('SELECT COUNT(*) as total FROM reviews');
    
    // Angka dummy akurasi model AI, atau bisa diambil dari kalkulasi metrik jika ada
    const akurasiSentimen = 94.5; 

    res.status(200).json({
      success: true,
      data: {
        total_film: parseInt(filmCount.rows[0].total),
        total_ulasan: parseInt(reviewCount.rows[0].total),
        persentase_akurasi_ai: akurasiSentimen
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// B. Get Latest Reviews (Ulasan Terbaru di Dashboard)
const getLatestReviews = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 2;
    const queryText = `
      SELECT 
        r.id_review, 
        r.ulasan_pengguna, 
        r.kategori_sentimen, 
        r.created_at, 
        m.judul_film, 
        u.name as nama_pengguna,
        rt.rating_pengguna
      FROM reviews r
      JOIN movies m ON CAST(r.id_film AS VARCHAR) = CAST(m.id_film AS VARCHAR)
      JOIN users u ON r.user_id = u.user_id
      LEFT JOIN ratings rt ON r.user_id = rt.user_id AND CAST(r.id_film AS VARCHAR) = CAST(rt.id_film AS VARCHAR)
      ORDER BY r.id_review DESC
      LIMIT $1
    `;

    const result = await db.query(queryText, [limit]);

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error("GAGAL GET LATEST REVIEWS:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getDashboardStats, getLatestReviews };