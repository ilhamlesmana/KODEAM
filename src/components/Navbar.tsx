import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Menu, X, LogIn, LayoutDashboard, GraduationCap, School } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import '../styles/landing.css';

export const Navbar: React.FC = () => {
  const { siteSettings, supabaseStatus, supabaseError, retrySupabaseConnection } = useData();
  const { isAuthenticated, role, currentUser, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="fixed top-4 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 pointer-events-none">
      <div
        className={`max-w-7xl mx-auto px-4 sm:px-6 py-3 pointer-events-auto nexora-navbar-pill ${
          scrolled ? 'is-scrolled' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Brand Logo Lockup — Clean, Balanced & Adaptive */}
          <Link
            to="/"
            className="flex items-center gap-3.5 group focus:outline-none shrink-0"
          >
            {siteSettings.logo_url ? (
              <div className="relative flex items-center justify-center h-11 min-w-[2.75rem] max-w-[9.5rem] px-2 py-1 rounded-2xl bg-gradient-to-b from-white to-slate-50 border border-slate-200/90 shadow-[0_2px_10px_-2px_rgba(15,23,42,0.08)] ring-2 ring-transparent group-hover:ring-blue-500/20 group-hover:border-blue-300 group-hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
                <img
                  src={siteSettings.logo_url}
                  alt={siteSettings.site_name || 'Logo'}
                  className="h-8 sm:h-9 w-auto max-w-[136px] object-contain drop-shadow-[0_1px_1px_rgba(15,23,42,0.06)] transition-transform duration-300 group-hover:scale-[1.04]"
                />
              </div>
            ) : (
              <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md shadow-blue-600/25 ring-2 ring-blue-500/15 flex items-center justify-center group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:shadow-blue-600/30 transition-all duration-300">
                <Sparkles className="w-5 h-5 text-yellow-300 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
              </div>
            )}

            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="font-display text-lg sm:text-xl font-black tracking-tight text-slate-900 leading-none group-hover:text-blue-600 transition-colors">
                  {siteSettings.site_name || 'NEXORA'}
                </span>
                <span
                  onClick={(e) => {
                    e.preventDefault();
                    retrySupabaseConnection();
                  }}
                  title={
                    supabaseError ||
                    (supabaseStatus === 'connected'
                      ? 'Terhubung ke Cloud Supabase'
                      : 'Klik untuk sinkronisasi ulang')
                  }
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border transition-colors ${
                    supabaseStatus === 'connected'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : supabaseStatus === 'error'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      supabaseStatus === 'connected'
                        ? 'bg-emerald-500 animate-pulse'
                        : supabaseStatus === 'error'
                        ? 'bg-rose-500'
                        : 'bg-amber-500'
                    }`}
                  />
                  <span className="hidden sm:inline">
                    {supabaseStatus === 'connected' ? 'Online' : 'Lokal'}
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-1.5 mt-1">
                <School className="w-3 h-3 text-blue-600 shrink-0" />
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500 group-hover:text-slate-700 transition-colors">
                  SMK MARHAS &bull; Digital LMS
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1 rounded-full border border-slate-200/80">
            <a
              href="#beranda"
              className="px-4 py-1.5 rounded-full text-xs sm:text-sm font-extrabold text-slate-700 hover:text-blue-600 hover:bg-white hover:shadow-2xs transition-all"
            >
              Beranda
            </a>
            <a
              href="#tentang"
              className="px-4 py-1.5 rounded-full text-xs sm:text-sm font-extrabold text-slate-700 hover:text-blue-600 hover:bg-white hover:shadow-2xs transition-all"
            >
              Alur Belajar
            </a>
            <a
              href="#mata-pelajaran"
              className="px-4 py-1.5 rounded-full text-xs sm:text-sm font-extrabold text-slate-700 hover:text-blue-600 hover:bg-white hover:shadow-2xs transition-all"
            >
              Mata Pelajaran
            </a>
            <a
              href="#pengajar"
              className="px-4 py-1.5 rounded-full text-xs sm:text-sm font-extrabold text-slate-700 hover:text-blue-600 hover:bg-white hover:shadow-2xs transition-all"
            >
              Pengajar
            </a>
          </nav>

          {/* Auth Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2.5">
                <Link
                  to={role === 'admin' ? '/admin' : '/student'}
                  className="nexora-btn-primary px-4 py-2 text-xs flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard {role === 'admin' ? 'Guru' : 'Siswa'} ({currentUser?.full_name?.split(' ')[0]})</span>
                </Link>

                <button
                  onClick={logout}
                  className="px-3.5 py-2 rounded-xl bg-rose-100 border-2 border-slate-900 text-slate-900 hover:bg-rose-200 text-xs font-extrabold transition-colors"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login-siswa"
                  className="nexora-btn-yellow px-4 py-2 text-xs flex items-center gap-1.5"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Login Siswa</span>
                </Link>
                <Link
                  to="/login-admin"
                  className="nexora-btn-primary px-4 py-2 text-xs flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Portal Guru</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-100 border-2 border-slate-900 text-slate-900 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 max-w-7xl mx-auto pointer-events-auto bg-white border-2 border-slate-900 shadow-[0_8px_0_0_#0f172a] rounded-3xl p-5 space-y-3">
          <a
            href="#beranda"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-extrabold text-slate-900 hover:bg-slate-100"
          >
            Beranda
          </a>
          <a
            href="#tentang"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-extrabold text-slate-900 hover:bg-slate-100"
          >
            Alur Belajar
          </a>
          <a
            href="#mata-pelajaran"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-extrabold text-slate-900 hover:bg-slate-100"
          >
            Mata Pelajaran
          </a>
          <a
            href="#pengajar"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-extrabold text-slate-900 hover:bg-slate-100"
          >
            Profil Pengajar
          </a>

          <div className="pt-3 border-t-2 border-dashed border-slate-200 flex flex-col gap-2.5">
            {isAuthenticated ? (
              <>
                <Link
                  to={role === 'admin' ? '/admin' : '/student'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="nexora-btn-primary py-2.5 px-4 text-center text-xs flex items-center justify-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Buka Dashboard {role === 'admin' ? 'Guru' : 'Siswa'}</span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-rose-100 border-2 border-slate-900 text-slate-900 text-xs font-extrabold"
                >
                  Keluar dari Akun
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login-siswa"
                  onClick={() => setMobileMenuOpen(false)}
                  className="nexora-btn-yellow py-2.5 px-4 text-center text-xs flex items-center justify-center gap-2"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Login Siswa SMK MARHAS</span>
                </Link>
                <Link
                  to="/login-admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="nexora-btn-primary py-2.5 px-4 text-center text-xs flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Portal Guru / Admin</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
