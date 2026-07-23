const db = require('../config/db');
const { analyzeSentiment } = require('../utils/aiClient');

// MENGAMBIL RIWAYAT REVIEW USER YANG SEDANG LOGIN (Untuk Halaman Profil)
const getUserReviews = async (req, res) => {
  const user_id = req.user.id; 

  try {
    const queryHistory = `
      SELECT 
        r.id_review,
        r.id_film,
        COALESCE(m.judul_film, 'Film ID ' || CAST(r.id_film AS VARCHAR)) AS title,
        COALESCE(m.link_poster, 'https://placehold.co/400x600?text=No+Poster') AS poster_url,
        r.ulasan_pengguna AS review_text,
        r.kategori_sentimen AS sentiment,
        rt.rating_pengguna AS user_rating,
        r.created_at -- 💡 TAMBAHKAN: Ambil data waktu untuk kebutuhan UI Front-End
      FROM reviews r
      LEFT JOIN movies m ON CAST(r.id_film AS VARCHAR) = CAST(m.id_film AS VARCHAR)
      LEFT JOIN ratings rt ON r.user_id = rt.user_id AND CAST(r.id_film AS VARCHAR) = CAST(rt.id_film AS VARCHAR)
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC -- 💡 FIX: Diurutkan berdasarkan waktu pembuatan terbaru!
    `;

    const result = await db.query(queryHistory, [user_id]);

    res.status(200).json({
      success: true,
      message: 'Berhasil mengambil riwayat ulasan user secara real-time.',
      data: result.rows 
    });
  } catch (error) {
    console.error('GAGAL GET USER REVIEWS:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// A. TAMBAH REVIEW (POST)
const createReview = async (req, res) => {
  const { id_film, ulasan_pengguna, rating_pengguna } = req.body;
  const user_id = req.user.id;

  if (!id_film || !ulasan_pengguna || rating_pengguna === undefined) {
    return res.status(400).json({ success: false, message: 'Data film, ulasan, dan rating wajib diisi' });
  }

  const idFilmString = String(id_film).trim();

  try {
    const checkReview = await db.query(
      'SELECT id_review FROM reviews WHERE user_id = $1 AND CAST(id_film AS VARCHAR) = $2',
      [user_id, idFilmString]
    );
    
    if (checkReview.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Kamu sudah pernah memberikan ulasan pada film ini!' });
    }

    const aiResult = await analyzeSentiment(ulasan_pengguna, user_id, idFilmString, rating_pengguna);

    const kategori_sentimen = aiResult.final_sentiment; 
    const ulasan_bersih = aiResult.cleaned_text;

    // Simpan ke database menggunakan string ID
    await db.query(
      `INSERT INTO reviews (user_id, id_film, ulasan_pengguna, ulasan_bersih, kategori_sentimen) 
       VALUES ($1, $2, $3, $4, $5)`,
      [user_id, idFilmString, ulasan_pengguna, ulasan_bersih, kategori_sentimen]
    );

    // Simpan data rating
    const scoreAngka = parseFloat(rating_pengguna);
    await db.query(
      `INSERT INTO ratings (user_id, id_film, rating_pengguna) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (user_id, id_film) DO UPDATE SET rating_pengguna = EXCLUDED.rating_pengguna`,
      [user_id, idFilmString, scoreAngka]
    );

    res.status(201).json({
      success: true,
      message: 'Ulasan berhasil dikirim dan dianalisis oleh AI!',
      data: {
        review_text: ulasan_pengguna,
        rating_pengguna: scoreAngka,
        predicted_sentiment: aiResult.predicted_sentiment,
        rating_sentiment: aiResult.rating_sentiment,
        kategori_sentimen: kategori_sentimen, 
        confidence: aiResult.confidence,
        is_reliable: aiResult.is_reliable,
        is_corrected: aiResult.is_corrected,
        is_conflict: aiResult.is_conflict,
        cleaned_text: ulasan_bersih,
        review_type: aiResult.review_type,
        model_source: aiResult.model_source,
        model_name: aiResult.model_name,
        correction_reason: aiResult.correction_reason
      },
    });
  } catch (error) {
    console.error('GAGAL INSERT REVIEW LENGKAP:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// B. EDIT REVIEW (PUT)
const updateReview = async (req, res) => {
  const { id_review } = req.params;
  const { ulasan_pengguna, rating_pengguna } = req.body;
  const user_id = req.user.id;

  if (!ulasan_pengguna || rating_pengguna === undefined) {
    return res.status(400).json({ success: false, message: 'Ulasan baru dan rating wajib diisi' });
  }

  try {
    const reviewCheck = await db.query(
      'SELECT id_film FROM reviews WHERE id_review = $1 AND user_id = $2',
      [id_review, user_id]
    );
    if (reviewCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Ulasan tidak ditemukan' });
    }

    const idFilmString = String(reviewCheck.rows[0].id_film).trim();

    const aiResult = await analyzeSentiment(ulasan_pengguna, user_id, idFilmString, rating_pengguna);
    const kategori_sentimen = aiResult.final_sentiment;
    const ulasan_bersih = aiResult.cleaned_text;

    await db.query(
      `UPDATE reviews 
       SET ulasan_pengguna = $1, ulasan_bersih = $2, kategori_sentimen = $3 
       WHERE id_review = $4 AND user_id = $5`,
      [ulasan_pengguna, ulasan_bersih, kategori_sentimen, id_review, user_id]
    );

    const scoreAngka = parseFloat(rating_pengguna);
    await db.query(
      `INSERT INTO ratings (user_id, id_film, rating_pengguna) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (user_id, id_film) DO UPDATE SET rating_pengguna = EXCLUDED.rating_pengguna`,
      [user_id, idFilmString, scoreAngka]
    );

    res.status(200).json({
      success: true,
      message: 'Ulasan berhasil diperbarui dan dianalisis ulang oleh AI!',
      data: {
        review_text: ulasan_pengguna,
        rating_pengguna: scoreAngka,
        predicted_sentiment: aiResult.predicted_sentiment,
        rating_sentiment: aiResult.rating_sentiment,
        kategori_sentimen: kategori_sentimen,
        confidence: aiResult.confidence,
        is_reliable: aiResult.is_reliable,
        is_corrected: aiResult.is_corrected,
        is_conflict: aiResult.is_conflict,
        cleaned_text: ulasan_bersih,
        review_type: aiResult.review_type,
        model_source: aiResult.model_source,
        model_name: aiResult.model_name,
        correction_reason: aiResult.correction_reason
      },
    });
  } catch (error) {
    console.error('GAGAL UPDATE REVIEW LENGKAP:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// C. HAPUS REVIEW (DELETE)
const deleteReview = async (req, res) => {
  const { id_review } = req.params;
  const user_id = req.user.id;

  try {
    const reviewCheck = await db.query(
      'SELECT id_film FROM reviews WHERE id_review = $1 AND user_id = $2',
      [id_review, user_id]
    );
    if (reviewCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Ulasan tidak ditemukan atau kamu tidak berhak menghapus ulasan ini' });
    }

    const id_film = reviewCheck.rows[0].id_film;
    await db.query('DELETE FROM reviews WHERE id_review = $1 AND user_id = $2', [id_review, user_id]);
    await db.query('DELETE FROM ratings WHERE user_id = $1 AND id_film = $2', [user_id, id_film]);

    res.status(200).json({ success: true, message: 'Ulasan dan rating berhasil dihapus!' });
  } catch (error) {
    console.error('GAGAL DELETE REVIEW:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getUserReviews, createReview, updateReview, deleteReview };