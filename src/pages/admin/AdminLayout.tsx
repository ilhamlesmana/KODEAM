import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  School,
  BookOpen,
  FileCode2,
  HelpCircle,
  ClipboardList,
  Inbox,
  Award,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ExternalLink,
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

import { AdminOverview } from './tabs/AdminOverview';
import { AdminStudents } from './tabs/AdminStudents';
import { AdminClasses } from './tabs/AdminClasses';
import { AdminSubjects } from './tabs/AdminSubjects';
import { AdminMaterials } from './tabs/AdminMaterials';
import { AdminQuestionBank } from './tabs/AdminQuestionBank';
import { AdminAssignments } from './tabs/AdminAssignments';
import { AdminSubmissions } from './tabs/AdminSubmissions';
import { AdminGrading } from './tabs/AdminGrading';
import { AdminSettings } from './tabs/AdminSettings';
import { AdminProfile } from './tabs/AdminProfile';
import { StudentTaskReportTable } from './components/StudentTaskReportTable';

export const AdminLayout: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const {
    siteSettings,
    students,
    classes,
    subjects,
    materials,
    assignments,
    submissions,
    supabaseStatus,
    retrySupabaseConnection,
  } = useData();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Interactive Header Modals / Popovers
  const [searchOpen, setSearchOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);

  const pendingSubmissions = useMemo(
    () => submissions.filter(s => s.status === 'submitted'),
    [submissions]
  );
  const pendingSubmissionsCount = pendingSubmissions.length;

  const menuGroup = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assignments', label: 'Tugas dan Ujian', icon: ClipboardList },
    { id: 'materials', label: 'Materi Belajar', icon: FileCode2 },
    { id: 'students', label: 'Manajemen Siswa', icon: Users },
  ];

  const academicGroup = [
    { id: 'task_report', label: 'Laporan Tugas Siswa', icon: FileSpreadsheet },
    { id: 'classes', label: 'Manajemen Kelas', icon: School },
    { id: 'subjects', label: 'Mata Pelajaran', icon: BookOpen },
    { id: 'question_bank', label: 'Bank Soal', icon: HelpCircle },
    { id: 'grading', label: 'Penilaian & Rekap', icon: Award },
  ];

  const toolsGroup = [
    {
      id: 'submissions',
      label: 'Pengumpulan Jawaban',
      icon: Inbox,
      badge: pendingSubmissionsCount > 0 ? pendingSubmissionsCount : undefined,
    },
    { id: 'profile', label: 'Profil & Akun Login', icon: UserCheck },
    { id: 'settings', label: 'Pengaturan Website', icon: Settings },
  ];

  const allNavItems = [...menuGroup, ...academicGroup, ...toolsGroup];

  // Global search results across menus, students, assignments, materials
  const searchResults = useMemo(() => {
    const q = globalSearchQuery.trim().toLowerCase();
    if (!q) return { menus: allNavItems.slice(0, 5), students: [], assignments: [], materials: [] };

    return {
      menus: allNavItems.filter(m => m.label.toLowerCase().includes(q)),
      students: students
        .filter(
          s =>
            (s.profile?.full_name || '').toLowerCase().includes(q) ||
            (s.nis_nisn || '').toLowerCase().includes(q)
        )
        .slice(0, 4),
      assignments: assignments.filter(a => a.title.toLowerCase().includes(q)).slice(0, 4),
      materials: materials.filter(m => m.title.toLowerCase().includes(q)).slice(0, 4),
    };
  }, [globalSearchQuery, students, assignments, materials]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminOverview onNavigate={tab => setActiveTab(tab)} />;
      case 'students':
        return <AdminStudents />;
      case 'classes':
        return <AdminClasses />;
      case 'subjects':
        return <AdminSubjects />;
      case 'materials':
        return <AdminMaterials />;
      case 'question_bank':
        return <AdminQuestionBank />;
      case 'assignments':
        return <AdminAssignments />;
      case 'submissions':
        return <AdminSubmissions />;
      case 'task_report':
        return <StudentTaskReportTable />;
      case 'grading':
        return <AdminGrading />;
      case 'profile':
        return <AdminProfile />;
      case 'settings':
        return <AdminSettings />;
      default:
        return <AdminOverview onNavigate={tab => setActiveTab(tab)} />;
    }
  };

  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="min-h-screen bg-[#f0f2f7] text-slate-900 p-3 sm:p-5 lg:p-6 flex flex-col md:flex-row gap-6 selection:bg-[#3b5bf5] selection:text-white">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white rounded-2xl shadow-sm border border-slate-200/80 sticky top-3 z-40">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            {siteSettings.logo_url ? (
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-sm overflow-hidden">
                <img
                  src={siteSettings.logo_url}
                  alt={siteSettings.site_name}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-[#3b5bf5] text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/20">
                N
              </div>
            )}
            <span className="font-extrabold text-slate-900 text-base tracking-tight">
              {siteSettings.site_name}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-xl bg-slate-100 text-slate-600"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            className="text-xs px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 font-semibold border border-rose-200"
          >
            Keluar
          </button>
        </div>
      </div>

      {/* Sidebar Overlay on Mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-sm"
        />
      )}

      {/* Modern Sidebar */}
      <aside
        className={`fixed md:sticky top-6 h-[calc(100vh-3rem)] w-72 bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 z-50 flex flex-col justify-between transition-transform duration-300 shrink-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto pr-1">
          {/* Logo & Platform Info */}
          <div className="flex items-center justify-between pb-6 mb-2">
            <Link to="/" className="flex items-center gap-3 group">
              {siteSettings.logo_url ? (
                <div className="h-11 min-w-[2.75rem] max-w-[6.5rem] px-1.5 py-1 rounded-2xl bg-gradient-to-b from-white to-slate-50 border border-slate-200/90 shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden">
                  <img
                    src={siteSettings.logo_url}
                    alt={siteSettings.site_name}
                    className="h-8 w-auto max-w-[92px] object-contain"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#2a45d4] to-[#3b5bf5] text-white flex items-center justify-center font-black text-lg shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
                  <span className="tracking-tighter">N</span>
                </div>
              )}
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight group-hover:text-[#3b5bf5] transition-colors">
                  {siteSettings.site_name}
                </h1>
                <p className="text-[10px] text-slate-400 font-bold tracking-widest">PORTAL GURU</p>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Groups */}
          <div className="space-y-6 flex-1">
            {/* GROUP 1: MENU */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2.5">
                MENU UTAMA
              </p>
              <div className="space-y-1">
                {menuGroup.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-[#3b5bf5] to-indigo-600 text-white shadow-md shadow-blue-500/25 font-bold translate-x-0.5'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* GROUP 2: AKADEMIK */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2.5">
                AKADEMIK &amp; LAPORAN
              </p>
              <div className="space-y-1">
                {academicGroup.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-[#3b5bf5] to-indigo-600 text-white shadow-md shadow-blue-500/25 font-bold translate-x-0.5'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* GROUP 3: TOOLS / SISTEM */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2.5">
                SISTEM &amp; INBOX
              </p>
              <div className="space-y-1">
                {toolsGroup.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-[#3b5bf5] to-indigo-600 text-white shadow-md shadow-blue-500/25 font-bold translate-x-0.5'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white shadow-sm animate-pulse">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Card: Cohesive Light Footer Card */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200/80 flex items-center justify-between gap-3">
              <div
                onClick={() => {
                  setActiveTab('profile');
                  setSidebarOpen(false);
                }}
                className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
                title="Klik untuk Pengaturan Profil & Akun Login Pengajar"
              >
                <img
                  src={
                    siteSettings.teacher_photo_url ||
                    currentUser?.avatar_url ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'
                  }
                  alt={currentUser?.full_name}
                  className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0 group-hover:border-[#3b5bf5] transition-colors"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate group-hover:text-[#3b5bf5] transition-colors">
                    {siteSettings.teacher_name || currentUser?.full_name || 'Ilham Lesmana'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">Pengajar Utama</p>
                </div>
              </div>

              <Link
                to="/"
                target="_blank"
                className="p-2 rounded-xl text-slate-400 hover:text-[#3b5bf5] hover:bg-white transition-colors border border-transparent hover:border-slate-200 shrink-0"
                title="Lihat Beranda Publik"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Dashboard Area */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-2 relative">
          {/* Left Title & Date */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {allNavItems.find(i => i.id === activeTab)?.label || 'Dashboard'}
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-1">
              {todayFormatted} &bull;{' '}
              <span className="text-[#3b5bf5] font-bold">
                {classes.length} Kelas &bull; {students.length} Siswa Aktif
              </span>
            </p>
          </div>

          {/* Right Controls: Search, Bell, Profile Capsule, Database Status */}
          <div className="flex items-center gap-3 self-start sm:self-auto">
            {/* Supabase Status Pill */}
            <button
              onClick={() => retrySupabaseConnection()}
              className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-semibold bg-white border border-slate-200/80 shadow-sm transition-all hover:border-slate-300 hover:shadow ${
                supabaseStatus === 'connected'
                  ? 'text-emerald-600'
                  : supabaseStatus === 'error'
                  ? 'text-rose-600'
                  : 'text-amber-600'
              }`}
              title="Klik untuk sinkronisasi ulang data Cloud Supabase"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  supabaseStatus === 'connected'
                    ? 'bg-emerald-500 animate-pulse'
                    : supabaseStatus === 'error'
                    ? 'bg-rose-500'
                    : 'bg-amber-500'
                }`}
              />
              <span className="hidden lg:inline">
                {supabaseStatus === 'connected' ? 'Cloud Terhubung' : 'Sync Cloud'}
              </span>
            </button>

            {/* Interactive Search Button */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="h-10 px-3.5 rounded-full bg-white shadow-sm border border-slate-200/80 flex items-center gap-2 text-slate-600 hover:text-[#3b5bf5] hover:border-[#3b5bf5]/40 hover:shadow transition-all"
              title="Pencarian Cepat Siswa, Tugas, Materi & Menu"
            >
              <Search className="w-4 h-4" />
              <span className="text-xs font-semibold text-slate-400 hidden xl:inline">
                Cari cepat...
              </span>
            </button>

            {/* Interactive Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen(prev => !prev)}
                className={`w-10 h-10 rounded-full bg-white shadow-sm border flex items-center justify-center transition-all ${
                  notifOpen
                    ? 'border-[#3b5bf5] text-[#3b5bf5] ring-2 ring-blue-500/20'
                    : 'border-slate-200/80 text-slate-600 hover:text-[#3b5bf5] hover:shadow'
                }`}
                title="Notifikasi Pengumpulan Tugas Siswa"
              >
                <Bell className="w-4 h-4" />
              </button>
              {pendingSubmissionsCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black ring-2 ring-white absolute -top-1 -right-1 flex items-center justify-center">
                  {pendingSubmissionsCount}
                </span>
              )}

              {/* Notification Popover */}
              {notifOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200/90 p-4 z-50 space-y-3">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">
                        Notifikasi Aktivitas Kelas
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {pendingSubmissionsCount} jawaban menunggu pemeriksaan guru
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotifOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {pendingSubmissions.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400 space-y-1">
                        <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto mb-1" />
                        <p className="font-bold text-slate-700">Semua Jawaban Sudah Dinilai!</p>
                        <p className="text-[11px]">Tidak ada antrean koreksi saat ini.</p>
                      </div>
                    ) : (
                      pendingSubmissions.slice(0, 5).map(sub => {
                        const st = students.find(s => s.id === sub.student_id);
                        const asg = assignments.find(a => a.id === sub.assignment_id);
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => {
                              setNotifOpen(false);
                              setActiveTab('submissions');
                            }}
                            className="w-full p-3 rounded-2xl bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200/80 text-left transition-colors flex items-start justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-extrabold text-slate-900 truncate">
                                {st?.profile?.full_name || 'Siswa'} mengumpulkan tugas
                              </p>
                              <p className="text-[11px] font-bold text-[#3b5bf5] truncate">
                                {asg?.title || 'Tugas Kelas'}
                              </p>
                              <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Klik untuk periksa &amp; beri nilai</span>
                              </p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-amber-700 shrink-0 mt-1" />
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setNotifOpen(false);
                        setActiveTab('task_report');
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-extrabold text-center transition-colors"
                    >
                      Buka Laporan Tugas
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNotifOpen(false);
                        setActiveTab('submissions');
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#3b5bf5] hover:bg-blue-600 text-white text-[11px] font-extrabold text-center transition-colors"
                    >
                      Buka Kotak Masuk
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Capsule (Klik untuk ke Profil & Akun Login Guru) */}
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-3 pl-1.5 pr-4 py-1.5 bg-white hover:bg-slate-50 shadow-sm border border-slate-200/80 rounded-full transition-all cursor-pointer"
              title="Buka Profil & Akun Login Guru (Ganti Email / Password)"
            >
              <img
                src={
                  siteSettings.teacher_photo_url ||
                  currentUser?.avatar_url ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'
                }
                alt={currentUser?.full_name}
                className="w-8 h-8 rounded-full object-cover border border-slate-200"
              />
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  {siteSettings.teacher_name || currentUser?.full_name || 'Ilham Lesmana'}
                </p>
                <p className="text-[10px] text-slate-400 font-medium">Admin Guru</p>
              </div>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-full bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/80 shadow-sm transition-colors"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Tab Body */}
        <div className="flex-1">{renderContent()}</div>
      </main>

      {/* Global Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-start justify-center pt-16 p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <Search className="w-5 h-5 text-[#3b5bf5] shrink-0" />
              <input
                type="text"
                autoFocus
                value={globalSearchQuery}
                onChange={e => setGlobalSearchQuery(e.target.value)}
                placeholder="Ketik nama siswa, NISN, judul tugas, materi, atau menu..."
                className="w-full text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  setGlobalSearchQuery('');
                }}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-4 pr-1">
              {/* Menus */}
              {searchResults.menus.length > 0 && (
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                    Navigasi Menu Cepat
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {searchResults.menus.map(m => {
                      const Icon = m.icon;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setActiveTab(m.id);
                            setSearchOpen(false);
                            setGlobalSearchQuery('');
                          }}
                          className="p-2.5 rounded-2xl bg-slate-50 hover:bg-blue-50 hover:text-[#3b5bf5] border border-slate-200/70 text-xs font-bold text-slate-700 flex items-center gap-2.5 transition-colors text-left"
                        >
                          <Icon className="w-4 h-4 text-[#3b5bf5] shrink-0" />
                          <span className="truncate">{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Students */}
              {searchResults.students.length > 0 && (
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                    Data Siswa ({searchResults.students.length})
                  </p>
                  <div className="space-y-1.5">
                    {searchResults.students.map(st => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          setActiveTab('task_report');
                          setSearchOpen(false);
                          setGlobalSearchQuery('');
                        }}
                        className="w-full p-2.5 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200/70 flex items-center justify-between text-xs"
                      >
                        <span className="font-extrabold text-slate-900">
                          {st.profile?.full_name} ({st.nis_nisn})
                        </span>
                        <span className="text-[11px] font-bold text-[#3b5bf5]">
                          Lihat Laporan &rarr;
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Assignments */}
              {searchResults.assignments.length > 0 && (
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                    Tugas &amp; Ujian ({searchResults.assignments.length})
                  </p>
                  <div className="space-y-1.5">
                    {searchResults.assignments.map(asg => (
                      <button
                        key={asg.id}
                        type="button"
                        onClick={() => {
                          setActiveTab('assignments');
                          setSearchOpen(false);
                          setGlobalSearchQuery('');
                        }}
                        className="w-full p-2.5 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200/70 flex items-center justify-between text-xs"
                      >
                        <span className="font-extrabold text-slate-900 truncate">{asg.title}</span>
                        <span className="text-[11px] font-bold text-[#3b5bf5]">Buka &rarr;</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Materials */}
              {searchResults.materials.length > 0 && (
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                    Materi Pembelajaran ({searchResults.materials.length})
                  </p>
                  <div className="space-y-1.5">
                    {searchResults.materials.map(mat => (
                      <button
                        key={mat.id}
                        type="button"
                        onClick={() => {
                          setActiveTab('materials');
                          setSearchOpen(false);
                          setGlobalSearchQuery('');
                        }}
                        className="w-full p-2.5 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200/70 flex items-center justify-between text-xs"
                      >
                        <span className="font-extrabold text-slate-900 truncate">{mat.title}</span>
                        <span className="text-[11px] font-bold text-[#3b5bf5]">Buka &rarr;</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
