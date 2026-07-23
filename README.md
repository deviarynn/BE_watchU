# WatchU - Backend API 🎬

Backend API untuk aplikasi platform review film berbasis **Analisis Sentimen Hibrida** dan **Sistem Rekomendasi Personal**. Repositori ini bertindak sebagai integrator utama yang mengolah data relasional platform, mengamankan gerbang otentikasi, serta menjembatani komunikasi data menuju server AI eksternal.

---

## 🛠️ Tech Stack & Fitur Utama

### Tech Stack:
* **Runtime Environment:** Node.js
* **Web Framework:** Express.js
* **Database Relasional:** PostgreSQL (Hosted on Supabase / Deployed via Railway)
* **HTTP Client (AI Integration Bridge):** Axios
* **Authentication:** JSON Web Token (JWT)

### Fitur Utama:
1. **Authentication & Authorization:** Pembatasan rute privat menggunakan middleware `requireAuth` berbasis verifikasi token JWT.
2. **Manajemen Ulasan & Rating (CRUD):** Operasi ulasan lengkap dengan pencegahan ulasan ganda per user pada film yang sama, serta fitur *String Casting SQL* otomatis agar format ID film aman dan konsisten.
3. **Mekanisme Fallback Otomatis:** Jika server AI eksternal bermasalah (*offline*), backend otomatis mengaktifkan modul algoritma lokal berbasis kalkulasi rating agar fungsionalitas web tetap berjalan lancar.

### 🛠️ Dependensi Utama
1. express - Kerangka kerja web server Node.js.

2. pg - Driver PostgreSQL non-blocking untuk koneksi database Supabase.

3. axios - Klien HTTP berbasis janji untuk menembak API Ngrok milik tim AI.

4. jsonwebtoken - Implementasi pembuatan dan verifikasi token akses JWT.

5. dotenv - Modul pemuat variabel lingkungan dari file .env.
---


## ⚙️ Petunjuk Setup Environment

Untuk menjalankan repositori ini, ikuti langkah pembuatan berkas konfigurasi lingkungan kerja berikut:

1. Buat sebuah berkas baru bernama `.env` tepat di *root folder* proyek .
2. Salin blue print konfigurasi di bawah ini ke dalam file `.env` tersebut, kemudian isi nilainya sesuai dengan kredensial lokal sendiri:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Connection (Supabase / PostgreSQL)
DB_USER=your_database_user
DB_HOST=your_database_pooler_host
DB_NAME=your_database_name
DB_PASSWORD=your_secure_database_password
DB_PORT=5432

# Supabase Client API Credentials
SUPABASE_URL=https://your_project_id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_public_jwt_key

# External AI Model Engine Endpoints (Ngrok Private Tunnels)
AI_ENGINEER_API_URL=https://your_sentiment_ai_subdomain.ngrok-free.dev
AI_BASE_URL=https://your_recommendation_ai_subdomain.ngrok-free.dev
---

```
## 📁 Struktur Folder Proyek

```
BACKEND/
├── db/
│   └── schema.sql              # Skema DDL dan rancangan tabel database Supabase
├── src/
│   ├── config/
│   │   └── db.js               # Koneksi basis data PostgreSQL / Supabase
│   ├── controllers/
│   │   ├── dashboardController.js # Pengolah data statistik & tren film terpopuler
│   │   ├── likeController.js      # Logika interaksi menyukai (like/dislike) ulasan
│   │   ├── movieController.js     # Manajemen daftar film, pencarian, dan filtrasi
│   │   ├── reviewController.js    # Logika CRUD ulasan pengguna & penyelarasan sentimen AI
│   │   ├── userController.js      # Manajemen data profil dan autentikasi pengguna
│   │   └── watchlistController.js # Manajemen daftar tontonan (watchlist) pengguna
│   ├── middlewares/
│   │   └── authMiddleware.js   # Middleware validasi JWT token untuk rute terproteksi
│   ├── routes/
│   │   ├── dashboardRoutes.js  # Rute untuk komponen widget statistik dashboard
│   │   ├── likeRoutes.js       # Rute untuk fitur suka/batal suka pada ulasan
│   │   ├── movieRoutes.js      # Rute untuk eksplorasi, pencarian, dan detail film
│   │   ├── recommendRoutes.js  # Rute penghubung ke endpoint rekomendasi sistem AI 2
│   │   ├── reviewRoutes.js     # Rute utama manajemen ulasan terintegrasi analisis AI
│   │   ├── userRoutes.js       # Rute pendaftaran, login, dan profile akun user
│   │   └── watchlistRoutes.js  # Rute operasi data daftar tontonan (watchlist)
│   ├── utils/
│   │   ├── aiClient.js         # Konfigurasi Axios client, Ngrok bypass, & aturan hibrida AI
│   │   ├── recommendationHelper.js # Helper pemroses data rekomendasi film
│   │   └── sentimentHelper.js  # Helper pemroses tambahan manipulasi teks sentimen
│   └── app.js                  # Titik masuk utama aplikasi backend (Entry Point)
```

## 🌐 Deployment
Backend dideploy menggunakan railway
```
https://backend-production-14ff.up.railway.app/
```
## Panduan Memulai (Setup Lokal)
1. Kloning Repositori
```
git clone https://github.com/capstone-project-CC26-PSU158/backend.git
cd backend
```
2. Install Depedensi
```
npm install
```

4. Menjalankan Aplikasi
```
npm run dev
```


## Dokumentasi Endpoint API (Ringkas)
<p>Semua rute ulasan dan rekomendasi membutuhkan header autentikasi: Authorization: Bearer {token_jwt_kamu}.</p>

### 1. Rute Review & Rating (/api/reviews)

```
POST http://localhost:5000/api/reviews      (Mengirim ulasan baru, memicu analisis AI, dan menyimpan rating.)
PUT http://localhost:5000/api/reviews/id_review    (Memperbarui teks ulasan/rating serta kalkulasi ulang sentimen AI.)
DELETE http://localhost:5000/api/reviews/id_review  (Menghapus ulasan beserta rating terkait secara permanen.)
GET http://localhost:5000/api/reviews/me    (Mengambil semua riwayat ulasan milik user yang sedang login (Profil).)
```

<p>Contoh request body</p>

```
{
  "id_film": "19",
  "ulasan_pengguna": "Filmnya tidak bagus, bikin ngantuk di bioskop.",
  "rating_pengguna": 2.0
}
```
<p>Respons Sukses: </p>

```
{
  "success": true,
  "message": "Ulasan berhasil dikirim dan dianalisis oleh AI!",
  "data": {
    "review_text": "Filmnya tidak bagus, bikin ngantuk di bioskop.",
    "rating_pengguna": 2,
    "predicted_sentiment": "Positif",
    "rating_sentiment": "Negatif",
    "kategori_sentimen": "Negatif",
    "confidence": 0.9996,
    "is_reliable": true,
    "is_corrected": true,
    "is_conflict": true,
    "cleaned_text": "filmnya tidak bagus bikin ngantuk di bioskop",
    "review_type": "pendek",
    "model_source": "short_review_sentiment_classifier",
    "model_name": "movie_review_sentiment_bilstm_attention",
    "correction_reason": "Prediksi model dan rating bertentangan secara ekstrem, final sentiment mengikuti rating user"
  }
}
```

### 2. Rute Movie & Pencarian Film (`/api/movies`)
Endpoint ini digunakan untuk mengelola data film, melakukan pencarian, filtrasi tingkat lanjut, serta melihat detail informasi film.

```
GET `http://localhost:5000/api/movies` (Mengambil semua daftar film yang tersedia di database.)
GET `http://localhost:5000/api/movies?genre=Fantasy` (Mengambil daftar film dan memfilternya berdasarkan genre spesifik (contoh: Fantasy).)
GET `http://localhost:5000/api/movies/detail/11` (Mengambil data detail lengkap dari satu film berdasarkan ID Film (contoh: ID Film `11`).)
GET `http://localhost:5000/api/movies?search=Donnie`
    (Mencari film secara spesifik berdasarkan kemiripan judul (contoh: mencari film "Donnie Darko").
GET `http://localhost:5000/api/movies?search=land&genre=Drama&rating=4.0&year=2016&page=1&limit=10`)
    (Fitur pencarian dan filtrasi komplit untuk halaman daftar film (kombinasi kata kunci, genre, rating minimal, tahun rilis, dilengkapi fitur *pagination*).)
```
### 3. Rute Watchlist Film (`/api/watchlist`)
Endpoint ini digunakan untuk mengelola daftar film yang ingin disimpan/ditonton oleh pengguna di masa mendatang.
```
POST `http://localhost:5000/api/watchlist`
    (Menambahkan film baru ke dalam daftar simpanan (*watchlist*) pengguna.)
GET `http://localhost:5000/api/watchlist`
    (Mengambil semua daftar film yang telah disimpan oleh user yang sedang login.)
DELETE `http://localhost:5000/api/watchlist/id_watchlist`
    (Menghapus film dari daftar *watchlist* berdasarkan ID data watchlist spesifik.)
GET `http://localhost:5000/api/watchlist?search=Imitation&genre=Drama&sort=newest&page=1&limit=10`
    (Fitur pencarian dan manipulasi data kompleks di dalam halaman *watchlist* user (pencarian judul, filter genre, pengurutan data terbaru, dan pembatasan halaman/*pagination*).)
```
### 4. Rute Dashboard Admin / Analistik (`/api/dashboard`)
Endpoint khusus untuk menyuplai data statistik, widget visualgrafik, dan rangkuman aktivitas aplikasi.
```
GET `http://localhost:5000/api/dashboard/stats`
    (Mengambil rangkuman data angka untuk widget komponen statistik (seperti total film, jumlah pengguna, total review, persentase sentimen).)
GET `http://localhost:5000/api/dashboard/reviews/latest?limit=2`
    (Mengambil ulasan terbaru yang dikirimkan oleh pengguna terakhir di sistem (dibatasi sebanyak 2 data ulasan).)
GET `http://localhost:5000/api/movies?sort_by=popularity&order=desc&limit=10`
    (Mengambil daftar 10 film terpopuler berdasarkan jumlah rating atau interaksi terbanyak secara menurun (*descending*) untuk ditampilkan pada halaman utama dashboard.)
```


### 5. Rute Rekomendasi AI (/api/recommend)

```
GET http://localhost:5000/api/recommend/home    (Mengambil rekomendasi film untuk halaman beranda utama.)
GET http://localhost:5000/api/recommend/genre/:genre    (Mengambil rekomendasi berdasarkan kategori genre film.)
GET http://localhost:5000/api/recommend/movie/:title  (Menampilkan daftar rekomendasi film yang serupa (similar).)
GET http://localhost:5000/api/recommend/user/:user_id    (Menghasilkan rekomendasi personal unik berbasis preferensi user.)
GET http://localhost:5000/api/recommend/movie-detail-sentiment  (Mendapatkan statistik persentase sentimen dan rangkuman kata kunci film.)
```


