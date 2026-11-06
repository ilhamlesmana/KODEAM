import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  FileCode2,
  ClipboardList,
  History,
  Award,
  User,
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  Clock,
  CheckCircle2,
  ArrowRight,
  BellRing
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

import { StudentOverview } from './tabs/StudentOverview';
import { StudentSubjects } from './tabs/StudentSubjects';
import { StudentMaterials } from './tabs/StudentMaterials';
import { StudentAssignments } from './tabs/StudentAssignments';
import { StudentHistory } from './tabs/StudentHistory';
import { StudentGrades } from './tabs/StudentGrades';
import { StudentProfile } from './tabs/StudentProfile';

export const StudentLayout: React.FC = () => {
  const { currentUser, currentStudent, logout } = useAuth();
  const {
    siteSettings,
    classes,
    subjects,
    materials,
    assignments,
    submissions,
    grades,
    announcements,
  } = useData();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Interactive Header Search & Notification
  const [searchOpen, setSearchOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);

  const studentClass = classes.find(c => c.id === currentStudent?.class_id);

  // Active tasks calculation (supporting multi-class class_ids)
  const studentSubmissions = submissions.filter(s => s.student_id === currentStudent?.id);
  const submittedAsgIds = studentSubmissions.map(s => s.assignment_id);

  const activeStudentAssignments = useMemo(() => {
    return assignments.filter(a => {
      if (a.is_active === false) return false;
      if (submittedAsgIds.includes(a.id)) return false;

      let allowedIds: string[] = [];
      if (Array.isArray(a.class_ids) && a.class_ids.length > 0) {
        allowedIds = a.class_ids;
      } else if (a.class_id) {
        allowedIds = [a.class_id];
      } else {
        const sub = subjects.find(s => s.id === a.subject_id);
        if (sub?.class_ids && sub.class_ids.length > 0) {
          allowedIds = sub.class_ids;
        }
      }
      if (allowedIds.length === 0) return true;
      if (!currentStudent?.class_id) return false;
      return allowedIds.includes(currentStudent.class_id);
    });
  }, [assignments, submittedAsgIds, subjects, currentStudent]);

  const activeAssignmentsCount = activeStudentAssignments.length;
  const myGrades = grades.filter(g => g.student_id === currentStudent?.id && g.is_published);

  const menuGroup = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'assignments',
      label: 'Tugas & Ujian',
      icon: ClipboardList,
      badge: activeAssignmentsCount > 0 ? activeAssignmentsCount : undefined,
    },
    { id: 'materials', label: 'Materi Belajar', icon: FileCode2 },
    { id: 'subjects', label: 'Mata Pelajaran', icon: BookOpen },
  ];

  const academicGroup = [
    { id: 'history', label: 'Riwayat Tugas', icon: History },
    { id: 'grades', label: 'Nilai & Rapor', icon: Award },
    { id: 'profile', label: 'Profil Saya', icon: User },
  ];

  const allNavItems = [...menuGroup, ...academicGroup];

  const searchResults = useMemo(() => {
    const q = globalSearchQuery.trim().toLowerCase();
    if (!q) return { menus: allNavItems, assignments: [], materials: [], subjects: [] };

    return {
      menus: allNavItems.filter(m => m.label.toLowerCase().includes(q)),
      assignments: assignments.filter(a => a.title.toLowerCase().includes(q)).slice(0, 4),
      materials: materials.filter(m => m.title.toLowerCase().includes(q)).slice(0, 4),
      subjects: subjects.filter(s => s.name.toLowerCase().includes(q)).slice(0, 4),
    };
  }, [globalSearchQuery, assignments, materials, subjects]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <StudentOverview onNavigate={tab => setActiveTab(tab)} />;
      case 'subjects':
        return <StudentSubjects onNavigate={tab => setActiveTab(tab)} />;
      case 'materials':
        return <StudentMaterials />;
      case 'assignments':
        return <StudentAssignments />;
      case 'history':
        return <StudentHistory />;
      case 'grades':
        return <StudentGrades />;
      case 'profile':
        return <StudentProfile />;
      default:
        return <StudentOverview onNavigate={tab => setActiveTab(tab)} />;
    }
  };

  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const totalNotifCount = activeAssignmentsCount + Math.min(2, announcements.length);

  return (
    <div className="min-h-screen bg-[#f0f2f7] text-slate-900 p-3 sm:p-5 lg:p-6 flex flex-col md:flex-row gap-6 selection:bg-[#3b5bf5] selection:text-white">
      {/* Mobile Header */}
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
                <p className="text-[10px] text-slate-400 font-bold tracking-widest">PORTAL SISWA</p>
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
            {/* GROUP 1: BELAJAR */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2.5">
                RUANG BELAJAR
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
                      {item.badge && (
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            isActive ? 'bg-white text-[#3b5bf5]' : 'bg-rose-500 text-white animate-pulse'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* GROUP 2: AKADEMIK */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2.5">
                AKADEMIK &amp; PROFIL
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
          </div>

          {/* Bottom Student Profile Card */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200/80 flex items-center justify-between gap-3">
              <div
                onClick={() => {
                  setActiveTab('profile');
                  setSidebarOpen(false);
                }}
                className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
                title="Klik untuk Ganti Foto Profil & Password"
              >
                <img
                  src={
                    currentUser?.avatar_url ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${currentStudent?.nis_nisn || 'student'}`
                  }
                  alt={currentUser?.full_name}
                  className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0 group-hover:border-[#3b5bf5] transition-colors"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate group-hover:text-[#3b5bf5] transition-colors">
                    {currentUser?.full_name || 'Siswa'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {studentClass?.name || 'Siswa Aktif'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-white transition-colors border border-transparent hover:border-slate-200 shrink-0"
                title="Keluar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
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
              <span className="text-[#3b5bf5] font-bold">{studentClass?.name || 'Kelas Aktif'}</span>
            </p>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3 self-start sm:self-auto">
            {/* Interactive Search Button */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="h-10 px-3.5 rounded-full bg-white shadow-sm border border-slate-200/80 flex items-center gap-2 text-slate-600 hover:text-[#3b5bf5] hover:border-[#3b5bf5]/40 hover:shadow transition-all"
              title="Cari Materi, Tugas, atau Mata Pelajaran"
            >
              <Search className="w-4 h-4" />
              <span className="text-xs font-semibold text-slate-400 hidden lg:inline">
                Cari materi / tugas...
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
                title="Notifikasi Tugas & Pengumuman"
              >
                <Bell className="w-4 h-4" />
              </button>
              {totalNotifCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black ring-2 ring-white absolute -top-1 -right-1 flex items-center justify-center">
                  {totalNotifCount}
                </span>
              )}

              {/* Student Notification Popover */}
              {notifOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200/90 p-4 z-50 space-y-3">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">
                        Notifikasi Belajar Kamu
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {activeAssignmentsCount} tugas aktif &bull; {myGrades.length} nilai terbit
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
                    {activeStudentAssignments.slice(0, 3).map(asg => (
                      <button
                        key={asg.id}
                        type="button"
                        onClick={() => {
                          setNotifOpen(false);
                          setActiveTab('assignments');
                        }}
                        className="w-full p-3 rounded-2xl bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200/80 text-left transition-colors flex items-start justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <span className="text-[10px] font-extrabold text-amber-700 uppercase">
                            Tugas / Ujian Belum Dikerjakan
                          </span>
                          <p className="text-xs font-extrabold text-slate-900 truncate mt-0.5">
                            {asg.title}
                          </p>
                          <p className="text-[10px] text-[#3b5bf5] font-bold mt-0.5">
                            Klik untuk mulai mengerjakan &rarr;
                          </p>
                        </div>
                        <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-1" />
                      </button>
                    ))}

                    {myGrades.slice(0, 2).map(gr => {
                      const asg = assignments.find(a => a.id === gr.assignment_id);
                      return (
                        <button
                          key={gr.id}
                          type="button"
                          onClick={() => {
                            setNotifOpen(false);
                            setActiveTab('grades');
                          }}
                          className="w-full p-3 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200/80 text-left transition-colors flex items-start justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <span className="text-[10px] font-extrabold text-emerald-700 uppercase">
                              Nilai Baru Dipublikasikan!
                            </span>
                            <p className="text-xs font-extrabold text-slate-900 truncate mt-0.5">
                              {asg?.title || 'Tugas Kelas'} — Skor: {gr.score}
                            </p>
                          </div>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                        </button>
                      );
                    })}

                    {announcements.slice(0, 2).map(ann => (
                      <div
                        key={ann.id}
                        className="p-3 rounded-2xl bg-blue-50/50 border border-blue-200/60 text-left"
                      >
                        <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#3b5bf5] uppercase">
                          <BellRing className="w-3 h-3" />
                          <span>Pengumuman Guru</span>
                        </div>
                        <p className="text-xs font-extrabold text-slate-900 mt-0.5">{ann.title}</p>
                        <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                          {ann.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Student Profile Capsule */}
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-3 pl-1.5 pr-4 py-1.5 bg-white hover:bg-slate-50 shadow-sm border border-slate-200/80 rounded-full transition-all cursor-pointer"
              title="Buka Profil & Ganti Password / Foto"
            >
              <img
                src={
                  currentUser?.avatar_url ||
                  `https://api.dicebear.com/7.x/bottts/svg?seed=${currentStudent?.nis_nisn || 'student'}`
                }
                alt={currentUser?.full_name}
                className="w-8 h-8 rounded-full object-cover border border-slate-200"
              />
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  {currentUser?.full_name || 'Siswa'}
                </p>
                <p className="text-[10px] text-slate-400 font-medium">
                  {studentClass?.name || 'Siswa Aktif'}
                </p>
              </div>
            </button>

            {/* Logout button */}
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

      {/* Global Search Modal for Student */}
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
                placeholder="Cari materi belajar, judul tugas/ujian, atau mata pelajaran..."
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
              {searchResults.menus.length > 0 && (
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                    Menu Ruang Siswa
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
                        <span className="text-[11px] font-bold text-[#3b5bf5]">Kerjakan &rarr;</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
                        <span className="text-[11px] font-bold text-[#3b5bf5]">Baca &rarr;</span>
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
