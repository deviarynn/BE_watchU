const db = require('../config/db');

/**
 * Mengambil rekomendasi film serupa berdasarkan kesamaan genre utama
 * @param {string} genreUtama 
 * @param {number} idFilmSekarang 
 * @param {number} limit 
 */
const getRecommendationsByGenre = async (genreUtama, idFilmSekarang, limit = 5) => {
  try {
    const recommendationQuery = `
      SELECT id_film AS id, judul_film AS title, link_poster AS poster_url, skor_rata_rata AS rating, genre_utama AS genres 
      FROM movies 
      WHERE genre_utama = $1 AND id_film != $2 
      ORDER BY popularitas DESC 
      LIMIT $3
    `;
    const result = await db.query(recommendationQuery, [genreUtama, idFilmSekarang, limit]);
    return result.rows;
  } catch (error) {
    console.error("Error di Recommendation Helper:", error.message);
    throw new Error("Gagal mengambil data rekomendasi film.");
  }
};

module.exports = { getRecommendationsByGenre };