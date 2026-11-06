import React, { useState, useMemo } from 'react';
import {
  ClipboardList,
  Search,
  School,
  BookOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit3,
  Award,
  Download,
  FileText,
  X,
  UserCheck,
  Sparkles,
  Filter
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { Assignment, Student, Submission, Grade } from '../../../types/database.types';
import { TablePaginationBar, paginateArray } from '../../../components/TablePaginationBar';
import { CustomCombobox } from '../../../components/CustomCombobox';

export const StudentTaskReportTable: React.FC = () => {
  const {
    students,
    classes,
    subjects,
    assignments,
    questions,
    submissions,
    grades,
    gradeStudentAssignment,
  } = useData();

  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'submitted' | 'pending_grade' | 'not_submitted'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [notification, setNotification] = useState<string | null>(null);

  // Modal state for grading directly from table cell
  const [activeGradingCell, setActiveGradingCell] = useState<{
    student: Student;
    assignment: Assignment;
    submission?: Submission;
    grade?: Grade;
  } | null>(null);
  const [inputScore, setInputScore] = useState<number>(85);
  const [inputFeedback, setInputFeedback] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const showNotif = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Helper to resolve which classes an assignment belongs to
  const getAssignmentClassIds = (asg: Assignment): string[] => {
    if (Array.isArray(asg.class_ids) && asg.class_ids.length > 0) {
      return asg.class_ids;
    }
    if (asg.class_id) {
      return [asg.class_id];
    }
    const subj = subjects.find(s => s.id === asg.subject_id);
    if (subj && Array.isArray(subj.class_ids) && subj.class_ids.length > 0) {
      return subj.class_ids;
    }
    return [];
  };

  // Filtered assignments that appear as Table Headers
  const filteredAssignments = useMemo(() => {
    return assignments.filter(asg => {
      // Filter by subject if chosen
      if (selectedSubjectId !== 'all' && asg.subject_id !== selectedSubjectId) {
        return false;
      }
      // Filter by class if chosen
      if (selectedClassId !== 'all') {
        const targetClassIds = getAssignmentClassIds(asg);
        if (targetClassIds.length > 0 && !targetClassIds.includes(selectedClassId)) {
          return false;
        }
      }
      return true;
    });
  }, [assignments, selectedClassId, selectedSubjectId, subjects]);

  // Lookup map for quick cell access: key = `${studentId}_${assignmentId}`
  const submissionMap = useMemo(() => {
    const map = new Map<string, Submission>();
    submissions.forEach(sub => {
      map.set(`${sub.student_id}_${sub.assignment_id}`, sub);
    });
    return map;
  }, [submissions]);

  const gradeMap = useMemo(() => {
    const map = new Map<string, Grade>();
    grades.forEach(gr => {
      map.set(`${gr.student_id}_${gr.assignment_id}`, gr);
    });
    return map;
  }, [grades]);

  // Filtered students for table rows
  const filteredStudents = useMemo(() => {
    return students
      .filter(st => {
        if (selectedClassId !== 'all' && st.class_id !== selectedClassId) {
          return false;
        }
        const nameMatch = (st.profile?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const nisMatch = (st.nis_nisn || '').toLowerCase().includes(searchTerm.toLowerCase());
        if (searchTerm.trim() && !nameMatch && !nisMatch) {
          return false;
        }

        // Optional status filter across visible assignments
        if (selectedStatusFilter !== 'all' && filteredAssignments.length > 0) {
          const studentTargetAsgs = filteredAssignments.filter(asg => {
            const cIds = getAssignmentClassIds(asg);
            return cIds.length === 0 || Boolean(st.class_id && cIds.includes(st.class_id));
          });

          if (selectedStatusFilter === 'pending_grade') {
            return studentTargetAsgs.some(asg => {
              const sub = submissionMap.get(`${st.id}_${asg.id}`);
              const gr = gradeMap.get(`${st.id}_${asg.id}`);
              return sub && sub.status === 'submitted' && !gr;
            });
          }
          if (selectedStatusFilter === 'submitted') {
            return studentTargetAsgs.some(asg => {
              const sub = submissionMap.get(`${st.id}_${asg.id}`);
              const gr = gradeMap.get(`${st.id}_${asg.id}`);
              return Boolean(sub || gr);
            });
          }
          if (selectedStatusFilter === 'not_submitted') {
            return studentTargetAsgs.some(asg => {
              const sub = submissionMap.get(`${st.id}_${asg.id}`);
              const gr = gradeMap.get(`${st.id}_${asg.id}`);
              return !sub && !gr;
            });
          }
        }

        return true;
      })
      .sort((a, b) => {
        const classA = classes.find(c => c.id === a.class_id)?.name || '';
        const classB = classes.find(c => c.id === b.class_id)?.name || '';
        if (classA !== classB) return classA.localeCompare(classB);
        return (a.profile?.full_name || '').localeCompare(b.profile?.full_name || '');
      });
  }, [students, selectedClassId, searchTerm, selectedStatusFilter, filteredAssignments, submissionMap, gradeMap, classes]);

  const paginatedStudents = useMemo(
    () => paginateArray(filteredStudents, pageSize, currentPage),
    [filteredStudents, pageSize, currentPage]
  );

  // Summary metrics for top cards
  const summaryStats = useMemo(() => {
    let totalExpected = 0;
    let totalSubmitted = 0;
    let totalPendingGrade = 0;
    let totalGradedCount = 0;
    let scoreSum = 0;

    filteredStudents.forEach(st => {
      filteredAssignments.forEach(asg => {
        const cIds = getAssignmentClassIds(asg);
        const isForStudent = cIds.length === 0 || Boolean(st.class_id && cIds.includes(st.class_id));
        if (!isForStudent) return;

        totalExpected++;
        const sub = submissionMap.get(`${st.id}_${asg.id}`);
        const gr = gradeMap.get(`${st.id}_${asg.id}`);

        if (sub || gr) {
          totalSubmitted++;
        }
        if (gr || sub?.status === 'graded') {
          totalGradedCount++;
          const val = gr ? gr.score : (sub?.total_score ?? 0);
          scoreSum += Number(val);
        } else if (sub && sub.status === 'submitted') {
          totalPendingGrade++;
        }
      });
    });

    const avgScore = totalGradedCount > 0 ? Math.round((scoreSum / totalGradedCount) * 10) / 10 : 0;
    return {
      totalStudents: filteredStudents.length,
      totalAssignments: filteredAssignments.length,
      totalExpected,
      totalSubmitted,
      totalPendingGrade,
      totalGradedCount,
      avgScore,
    };
  }, [filteredStudents, filteredAssignments, submissionMap, gradeMap]);

  const handleOpenCellModal = (student: Student, assignment: Assignment) => {
    const sub = submissionMap.get(`${student.id}_${assignment.id}`);
    const gr = gradeMap.get(`${student.id}_${assignment.id}`);
    const existingScore = gr ? gr.score : (sub?.total_score ?? 85);
    const existingFeedback =
      gr?.feedback ||
      sub?.teacher_feedback ||
      'Kerja bagus! Terus tingkatkan pemahaman dan ketelitian Anda.';

    setActiveGradingCell({
      student,
      assignment,
      submission: sub,
      grade: gr,
    });
    setInputScore(existingScore);
    setInputFeedback(existingFeedback);
  };

  const handleSaveCellGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGradingCell) return;

    setIsSaving(true);
    const { student, assignment } = activeGradingCell;
    const res = await gradeStudentAssignment(
      student.id,
      assignment.id,
      Number(inputScore),
      inputFeedback
    );
    setIsSaving(false);

    if (res.success) {
      showNotif(
        `Nilai ${student.profile?.full_name} untuk "${assignment.title}" (${inputScore}) berhasil disimpan!`
      );
      setActiveGradingCell(null);
    } else {
      showNotif(`Gagal menyimpan nilai: ${res.error || 'Terjadi kesalahan'}`);
    }
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    const selectedClassName =
      selectedClassId === 'all'
        ? 'Semua_Kelas'
        : (classes.find(c => c.id === selectedClassId)?.name || 'Kelas').replace(/\s+/g, '_');

    const headers = [
      'No',
      'NISN',
      'Nama Siswa',
      'Kelas',
      ...filteredAssignments.map(
        a => `${a.title} (Maks ${a.total_points || 100})`
      ),
      'Tugas Dikerjakan',
      'Rata-Rata Nilai',
    ];

    const rows = filteredStudents.map((st, idx) => {
      const clsName = classes.find(c => c.id === st.class_id)?.name || '-';
      let completedCount = 0;
      let targetCount = 0;
      let sumScores = 0;
      let gradedCount = 0;

      const scoreCells = filteredAssignments.map(asg => {
        const cIds = getAssignmentClassIds(asg);
        const isForStudent = cIds.length === 0 || Boolean(st.class_id && cIds.includes(st.class_id));
        if (!isForStudent) return 'Bukan Kelasnya';

        targetCount++;
        const sub = submissionMap.get(`${st.id}_${asg.id}`);
        const gr = gradeMap.get(`${st.id}_${asg.id}`);

        if (gr || sub?.status === 'graded') {
          completedCount++;
          gradedCount++;
          const val = gr ? gr.score : (sub?.total_score ?? 0);
          sumScores += Number(val);
          return String(val);
        }
        if (sub && sub.status === 'submitted') {
          completedCount++;
          return 'Menunggu Koreksi';
        }
        return 'Belum Mengerjakan (0)';
      });

      const avg = gradedCount > 0 ? (sumScores / gradedCount).toFixed(1) : '0';

      return [
        String(idx + 1),
        st.nis_nisn || '-',
        st.profile?.full_name || '-',
        clsName,
        ...scoreCells,
        `${completedCount}/${targetCount}`,
        avg,
      ];
    });

    const csvContent =
      '\uFEFF' +
      [headers, ...rows]
        .map(row =>
          row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        )
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Tugas_Nilai_${selectedClassName}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm shadow-xl flex items-center gap-2.5 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-bold">{notification}</span>
        </div>
      )}

      {/* Quick Class Selector Pills */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-[#3b5bf5] flex items-center justify-center shrink-0">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900">
                Filter Laporan Tugas per Kelas
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">
                Pilih kelas untuk melihat tabel matriks tugas beserta nilai setiap siswa dan menilai langsung
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all self-start sm:self-auto shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Laporan Excel / CSV</span>
          </button>
        </div>

        {/* Class Pills */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <button
            type="button"
            onClick={() => setSelectedClassId('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedClassId === 'all'
                ? 'bg-[#3b5bf5] text-white shadow-md shadow-blue-500/25'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
            }`}
          >
            <span>Semua Kelas</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                selectedClassId === 'all' ? 'bg-white/20 text-white' : 'bg-white text-slate-600'
              }`}
            >
              {students.length} Siswa
            </span>
          </button>

          {classes.map(cls => {
            const count = students.filter(s => s.class_id === cls.id).length;
            const isSelected = selectedClassId === cls.id;
            return (
              <button
                key={cls.id}
                type="button"
                onClick={() => setSelectedClassId(cls.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#3b5bf5] text-white shadow-md shadow-blue-500/25'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                <span>{cls.name}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-white text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Secondary Filters: Subject, Status, Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          {/* Search Student */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Cari nama siswa atau NISN..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
            />
          </div>

          {/* Combobox Kelas */}
          <CustomCombobox
            icon={<School className="w-4 h-4" />}
            value={selectedClassId}
            onChange={(val) => setSelectedClassId(val)}
            options={[
              { value: 'all', label: 'Semua Kelas', badge: `${classes.length} Kelas` },
              ...classes.map((c) => ({
                value: c.id,
                label: `Kelas ${c.name}`,
                badge: `${students.filter((s) => s.class_id === c.id).length} Siswa`,
              })),
            ]}
          />

          {/* Combobox Mata Pelajaran */}
          <CustomCombobox
            icon={<BookOpen className="w-4 h-4" />}
            value={selectedSubjectId}
            onChange={(val) => setSelectedSubjectId(val)}
            options={[
              { value: 'all', label: 'Semua Mata Pelajaran', badge: subjects.length },
              ...subjects.map((s) => ({
                value: s.id,
                label: s.name,
                badge: s.code,
              })),
            ]}
          />

          {/* Combobox Status Pengerjaan */}
          <CustomCombobox
            icon={<Filter className="w-4 h-4" />}
            value={selectedStatusFilter}
            onChange={(val) => setSelectedStatusFilter(val as any)}
            searchable={false}
            options={[
              { value: 'all', label: 'Semua Status Pengerjaan' },
              { value: 'pending_grade', label: '⏳ Ada Tugas Menunggu Dinilai' },
              { value: 'submitted', label: '✓ Sudah Mengumpulkan Tugas' },
              { value: 'not_submitted', label: '○ Ada Tugas Belum Dikerjakan' },
            ]}
          />
        </div>
      </div>

      {/* Summary Cards for Selected Class */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Siswa Ditampilkan</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{summaryStats.totalStudents}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            {selectedClassId === 'all'
              ? 'Seluruh Kelas'
              : `Kelas ${classes.find(c => c.id === selectedClassId)?.name || ''}`}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Kolom Tugas</p>
          <p className="text-2xl font-extrabold text-[#3b5bf5] mt-1">{summaryStats.totalAssignments}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">Tugas & Kuis Aktif</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tugas Dikerjakan</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">
            {summaryStats.totalSubmitted}
            <span className="text-xs font-bold text-slate-400 ml-1">/ {summaryStats.totalExpected}</span>
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">Total Pengumpulan</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Perlu Dinilai</p>
          <p className="text-2xl font-extrabold text-amber-500 mt-1">{summaryStats.totalPendingGrade}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">Klik sel untuk menilai</p>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rata-Rata Nilai</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{summaryStats.avgScore}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Dari {summaryStats.totalGradedCount} tugas dinilai
          </p>
        </div>
      </div>

      {/* Filter Jumlah Baris Data */}
      <TablePaginationBar
        totalItems={filteredStudents.length}
        pageSize={pageSize}
        currentPage={currentPage}
        onPageSizeChange={setPageSize}
        onPageChange={setCurrentPage}
        itemLabel="siswa"
      />

      {/* Main Matrix Table: Students x Assignments */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-[#3b5bf5]" />
            <h4 className="text-sm font-extrabold text-slate-900">
              Tabel Laporan Tugas & Nilai Siswa{' '}
              {selectedClassId !== 'all' && (
                <span className="text-[#3b5bf5]">
                  — Kelas {classes.find(c => c.id === selectedClassId)?.name}
                </span>
              )}
            </h4>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              Sudah Dinilai
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
              Menunggu Dinilai
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block"></span>
              Belum Mengerjakan
            </span>
            <span className="text-[#3b5bf5] font-bold">
              💡 Tips: Klik langsung pada kotak nilai/tugas siswa untuk memberi atau mengubah nilai
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600">
                <th className="py-4 px-4 font-extrabold uppercase tracking-wider text-[11px] w-12 text-center border-r border-slate-200/60">
                  No
                </th>
                <th className="py-4 px-5 font-extrabold uppercase tracking-wider text-[11px] min-w-[220px] sticky left-0 bg-slate-50 z-10 border-r border-slate-200/80 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                  Nama Siswa & NISN
                </th>
                <th className="py-4 px-4 font-extrabold uppercase tracking-wider text-[11px] min-w-[110px] border-r border-slate-200/60">
                  Kelas
                </th>

                {/* Dynamic Assignment Headers */}
                {filteredAssignments.length === 0 ? (
                  <th className="py-4 px-5 font-bold text-slate-400 text-center min-w-[240px] border-r border-slate-200/60">
                    Belum Ada Tugas / Ujian pada Filter Ini
                  </th>
                ) : (
                  filteredAssignments.map((asg, index) => {
                    const subj = subjects.find(s => s.id === asg.subject_id);
                    // Calculate how many students in current view completed this assignment
                    const targetStudents = filteredStudents.filter(st => {
                      const cIds = getAssignmentClassIds(asg);
                      return cIds.length === 0 || Boolean(st.class_id && cIds.includes(st.class_id));
                    });
                    const submittedForAsg = targetStudents.filter(
                      st =>
                        submissionMap.has(`${st.id}_${asg.id}`) ||
                        gradeMap.has(`${st.id}_${asg.id}`)
                    ).length;

                    return (
                      <th
                        key={asg.id}
                        className="py-3.5 px-4 min-w-[195px] max-w-[230px] border-r border-slate-200/60 align-top bg-slate-50/90 hover:bg-blue-50/40 transition-colors"
                      >
                        <div className="space-y-1.5">
                          {/* Type & Package Badge */}
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider ${
                                asg.type === 'quiz'
                                  ? 'bg-indigo-100 text-indigo-700'
                                  : 'bg-blue-100 text-[#3b5bf5]'
                              }`}
                            >
                              {asg.type === 'quiz' ? `Ujian/Kuis #${index + 1}` : `Tugas #${index + 1}`}
                            </span>
                            {asg.category_name && (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-100 text-amber-800 truncate max-w-[100px]">
                                {asg.category_name}
                              </span>
                            )}
                          </div>

                          {/* Assignment Title */}
                          <p
                            className="font-extrabold text-slate-900 text-xs leading-snug line-clamp-2 normal-case"
                            title={asg.title}
                          >
                            {asg.title}
                          </p>

                          {/* Subject & Max Score Info */}
                          <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-semibold text-slate-500 normal-case">
                            <span className="truncate max-w-[110px]" title={subj?.name}>
                              {subj?.name || 'Mapel'}
                            </span>
                            <span className="text-slate-700 font-bold">
                              Maks: {asg.total_points || 100}
                            </span>
                          </div>

                          {/* Completion mini badge */}
                          <div className="flex items-center justify-between text-[10px] font-bold normal-case">
                            <span className="text-emerald-600">
                              {submittedForAsg}/{targetStudents.length} Selesai
                            </span>
                          </div>
                        </div>
                      </th>
                    );
                  })
                )}

                {/* Summary Columns */}
                <th className="py-4 px-4 font-extrabold uppercase tracking-wider text-[11px] min-w-[140px] text-center border-r border-slate-200/60 bg-slate-100/70">
                  Tugas Dikerjakan
                </th>
                <th className="py-4 px-5 font-extrabold uppercase tracking-wider text-[11px] min-w-[140px] text-center bg-slate-100/70">
                  Rata-Rata Nilai
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={4 + Math.max(1, filteredAssignments.length) + 1}
                    className="py-12 text-center text-slate-400 font-medium"
                  >
                    Tidak ada data siswa yang sesuai dengan filter kelas/pencarian.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student, rowIdx) => {
                  const studentClass = classes.find(c => c.id === student.class_id);
                  const displayRowNumber = pageSize <= 0 ? rowIdx + 1 : (currentPage - 1) * pageSize + rowIdx + 1;
                  let studentTargetCount = 0;
                  let studentCompletedCount = 0;
                  let studentGradedCount = 0;
                  let studentScoreSum = 0;

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-blue-50/20 transition-colors group"
                    >
                      {/* No */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400 border-r border-slate-100">
                        {displayRowNumber}
                      </td>

                      {/* Student Name & NISN (Sticky) */}
                      <td className="py-3.5 px-5 sticky left-0 bg-white group-hover:bg-[#f8faff] z-10 border-r border-slate-200/80 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              student.profile?.avatar_url ||
                              `https://api.dicebear.com/7.x/bottts/svg?seed=${student.nis_nisn}`
                            }
                            alt={student.profile?.full_name}
                            className="w-9 h-9 rounded-xl bg-slate-100 object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-900 text-xs truncate">
                              {student.profile?.full_name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono font-medium">
                              NISN: {student.nis_nisn}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Class */}
                      <td className="py-3.5 px-4 border-r border-slate-100">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px] inline-block">
                          {studentClass?.name || '—'}
                        </span>
                      </td>

                      {/* Dynamic Assignment Score Cells */}
                      {filteredAssignments.length === 0 ? (
                        <td className="py-3.5 px-4 text-center text-slate-400 border-r border-slate-100">
                          —
                        </td>
                      ) : (
                        filteredAssignments.map(asg => {
                          const cIds = getAssignmentClassIds(asg);
                          const isTargetedForStudent =
                            cIds.length === 0 || Boolean(student.class_id && cIds.includes(student.class_id));

                          if (!isTargetedForStudent) {
                            return (
                              <td
                                key={asg.id}
                                className="py-3 px-3 text-center border-r border-slate-100 bg-slate-50/40"
                              >
                                <span className="text-[10px] text-slate-300 font-medium italic">
                                  Bukan Kelasnya
                                </span>
                              </td>
                            );
                          }

                          studentTargetCount++;
                          const sub = submissionMap.get(`${student.id}_${asg.id}`);
                          const gr = gradeMap.get(`${student.id}_${asg.id}`);
                          const maxPoints = asg.total_points || 100;

                          const isGraded = Boolean(gr || sub?.status === 'graded');
                          const isSubmittedPending = Boolean(
                            sub && sub.status === 'submitted' && !gr
                          );

                          if (isGraded || isSubmittedPending) {
                            studentCompletedCount++;
                          }

                          if (isGraded) {
                            const finalScore = gr ? gr.score : (sub?.total_score ?? 0);
                            studentGradedCount++;
                            studentScoreSum += Number(finalScore);

                            const scoreBadgeColor =
                              finalScore >= 80
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80'
                                : finalScore >= 70
                                ? 'bg-blue-50 text-[#3b5bf5] border-blue-200 hover:bg-blue-100/80'
                                : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100/80';

                            return (
                              <td
                                key={asg.id}
                                className="py-2.5 px-3 border-r border-slate-100 align-middle"
                              >
                                <button
                                  type="button"
                                  onClick={() => handleOpenCellModal(student, asg)}
                                  className={`w-full p-2.5 rounded-2xl border text-left transition-all group/cell ${scoreBadgeColor}`}
                                  title="Klik untuk melihat detail atau mengubah nilai siswa"
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-base font-black tracking-tight">
                                      {finalScore}
                                      <span className="text-[10px] font-bold opacity-65 ml-0.5">
                                        /{maxPoints}
                                      </span>
                                    </span>
                                    <span className="p-1 rounded-lg bg-white/80 text-slate-600 opacity-80 group-hover/cell:opacity-100 shadow-sm">
                                      <Edit3 className="w-3 h-3" />
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between mt-1 text-[10px] font-bold">
                                    <span className="flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                                      Dinilai
                                    </span>
                                    <span className="underline opacity-75 group-hover/cell:opacity-100">
                                      Ubah
                                    </span>
                                  </div>
                                </button>
                              </td>
                            );
                          }

                          if (isSubmittedPending) {
                            return (
                              <td
                                key={asg.id}
                                className="py-2.5 px-3 border-r border-slate-100 align-middle"
                              >
                                <button
                                  type="button"
                                  onClick={() => handleOpenCellModal(student, asg)}
                                  className="w-full p-2.5 rounded-2xl border border-amber-300 bg-amber-50/90 hover:bg-amber-100 text-amber-900 text-left transition-all shadow-sm"
                                  title="Siswa sudah mengumpulkan! Klik untuk memberi nilai"
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-[11px] font-extrabold text-amber-800 flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                      Sudah Dikerjakan
                                    </span>
                                  </div>
                                  <div className="mt-1.5 flex items-center justify-between">
                                    <span className="text-[10px] text-amber-700 font-medium">
                                      {sub?.total_score !== null && sub?.total_score !== undefined
                                        ? `Skor: ${sub.total_score}`
                                        : 'Perlu Koreksi'}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-lg bg-[#3b5bf5] text-white text-[10px] font-bold shadow-sm">
                                      Beri Nilai
                                    </span>
                                  </div>
                                </button>
                              </td>
                            );
                          }

                          // Not submitted yet
                          return (
                            <td
                              key={asg.id}
                              className="py-2.5 px-3 border-r border-slate-100 align-middle"
                            >
                              <button
                                type="button"
                                onClick={() => handleOpenCellModal(student, asg)}
                                className="w-full p-2.5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 hover:border-[#3b5bf5]/50 hover:bg-blue-50/40 text-left transition-all group/empty"
                                title="Belum mengumpulkan. Klik jika ingin menginput nilai secara langsung"
                              >
                                <div className="flex items-center justify-between text-slate-400">
                                  <span className="text-xs font-bold text-rose-500/80">
                                    Belum
                                  </span>
                                  <span className="text-[10px] font-mono">0/{maxPoints}</span>
                                </div>
                                <div className="mt-1 flex items-center justify-between">
                                  <span className="text-[10px] text-slate-400 font-medium group-hover/empty:hidden">
                                    Belum dikerjakan
                                  </span>
                                  <span className="hidden group-hover/empty:inline-flex items-center gap-1 text-[10px] font-bold text-[#3b5bf5]">
                                    <Edit3 className="w-2.5 h-2.5" />
                                    Input Nilai
                                  </span>
                                </div>
                              </button>
                            </td>
                          );
                        })
                      )}

                      {/* Summary Column 1: Tugas Dikerjakan */}
                      <td className="py-3.5 px-4 text-center border-r border-slate-100 bg-slate-50/40">
                        <div className="inline-flex flex-col items-center">
                          <span className="text-xs font-extrabold text-slate-800">
                            {studentCompletedCount} / {studentTargetCount}
                          </span>
                          <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full bg-[#3b5bf5] rounded-full transition-all"
                              style={{
                                width: `${
                                  studentTargetCount > 0
                                    ? Math.round((studentCompletedCount / studentTargetCount) * 100)
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
                            {studentTargetCount > 0
                              ? `${Math.round((studentCompletedCount / studentTargetCount) * 100)}% Selesai`
                              : '0%'}
                          </span>
                        </div>
                      </td>

                      {/* Summary Column 2: Rata-Rata Nilai */}
                      <td className="py-3.5 px-5 text-center bg-slate-50/40">
                        {studentGradedCount > 0 ? (
                          <div className="inline-flex flex-col items-center">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-black ${
                                studentScoreSum / studentGradedCount >= 80
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : studentScoreSum / studentGradedCount >= 70
                                  ? 'bg-blue-100 text-[#3b5bf5]'
                                  : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {(studentScoreSum / studentGradedCount).toFixed(1)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                              {studentGradedCount} tugas dinilai
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Table Footer: Class Averages per Assignment Column */}
            {filteredStudents.length > 0 && filteredAssignments.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100/90 border-t-2 border-slate-200 text-xs font-extrabold text-slate-800">
                  <td colSpan={3} className="py-3.5 px-5 text-right border-r border-slate-200">
                    Rata-Rata Nilai & Ketuntasan per Tugas:
                  </td>
                  {filteredAssignments.map(asg => {
                    let sum = 0;
                    let gradedCnt = 0;
                    let subCnt = 0;
                    let targetCnt = 0;

                    filteredStudents.forEach(st => {
                      const cIds = getAssignmentClassIds(asg);
                      const isForStudent = cIds.length === 0 || Boolean(st.class_id && cIds.includes(st.class_id));
                      if (!isForStudent) return;
                      targetCnt++;

                      const sub = submissionMap.get(`${st.id}_${asg.id}`);
                      const gr = gradeMap.get(`${st.id}_${asg.id}`);
                      if (sub || gr) subCnt++;
                      if (gr || sub?.status === 'graded') {
                        gradedCnt++;
                        sum += Number(gr ? gr.score : (sub?.total_score ?? 0));
                      }
                    });

                    const avg = gradedCnt > 0 ? (sum / gradedCnt).toFixed(1) : '—';

                    return (
                      <td key={asg.id} className="py-3 px-4 border-r border-slate-200">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-semibold">Rata-rata:</span>
                          <span className="font-black text-[#3b5bf5]">{avg}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mt-0.5">
                          <span>Terkumpul:</span>
                          <span className="text-emerald-700 font-bold">
                            {subCnt}/{targetCnt} Siswa
                          </span>
                        </div>
                      </td>
                    );
                  })}
                  <td className="py-3 px-4 text-center border-r border-slate-200 text-emerald-700">
                    {summaryStats.totalSubmitted} / {summaryStats.totalExpected}
                  </td>
                  <td className="py-3 px-5 text-center text-[#3b5bf5] text-sm font-black">
                    {summaryStats.avgScore}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Modal Penilaian Langsung dari Sel Tabel */}
      {activeGradingCell && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-50 text-[#3b5bf5] flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">
                    Penilaian Tugas Siswa
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Berikan atau perbarui nilai langsung dari tabel laporan kelas
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveGradingCell(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info Siswa & Tugas */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 space-y-3 mb-5">
              <div className="flex items-center gap-3">
                <img
                  src={
                    activeGradingCell.student.profile?.avatar_url ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${activeGradingCell.student.nis_nisn}`
                  }
                  alt=""
                  className="w-11 h-11 rounded-xl bg-white object-cover border border-slate-200 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-slate-900 truncate">
                    {activeGradingCell.student.profile?.full_name}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    NISN: <span className="font-mono">{activeGradingCell.student.nis_nisn}</span> • Kelas:{' '}
                    <span className="font-bold text-slate-700">
                      {classes.find(c => c.id === activeGradingCell.student.class_id)?.name || '-'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-200/70">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 text-[#3b5bf5]">
                    {activeGradingCell.assignment.type === 'quiz' ? 'Kuis / Ujian' : 'Tugas Kelas'}
                  </span>
                  <span className="text-[11px] font-bold text-slate-600">
                    Nilai Maksimal: {activeGradingCell.assignment.total_points || 100} Poin
                  </span>
                </div>
                <p className="text-sm font-extrabold text-slate-900 mt-1">
                  {activeGradingCell.assignment.title}
                </p>
              </div>

              {/* Detail Jawaban / Pengumpulan Siswa */}
              <div className="pt-2.5 border-t border-slate-200/70 text-xs">
                {activeGradingCell.submission ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-600">Status Pengumpulan:</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Sudah Mengumpulkan (
                        {new Date(
                          activeGradingCell.submission.submitted_at ||
                            activeGradingCell.submission.started_at
                        ).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        )
                      </span>
                    </div>
                    {activeGradingCell.submission.student_notes && (
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 italic">
                        &ldquo;{activeGradingCell.submission.student_notes}&rdquo;
                      </div>
                    )}

                    {/* Rincian Jawaban Soal Esai / Isian / PG Siswa */}
                    {(() => {
                      const asg = activeGradingCell.assignment;
                      const asgQuestions =
                        asg.question_ids && asg.question_ids.length > 0
                          ? questions.filter(q => asg.question_ids!.includes(q.id))
                          : questions.filter(q => q.subject_id === asg.subject_id);
                      const subAnswers = activeGradingCell.submission?.answers || [];

                      if (asg.type !== 'quiz' || asgQuestions.length === 0) return null;

                      return (
                        <div className="pt-2 space-y-2">
                          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#3b5bf5]">
                            Rincian Jawaban Siswa per Butir Soal ({asgQuestions.length} Soal):
                          </p>
                          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {asgQuestions.map((q, qIdx) => {
                              const ans = subAnswers.find(a => a.question_id === q.id);
                              const selectedOpt = q.options?.find(
                                o => o.id === ans?.selected_option_id
                              );

                              return (
                                <div
                                  key={q.id}
                                  className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                                    q.question_type === 'essay'
                                      ? 'bg-amber-50/60 border-amber-200'
                                      : 'bg-white border-slate-200'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-extrabold text-slate-800">
                                      Soal #{qIdx + 1} ({q.points} Poin)
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                        q.question_type === 'essay'
                                          ? 'bg-amber-100 text-amber-800'
                                          : 'bg-slate-100 text-slate-600'
                                      }`}
                                    >
                                      {q.question_type === 'essay'
                                        ? 'Esai'
                                        : q.question_type === 'short_answer'
                                        ? 'Isian'
                                        : q.question_type === 'true_false'
                                        ? 'Benar/Salah'
                                        : 'Pilihan Ganda'}
                                    </span>
                                  </div>
                                  <p className="text-slate-600 font-medium">{q.question_text}</p>
                                  {q.question_type === 'essay' ||
                                  q.question_type === 'short_answer' ? (
                                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                                      <span className="text-[10px] font-extrabold text-[#3b5bf5] block mb-0.5">
                                        Jawaban {q.question_type === 'essay' ? 'Esai' : 'Isian'} Siswa:
                                      </span>
                                      {ans?.answer_text && ans.answer_text.trim() ? (
                                        <p className="font-bold text-slate-900 whitespace-pre-wrap">
                                          {ans.answer_text}
                                        </p>
                                      ) : (
                                        <p className="italic text-rose-500">
                                          (Tidak ada jawaban tertulis)
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                                      <span className="font-semibold text-slate-800">
                                        Pilihan: {selectedOpt ? selectedOpt.option_text : 'Kosong'}
                                      </span>
                                      {selectedOpt && (
                                        <span
                                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                            selectedOpt.is_correct
                                              ? 'bg-emerald-100 text-emerald-800'
                                              : 'bg-rose-100 text-rose-700'
                                          }`}
                                        >
                                          {selectedOpt.is_correct
                                            ? `Benar (+${q.points})`
                                            : 'Salah (0)'}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                    {activeGradingCell.submission.file_urls &&
                      activeGradingCell.submission.file_urls.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[#3b5bf5] font-bold pt-1">
                          <FileText className="w-3.5 h-3.5" />
                          <span>
                            {activeGradingCell.submission.file_urls.length} Berkas Jawaban Terlampir
                          </span>
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200/80 rounded-xl p-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span className="text-[11px] font-semibold">
                      Siswa belum mengirimkan jawaban di sistem, namun Anda tetap dapat memberikan nilai secara langsung.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Grading Form */}
            <form onSubmit={handleSaveCellGrade} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Input Nilai Siswa (0 - {activeGradingCell.assignment.total_points || 100}) *
                  </label>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    Klik angka cepat di bawah atau ketik manual
                  </span>
                </div>

                <input
                  type="number"
                  min={0}
                  max={activeGradingCell.assignment.total_points || 100}
                  required
                  value={inputScore}
                  onChange={e => setInputScore(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-2 border-slate-200 text-3xl font-black text-[#3b5bf5] focus:outline-none focus:border-[#3b5bf5] focus:bg-white text-center shadow-inner"
                />

                {/* Quick Score Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                  {[100, 95, 90, 85, 80, 75, 70, 60, 0].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setInputScore(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border transition-all ${
                        inputScore === preset
                          ? 'bg-[#3b5bf5] text-white border-[#3b5bf5] shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Catatan / Feedback Guru *
                </label>
                <textarea
                  rows={3}
                  required
                  value={inputFeedback}
                  onChange={e => setInputFeedback(e.target.value)}
                  placeholder="Berikan catatan evaluasi atau apresiasi untuk siswa..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
                />
                {/* Quick Feedback Chips */}
                <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                  {[
                    'Sangat baik! Pertahankan prestasimu.',
                    'Kerja bagus, tingkatkan lagi ketelitiannya.',
                    'Cukup baik, pelajari kembali materi yang belum tepat.',
                  ].map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setInputFeedback(tpl)}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-[#3b5bf5] text-slate-600 font-semibold transition-colors"
                    >
                      + &ldquo;{tpl}&rdquo;
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveGradingCell(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-[#3b5bf5] hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-extrabold shadow-md shadow-blue-500/25 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan & Publikasikan Nilai'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
