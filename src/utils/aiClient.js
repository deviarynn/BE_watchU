const axios = require('axios');
const db = require('../config/db'); // IMPORT KONEKSI DATABASE SUPABASE
require('dotenv').config();

// Header konfigurasi default untuk menjamin kelancaran komunikasi API
const customHeaders = {
  'Content-Type': 'application/json',
};

const AI_ENGINEER_API_URL = process.env.AI_ENGINEER_API_URL || 'https://ai-engineer-production-7104.up.railway.app';

const AI_RECOMMEND_URL = process.env.AI_BASE_URL || 'https://calm-amazement-production-ebe5.up.railway.app';

const recommendClient = axios.create({
  baseURL: AI_RECOMMEND_URL,
  headers: customHeaders,
  timeout: 10000
});


const enrichWithDatabaseData = async (aiMoviesList) => {
  if (!Array.isArray(aiMoviesList) || aiMoviesList.length === 0) return [];
  
  try {
    const enrichedList = await Promise.all(
      aiMoviesList.map(async (movie) => {
        const targetId = movie.movie_id || movie.id_film;
        
        if (!targetId) return movie;

        const query = `
          SELECT id_film, link_poster, genre_utama 
          FROM movies 
          WHERE CAST(id_film AS VARCHAR) LIKE $1
          LIMIT 1
        `;
        const result = await db.query(query, [`${parseInt(targetId)}%`]);

        if (result.rows.length > 0) {
          const dbData = result.rows[0];
          return {
            ...movie,
            movie_id: parseInt(targetId, 10), 
            id_film: dbData.id_film,           
            poster_url: dbData.link_poster,    
            genre_utama: dbData.genre_utama    
          };
        }
        
        return {
          ...movie,
          id_film: String(targetId),
          poster_url: movie.poster_url || '',
          genre_utama: movie.genre_utama || 'Unknown'
        };
      })
    );
    return enrichedList;
  } catch (err) {
    console.error('Gagal menyelaraskan data recommendation dengan DB:', err.message);
    return aiMoviesList; // Jika DB error, balikkan data mentah AI agar FE tidak crash total
  }
};

/**
 * 2. Helper: Pemetaan Rating Numerik Ke Label Sentimen
 */
function getRatingSentiment(rating) {
  const score = parseFloat(rating);
  if (score >= 1.0 && score <= 4.0) return 'negatif';
  if (score >= 4.5 && score <= 6.5) return 'netral';
  if (score >= 7.0 && score <= 10.0) return 'positif';
  return 'netral';
}

/**
 * 3. Helper: Bobot Tingkatan Sentimen untuk Resolusi Konflik
 */
function sentimentLevel(sentiment) {
  const clean = sentiment ? sentiment.toLowerCase().trim() : 'netral';
  const levels = { negatif: 0, netral: 1, positif: 2 };
  return levels[clean] !== undefined ? levels[clean] : 1;
}

function resolveFinalSentiment(predictedSentiment, confidence, ratingSentiment) {
  const pred = predictedSentiment.toLowerCase().trim();
  const rat = ratingSentiment.toLowerCase().trim();

  if (pred === rat) {
    return { 
      final_sentiment: pred, 
      is_corrected: false, 
      is_conflict: false, 
      correction_reason: "Prediksi model sesuai dengan rating user" 
    };
  }

  if (confidence < 0.6) {
    return { 
      final_sentiment: rat, 
      is_corrected: true, 
      is_conflict: false, 
      correction_reason: "Confidence model rendah, final sentiment dibantu oleh rating user" 
    };
  }

  return { 
    final_sentiment: pred, 
    is_corrected: false, 
    is_conflict: true, 
    correction_reason: `Aplikasi mengutamakan teks ulasan (${pred}) meskipun rating bintang cenderung ${rat}` 
  };
}
/**
 * 5. Core Feature: Analisis Sentimen Ulasan (AI 1)
 */
const analyzeSentiment = async (reviewText, userId, movieId, rating) => {
  try {
    const cleanUrl = AI_ENGINEER_API_URL.endsWith('/') ? AI_ENGINEER_API_URL.slice(0, -1) : AI_ENGINEER_API_URL;

    const response = await axios.post(`${cleanUrl}/predict-sentiment`, {
      user_id: parseInt(userId, 10),
      movie_id: parseInt(movieId, 10),
      review_text: reviewText
    }, { headers: customHeaders, timeout: 5000 });

    const prediction = response.data;
    const ratingSentiment = getRatingSentiment(rating);
    const finalResult = resolveFinalSentiment(prediction.sentiment, prediction.confidence, ratingSentiment);
    const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

    return {
      success: true,
      predicted_sentiment: capitalize(prediction.sentiment),
      rating_sentiment: capitalize(ratingSentiment),
      final_sentiment: capitalize(finalResult.final_sentiment),
      confidence: prediction.confidence,
      is_reliable: prediction.is_reliable ?? (prediction.confidence >= 0.6),
      is_corrected: finalResult.is_corrected,
      is_conflict: finalResult.is_conflict,
      correction_reason: finalResult.correction_reason,
      cleaned_text: prediction.cleaned_text || reviewText,
      review_type: prediction.review_type || 'pendek',
      model_source: prediction.model_source || 'short_review_sentiment_classifier',
      model_name: prediction.model_name || 'movie_review_sentiment_bilstm_attention'
    };
  } catch (error) {
    console.log('Server AI Production Bermasalah, Jalankan Algoritma Fallback Otomatis...');
    const ratingSentiment = getRatingSentiment(rating);
    const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

    return {
      success: false,
      predicted_sentiment: 'Netral',
      rating_sentiment: capitalize(ratingSentiment),
      final_sentiment: capitalize(ratingSentiment),
      confidence: 0.60,
      is_reliable: false,
      is_corrected: true,
      is_conflict: false,
      correction_reason: "Server AI offline, menggunakan sentimen berbasis rating user (Fallback)",
      cleaned_text: reviewText,
      review_type: 'pendek',
      model_source: 'local_fallback',
      model_name: 'fallback_handler'
    };
  }
};

/**
 * 6. Core Feature: Rekomendasi Halaman Beranda (AI 2)
 */
const getHomeRecommendations = async () => {
  try {
    const response = await recommendClient.get('/recommend/home');
    return await enrichWithDatabaseData(response.data);
  } catch (err) {
    console.error('Home recommendation gagal:', err.message);
    return [];
  }
};

/**
 * 7. Core Feature: Rekomendasi Berbasis Kategori Genre (AI 2)
 */
const getGenreRecommendations = async (genre) => {
  try {
    const response = await recommendClient.get(`/recommend/genre/${encodeURIComponent(genre)}`);
    return await enrichWithDatabaseData(response.data);
  } catch (err) {
    console.error('Genre recommendation gagal:', err.message);
    return [];
  }
};

/**
 * 8. Core Feature: Rekomendasi Item Serupa / Kemiripan Film (AI 2)
 */
const getSimilarMovies = async (title) => {
  try {
    const response = await recommendClient.get(`/recommend/movie/${encodeURIComponent(title)}`);
    return await enrichWithDatabaseData(response.data);
  } catch (err) {
    console.error('Similar movie recommendation gagal:', err.message);
    return [];
  }
};

/**
 * 9. Core Feature: Rekomendasi Personal Unik Per User ID (AI 2)
 */
const getPersonalRecommendations = async (userId) => {
  try {
    const response = await recommendClient.get(`/recommend/user/${userId}`);
    return await enrichWithDatabaseData(response.data);
  } catch (err) {
    console.error('Personal recommendation gagal:', err.message);
    return [];
  }
};

/**
 * 10. Core Feature: Mengambil Riwayat Opini Global Teks Tunggal Film
 */
const getMovieReviews = async (title) => {
  try {
    const response = await recommendClient.get(`/reviews/${encodeURIComponent(title)}`);
    return response.data;
  } catch (err) {
    console.error('Movie reviews dari AI gagal:', err.message);
    return [];
  }
};

/**
 * 11. Core Feature: Rangkuman Narasi Ulasan Otomatis NLP (AI 2)
 */
const getReviewsSummary = async (title) => {
  try {
    const response = await recommendClient.get(`/reviews/summary/${encodeURIComponent(title)}`);
    return response.data;
  } catch (error) {
    console.error(`Gagal mengambil summary review untuk film ${title}:`, error.message);
    return { summary: "Gagal memuat ringkasan ulasan otomatis dari AI." };
  }
};

module.exports = {
  analyzeSentiment,
  getHomeRecommendations,
  getGenreRecommendations,
  getSimilarMovies,
  getPersonalRecommendations,
  getMovieReviews,
  getReviewsSummary,
};