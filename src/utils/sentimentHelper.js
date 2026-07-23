const db = require('../config/db');

/**
 * Menghitung distribusi persentase sentimen (Positif, Netral, Negatif) dari ulasan film
 * @param {number} idFilm 
 */
const calculateSentimentDistribution = async (idFilm) => {
  try {
    const sentimentStatsQuery = `
      SELECT kategori_sentimen, COUNT(*) as jumlah 
      FROM reviews 
      WHERE id_film = $1 
      GROUP BY kategori_sentimen
    `;
    const result = await db.query(sentimentStatsQuery, [idFilm]);
    
    // Hitung total seluruh ulasan untuk film tersebut
    const totalReview = result.rows.reduce((sum, row) => sum + parseInt(row.jumlah), 0);
    let persentaseSentimen = { positif: 0, netral: 0, negatif: 0 };

    if (totalReview > 0) {
      result.rows.forEach(row => {
        const label = row.kategori_sentimen ? row.kategori_sentimen.toLowerCase() : 'netral';
        const hitungPersen = Math.round((parseInt(row.jumlah) / totalReview) * 100);
        
        if (label === 'positif' || label === 'pos') persentaseSentimen.positif = hitungPersen;
        if (label === 'netral' || label === 'neu') persentaseSentimen.netral = hitungPersen;
        if (label === 'negatif' || label === 'neg') persentaseSentimen.negatif = hitungPersen;
      });
    }

    return persentaseSentimen;
  } catch (error) {
    console.error("❌ Error di sentimentHelper:", error.message);
    throw new Error("Gagal mengalkulasi distribusi persentase sentimen.");
  }
};

module.exports = { calculateSentimentDistribution };