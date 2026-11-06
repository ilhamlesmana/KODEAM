import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  BarChart3,
  Award,
  ArrowRight,
  FileText,
  Clock,
  ShieldCheck,
  GraduationCap,
  Layers,
  School,
  Cpu,
  Terminal,
  Compass,
  Play,
  ArrowUpRight,
  Check
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useData } from '../context/DataContext';
import '../styles/landing.css';

export const LandingPage: React.FC = () => {
  const { siteSettings, subjects, classes, students, materials, assignments } = useData();
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const scopeRef = useRef<HTMLDivElement | null>(null);

  // Smooth Scroll Parallax Listener (60fps rAF)
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // IntersectionObserver untuk memicu animasi reveal setiap kali elemen bergulir ke layar
  useEffect(() => {
    const rootEl = scopeRef.current;
    if (!rootEl) return;

    const elements = rootEl.querySelectorAll('.reveal-item');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-inview');
          } else if (entry.boundingClientRect.top > 0) {
            // Reset saat digulir kembali ke atas agar efek hidup setiap kali di-scroll
            entry.target.classList.remove('is-inview');
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [subjects.length, classes.length]);

  // Subtle Mouse Parallax di area Hero
  const handleHeroMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  // Helper kalkulasi offset vertikal parallax
  const parallaxOffset = (speed: number, maxLimit = 180) => {
    const raw = scrollY * speed;
    return Math.max(-maxLimit, Math.min(maxLimit, raw));
  };

  return (
    <div ref={scopeRef} className="min-h-screen nexora-landing-scope nexora-blueprint-bg flex flex-col">
      <Navbar />

      {/* ====================================================================
          1. HERO SECTION — MULTI-LAYER PARALLAX STAGE
         ==================================================================== */}
      <section
        id="beranda"
        onMouseMove={handleHeroMouseMove}
        className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden"
      >
        {/* Parallax Background Geometric Shapes */}
        <div
          style={{
            transform: `translate3d(${mousePos.x * -25}px, ${parallaxOffset(0.22)}px, 0) rotate(${scrollY * 0.03}deg)`,
          }}
          className="parallax-layer hidden lg:block absolute top-28 right-[8%] w-28 h-28 rounded-3xl bg-yellow-300 border-2 border-slate-900 shadow-[6px_6px_0_0_#0f172a] pointer-events-none z-0"
        />
        <div
          style={{
            transform: `translate3d(${mousePos.x * 20}px, ${parallaxOffset(-0.18)}px, 0)`,
          }}
          className="parallax-layer hidden lg:block absolute bottom-16 left-[5%] w-20 h-20 rounded-full bg-emerald-300 border-2 border-slate-900 shadow-[5px_5px_0_0_#0f172a] pointer-events-none z-0"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            {/* Left Column: Editorial Typography & CTAs (7 Cols) */}
            <div
              style={{ transform: `translate3d(0, ${parallaxOffset(-0.06, 60)}px, 0)` }}
              className="lg:col-span-7 space-y-6"
            >
              {/* Top Sticker Badge */}
              <div className="inline-flex flex-wrap items-center gap-2">
                <span className="nexora-tag-pill bg-yellow-300 text-slate-900">
                  <School className="w-3.5 h-3.5" />
                  <span>E-LEARNING RESMI SMK MARHAS</span>
                </span>
                <span className="nexora-tag-pill bg-white text-blue-700">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{siteSettings.site_name || 'NEXORA'} v2.5</span>
                </span>
              </div>

              {/* Bold Editorial Headline */}
              <h1 className="font-display text-4xl sm:text-6xl xl:text-[4.25rem] font-extrabold tracking-tight text-slate-900 leading-[1.06]">
                Ruang Belajar Vokasi{' '}
                <span className="inline-block px-3 py-0.5 bg-blue-600 text-white border-2 border-slate-900 shadow-[5px_5px_0_0_#0f172a] rounded-2xl -rotate-1">
                  Lebih Hidup
                </span>{' '}
                &amp; Terstruktur.
              </h1>

              {/* Lead Paragraph */}
              <p className="text-base sm:text-lg text-slate-700 font-medium max-w-2xl leading-relaxed">
                Dirancang khusus untuk ekosistem akademik <strong>SMK MARHAS</strong>. Pelajari modul praktikum interaktif, kerjakan ujian berwaktu otomatis, dan pantau perkembangan nilai kompetensi langsung dari satu meja belajar digital.
              </p>

              {/* Tactile Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Link
                  to="/login-siswa"
                  className="nexora-btn-yellow px-7 py-4 text-base flex items-center justify-center gap-2.5 group"
                >
                  <GraduationCap className="w-5 h-5" />
                  <span>Masuk Portal Siswa</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/login-admin"
                  className="nexora-btn-primary px-7 py-4 text-base flex items-center justify-center gap-2"
                >
                  <span>Portal Pengajar</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>

                <a
                  href="#mata-pelajaran"
                  className="nexora-btn-secondary px-6 py-4 text-sm flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>Lihat Kurikulum</span>
                </a>
              </div>

              {/* Live Metrics Strip */}
              <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="bg-white border-2 border-slate-900 shadow-[0_4px_0_0_#0f172a] rounded-2xl p-3.5">
                  <p className="font-display text-2xl sm:text-3xl font-extrabold text-blue-600">
                    {classes.length}
                  </p>
                  <p className="text-xs font-extrabold text-slate-700 mt-0.5">Kelas Terdaftar</p>
                </div>

                <div className="bg-white border-2 border-slate-900 shadow-[0_4px_0_0_#0f172a] rounded-2xl p-3.5">
                  <p className="font-display text-2xl sm:text-3xl font-extrabold text-emerald-600">
                    {subjects.length}
                  </p>
                  <p className="text-xs font-extrabold text-slate-700 mt-0.5">Mata Pelajaran</p>
                </div>

                <div className="bg-white border-2 border-slate-900 shadow-[0_4px_0_0_#0f172a] rounded-2xl p-3.5">
                  <p className="font-display text-2xl sm:text-3xl font-extrabold text-amber-500">
                    {materials.length}+
                  </p>
                  <p className="text-xs font-extrabold text-slate-700 mt-0.5">Modul &amp; Bab</p>
                </div>

                <div className="bg-white border-2 border-slate-900 shadow-[0_4px_0_0_#0f172a] rounded-2xl p-3.5">
                  <p className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {students.length}+
                  </p>
                  <p className="text-xs font-extrabold text-slate-700 mt-0.5">Siswa Aktif</p>
                </div>
              </div>
            </div>

            {/* Right Column: Multi-Depth Parallax Interactive Stage (5 Cols) */}
            <div className="lg:col-span-5 relative min-h-[430px] flex items-center justify-center">
              {/* Layer 1 (Back Card): Blueprint Offset Frame */}
              <div
                style={{
                  transform: `translate3d(${mousePos.x * -18}px, ${parallaxOffset(0.14, 90)}px, 0) rotate(3deg)`,
                }}
                className="parallax-layer absolute inset-4 rounded-3xl bg-blue-600 border-2 border-slate-900 shadow-[8px_8px_0_0_#0f172a]"
              />

              {/* Layer 2 (Midground): Main Interactive LMS Window Mockup */}
              <div
                style={{
                  transform: `translate3d(${mousePos.x * 12}px, ${parallaxOffset(-0.08, 70)}px, 0)`,
                }}
                className="parallax-layer relative z-10 w-full bg-white border-2 border-slate-900 shadow-[10px_10px_0_0_#0f172a] rounded-3xl overflow-hidden"
              >
                {/* Browser / Window Top Bar */}
                <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b-2 border-slate-900">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-400 border border-slate-950"></span>
                    <span className="w-3 h-3 rounded-full bg-yellow-400 border border-slate-950"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-400 border border-slate-950"></span>
                    <span className="ml-2 font-mono text-[11px] font-bold text-slate-300">
                      nexora.smkmarhas.sch.id/ruang-belajar
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-400 text-slate-900 font-mono text-[10px] font-extrabold">
                    LIVE
                  </span>
                </div>

                {/* Window Content: Live Preview of Student Activity */}
                <div className="p-5 sm:p-6 space-y-4 bg-[#faf8f5]">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
                        Sesi Ujian &amp; Praktikum Aktif
                      </span>
                      <h3 className="font-display text-lg font-extrabold text-slate-900">
                        {subjects[0]?.name || 'Rekayasa Perangkat Lunak & Sains'}
                      </h3>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-amber-300 border-2 border-slate-900 font-mono text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>24:15</span>
                    </div>
                  </div>

                  {/* Interactive Question Card Preview */}
                  <div className="p-4 rounded-2xl bg-white border-2 border-slate-900 space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-slate-900">
                        Soal #01 &bull; Pilihan Ganda
                      </span>
                      <span className="text-emerald-700 font-extrabold">+10 Poin Otomatis</span>
                    </div>
                    <p className="text-xs font-extrabold text-slate-900 leading-snug">
                      Komponen utama dalam arsitektur aplikasi modern yang bertugas mengelola otorisasi data siswa secara aman adalah...
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="p-2.5 rounded-xl bg-emerald-300 border-2 border-slate-900 text-xs font-extrabold text-slate-900 flex items-center justify-between">
                        <span>A. Row Level Security (RLS) PostgreSQL</span>
                        <Check className="w-4 h-4 text-slate-900" />
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-600">
                        <span>B. Local Static Stylesheet</span>
                      </div>
                    </div>
                  </div>

                  {/* Mini Progress Footer */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-yellow-300 border-2 border-slate-900 flex items-center justify-center font-extrabold text-xs">
                        98
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-slate-900">Rata-Rata Ketuntasan</p>
                        <p className="text-[10px] font-semibold text-slate-500">Koreksi Instan Tanpa Menunggu</p>
                      </div>
                    </div>
                    <Link
                      to="/login-siswa"
                      className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-blue-700 transition-colors"
                    >
                      Coba Sekarang &rarr;
                    </Link>
                  </div>
                </div>
              </div>

              {/* Layer 3 (Foreground Floating Sticker Top-Left): Moves Faster on Scroll */}
              <div
                style={{
                  transform: `translate3d(${mousePos.x * 26}px, ${parallaxOffset(-0.22, 110)}px, 0) rotate(-3deg)`,
                }}
                className="parallax-layer hidden sm:flex absolute -top-6 -left-6 z-20 items-center gap-3 px-4 py-3 rounded-2xl bg-yellow-300 border-2 border-slate-900 shadow-[5px_5px_0_0_#0f172a]"
              >
                <div className="w-9 h-9 rounded-xl bg-white border-2 border-slate-900 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-slate-900" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-900">Vokasi &amp; Praktikum</p>
                  <p className="text-[10px] font-bold text-slate-800">SMK MARHAS Margahayu</p>
                </div>
              </div>

              {/* Layer 4 (Foreground Floating Sticker Bottom-Right): Moves Opposite on Scroll */}
              <div
                style={{
                  transform: `translate3d(${mousePos.x * -22}px, ${parallaxOffset(0.18, 95)}px, 0) rotate(2deg)`,
                }}
                className="parallax-layer hidden sm:flex absolute -bottom-6 -right-4 z-20 items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-300 border-2 border-slate-900 shadow-[5px_5px_0_0_#0f172a]"
              >
                <div className="w-9 h-9 rounded-xl bg-white border-2 border-slate-900 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-900">Auto-Grading Aktif</p>
                  <p className="text-[10px] font-bold text-slate-800">{assignments.length} Tugas &amp; Kuis Siap Kerjakan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          2. KINETIC PARALLAX MARQUEE STRIP
         ==================================================================== */}
      <div className="border-y-2 border-slate-900 bg-yellow-300 py-3.5 overflow-hidden select-none relative z-20">
        <div
          style={{ transform: `translate3d(${-scrollY * 0.15}px, 0, 0)` }}
          className="nexora-marquee-track flex items-center gap-8 font-display text-sm sm:text-base font-extrabold text-slate-900 uppercase tracking-wider"
        >
          {[1, 2].map((loop) => (
            <React.Fragment key={loop}>
              <span className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900"></span>
                SMK MARHAS MARGAHAYU
              </span>
              <span className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                MODUL PEMBELAJARAN INTERAKTIF
              </span>
              <span className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900"></span>
                UJIAN ONLINE BERWAKTU OTOMATIS
              </span>
              <span className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                REKAP NILAI &amp; RAPOR TRANSPARAN
              </span>
              <span className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900"></span>
                UNGGUL &bull; CERDAS &bull; BERKARAKTER
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ====================================================================
          3. ASYMMETRIC BENTO & PARALLAX STORYTELLING ("ALUR BELAJAR")
         ==================================================================== */}
      <section id="tentang" className="py-24 lg:py-32 relative overflow-hidden">
        {/* Background Parallax Watermark Text */}
        <div
          style={{ transform: `translate3d(${parallaxOffset(-0.15, 220)}px, 0, 0)` }}
          className="parallax-layer pointer-events-none select-none absolute top-12 left-0 font-display text-[6rem] sm:text-[9rem] font-extrabold text-slate-900/[0.035] whitespace-nowrap leading-none"
        >
          SMK MARHAS DIGITAL ECOSYSTEM &bull; NEXORA LMS
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <div className="reveal-item reveal-up max-w-3xl mb-16">
            <span className="nexora-tag-pill bg-emerald-300 text-slate-900 mb-4">
              <Compass className="w-3.5 h-3.5" />
              <span>ARSITEKTUR PEMBELAJARAN MODERN</span>
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
              Bukan Sekadar Web Statis. <br />
              <span className="text-blue-600">Dirancang Hidup untuk Guru &amp; Siswa.</span>
            </h2>
            <p className="mt-4 text-slate-700 text-base sm:text-lg font-medium leading-relaxed">
              Setiap komponen di dalam {siteSettings.site_name} terhubung langsung dari meja pengajar ke layar siswa—mulai dari distribusi materi bab, bank soal, hingga analitik nilai.
            </p>
          </div>

          {/* Asymmetric Bento Grid with Scroll-Reveal & Parallax Displacements */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-stretch">
            {/* Bento Card 1 (7 Cols): Modul Digital & Video Praktikum */}
            <div className="lg:col-span-7 reveal-item reveal-left stagger-1 nexora-card-tactile p-7 sm:p-9 flex flex-col justify-between bg-white relative overflow-hidden">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 border-2 border-slate-900 shadow-[4px_4px_0_0_#0f172a] flex items-center justify-center text-white shrink-0">
                  <BookOpen className="w-7 h-7" />
                </div>
                <span className="font-mono text-xs font-extrabold px-3 py-1 rounded-full bg-blue-100 border-2 border-slate-900 text-slate-900">
                  01 / MATERI &amp; MODUL
                </span>
              </div>

              <div>
                <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">
                  Modul Bab Interaktif, PDF &amp; Video Praktikum
                </h3>
                <p className="text-slate-600 text-sm sm:text-base font-medium leading-relaxed mb-6">
                  Materi pembelajaran disusun runtut per pertemuan. Siswa dapat membaca artikel terformat, mengunduh e-book PDF, dan menonton video demonstrasi langsung tanpa berpindah aplikasi.
                </p>
              </div>

              {/* Miniature Interactive Visual Preview inside Bento */}
              <div className="p-4 rounded-2xl bg-[#faf8f5] border-2 border-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-300 border-2 border-slate-900 flex items-center justify-center font-mono font-extrabold text-xs">
                    #01
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-900">
                      {materials[0]?.title || 'Bab 1: Pengenalan Konsep & Praktikum Dasar'}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-500">
                      Dilengkapi Modul PDF &amp; Video Pembelajaran
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1.5 rounded-xl bg-emerald-300 border-2 border-slate-900 text-xs font-extrabold text-slate-900 flex items-center gap-1.5 shrink-0">
                  <Play className="w-3.5 h-3.5 fill-slate-900" />
                  <span>Siap Diakses</span>
                </span>
              </div>
            </div>

            {/* Bento Card 2 (5 Cols): Evaluasi & Timer Otomatis */}
            <div
              style={{ transform: `translate3d(0, ${parallaxOffset(-0.04, 35)}px, 0)` }}
              className="lg:col-span-5 reveal-item reveal-right stagger-2 nexora-card-dark p-7 sm:p-9 flex flex-col justify-between relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-yellow-400 border-2 border-slate-900 flex items-center justify-center text-slate-900 shrink-0">
                  <BrainCircuit className="w-7 h-7" />
                </div>
                <span className="font-mono text-xs font-extrabold px-3 py-1 rounded-full bg-slate-800 border border-slate-600 text-yellow-300">
                  02 / KUIS &amp; UJIAN
                </span>
              </div>

              <div>
                <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-white mb-3">
                  Ujian Berwaktu &amp; Koreksi Skor Instan
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-6 font-medium">
                  Mendukung soal Pilihan Ganda, Benar/Salah, Isian Singkat, hingga Esai. Dilengkapi hitung mundur otomatis dan kalkulasi nilai seketika saat siswa mengirimkan lembar jawaban.
                </p>
              </div>

              {/* Miniature Quiz Pill Stack */}
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Pilihan Ganda &amp; Benar-Salah
                  </span>
                  <span className="font-mono font-bold text-emerald-400">Auto-Score</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                    Isian Singkat &amp; Uraian Esai
                  </span>
                  <span className="font-mono font-bold text-yellow-300">Review Guru</span>
                </div>
              </div>
            </div>

            {/* Bento Card 3 (4 Cols): Pengumpulan Tugas */}
            <div className="lg:col-span-4 reveal-item reveal-up stagger-1 nexora-card-tactile p-7 bg-yellow-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-900 shadow-[3px_3px_0_0_#0f172a] flex items-center justify-center text-slate-900">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-full bg-white border-2 border-slate-900">
                    03 / TUGAS
                  </span>
                </div>
                <h3 className="font-display text-xl font-extrabold text-slate-900 mb-2">
                  Portofolio &amp; Lembar Kerja Mandiri
                </h3>
                <p className="text-slate-800 text-xs sm:text-sm font-semibold leading-relaxed">
                  Kumpulkan tautan dokumen laporan praktikum, PDF, atau catatan pengerjaan langsung ke meja koreksi guru.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t-2 border-slate-900/20 flex items-center justify-between text-xs font-extrabold text-slate-900">
                <span>Status Pengumpulan</span>
                <span className="px-2.5 py-1 rounded-lg bg-white border-2 border-slate-900">Tercatat Otomatis</span>
              </div>
            </div>

            {/* Bento Card 4 (4 Cols): Rapor & Analitik */}
            <div className="lg:col-span-4 reveal-item reveal-up stagger-2 nexora-card-tactile p-7 bg-white flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-300 border-2 border-slate-900 shadow-[3px_3px_0_0_#0f172a] flex items-center justify-center text-slate-900">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 border-2 border-slate-900">
                    04 / ANALITIK
                  </span>
                </div>
                <h3 className="font-display text-xl font-extrabold text-slate-900 mb-2">
                  Transparansi Rapor &amp; Umpan Balik
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed">
                  Setiap nilai disertai ulasan dan catatan pembimbingan dari guru agar siswa memahami bagian yang perlu ditingkatkan.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t-2 border-slate-100 flex items-center gap-2">
                <div className="flex-1 h-3 rounded-full bg-slate-100 border border-slate-900 overflow-hidden">
                  <div className="h-full w-4/5 bg-emerald-400"></div>
                </div>
                <span className="font-mono text-xs font-extrabold text-slate-900">88.5 Avg</span>
              </div>
            </div>

            {/* Bento Card 5 (4 Cols): Manajemen Multikelas */}
            <div className="lg:col-span-4 reveal-item reveal-up stagger-3 nexora-card-tactile p-7 bg-blue-50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-900 shadow-[3px_3px_0_0_#0f172a] flex items-center justify-center text-blue-600">
                    <Layers className="w-6 h-6" />
                  </div>
                  <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-full bg-white border-2 border-slate-900">
                    05 / MULTIKELAS
                  </span>
                </div>
                <h3 className="font-display text-xl font-extrabold text-slate-900 mb-2">
                  Distribusi Materi Spesifik Per Kelas
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed">
                  Mata pelajaran dan ujian dapat ditautkan khusus ke kelas tertentu sehingga materi tidak tercampur antar tingkat.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t-2 border-blue-200 flex flex-wrap gap-1.5">
                {classes.slice(0, 3).map((c) => (
                  <span
                    key={c.id}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-900 text-[11px] font-extrabold text-slate-900"
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          4. PARALLAX SUBJECTS CATALOG ("MATA PELAJARAN")
         ==================================================================== */}
      <section
        id="mata-pelajaran"
        className="py-24 lg:py-32 bg-[#0f172a] text-white border-y-2 border-slate-900 relative overflow-hidden"
      >
        {/* Parallax Floating Grid Orbs in Dark Section */}
        <div
          style={{ transform: `translate3d(0, ${parallaxOffset(0.16, 150)}px, 0)` }}
          className="parallax-layer absolute top-16 right-10 w-72 h-72 rounded-full bg-blue-600/20 blur-3xl pointer-events-none"
        />
        <div
          style={{ transform: `translate3d(0, ${parallaxOffset(-0.14, 150)}px, 0)` }}
          className="parallax-layer absolute bottom-10 left-10 w-80 h-80 rounded-full bg-yellow-400/10 blur-3xl pointer-events-none"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="reveal-item reveal-up flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
            <div>
              <span className="nexora-tag-pill bg-yellow-300 text-slate-900 mb-4">
                <Terminal className="w-3.5 h-3.5" />
                <span>KATALOG KURIKULUM AKTIF</span>
              </span>
              <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                Mata Pelajaran &amp; Kompetensi
              </h2>
              <p className="text-slate-300 mt-3 text-base max-w-xl font-medium">
                Setiap mata pelajaran dikelola langsung oleh guru pengampu lengkap dengan modul bacaan, latihan soal, dan ujian evaluasi.
              </p>
            </div>

            <Link
              to="/login-siswa"
              className="nexora-btn-yellow px-6 py-3.5 text-xs sm:text-sm inline-flex items-center gap-2 self-start md:self-auto"
            >
              <span>Masuk untuk Mulai Belajar</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {subjects.length === 0 ? (
              <div className="col-span-full p-14 text-center rounded-3xl border-2 border-dashed border-slate-700 bg-slate-900/60">
                <BookOpen className="w-12 h-12 text-yellow-300 mx-auto mb-3" />
                <p className="font-display text-xl font-extrabold text-white">Belum Ada Mata Pelajaran</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Mata pelajaran yang ditambahkan oleh guru melalui dashboard admin akan otomatis tampil di katalog ini.
                </p>
              </div>
            ) : (
              subjects.map((sub, idx) => {
                const staggerClass = `stagger-${(idx % 3) + 1}`;
                const linkedClasses = classes.filter((c) => (sub.class_ids || []).includes(c.id));

                return (
                  <div
                    key={sub.id}
                    className={`reveal-item reveal-scale ${staggerClass} bg-white text-slate-900 rounded-3xl border-2 border-slate-900 shadow-[0_8px_0_0_#3b82f6] hover:-translate-y-2 transition-all duration-300 overflow-hidden flex flex-col justify-between group`}
                  >
                    <div>
                      {/* Cover Image with Subtle Scroll Parallax */}
                      <div className="h-48 w-full relative overflow-hidden bg-slate-900 border-b-2 border-slate-900">
                        <img
                          src={
                            sub.cover_image_url ||
                            'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=800'
                          }
                          alt={sub.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />

                        <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                          <span className="px-3 py-1 rounded-xl bg-yellow-300 border-2 border-slate-900 font-mono text-xs font-extrabold text-slate-900 shadow-[2px_2px_0_0_#0f172a]">
                            {sub.code}
                          </span>
                        </div>

                        <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-white">
                          <span className="font-mono text-xs font-bold text-yellow-300">
                            MAPEL #{String(idx + 1).padStart(2, '0')}
                          </span>
                          <span className="text-[11px] font-bold bg-slate-900/80 px-2.5 py-0.5 rounded-full border border-white/20">
                            {linkedClasses.length > 0 ? `${linkedClasses.length} Kelas` : 'Semua Kelas'}
                          </span>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-6">
                        <h3 className="font-display text-xl font-extrabold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                          {sub.name}
                        </h3>
                        <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed line-clamp-2 mb-4">
                          {sub.description || 'Materi kurikulum terstruktur dilengkapi latihan evaluasi berkala.'}
                        </p>

                        {/* Linked Class Pills */}
                        {linkedClasses.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {linkedClasses.slice(0, 4).map((cls) => (
                              <span
                                key={cls.id}
                                className="px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-300 text-[10px] font-extrabold text-slate-700"
                              >
                                {cls.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="px-6 py-4 bg-slate-50 border-t-2 border-slate-900 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700">
                        <GraduationCap className="w-4 h-4 text-blue-600" />
                        <span>Modul &amp; Bank Soal</span>
                      </span>
                      <Link
                        to="/login-siswa"
                        className="inline-flex items-center gap-1 text-xs font-extrabold text-blue-600 hover:text-slate-900"
                      >
                        <span>Buka Kelas</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* ====================================================================
          5. EDUCATOR EDITORIAL SPOTLIGHT ("PROFIL PENGAJAR")
         ==================================================================== */}
      <section id="pengajar" className="py-24 lg:py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="reveal-item reveal-up nexora-card-tactile bg-white p-8 sm:p-12 lg:p-14 relative overflow-hidden">
            {/* Decorative Top Corner Badge */}
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-yellow-300/40 pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center relative z-10">
              {/* Teacher Photo with Parallax Offset Architectural Frame */}
              <div className="lg:col-span-4 flex justify-center">
                <div className="relative">
                  {/* Offset background frame */}
                  <div
                    style={{ transform: `translate3d(10px, ${parallaxOffset(0.04, 24)}px, 0)` }}
                    className="parallax-layer absolute inset-0 rounded-3xl bg-yellow-300 border-2 border-slate-900 translate-x-3 translate-y-3"
                  />
                  <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-3xl overflow-hidden border-2 border-slate-900 relative z-10 bg-slate-100">
                    <img
                      src={
                        siteSettings.teacher_photo_url ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800'
                      }
                      alt={siteSettings.teacher_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-4 -right-2 z-20 px-4 py-2 rounded-2xl bg-blue-600 text-white border-2 border-slate-900 shadow-[4px_4px_0_0_#0f172a] text-xs font-extrabold flex items-center gap-2">
                    <Award className="w-4 h-4 text-yellow-300" />
                    <span>Pengajar Utama</span>
                  </div>
                </div>
              </div>

              {/* Teacher Details & Bio */}
              <div className="lg:col-span-8 space-y-5">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-100 border-2 border-slate-900 text-xs font-extrabold text-blue-900">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>PROFIL PENDIDIK &amp; PENGELOLA KURIKULUM</span>
                </div>

                <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                  {siteSettings.teacher_name}
                </h2>

                <p className="text-slate-700 text-base sm:text-lg leading-relaxed font-medium">
                  {siteSettings.teacher_bio}
                </p>

                {/* Commitment & Specialty Boxes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-yellow-50 border-2 border-slate-900 shadow-[4px_4px_0_0_#0f172a]">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      Komitmen Pengajaran
                    </p>
                    <p className="text-sm sm:text-base font-extrabold text-slate-900 mt-1">
                      {siteSettings.teacher_commitment || 'Pembelajaran Interaktif & Terarah'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-slate-900 shadow-[4px_4px_0_0_#0f172a]">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      Bidang Spesialisasi
                    </p>
                    <p className="text-sm sm:text-base font-extrabold text-slate-900 mt-1">
                      {siteSettings.teacher_specialty || 'Matematika & Sains Digital'}
                    </p>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="pt-4 flex flex-wrap items-center gap-4">
                  <Link
                    to="/login-siswa"
                    className="nexora-btn-yellow px-6 py-3 text-xs sm:text-sm inline-flex items-center gap-2"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Masuk Kelas Siswa</span>
                  </Link>

                  <Link
                    to="/login-admin"
                    className="nexora-btn-secondary px-6 py-3 text-xs sm:text-sm inline-flex items-center gap-2"
                  >
                    <span>Akses Dashboard Pengajar</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
