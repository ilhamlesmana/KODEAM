import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  Shield,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  GraduationCap,
  ShieldCheck,
  School,
  ArrowLeft,
  Layers,
  Award,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import '../styles/login.css';

export const LoginAdmin: React.FC = () => {
  const { siteSettings, classes, students, subjects } = useData();
  const { loginAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleKeyEvents = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const res = await loginAdmin(emailOrUsername, password);
    if (res.success) {
      navigate('/admin');
    } else {
      setErrorMsg(res.error || 'Autentikasi gagal. Silakan periksa kembali email/username & kata sandi Anda.');
    }
  };

  return (
    <div className="min-h-screen marhas-login-scope marhas-grid-pattern flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8">
      {/* Top Navigation Bar */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-xs sm:text-sm font-extrabold text-slate-900"
        >
          <ArrowLeft className="w-4 h-4 text-[#3b5bf5]" />
          {siteSettings.logo_url && (
            <img
              src={siteSettings.logo_url}
              alt={siteSettings.site_name || 'Logo'}
              className="w-5 h-5 object-contain"
            />
          )}
          <span>Beranda {siteSettings.site_name || 'NEXORA'}</span>
        </Link>

        <div className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-sm text-xs font-extrabold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-[#1cd485] animate-pulse"></span>
          {siteSettings.logo_url ? (
            <img
              src={siteSettings.logo_url}
              alt="Logo"
              className="w-4 h-4 object-contain"
            />
          ) : (
            <School className="w-4 h-4 text-[#3b5bf5]" />
          )}
          <span>SMK MARHAS MARGAHAYU &bull; Portal Pengajar &amp; Admin</span>
        </div>
      </div>

      {/* Main Split Auth Card */}
      <div className="max-w-5xl w-full mx-auto my-6">
        <div className="marhas-auth-container grid grid-cols-1 lg:grid-cols-12">
          {/* Left Showcase Column: SMK MARHAS Teacher Identity */}
          <div className="lg:col-span-6 marhas-banner-teacher p-8 sm:p-10 text-white flex flex-col justify-between relative min-h-[460px]">
            {/* Decorative Geometric Circles */}
            <div className="marhas-deco-circle w-72 h-72 bg-blue-400/20 -top-20 -right-20 blur-3xl"></div>
            <div className="marhas-deco-circle w-64 h-64 bg-[#1cd485]/20 -bottom-20 -left-16 blur-3xl"></div>

            {/* Top School Header */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-extrabold text-[#1cd485] mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                <span>PUSAT KENDALI AKADEMIK GURU</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight text-white">
                Kelola Kurikulum &amp; <br />
                <span className="text-[#1cd485]">
                  Evaluasi Kelas Digital
                </span>
              </h2>

              <p className="mt-3.5 text-xs sm:text-sm text-blue-100/90 leading-relaxed font-medium max-w-md">
                Panel manajemen terpadu bagi pendidik untuk mengatur kelas, menerbitkan modul belajar, menyusun Bank Soal PG &amp; Essay, serta merekap nilai siswa secara real-time.
              </p>
            </div>

            {/* Interactive Floating Teacher Badges */}
            <div className="relative z-10 my-7 space-y-3.5">
              {/* Floating Card 1: Teacher Profile Preview */}
              <div className="marhas-sticker p-4 flex items-center gap-3.5 max-w-sm animate-marhas-float">
                <div className="w-12 h-12 rounded-2xl bg-[#3b5bf5] text-white flex items-center justify-center shrink-0 overflow-hidden shadow-md">
                  {siteSettings.teacher_photo_url ? (
                    <img
                      src={siteSettings.teacher_photo_url}
                      alt={siteSettings.teacher_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Award className="w-6 h-6 text-white" />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#3b5bf5] block">
                    Pengajar Utama
                  </span>
                  <p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                    {siteSettings.teacher_name}
                  </p>
                  <p className="text-[11px] font-medium text-slate-500 truncate">
                    {siteSettings.teacher_specialty || 'Pendidik & Administrator LMS'}
                  </p>
                </div>
              </div>

              {/* Floating Card 2: Live Ecosystem Stats */}
              <div className="marhas-sticker p-4 flex items-center gap-3.5 max-w-sm ml-auto animate-marhas-float-reverse">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-900">
                    {students.length} Siswa &bull; {classes.length} Kelas &bull; {subjects.length} Mapel
                  </p>
                  <p className="text-[11px] font-medium text-slate-500">
                    Laporan Matriks Tugas &amp; Auto-Grading Aktif
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Pills */}
            <div className="relative z-10 pt-4 border-t border-white/15 flex flex-wrap items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm text-[11px] font-bold text-white border border-white/15">
                📊 Rekap Nilai per Kelas
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm text-[11px] font-bold text-white border border-white/15">
                🗂️ Bank Soal PG &amp; Essay
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm text-[11px] font-bold text-white border border-white/15">
                🔒 Keamanan Terenkripsi
              </span>
            </div>
          </div>

          {/* Right Form Column */}
          <div className="lg:col-span-6 p-7 sm:p-10 bg-white flex flex-col justify-between">
            <div>
              {/* Role Switcher Tabs */}
              <div className="marhas-role-switcher grid grid-cols-2 gap-1.5 mb-7">
                <Link
                  to="/login-siswa"
                  className="py-2.5 px-3 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center justify-center gap-2 transition-all"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Portal Siswa</span>
                </Link>
                <Link
                  to="/login-admin"
                  className="marhas-role-tab-active py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Portal Guru</span>
                </Link>
              </div>

              {/* Greeting Header */}
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#3b5bf5] uppercase tracking-wider mb-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Otorisasi Pengajar &amp; Administrator</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Selamat Datang, Guru! 👨‍🏫
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  Silakan masuk menggunakan email atau username pengajar Anda.
                </p>
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-start gap-2.5 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    Email atau Username Pengajar
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={emailOrUsername}
                      onChange={(e) => setEmailOrUsername(e.target.value)}
                      placeholder="Masukkan email atau username pengajar"
                      required
                      className="marhas-input pl-11 pr-4 py-3.5 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-extrabold text-slate-700">
                      Kata Sandi Otorisasi
                    </label>
                    {capsLockOn && (
                      <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1">
                        ⚠️ Caps Lock Aktif
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyUp={handleKeyEvents}
                      onKeyDown={handleKeyEvents}
                      placeholder="Masukkan kata sandi pengajar"
                      required
                      className="marhas-input pl-11 pr-12 py-3.5 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                      title={showPassword ? 'Sembunyikan Sandi' : 'Lihat Sandi'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between pt-0.5">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#3b5bf5] focus:ring-[#3b5bf5]"
                    />
                    <span className="text-xs font-semibold text-slate-600">Ingat sesi di perangkat ini</span>
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 px-5 marhas-btn-submit bg-gradient-to-r from-[#3b5bf5] to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? (
                      <span>Memverifikasi Otorisasi...</span>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        <span>Masuk ke Dashboard Guru</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Security Notice */}
            <div className="mt-7 pt-5 border-t border-slate-100">
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  <strong className="text-slate-800">Keamanan Sistem:</strong> Portal ini dilindungi otorisasi pengajar terenkripsi. Hanya staf pendidik terotorisasi yang memiliki akses manajemen penuh.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="max-w-6xl w-full mx-auto text-center text-xs font-semibold text-slate-400">
        &copy; {new Date().getFullYear()} {siteSettings.site_name || 'NEXORA'} &times; SMK MARHAS Margahayu &bull; Dikelola oleh {siteSettings.teacher_name}
      </div>
    </div>
  );
};
