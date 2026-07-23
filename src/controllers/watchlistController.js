const db = require('../config/db'); 

const addToWatchlist = async (req, res) => {
  const { id_film } = req.body;
  const user_id = req.user.id; 
  try {
    await db.query(
      'INSERT INTO watchlists (user_id, id_film) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [user_id, parseFloat(id_film)]
    );
    res.status(201).json({ success: true, message: 'Film berhasil disimpan ke daftar tonton nanti!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getMyWatchlist = async (req, res) => {
  const user_id = req.user.id;
  const { search, genre, sort, page = 1, limit = 10 } = req.query;
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  try {
    let queryText = `
      SELECT w.id, m.id_film, m.judul_film, m.link_poster, m.skor_rata_rata, m.genre_utama, w.created_at as added_at
      FROM watchlists w JOIN movies m ON w.id_film = m.id_film
      WHERE w.user_id = $1
    `;
    let countText = `SELECT COUNT(*) FROM watchlists w JOIN movies m ON w.id_film = m.id_film WHERE w.user_id = $1`;
    let queryParams = [user_id];
    let paramIndex = 2;

    if (search) {
      queryText += ` AND m.judul_film ILIKE $${paramIndex}`;
      countText += ` AND m.judul_film ILIKE $${paramIndex}`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (genre) {
      queryText += ` AND m.genre_utama = $${paramIndex}`;
      countText += ` AND m.genre_utama = $${paramIndex}`;
      queryParams.push(genre);
      paramIndex++;
    }

    // Urutan berdasarkan baru ditambahkan
    let direction = sort && sort.toLowerCase() === 'oldest' ? 'ASC' : 'DESC';
    queryText += ` ORDER BY w.id ${direction}`;

    // Hitung Paginasi
    const countResult = await db.query(countText, queryParams);
    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limitNum);

    queryText += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limitNum, offset);

    const result = await db.query(queryText, queryParams);

    res.status(200).json({
      status: "success",
      message: "Watchlist retrieved successfully",
      pagination: { current_page: pageNum, total_pages: totalPages, total_items: totalItems },
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// C. FITUR BARU: Menghapus film dari daftar tonton nanti
const removeFromWatchlist = async (req, res) => {
  const { id_film } = req.params;
  const user_id = req.user.id;
  try {
    const result = await db.query(
      'DELETE FROM watchlists WHERE user_id = $1 AND id_film = $2',
      [user_id, parseFloat(id_film)]
    );
    
    res.status(200).json({ success: true, message: 'Film berhasil dihapus dari daftar tonton nanti!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { addToWatchlist, getMyWatchlist, removeFromWatchlist };