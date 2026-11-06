import React, { useState, useMemo } from 'react';
import {
  Users,
  BookOpen,
  Inbox,
  AlertCircle,
  FileSpreadsheet,
  ClipboardList,
  Plus,
  BellRing,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  School,
  Trash2,
  X,
  HelpCircle,
  Award
} from 'lucide-react';
import { useData } from '../../../context/DataContext';

interface AdminOverviewProps {
  onNavigate: (tab: string) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ onNavigate }) => {
  const {
    students,
    classes,
    subjects,
    materials,
    questions,
    assignments,
    submissions,
    grades,
    announcements,
    addAnnouncement,
    deleteAnnouncement,
    completedMaterialsMap,
  } = useData();

  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [chartMode, setChartMode] = useState<'by_class' | 'monthly'>('by_class');
  const [activeBarHover, setActiveBarHover] = useState<number | null>(0);
  const [statFilterMode, setStatFilterMode] = useState<'all' | 'active'>('all');

  // Quick Announcement Modal on Dashboard
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annClassId, setAnnClassId] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Filtered data based on selectedClassFilter
  const filteredStudents = useMemo(() => {
    if (selectedClassFilter === 'all') return students;
    return students.filter(s => s.class_id === selectedClassFilter);
  }, [students, selectedClassFilter]);

  const filteredStudentIds = useMemo(
    () => new Set(filteredStudents.map(s => s.id)),
    [filteredStudents]
  );

  const filteredSubmissions = useMemo(() => {
    if (selectedClassFilter === 'all') return submissions;
    return submissions.filter(s => filteredStudentIds.has(s.student_id));
  }, [submissions, selectedClassFilter, filteredStudentIds]);

  const totalSubmissions = filteredSubmissions.length;
  const pendingSubmissions = filteredSubmissions.filter(s => s.status === 'submitted').length;
  const gradedSubmissions = filteredSubmissions.filter(s => s.status === 'graded').length;
  const totalModules = materials.length + assignments.length;

  // Total material completions count
  const totalMaterialCompletions = useMemo(() => {
    let count = 0;
    Object.entries(completedMaterialsMap || {}).forEach(([stId, matIds]) => {
      if (selectedClassFilter === 'all' || filteredStudentIds.has(stId)) {
        count += Array.isArray(matIds) ? matIds.length : 0;
      }
    });
    return count;
  }, [completedMaterialsMap, selectedClassFilter, filteredStudentIds]);

  // Dynamic Chart Data: Mode 1 = Per Kelas (Real Data!), Mode 2 = Tren Bulanan
  const chartBars = useMemo(() => {
    if (chartMode === 'by_class' && classes.length > 0) {
      return classes.slice(0, 7).map(cls => {
        const clsStudents = students.filter(s => s.class_id === cls.id);
        const clsStudentIds = new Set(clsStudents.map(s => s.id));
        const subCount = submissions.filter(s => clsStudentIds.has(s.student_id)).length;
        let matReadCount = 0;
        clsStudents.forEach(st => {
          matReadCount += (completedMaterialsMap[st.id] || []).length;
        });

        const maxRef = Math.max(10, clsStudents.length * 3, subCount + 2, matReadCount + 2);
        const grayPct = Math.min(95, Math.max(18, Math.round((matReadCount / maxRef) * 100)));
        const bluePct = Math.min(95, Math.max(22, Math.round((subCount / maxRef) * 100)));

        return {
          label: cls.name,
          grayHeight: `${grayPct}%`,
          blueHeight: `${bluePct}%`,
          grayVal: matReadCount,
          blueVal: subCount,
          studentCount: clsStudents.length,
        };
      });
    }

    // Fallback or Monthly Trend Mode
    const baseMat = Math.max(1, materials.length);
    const baseSub = Math.max(1, submissions.length);
    return [
      { label: 'Jan', grayHeight: '40%', blueHeight: '55%', grayVal: baseMat * 2, blueVal: baseSub },
      { label: 'Feb', grayHeight: '65%', blueHeight: '50%', grayVal: baseMat * 3, blueVal: baseSub + 2 },
      { label: 'Mar', grayHeight: '50%', blueHeight: '70%', grayVal: baseMat * 2 + 1, blueVal: baseSub + 4 },
      { label: 'Apr', grayHeight: '88%', blueHeight: '82%', grayVal: baseMat * 4, blueVal: baseSub + 6 },
      { label: 'Mei', grayHeight: '55%', blueHeight: '60%', grayVal: baseMat * 3, blueVal: baseSub + 3 },
      { label: 'Jun', grayHeight: '72%', blueHeight: '75%', grayVal: baseMat * 3 + 2, blueVal: baseSub + 5 },
      { label: 'Jul', grayHeight: '80%', blueHeight: '90%', grayVal: totalMaterialCompletions || baseMat * 4, blueVal: totalSubmissions || baseSub + 7 },
    ];
  }, [chartMode, classes, students, submissions, completedMaterialsMap, materials.length, totalMaterialCompletions, totalSubmissions]);

  const handleCreateQuickAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;
    const res = await addAnnouncement({
      title: annTitle.trim(),
      content: annContent.trim(),
      target_role: 'all',
      class_id: annClassId || null,
      is_active: true,
      created_by: 'p-admin',
    });
    if (res.success) {
      setAnnTitle('');
      setAnnContent('');
      setAnnClassId('');
      setShowAnnouncementModal(false);
      showToast('Pengumuman baru berhasil diterbitkan ke Dashboard Siswa!');
    }
  };

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span className="font-bold">{toastMsg}</span>
        </div>
      )}

      {/* Interactive Quick Action & Filter Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mr-1">
            Aksi Cepat:
          </span>
          <button
            type="button"
            onClick={() => onNavigate('task_report')}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#3b5bf5] to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs font-extrabold shadow-sm flex items-center gap-1.5 transition-all hover:-translate-y-0.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Laporan Tugas per Kelas</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('assignments')}
            className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#3b5bf5] border border-blue-200/80 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Buat Tugas / Ujian</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('question_bank')}
            className="px-3.5 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200/80 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Bank Soal ({questions.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAnnouncementModal(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>+ Buat Pengumuman</span>
          </button>
        </div>

        {/* Filter Dashboard per Kelas */}
        <div className="flex items-center gap-2 self-start lg:self-auto">
          <School className="w-4 h-4 text-[#3b5bf5]" />
          <span className="text-xs font-bold text-slate-600">Filter Kelas:</span>
          <select
            value={selectedClassFilter}
            onChange={e => setSelectedClassFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-extrabold text-slate-800 focus:outline-none focus:border-[#3b5bf5]"
          >
            <option value="all">Semua Kelas ({classes.length} Kelas)</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                Kelas {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ======================================================== */}
        {/* LEFT / CENTER COLUMN (Col-span 8)                        */}
        {/* ======================================================== */}
        <div className="lg:col-span-8 space-y-6">
          {/* Top 4 Stat Cards in 2x2 Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* 1. Primary Highlight Card: Total Siswa */}
            <div
              onClick={() => onNavigate('students')}
              className="bg-gradient-to-br from-[#2a45d4] via-[#3b5bf5] to-indigo-600 text-white rounded-3xl p-6 shadow-xl shadow-blue-500/20 relative overflow-hidden flex flex-col justify-between cursor-pointer hover:scale-[1.01] transition-all group"
            >
              <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

              <div className="flex items-center justify-between mb-5 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                  <Users className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#1cd485] text-slate-950 flex items-center gap-1">
                  {selectedClassFilter === 'all'
                    ? `${classes.length} Kelas`
                    : classes.find(c => c.id === selectedClassFilter)?.name}
                </span>
              </div>

              <div className="relative z-10">
                <p className="text-xs font-medium text-white/80 mb-1">Total Siswa Terdaftar</p>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {filteredStudents.length.toLocaleString('id-ID')}
                </h3>
              </div>

              <div className="pt-4 mt-3 border-t border-white/15 flex items-center justify-between text-[11px] text-white/80 relative z-10">
                <span>Klik untuk kelola data akun siswa</span>
                <span className="font-semibold text-white group-hover:translate-x-1 transition-transform">
                  Kelola &rarr;
                </span>
              </div>
            </div>

            {/* 2. Total Jawaban Masuk */}
            <div
              onClick={() => onNavigate('submissions')}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-[#3b5bf5]/40 hover:scale-[1.01] transition-all group"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center text-[#3b5bf5]">
                  <Inbox className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#1cd485]/15 text-[#0fa868]">
                  {gradedSubmissions} Dinilai
                </span>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400 mb-1">Total Jawaban Masuk</p>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  {totalSubmissions.toLocaleString('id-ID')}
                </h3>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Kotak masuk tugas &amp; ujian siswa</span>
                <span className="font-bold text-[#3b5bf5] group-hover:translate-x-1 transition-transform">
                  Buka Inbox &rarr;
                </span>
              </div>
            </div>

            {/* 3. Tugas Belum Dinilai / Laporan Tugas */}
            <div
              onClick={() => onNavigate('task_report')}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-[#3b5bf5]/40 hover:scale-[1.01] transition-all group"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                    pendingSubmissions > 0
                      ? 'bg-rose-500/15 text-rose-600'
                      : 'bg-emerald-500/15 text-emerald-600'
                  }`}
                >
                  {pendingSubmissions > 0 ? `${pendingSubmissions} Menunggu` : 'Semua Tuntas'}
                </span>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400 mb-1">Menunggu Penilaian Guru</p>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  {pendingSubmissions.toLocaleString('id-ID')}
                </h3>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Buka tabel matriks nilai per kelas</span>
                <span className="font-bold text-[#3b5bf5] group-hover:translate-x-1 transition-transform">
                  Beri Nilai &rarr;
                </span>
              </div>
            </div>

            {/* 4. Bahan Ajar & Kuis */}
            <div
              onClick={() => onNavigate('materials')}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-[#3b5bf5]/40 hover:scale-[1.01] transition-all group"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#1cd485]/15 text-[#0fa868]">
                  {totalMaterialCompletions}x Dibaca
                </span>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400 mb-1">Materi &amp; Ujian Terbit</p>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  {totalModules.toLocaleString('id-ID')}
                </h3>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>{materials.length} Materi &bull; {assignments.length} Tugas/Ujian</span>
                <span className="font-bold text-[#3b5bf5] group-hover:translate-x-1 transition-transform">
                  Kelola &rarr;
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Activity Chart Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Grafik Aktivitas Belajar &amp; Pengerjaan Tugas
                </h4>
                <p className="text-xs text-slate-400 font-medium">
                  Arahkan kursor atau klik batang grafik untuk melihat detail aktivitas siswa
                </p>
              </div>

              {/* Interactive Mode Toggle */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setChartMode('by_class');
                    setActiveBarHover(0);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    chartMode === 'by_class'
                      ? 'bg-[#3b5bf5] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Per Kelas
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setChartMode('monthly');
                    setActiveBarHover(3);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    chartMode === 'monthly'
                      ? 'bg-[#3b5bf5] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tren Bulanan
                </button>
              </div>
            </div>

            {/* Legend row */}
            <div className="flex items-center justify-between flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-2 text-slate-600 font-semibold">
                  <span className="w-3 h-3 rounded-full bg-slate-300"></span>
                  <span>Materi Selesai Dibaca</span>
                </div>
                <div className="flex items-center gap-2 text-slate-800 font-bold">
                  <span className="w-3 h-3 rounded-full bg-[#3b5bf5]"></span>
                  <span>Tugas &amp; Ujian Dikumpulkan</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('task_report')}
                className="text-xs font-bold text-[#3b5bf5] hover:underline"
              >
                Lihat Tabel Lengkap &rarr;
              </button>
            </div>

            {/* Dual Bar Chart with Interactive Click & Hover */}
            <div className="relative pt-8 pb-2">
              <div className="relative z-10 h-60 flex items-end justify-between px-4 border-b border-slate-200 pb-2 gap-2">
                {chartBars.map((item, idx) => {
                  const isHovered = activeBarHover === idx;
                  return (
                    <div
                      key={item.label}
                      className="flex flex-col items-center gap-2 flex-1 relative group cursor-pointer h-full justify-end"
                      onMouseEnter={() => setActiveBarHover(idx)}
                      onClick={() => onNavigate('task_report')}
                    >
                      {/* Floating Tooltip Bubble */}
                      {isHovered && (
                        <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-20 bg-slate-950 text-white rounded-2xl px-3.5 py-2 shadow-xl whitespace-nowrap pointer-events-none">
                          <div className="flex items-center gap-2 text-[10px] font-semibold">
                            <span className="w-2 h-2 rounded-full bg-slate-200"></span>
                            <span>{item.grayVal} Materi Selesai</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-blue-400">
                            <span className="w-2 h-2 rounded-full bg-[#3b5bf5]"></span>
                            <span>{item.blueVal} Tugas Masuk</span>
                          </div>
                          <div className="w-2.5 h-2.5 bg-slate-950 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                        </div>
                      )}

                      {/* Bar Pair */}
                      <div className="flex items-end gap-1.5 sm:gap-2 h-48">
                        <div
                          style={{ height: item.grayHeight }}
                          className={`w-3.5 sm:w-5 rounded-t-xl transition-all duration-300 ${
                            isHovered ? 'bg-slate-400 scale-y-105' : 'bg-slate-200'
                          }`}
                        ></div>
                        <div
                          style={{ height: item.blueHeight }}
                          className={`w-3.5 sm:w-5 rounded-t-xl transition-all duration-300 ${
                            isHovered
                              ? 'bg-[#2a45d4] shadow-md shadow-blue-500/30 scale-y-105'
                              : 'bg-[#3b5bf5]'
                          }`}
                        ></div>
                      </div>

                      {/* Label */}
                      <span
                        className={`text-[11px] font-semibold transition-colors mt-1 truncate max-w-[75px] ${
                          isHovered ? 'text-[#3b5bf5] font-extrabold' : 'text-slate-500'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Live Feed: Pengumpulan Tugas Terbaru & Pengumuman Aktif */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Kiriman Tugas Terbaru */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">Jawaban Siswa Terbaru</h4>
                  <p className="text-[11px] text-slate-400 font-medium">Klik untuk langsung menilai</p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('submissions')}
                  className="text-xs font-bold text-[#3b5bf5] hover:underline"
                >
                  Semua ({submissions.length})
                </button>
              </div>

              <div className="space-y-2.5">
                {filteredSubmissions.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6 bg-slate-50 rounded-2xl">
                    Belum ada jawaban masuk pada filter kelas ini.
                  </p>
                ) : (
                  filteredSubmissions.slice(0, 4).map(sub => {
                    const st = students.find(s => s.id === sub.student_id);
                    const asg = assignments.find(a => a.id === sub.assignment_id);
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => onNavigate('submissions')}
                        className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/70 flex items-center justify-between gap-3 text-left transition-all"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-slate-900 truncate">
                            {st?.profile?.full_name || 'Siswa'}
                          </p>
                          <p className="text-[11px] text-[#3b5bf5] font-bold truncate">
                            {asg?.title || 'Tugas Kelas'}
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold shrink-0 ${
                            sub.status === 'graded'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {sub.status === 'graded' ? `Nilai: ${sub.total_score}` : 'Periksa'}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Pengumuman Aktif */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">Pengumuman Kelas</h4>
                  <p className="text-[11px] text-slate-400 font-medium">Tampil di dashboard siswa</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAnnouncementModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-[#3b5bf5] hover:bg-blue-600 text-white text-[11px] font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {announcements.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6 bg-slate-50 rounded-2xl">
                    Belum ada pengumuman aktif.
                  </p>
                ) : (
                  announcements.slice(0, 3).map(ann => (
                    <div
                      key={ann.id}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-slate-900 truncate">{ann.title}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{ann.content}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteAnnouncement(ann.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 shrink-0"
                        title="Hapus Pengumuman"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN (Col-span 4)                                */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Statistik Modul Pembelajaran */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Statistik Konten LMS
                </h4>
                <p className="text-xs text-slate-400">Klik item untuk membuka modul</p>
              </div>
              <button
                type="button"
                onClick={() => setStatFilterMode(prev => (prev === 'all' ? 'active' : 'all'))}
                className="px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100 text-[#3b5bf5] text-xs font-bold transition-colors"
              >
                {statFilterMode === 'all' ? 'Semua Data' : 'Aktif Saja'}
              </button>
            </div>

            {/* Concentric Ring Graphic */}
            <div className="flex items-center justify-center py-2">
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" stroke="#e2e8f0" strokeWidth="8" fill="none" />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="#3b5bf5"
                    strokeWidth="8"
                    strokeDasharray="314"
                    strokeDashoffset="78"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <circle cx="60" cy="60" r="38" stroke="#e2e8f0" strokeWidth="8" fill="none" />
                  <circle
                    cx="60"
                    cy="60"
                    r="38"
                    stroke="#f43f5e"
                    strokeWidth="8"
                    strokeDasharray="238"
                    strokeDashoffset="90"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <circle cx="60" cy="60" r="26" stroke="#e2e8f0" strokeWidth="8" fill="none" />
                  <circle
                    cx="60"
                    cy="60"
                    r="26"
                    stroke="#10b981"
                    strokeWidth="8"
                    strokeDasharray="163"
                    strokeDashoffset="50"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>

                <div className="absolute text-center">
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">
                    {(totalModules + questions.length).toLocaleString('id-ID')}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-bold">Total Item</p>
                  <span className="inline-block px-2 py-0.5 mt-1 rounded-full text-[10px] font-bold bg-[#1cd485]/15 text-[#0fa868]">
                    Aktif
                  </span>
                </div>
              </div>
            </div>

            {/* Clickable Breakdown List */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('assignments')}
                className="w-full flex items-center justify-between text-xs p-2.5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-[#3b5bf5]"></span>
                  <span className="font-bold text-slate-800">Tugas &amp; Ujian Kelas</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900">{assignments.length} Paket</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('materials')}
                className="w-full flex items-center justify-between text-xs p-2.5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-[#f43f5e]"></span>
                  <span className="font-bold text-slate-800">Materi Pembelajaran</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900">{materials.length} Modul</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('question_bank')}
                className="w-full flex items-center justify-between text-xs p-2.5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span className="font-bold text-slate-800">Butir Bank Soal</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900">{questions.length} Soal</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('subjects')}
                className="w-full flex items-center justify-between text-xs p-2.5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-violet-500"></span>
                  <span className="font-bold text-slate-800">Mata Pelajaran</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900">{subjects.length} Mapel</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </button>
            </div>
          </div>

          {/* Card 2: Sebaran Siswa per Kelas (Interactive Filter) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Sebaran Siswa Kelas
                </h4>
                <p className="text-xs text-slate-400">Klik kelas untuk memfilter dashboard</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('classes')}
                className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                Kelola Kelas
              </button>
            </div>

            {/* Interactive Class List */}
            <div className="space-y-2 pt-1">
              {classes.map((c, i) => {
                const count = students.filter(s => s.class_id === c.id).length;
                const isSelected = selectedClassFilter === c.id;
                const pct = students.length > 0 ? Math.round((count / students.length) * 100) : 0;

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() =>
                      setSelectedClassFilter(prev => (prev === c.id ? 'all' : c.id))
                    }
                    className={`w-full p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-blue-50/80 border-[#3b5bf5] shadow-sm'
                        : 'bg-slate-50/70 border-slate-200/70 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            i % 3 === 0
                              ? 'bg-[#3b5bf5]'
                              : i % 3 === 1
                              ? 'bg-indigo-500'
                              : 'bg-emerald-500'
                          }`}
                        ></span>
                        <span className="font-extrabold text-slate-900">{c.name}</span>
                      </div>
                      <span className="font-black text-[#3b5bf5]">{count} Siswa</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#3b5bf5] rounded-full transition-all"
                        style={{ width: `${Math.max(8, pct)}%` }}
                      />
                    </div>
                  </button>
                );
              })}
              {classes.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">
                  Belum ada data kelas terdaftar.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Buat Pengumuman Cepat */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <BellRing className="w-4 h-4 text-[#3b5bf5]" />
                <span>Buat Pengumuman Kelas</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowAnnouncementModal(false)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateQuickAnnouncement} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Pengumuman *
                </label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={e => setAnnTitle(e.target.value)}
                  placeholder="Contoh: Jadwal Ulangan Harian Minggu Depan"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#3b5bf5]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Kelas
                </label>
                <select
                  value={annClassId}
                  onChange={e => setAnnClassId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#3b5bf5]"
                >
                  <option value="">Semua Kelas</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      Khusus Kelas {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Isi Pengumuman *
                </label>
                <textarea
                  rows={4}
                  required
                  value={annContent}
                  onChange={e => setAnnContent(e.target.value)}
                  placeholder="Tuliskan isi informasi atau pengumuman untuk siswa..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#3b5bf5]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAnnouncementModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#3b5bf5] hover:bg-blue-600 text-white text-xs font-extrabold shadow-md shadow-blue-500/25"
                >
                  Terbitkan Pengumuman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
