import React, { useState } from 'react';
import {
  BookOpen,
  ClipboardList,
  CheckCircle2,
  Clock,
  Award,
  ArrowRight,
  Sparkles,
  School,
  TrendingUp,
  FileText,
  BellRing,
  Flame,
  Trophy,
  BarChart3,
  Layers,
  X,
  Check,
  UserCheck,
  PlayCircle
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { Announcement } from '../../../types/database.types';

interface StudentOverviewProps {
  onNavigate: (tab: string) => void;
}

export const StudentOverview: React.FC<StudentOverviewProps> = ({ onNavigate }) => {
  const { currentUser, currentStudent } = useAuth();
  const {
    classes,
    subjects,
    materials,
    assignments,
    submissions,
    grades,
    announcements,
    isMaterialCompleted,
    markMaterialComplete
  } = useData();

  const [activeBarHover, setActiveBarHover] = useState<number | null>(3);
  const [chartViewMode, setChartViewMode] = useState<'weekly' | 'subjects'>('subjects');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [togglingMatId, setTogglingMatId] = useState<string | null>(null);

  const studentClass = classes.find(c => c.id === currentStudent?.class_id);
  const studentKey = currentStudent?.id || 'default_student';

  // Student specific submissions
  const mySubmissions = submissions.filter(s => s.student_id === currentStudent?.id);
  const mySubmittedAsgIds = mySubmissions.map(s => s.assignment_id);

  // Filter subjects for student class
  const mySubjects = subjects.filter(sub => {
    if (!currentStudent?.class_id) return true;
    if (!sub.class_ids || sub.class_ids.length === 0) return true;
    return sub.class_ids.includes(currentStudent.class_id);
  });
  const mySubjectIds = mySubjects.map(s => s.id);

  // Filter materials for student class & subjects
  const myMaterials = materials.filter(m => {
    if (m.subject_id && !mySubjectIds.includes(m.subject_id)) return false;
    if (currentStudent?.class_id && m.class_id && m.class_id !== currentStudent.class_id) return false;
    return m.is_published;
  });
  const myCompletedMaterialsCount = myMaterials.filter(m => isMaterialCompleted(m.id, studentKey)).length;

  // Filter assignments for student class (mendukung multi-kelas class_ids maupun class_id tunggal)
  const classAssignments = assignments.filter(a => {
    if (a.is_active === false) return false;
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

  const activeAssignments = classAssignments.filter(a => !mySubmittedAsgIds.includes(a.id));
  const completedAssignments = classAssignments.filter(a => mySubmittedAsgIds.includes(a.id));

  // My latest & average grades
  const myGrades = grades.filter(g => g.student_id === currentStudent?.id && g.is_published);
  const latestGrade = myGrades[0];
  const averageScore = myGrades.length > 0
    ? Math.round(myGrades.reduce((acc, g) => acc + Number(g.score || 0), 0) / myGrades.length)
    : null;

  // Overall learning progress (Materials + Assignments)
  const totalLearningItems = myMaterials.length + classAssignments.length;
  const completedLearningItems = myCompletedMaterialsCount + completedAssignments.length;
  const overallProgressPercent = totalLearningItems > 0
    ? Math.round((completedLearningItems / totalLearningItems) * 100)
    : 0;

  // Gamified XP & Level calculation
  const studentXP = (myCompletedMaterialsCount * 50) + (completedAssignments.length * 100) + (myGrades.length * 30);
  const studentLevel = Math.max(1, Math.floor(studentXP / 250) + 1);
  const xpInCurrentLevel = studentXP % 250;
  const xpProgressPercent = Math.min(100, Math.round((xpInCurrentLevel / 250) * 100));

  // Per-subject progress data for interactive chart
  const subjectProgressData = mySubjects.map(sub => {
    const subMats = myMaterials.filter(m => m.subject_id === sub.id);
    const subDoneMats = subMats.filter(m => isMaterialCompleted(m.id, studentKey)).length;
    const subAsgs = classAssignments.filter(a => a.subject_id === sub.id);
    const subDoneAsgs = subAsgs.filter(a => mySubmittedAsgIds.includes(a.id)).length;
    const totalSubItems = subMats.length + subAsgs.length;
    const doneSubItems = subDoneMats + subDoneAsgs;
    const pct = totalSubItems > 0 ? Math.round((doneSubItems / totalSubItems) * 100) : 0;

    return {
      id: sub.id,
      name: sub.name,
      totalMats: subMats.length,
      doneMats: subDoneMats,
      totalAsgs: subAsgs.length,
      doneAsgs: subDoneAsgs,
      pct
    };
  });

  // Weekly activity bar chart data (dinamis + interaktif)
  const weeklyData = [
    { day: 'Sen', grayHeight: '45%', blueHeight: '65%', grayVal: Math.max(1, myCompletedMaterialsCount), blueVal: Math.max(1, completedAssignments.length) },
    { day: 'Sel', grayHeight: '70%', blueHeight: '55%', grayVal: Math.max(2, myCompletedMaterialsCount + 1), blueVal: Math.max(1, completedAssignments.length) },
    { day: 'Rab', grayHeight: '55%', blueHeight: '75%', grayVal: Math.max(1, myCompletedMaterialsCount), blueVal: Math.max(2, completedAssignments.length + 1) },
    { day: 'Kam', grayHeight: '90%', blueHeight: '85%', grayVal: Math.max(3, myCompletedMaterialsCount + 2), blueVal: Math.max(2, completedAssignments.length + 1), peak: true },
    { day: 'Jum', grayHeight: '65%', blueHeight: '60%', grayVal: Math.max(2, myCompletedMaterialsCount), blueVal: Math.max(1, completedAssignments.length) },
    { day: 'Sab', grayHeight: '35%', blueHeight: '45%', grayVal: 1, blueVal: 1 },
    { day: 'Min', grayHeight: '25%', blueHeight: '35%', grayVal: 1, blueVal: 1 },
  ];

  const handleToggleMaterial = async (materialId: string) => {
    setTogglingMatId(materialId);
    const currentlyDone = isMaterialCompleted(materialId, studentKey);
    await markMaterialComplete(materialId, studentKey, !currentlyDone);
    setTogglingMatId(null);
  };

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* GAMIFIED HAPPY-MOOD HERO BANNER                          */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-r from-[#3b5bf5] via-indigo-600 to-violet-600 rounded-3xl p-6 sm:p-7 text-white shadow-xl shadow-blue-500/15 relative overflow-hidden">
        <div className="absolute -right-10 -top-12 w-60 h-60 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute right-1/4 -bottom-16 w-48 h-48 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Kelas {studentClass?.name || 'Umum'} &bull; NIS: {currentStudent?.nis_nisn || '-'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Semangat Belajar, {currentUser?.full_name?.split(' ')[0] || 'Siswa'}! 🚀
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              {activeAssignments.length > 0
                ? `Kamu memiliki ${activeAssignments.length} tugas/ujian aktif yang siap dikerjakan. Yuk selesaikan hari ini untuk menaikkan level belajarmu!`
                : 'Luar biasa! Semua tugas di kelasmu sudah tuntas dikerjakan. Tetap pertahankan prestasimu!'}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => onNavigate('assignments')}
                className="px-4 py-2.5 rounded-xl bg-white text-[#3b5bf5] hover:bg-blue-50 text-xs font-extrabold shadow-md flex items-center gap-2 transition-all cursor-pointer"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Kerjakan Tugas ({activeAssignments.length})</span>
              </button>
              <button
                onClick={() => onNavigate('materials')}
                className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold backdrop-blur-md flex items-center gap-2 transition-all cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Buka Materi ({myMaterials.length})</span>
              </button>
              <button
                onClick={() => onNavigate('profile')}
                className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Profil & Password</span>
              </button>
            </div>
          </div>

          {/* Right Gamified Level & Overall Progress Box */}
          <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-5 min-w-[260px] sm:min-w-[300px] space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-200 block">
                    Level Akademik {studentLevel}
                  </span>
                  <h4 className="text-sm font-extrabold text-white">{studentXP} XP Terkumpul</h4>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#1cd485] text-slate-950 text-[11px] font-black">
                {overallProgressPercent}% Tuntas
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-semibold text-blue-100">
                <span>Progres Tuntas Kelas</span>
                <span>{completedLearningItems} / {totalLearningItems} Misi</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950/30 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-[#1cd485] to-amber-300 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(6, overallProgressPercent)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-blue-100/80 pt-0.5">
                <span>{myCompletedMaterialsCount}/{myMaterials.length} Materi</span>
                <span>{completedAssignments.length}/{classAssignments.length} Tugas</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ======================================================== */}
        {/* LEFT / CENTER COLUMN                                     */}
        {/* ======================================================== */}
        <div className="lg:col-span-8 space-y-6">
          {/* Top 4 Stat Cards in 2x2 Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* 1. Primary Solid Blue Card: Tugas Aktif */}
            <div
              onClick={() => onNavigate('assignments')}
              className="bg-[#3b5bf5] text-white rounded-3xl p-6 shadow-xl shadow-blue-500/20 relative overflow-hidden flex flex-col justify-between cursor-pointer hover:scale-[1.01] transition-all group"
            >
              <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

              <div className="flex items-center justify-between mb-5 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#1cd485] text-slate-950">
                  {activeAssignments.length > 0 ? 'Siap Dikerjakan' : 'Tuntas'}
                </span>
              </div>

              <div className="relative z-10">
                <p className="text-xs font-medium text-white/80 mb-1">Tugas & Ujian Aktif</p>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {activeAssignments.length} Tugas
                </h3>
              </div>

              <div className="pt-4 mt-3 border-t border-white/15 flex items-center justify-between text-[11px] text-white/70 relative z-10">
                <span>{activeAssignments.length > 0 ? 'Klik untuk mulai mengerjakan' : 'Semua tugas telah selesai'}</span>
                <span className="font-semibold text-white group-hover:translate-x-1 transition-transform">&rarr;</span>
              </div>
            </div>

            {/* 2. Total Materi */}
            <div
              onClick={() => onNavigate('materials')}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all group"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#1cd485]/15 text-[#0fa868]">
                  {myCompletedMaterialsCount}/{myMaterials.length} Selesai
                </span>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400 mb-1">Materi Pembelajaran</p>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  {myMaterials.length} Modul
                </h3>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>{myCompletedMaterialsCount > 0 ? `${myCompletedMaterialsCount} modul selesai dipelajari` : 'Bahan ajar siap dipelajari'}</span>
                <span className="font-semibold text-slate-700 group-hover:translate-x-1 transition-transform">&rarr;</span>
              </div>
            </div>

            {/* 3. Tugas Selesai */}
            <div
              onClick={() => onNavigate('history')}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all group"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600">
                  Terkumpul
                </span>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400 mb-1">Tugas Telah Dikirim</p>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  {completedAssignments.length} Selesai
                </h3>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Lihat riwayat jawaban terkirim</span>
                <span className="font-semibold text-slate-700 group-hover:translate-x-1 transition-transform">&rarr;</span>
              </div>
            </div>

            {/* 4. Nilai Evaluasi & Rata-Rata Real */}
            <div
              onClick={() => onNavigate('grades')}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all group"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
                  <Award className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#1cd485]/15 text-[#0fa868]">
                  {myGrades.length > 0 ? `${myGrades.length} Dinilai` : 'Menunggu Nilai'}
                </span>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400 mb-1">Rata-Rata Nilai Evaluasi</p>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  {averageScore !== null ? averageScore : '—'}
                </h3>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  {latestGrade ? `Nilai terbaru: ${latestGrade.score} poin` : 'Klik untuk cek transkrip nilai'}
                </span>
                <span className="font-semibold text-slate-700 group-hover:translate-x-1 transition-transform">&rarr;</span>
              </div>
            </div>
          </div>

          {/* Interactive Activity & Subject Progress Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-lg font-bold text-slate-900 tracking-tight">
                  {chartViewMode === 'subjects' ? 'Progres Belajar per Mata Pelajaran' : 'Aktivitas Belajar Mingguan'}
                </h4>
                <p className="text-xs text-slate-400">
                  {chartViewMode === 'subjects'
                    ? 'Persentase ketuntasan membaca modul & mengerjakan tugas di kelasmu'
                    : 'Rekap frekuensi pengerjaan tugas dan membaca modul setiap hari'}
                </p>
              </div>

              {/* Live Mode Toggle Pill */}
              <div className="inline-flex items-center bg-slate-100 p-1 rounded-full self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setChartViewMode('subjects')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    chartViewMode === 'subjects'
                      ? 'bg-[#3b5bf5] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Per Mapel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChartViewMode('weekly')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    chartViewMode === 'weekly'
                      ? 'bg-[#3b5bf5] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Minggu Ini</span>
                </button>
              </div>
            </div>

            {chartViewMode === 'subjects' ? (
              <div className="space-y-3.5 pt-1">
                {subjectProgressData.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-100">
                    Belum ada mata pelajaran yang terdaftar untuk kelasmu.
                  </div>
                ) : (
                  subjectProgressData.map((sub) => (
                    <div
                      key={sub.id}
                      onClick={() => onNavigate('materials')}
                      className="p-4 rounded-2xl bg-slate-50 hover:bg-blue-50/50 border border-slate-100 hover:border-blue-200 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#3b5bf5] shrink-0"></span>
                          <h5 className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-[#3b5bf5] transition-colors">
                            {sub.name}
                          </h5>
                        </div>
                        <span className="text-xs font-extrabold text-[#3b5bf5] shrink-0">{sub.pct}% Selesai</span>
                      </div>

                      <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden mb-2">
                        <div
                          className="h-full bg-gradient-to-r from-[#3b5bf5] to-[#1cd485] rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(4, sub.pct)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>📖 {sub.doneMats}/{sub.totalMats} Modul Materi</span>
                        <span>📝 {sub.doneAsgs}/{sub.totalAsgs} Tugas & Ujian</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <>
                {/* Legend */}
                <div className="flex items-center gap-5 text-xs">
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                    <span>Modul Dibaca</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3b5bf5]"></span>
                    <span>Kuis & Tugas</span>
                  </div>
                </div>

                {/* Chart */}
                <div className="relative pt-6 pb-2">
                  <div className="h-56 flex items-end justify-between px-3">
                    {weeklyData.map((item, idx) => {
                      const isHovered = activeBarHover === idx;
                      return (
                        <div
                          key={item.day}
                          className="flex flex-col items-center gap-2 flex-1 relative group cursor-pointer"
                          onMouseEnter={() => setActiveBarHover(idx)}
                          onClick={() => onNavigate('assignments')}
                        >
                          {/* Floating Tooltip */}
                          {isHovered && (
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-20 bg-slate-950 text-white rounded-2xl px-3 py-1.5 shadow-xl whitespace-nowrap pointer-events-none">
                              <span className="text-[10px] font-bold text-[#3b5bf5] mr-1.5">{item.blueVal} Tugas</span>
                              <span className="text-[10px] text-slate-300">&bull; {item.grayVal} Modul</span>
                              <div className="w-2 h-2 bg-slate-950 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                            </div>
                          )}

                          <div className="flex items-end gap-1.5 h-full">
                            <div
                              style={{ height: item.grayHeight }}
                              className={`w-3 sm:w-4 rounded-t-xl transition-all duration-300 ${
                                isHovered ? 'bg-slate-300' : 'bg-slate-200'
                              }`}
                            ></div>
                            <div
                              style={{ height: item.blueHeight }}
                              className={`w-3 sm:w-4 rounded-t-xl transition-all duration-300 ${
                                isHovered ? 'bg-[#2a45d4] shadow-md shadow-blue-500/30' : 'bg-[#3b5bf5]'
                              }`}
                            ></div>
                          </div>

                          <span className={`text-xs transition-colors mt-2 ${
                            isHovered ? 'text-slate-900 font-bold' : 'text-slate-400'
                          }`}>
                            {item.day}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Interactive Quick Modul Materi Checklist right from Dashboard */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-bold text-slate-900 tracking-tight">Modul Materi Terbaru</h4>
                <p className="text-xs text-slate-400">Klik tombol centang untuk menandai modul sudah dipelajari (+50 XP)</p>
              </div>
              <button
                onClick={() => onNavigate('materials')}
                className="text-xs text-[#3b5bf5] hover:underline font-semibold cursor-pointer"
              >
                Buka Semua Modul &rarr;
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {myMaterials.length === 0 ? (
                <div className="col-span-2 p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-100">
                  Belum ada modul materi yang dipublikasikan untuk kelasmu.
                </div>
              ) : (
                myMaterials.slice(0, 4).map((mat) => {
                  const sub = subjects.find(s => s.id === mat.subject_id);
                  const isDone = isMaterialCompleted(mat.id, studentKey);
                  return (
                    <div
                      key={mat.id}
                      className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                        isDone
                          ? 'bg-emerald-50/50 border-emerald-200/80'
                          : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div
                        onClick={() => onNavigate('materials')}
                        className="min-w-0 flex-1 cursor-pointer"
                      >
                        <span className="text-[10px] font-bold text-[#3b5bf5] uppercase tracking-wider block">
                          {sub?.name || 'Materi Kelas'}
                        </span>
                        <h5 className="text-xs font-bold text-slate-900 truncate mt-0.5">{mat.title}</h5>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {isDone ? '✅ Sudah dipelajari' : '📖 Klik untuk baca modul'}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={togglingMatId === mat.id}
                        onClick={() => handleToggleMaterial(mat.id)}
                        title={isDone ? 'Tandai belum selesai' : 'Tandai sudah selesai dipelajari'}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                          isDone
                            ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                            : 'bg-white border border-slate-200 text-slate-400 hover:border-[#3b5bf5] hover:text-[#3b5bf5]'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN                                             */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Daftar Tugas Mendesak */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-bold text-slate-900 tracking-tight">Tugas Mendesak</h4>
                <p className="text-xs text-slate-400">Wajib segera diselesaikan</p>
              </div>
              <button
                onClick={() => onNavigate('assignments')}
                className="text-xs text-[#3b5bf5] hover:underline font-semibold cursor-pointer"
              >
                Lihat Semua
              </button>
            </div>

            <div className="space-y-3 pt-1">
              {activeAssignments.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs rounded-2xl bg-slate-50 border border-slate-100">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">Semua tugas tuntas!</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Tidak ada tugas aktif yang menanti.</p>
                </div>
              ) : (
                activeAssignments.slice(0, 4).map((asg) => {
                  const subject = subjects.find(s => s.id === asg.subject_id);
                  return (
                    <div
                      key={asg.id}
                      onClick={() => onNavigate('assignments')}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 hover:border-blue-200 hover:bg-blue-50/40 transition-all cursor-pointer"
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-[#3b5bf5] uppercase tracking-wider block">
                          {subject?.name || 'Umum'}
                        </span>
                        <h5 className="text-xs font-bold text-slate-900 truncate mt-0.5">{asg.title}</h5>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>{asg.duration_minutes ? `${asg.duration_minutes} Menit` : 'Tanpa Timer'}</span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate('assignments');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#3b5bf5] hover:bg-blue-600 text-white font-semibold text-xs shadow-sm shrink-0 cursor-pointer"
                      >
                        Kerjakan
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Card 2: Pengumuman Sekolah (Clickable for Detail Modal) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-bold text-slate-900 tracking-tight">Pengumuman Guru</h4>
                <p className="text-xs text-slate-400">Klik pengumuman untuk baca selengkapnya</p>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-[#3b5bf5] animate-pulse"></span>
            </div>

            <div className="space-y-3">
              {announcements.slice(0, 4).map((ann) => (
                <div
                  key={ann.id}
                  onClick={() => setSelectedAnnouncement(ann)}
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50/50 border border-slate-100 hover:border-blue-200 space-y-1 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <BellRing className="w-3.5 h-3.5 text-[#3b5bf5] shrink-0" />
                      <h5 className="text-xs font-bold text-slate-900 truncate group-hover:text-[#3b5bf5]">
                        {ann.title}
                      </h5>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#3b5bf5] shrink-0" />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed pl-5 line-clamp-2">{ann.content}</p>
                </div>
              ))}
              {announcements.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">Belum ada pengumuman baru.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Detail Pengumuman */}
      {selectedAnnouncement && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedAnnouncement(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#3b5bf5] flex items-center justify-center shrink-0">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#3b5bf5]">
                    Pengumuman Resmi Guru
                  </span>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                    {selectedAnnouncement.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {selectedAnnouncement.content}
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="px-4 py-2 rounded-xl bg-[#3b5bf5] hover:bg-blue-600 text-white text-xs font-bold cursor-pointer"
              >
                Mengerti & Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
