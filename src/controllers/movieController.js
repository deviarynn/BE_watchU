const db = require('../config/db');

// 1. Get All Movies + FITUR FILTER KOMPLIT (Termasuk Sentimen 'Semua') + HITUNG JUMLAH REVIEWS
const getAllMovies = async (req, res) => {
  try {
    const { search, genre, sentimen, year, rating, sort_by, order, page, limit } = req.query;
    
    const activePage = page ? parseInt(page) : 1;
    const activeLimit = limit ? parseInt(limit) : 10;
    const offset = (activePage - 1) * activeLimit;

    let queryText = `
      SELECT 
        m.id_film, 
        m.judul_film, 
        m.anggaran,
        m.pendapatan,
        m.keuntungan,
        m.roi,
        m.durasi_menit, 
        m.kelompok_durasi,
        m.skor_rata_rata, 
        m.jumlah_pemberi_skor,
        m.genre_utama, 
        m.genre_asli,
        m.bahasa_asli,
        m.negara_produksi,
        m.tanggal_rilis, 
        m.link_poster, 
        m.popularitas,

        COUNT(r.id_review)::INT AS jumlah_ulasan,

        COALESCE(
          (
            SELECT kategori_sentimen
            FROM reviews rv
            WHERE CAST(rv.id_film AS VARCHAR) = CAST(m.id_film AS VARCHAR)
            GROUP BY kategori_sentimen
            ORDER BY COUNT(*) DESC
            LIMIT 1
          ),
          'Netral'
        ) AS kategori_sentimen

      FROM movies m

      LEFT JOIN reviews r
        ON CAST(m.id_film AS VARCHAR) = CAST(r.id_film AS VARCHAR)

      WHERE 1=1
    `;
    
    let countQueryText = `SELECT COUNT(*) FROM movies WHERE 1=1`;
    
    const queryParams = [];
    let paramIndex = 1;

    // Filter: Search Bar
    if (search) {
      const searchCond = ` AND m.judul_film ILIKE $${paramIndex}`;
      const searchCondCount = ` AND judul_film ILIKE $${paramIndex}`;
      queryText += searchCond;
      countQueryText += searchCondCount;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Filter: Genre
    if (genre) {
      const genreCond = ` AND m.genre_utama = $${paramIndex}`;
      const genreCondCount = ` AND genre_utama = $${paramIndex}`;
      queryText += genreCond;
      countQueryText += genreCondCount;
      queryParams.push(genre);
      paramIndex++;
    }

    //Filter Sentimen Keseluruhan mendukung "positif", "negatif", "netral", dan "semua"
    if (sentimen && sentimen.toLowerCase() !== 'semua') {
      let sentCond = '';
      let sentCondCount = '';
      
      if (sentimen.toLowerCase() === 'positif') {
        sentCond = ` AND m.skor_rata_rata >= 7.0`;
        sentCondCount = ` AND skor_rata_rata >= 7.0`;
      } else if (sentimen.toLowerCase() === 'negatif') {
        sentCond = ` AND m.skor_rata_rata < 5.0`;
        sentCondCount = ` AND skor_rata_rata < 5.0`;
      } else if (sentimen.toLowerCase() === 'netral') {
        sentCond = ` AND m.skor_rata_rata >= 5.0 AND m.skor_rata_rata < 7.0`;
        sentCondCount = ` AND skor_rata_rata >= 5.0 AND skor_rata_rata < 7.0`;
      }
      
      queryText += sentCond;
      countQueryText += sentCondCount;
    }

    // Filter: Tahun Rilis
    if (year) {
      const yearCond = ` AND EXTRACT(YEAR FROM m.tanggal_rilis) = $${paramIndex}`;
      const yearCondCount = ` AND EXTRACT(YEAR FROM tanggal_rilis) = $${paramIndex}`;
      queryText += yearCond;
      countQueryText += yearCondCount;
      queryParams.push(parseInt(year));
      paramIndex++;
    }

    // Filter: Batas Minimal Rating Bintang
    if (rating) {
      const ratingCond = ` AND m.skor_rata_rata >= $${paramIndex}`;
      const ratingCondCount = ` AND skor_rata_rata >= $${paramIndex}`;
      queryText += ratingCond;
      countQueryText += ratingCondCount;
      queryParams.push(parseFloat(rating));
      paramIndex++;
    }

    queryText += ` 
      GROUP BY 
        m.id_film, 
        m.judul_film, 
        m.anggaran,
        m.pendapatan,
        m.keuntungan,
        m.roi,
        m.durasi_menit, 
        m.kelompok_durasi,
        m.skor_rata_rata, 
        m.jumlah_pemberi_skor,
        m.genre_utama, 
        m.genre_asli,
        m.bahasa_asli,
        m.negara_produksi,
        m.tanggal_rilis, 
        m.link_poster, 
        m.popularitas
    `;

    // Fitur Pengurutan Dinamis
    let allowedSortColumns = { popularity: 'm.popularitas', release_date: 'm.tanggal_rilis', rating: 'm.skor_rata_rata' };
    let sortByColumn = allowedSortColumns[sort_by] || 'm.popularitas';
    let sortDirection = order && order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    
    queryText += ` ORDER BY ${sortByColumn} ${sortDirection}`;

    const totalItemsResult = await db.query(countQueryText, queryParams);
    const totalItems = parseInt(totalItemsResult.rows[0].count);

    queryText += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(activeLimit, offset);

    const result = await db.query(queryText, queryParams);
    const totalPages = Math.ceil(totalItems / activeLimit);
    
    res.status(200).json({
      success: true,
      message: 'Films retrieved successfully',
      meta: {
        current_page: activePage,
        per_page: activeLimit,
        total_items: totalItems,
        total_pages: totalPages
      },
      data: result.rows
    });
  } catch (error) {
    console.error("GAGAL GET ALL MOVIES:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 2. Mengambil Detail Film Berdasarkan ID + List Ulasannya + Rating Pengguna
const getMovieById = async (req, res) => {
  let { id_film } = req.params;

 try {
    const idAngka = parseFloat(id_film);
    
    if (isNaN(idAngka)) {
      return res.status(400).json({ success: false, message: 'Format ID Film tidak valid harus berupa angka' });
    }

    const movieQuery = 'SELECT * FROM movies WHERE id_film = $1';
    const movieResult = await db.query(movieQuery, [idAngka]);
    
    if (movieResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Film tidak ditemukan' });
    }

    const currentMovie = movieResult.rows[0];

    const reviewsQuery = `
      SELECT 
        r.id_review, 
        r.ulasan_pengguna, 
        r.kategori_sentimen, 
        r.created_at, 
        u.name,
        rt.rating_pengguna
      FROM reviews r 
      JOIN users u ON r.user_id = u.user_id 
      LEFT JOIN ratings rt ON r.user_id = rt.user_id AND CAST(r.id_film AS VARCHAR) = CAST(rt.id_film AS VARCHAR)
      WHERE CAST(r.id_film AS VARCHAR) = CAST($1 AS VARCHAR)
      ORDER BY r.id_review DESC
    `;
    const reviewsResult = await db.query(reviewsQuery, [id_film]);

    const sentimentStatsQuery = `
      SELECT kategori_sentimen, COUNT(*) as jumlah 
      FROM reviews 
      WHERE CAST(id_film AS VARCHAR) = CAST($1 AS VARCHAR)
      GROUP BY kategori_sentimen
    `;
    const sentimentStatsResult = await db.query(sentimentStatsQuery, [id_film]);

    let totalReview = reviewsResult.rowCount;
    let persentaseSentimen = { positif: 0, netral: 0, negatif: 0 };

    if (totalReview > 0) {
      sentimentStatsResult.rows.forEach(row => {
        const label = row.kategori_sentimen ? row.kategori_sentimen.toLowerCase().trim() : 'netral';
        const hitungPersen = Math.round((parseInt(row.jumlah) / totalReview) * 100);
        if (label === 'positif' || label === 'pos') persentaseSentimen.positif = hitungPersen;
        if (label === 'netral' || label === 'neu') persentaseSentimen.netral = hitungPersen;
        if (label === 'negatif' || label === 'neg') persentaseSentimen.negatif = hitungPersen;
      });
    }

    const recommendationQuery = `
      SELECT id_film, judul_film, link_poster, skor_rata_rata 
      FROM movies 
      WHERE genre_utama = $1 AND id_film != $2 
      ORDER BY popularitas DESC 
      LIMIT 5
    `;
    const recommendationResult = await db.query(recommendationQuery, [currentMovie.genre_utama, id_film]);

    res.status(200).json({
      success: true,
      data: {
        movie: currentMovie,
        reviews: reviewsResult.rows,
        sentimentDistribution: persentaseSentimen,
        recommendations: recommendationResult.rows
      }
    });
  } catch (error) {
    console.error("ERROR GET MOVIE BY ID:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getAllMovies, getMovieById };