# LMS_IlhamLesmana

**NEXORA × SMK MARHAS — Learning Management System (LMS)**

> **Pengajar Utama:** Ilham Lesmana  
> **Institusi:** SMK MARHAS Margahayu  
> **Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, Supabase (PostgreSQL)

---

## 🚀 Fitur Utama

1. **Landing Page Interaktif & Halaman Login:**
   - Landing page bergaya *editorial kinetic* dengan efek *parallax scroll* berlapis (Hero, Fitur, Kurikulum, Profil Pengajar, Footer).
   - Halaman Login **Portal Guru** & **Portal Siswa** dengan tema ceria khas SMK MARHAS dan stylesheet terpisah (`landing.css` & `login.css`).

2. **Portal Guru / Admin (10 Modul Lengkap):**
   - **Dashboard Analitik (DealDeck Style):** Statistik real-time siswa, kelas, mata pelajaran, materi, tugas/ujian, dan pengumpulan jawaban.
   - **Manajemen Siswa & Kelas:** Kelola data siswa per kelas, tambah/edit/nonaktifkan akun, dan reset kata sandi.
   - **Mata Pelajaran & Materi Pembelajaran:** Hubungkan mata pelajaran ke beberapa kelas sekaligus; pembuatan materi otomatis menyesuaikan pilihan kelas dari mata pelajaran.
   - **Bank Soal Berbasis Paket Kategori:** Pengelompokan soal ke dalam Paket/Kategori (`Tugas 1`, `Tugas 2`, `Ulangan Harian 1`, `UTS`, `UAS`, atau kustom) untuk pemanggilan 1-klik saat membuat tugas/ujian.
   - **Tugas & Ujian Multi-Kelas:** Targetkan tugas/ujian ke **Semua Kelas Mapel** atau **Beberapa Kelas Pilihan**, lengkap dengan pemanggilan paket soal instan.
   - **Pengumpulan Jawaban & Penilaian:** Pemeriksaan otomatis pilihan ganda/benar-salah serta penilaian manual esai/berkas dan publikasi transkrip nilai.
   - **Pengaturan Website:** Kustomisasi profil pengajar, pengumuman, dan identitas portal secara dinamis.

3. **Portal Siswa:**
   - **Materi Belajar & Progress Tersimpan:** Baca modul, tonton video pembelajaran, dan tandai materi selesai (tersimpan permanen di database & browser).
   - **Tugas & Ujian dengan Proteksi Kelas:** Kerjakan kuis interaktif berwaktu atau unggah tugas; tugas milik kelas lain otomatis terkunci (*View-Only / Locked*).
   - **Transkrip Nilai & Riwayat Pengumpulan:** Pantau nilai yang telah dipublikasikan beserta umpan balik guru.
   - **Pengaturan Profil Mandiri:** Siswa dapat mengganti **Foto Profil** (unggah dari perangkat dengan kompresi otomatis, avatar instan, atau URL) serta mengganti **Kata Sandi** secara mandiri.

---

## 🛠️ Cara Menjalankan Proyek Secara Lokal

1. **Instalasi Dependensi:**
   ```bash
   npm install
   ```

2. **Konfigurasi Environment Variables (`.env`):**
   Buat file `.env` di direktori utama proyek:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Menjalankan Server Development:**
   ```bash
   npm run dev
   ```
   Buka `http://localhost:5173` di browser Anda.
