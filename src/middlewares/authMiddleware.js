const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Akses ditolak, token tidak ditemukan' });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      console.error("❌ SUPABASE AUTH ERROR ON SERVER:", error ? error.message : "User tidak ditemukan");
      return res.status(401).json({ error: 'Token tidak valid atau sudah kedaluwarsa' });
    }

    req.user = user; 
    next(); 
  } catch (err) {
    console.error("❌ ERROR AUTH MIDDLEWARE:", err.message); 
    return res.status(500).json({ error: 'Terjadi kesalahan pada sistem keamanan server' });
  }
};

module.exports = { requireAuth };