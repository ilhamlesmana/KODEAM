import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mail, Phone, MapPin, School, ArrowUpRight } from 'lucide-react';
import { useData } from '../context/DataContext';
import '../styles/landing.css';

export const Footer: React.FC = () => {
  const { siteSettings } = useData();

  return (
    <footer className="border-t-2 border-slate-900 bg-[#0f172a] text-slate-100 pt-16 pb-12 relative overflow-hidden">
      {/* Subtle architectural background accent */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-600/15 blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-800">
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3.5">
              {siteSettings.logo_url ? (
                <div className="h-12 min-w-[3rem] max-w-[9.5rem] px-2.5 py-1.5 rounded-2xl bg-white/95 border border-white/20 shadow-lg flex items-center justify-center overflow-hidden">
                  <img
                    src={siteSettings.logo_url}
                    alt={siteSettings.site_name || 'Logo'}
                    className="h-9 w-auto max-w-[136px] object-contain"
                  />
                </div>
              ) : (
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-yellow-300 to-amber-400 text-slate-900 shadow-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-slate-900" />
                </div>
              )}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-display text-2xl font-extrabold tracking-tight text-white leading-none">
                    {siteSettings.site_name || 'NEXORA'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-600/90 border border-blue-400/30 text-[10px] font-extrabold uppercase tracking-wider text-white">
                    SMK MARHAS
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-400 mt-1">
                  Platform Pembelajaran &amp; Evaluasi Vokasi Digital
                </span>
              </div>
            </div>

            <p className="text-slate-300 text-sm max-w-md leading-relaxed font-medium">
              {siteSettings.tagline} — Ekosistem pembelajaran digital terpadu yang dirancang khusus untuk mendukung kegiatan akademik, praktikum, dan evaluasi siswa secara interaktif.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Sistem Terlindungi Row Level Security
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-yellow-300">
                <School className="w-3.5 h-3.5" />
                Kurikulum Vokasi Terpadu
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-3">
            <h4 className="font-display text-xs font-extrabold text-yellow-300 uppercase tracking-widest mb-4">
              Eksplorasi Portal
            </h4>
            <ul className="space-y-2.5 text-sm font-semibold text-slate-300">
              <li>
                <a href="#beranda" className="hover:text-yellow-300 transition-colors inline-flex items-center gap-1">
                  <span>Beranda Utama</span>
                </a>
              </li>
              <li>
                <a href="#tentang" className="hover:text-yellow-300 transition-colors inline-flex items-center gap-1">
                  <span>Alur & Fitur Belajar</span>
                </a>
              </li>
              <li>
                <a href="#mata-pelajaran" className="hover:text-yellow-300 transition-colors inline-flex items-center gap-1">
                  <span>Katalog Mata Pelajaran</span>
                </a>
              </li>
              <li>
                <a href="#pengajar" className="hover:text-yellow-300 transition-colors inline-flex items-center gap-1">
                  <span>Profil Pengajar</span>
                </a>
              </li>
              <li className="pt-1">
                <Link to="/login-siswa" className="text-sky-400 hover:text-sky-300 inline-flex items-center gap-1 font-bold">
                  <span>Login Portal Siswa</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </li>
              <li>
                <Link to="/login-admin" className="text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 font-bold">
                  <span>Login Portal Guru</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Official Contact */}
          <div className="md:col-span-4">
            <h4 className="font-display text-xs font-extrabold text-yellow-300 uppercase tracking-widest mb-4">
              Kontak Resmi & Akademik
            </h4>
            <ul className="space-y-3 text-sm text-slate-300 font-medium">
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-sky-400" />
                </div>
                <span className="truncate">{siteSettings.contact_email}</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-emerald-400" />
                </div>
                <span>{siteSettings.contact_phone}</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-yellow-400" />
                </div>
                <span className="leading-snug">{siteSettings.contact_address}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4 font-semibold">
          <p>&copy; {new Date().getFullYear()} {siteSettings.site_name} &times; SMK MARHAS. Hak Cipta Dilindungi.</p>
          <p>
            Dikembangkan & Dikelola oleh <span className="text-yellow-300 font-extrabold">{siteSettings.teacher_name}</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
