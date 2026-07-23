
CREATE TABLE public.users (
  user_id character varying NOT NULL,
  name character varying NOT NULL,
  email character varying UNIQUE,
  password character varying,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_pkey PRIMARY KEY (user_id)
);
CREATE TABLE public.reviews (
  id_review integer NOT NULL DEFAULT nextval('reviews_id_review_seq'::regclass),
  user_id character varying,
  id_film numeric,
  ulasan_pengguna text NOT NULL,
  ulasan_bersih text,
  kategori_sentimen character varying,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT reviews_pkey PRIMARY KEY (id_review),
  CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.ratings (
  id_rating integer NOT NULL DEFAULT nextval('ratings_id_rating_seq'::regclass),
  user_id character varying,
  id_film numeric,
  rating_pengguna numeric,
  CONSTRAINT ratings_pkey PRIMARY KEY (id_rating),
  CONSTRAINT ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.movies (
  id_film numeric NOT NULL,
  judul_film character varying NOT NULL,
  anggaran numeric,
  bahasa_asli character varying,
  ringkasan_film text,
  popularitas numeric,
  negara_produksi character varying,
  tanggal_rilis date,
  pendapatan numeric,
  durasi_menit numeric,
  skor_rata_rata double precision,
  jumlah_pemberi_skor integer,
  link_poster character varying,
  genre_utama character varying,
  keuntungan numeric,
  roi double precision,
  kelompok_durasi character varying,
  genre_asli character varying,
  fitur_konten_rekomendasi text,
  CONSTRAINT movies_pkey PRIMARY KEY (id_film)
);
CREATE TABLE public.watchlists (
  id integer NOT NULL DEFAULT nextval('watchlists_id_seq'::regclass),
  user_id character varying,
  id_film integer,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT watchlists_pkey PRIMARY KEY (id),
  CONSTRAINT watchlists_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id),
  CONSTRAINT watchlists_id_film_fkey FOREIGN KEY (id_film) REFERENCES public.movies(id_film)
);
CREATE TABLE public.movie_likes (
  id_like integer NOT NULL DEFAULT nextval('movie_likes_id_like_seq'::regclass),
  user_id character varying,
  id_film numeric NOT NULL,
  is_like boolean NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT movie_likes_pkey PRIMARY KEY (id_like),
  CONSTRAINT movie_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);