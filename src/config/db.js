const { Pool } = require('pg');
require('dotenv').config();

// Menggunakan objek konfigurasi terpisah agar karakter spesial di password aman
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false 
  }
});
// Tes koneksi database saat server pertama kali dinyalakan
pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ Gagal terhubung ke database Supabase:', err.stack);
  }
  console.log('🚀 Yuhuu, kamu berhasil terhubung ke database online Supabase! 🎉');
  release();
});

module.exports = pool;