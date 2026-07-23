const db = require('../config/db');

// Memberikan Like, Dislike, atau Membatalkan Reaksi jika diklik ulang (Toggle)
const toggleLikeMovie = async (req, res) => {
  const { id_film, is_like } = req.body; 
  const user_id = req.user.id;
  const idAngka = parseFloat(id_film);

  if (id_film === undefined || is_like === undefined) {
    return res.status(400).json({ success: false, message: 'id_film dan status is_like wajib diisi' });
  }

  try {
    // 1. Cek  apakah user  pernah ngasih reaksi di film ini sebelumnya
    const checkExist = await db.query(
      'SELECT is_like FROM movie_likes WHERE user_id = $1 AND id_film = $2',
      [user_id, idAngka]
    );

    // 2. LOGIKA BATAL: Jika data sudah ada DAN nilainya sama dengan yang dikirim user, artinya USER BATAL/KEPENCET!
    if (checkExist.rows.length > 0 && checkExist.rows[0].is_like === is_like) {
      await db.query(
        'DELETE FROM movie_likes WHERE user_id = $1 AND id_film = $2',
        [user_id, idAngka]
      );
      
      return res.status(200).json({
        success: true,
        reaksiAktif: null, 
        message: 'Reaksi kamu berhasil dihapus (Batal)!'
      });
    }

    await db.query(
      `INSERT INTO movie_likes (user_id, id_film, is_like) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (user_id, id_film) 
       DO UPDATE SET is_like = EXCLUDED.is_like`,
      [user_id, idAngka, is_like]
    );

    res.status(200).json({ 
      success: true, 
      reaksiAktif: is_like ? 'like' : 'dislike', 
      message: is_like ? 'Kamu menyukai film ini! 👍' : 'Kamu tidak menyukai film ini! 👎' 
    });

  } catch (error) {
    console.error("❌ ERROR TOGGLE LIKE:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { toggleLikeMovie };