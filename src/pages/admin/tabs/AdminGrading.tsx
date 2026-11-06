import React, { useState, useMemo } from 'react';
import {
  Award,
  CheckCircle2,
  Edit3,
  Search,
  School,
  X,
  TrendingUp,
  Trophy,
  AlertTriangle,
  BookOpen
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { Submission, Student } from '../../../types/database.types';
import { TablePaginationBar, paginateArray } from '../../../components/TablePaginationBar';
import { CustomCombobox } from '../../../components/CustomCombobox';

export const AdminGrading: React.FC = () => {
  const { submissions, students, assignments, classes, subjects, grades, gradeSubmission } = useData();

  const [activeSubTab, setActiveSubTab] = useState<'ranking' | 'published'>('ranking');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [kkmScore, setKkmScore] = useState<number>(75);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<Student | null>(null);
  const [inputScore, setInputScore] = useState<number>(85);
  const [inputFeedback, setInputFeedback] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);

  const showNotif = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const getPredicate = (avg: number) => {
    if (avg >= 90) return { letter: 'A', label: 'Sangat Baik', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    if (avg >= 80) return { letter: 'B', label: 'Baik', color: 'bg-blue-100 text-[#3b5bf5] border-blue-200' };
    if (avg >= kkmScore) return { letter: 'C', label: 'Cukup (Tuntas)', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    return { letter: 'D', label: 'Perlu Remedial', color: 'bg-rose-100 text-rose-700 border-rose-200' };
  };

  // Compute student academic recap & ranking
  const studentRecaps = useMemo(() => {
    const filteredSt = students.filter(st => {
      if (selectedClassId !== 'all' && st.class_id !== selectedClassId) return false;
      const matchName = (st.profile?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchNis = (st.nis_nisn || '').toLowerCase().includes(searchTerm.toLowerCase());
      return !searchTerm.trim() || matchName || matchNis;
    });

    const list = filteredSt.map(st => {
      const studentGrades = grades.filter(g => g.student_id === st.id);
      const studentSubs = submissions.filter(s => s.student_id === st.id);

      // Combine scores from grades and graded submissions
      const scoredMap = new Map<string, number>();
      studentSubs.forEach(s => {
        if (s.status === 'graded' && s.total_score !== null) {
          scoredMap.set(s.assignment_id, Number(s.total_score));
        }
      });
      studentGrades.forEach(g => {
        scoredMap.set(g.assignment_id, Number(g.score));
      });

      const scores = Array.from(scoredMap.values());
      const gradedCount = scores.length;
      const totalScore = scores.reduce((a, b) => a + b, 0);
      const avgScore = gradedCount > 0 ? Math.round((totalScore / gradedCount) * 10) / 10 : 0;
      const highestScore = gradedCount > 0 ? Math.max(...scores) : 0;
      const lowestScore = gradedCount > 0 ? Math.min(...scores) : 0;

      return {
        student: st,
        className: classes.find(c => c.id === st.class_id)?.name || '—',
        gradedCount,
        submittedCount: studentSubs.length,
        totalScore,
        avgScore,
        highestScore,
        lowestScore,
        isPassedKkm: gradedCount > 0 && avgScore >= kkmScore,
        predicate: getPredicate(avgScore),
      };
    });

    // Sort by avgScore DESC, then gradedCount DESC
    return list.sort((a, b) => {
      if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
      return b.gradedCount - a.gradedCount;
    });
  }, [students, selectedClassId, searchTerm, grades, submissions, classes, kkmScore]);

  const filteredPublishedGrades = useMemo(() => {
    return grades.filter(gr => {
      const st = students.find(s => s.id === gr.student_id);
      if (selectedClassId !== 'all' && st?.class_id !== selectedClassId) return false;
      if (searchTerm.trim()) {
        const match = (st?.profile?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase());
        if (!match) return false;
      }
      return true;
    });
  }, [grades, students, selectedClassId, searchTerm]);

  const paginatedRecaps = useMemo(
    () => paginateArray(studentRecaps, pageSize, currentPage),
    [studentRecaps, pageSize, currentPage]
  );

  const paginatedPublishedGrades = useMemo(
    () => paginateArray(filteredPublishedGrades, pageSize, currentPage),
    [filteredPublishedGrades, pageSize, currentPage]
  );

  const analytics = useMemo(() => {
    const activeWithGrades = studentRecaps.filter(r => r.gradedCount > 0);
    const overallAvg =
      activeWithGrades.length > 0
        ? (
            activeWithGrades.reduce((acc, r) => acc + r.avgScore, 0) /
            activeWithGrades.length
          ).toFixed(1)
        : '0.0';
    const passedCount = activeWithGrades.filter(r => r.avgScore >= kkmScore).length;
    const remedialCount = activeWithGrades.filter(r => r.avgScore < kkmScore).length;
    const predA = activeWithGrades.filter(r => r.avgScore >= 90).length;
    const predB = activeWithGrades.filter(r => r.avgScore >= 80 && r.avgScore < 90).length;

    return {
      overallAvg,
      passedCount,
      remedialCount,
      predA,
      predB,
      totalEvaluated: activeWithGrades.length,
    };
  }, [studentRecaps, kkmScore]);

  const handleOpenGradeModal = (sub: Submission) => {
    setSelectedSubmission(sub);
    setInputScore(sub.total_score || 85);
    setInputFeedback(sub.teacher_feedback || 'Kerja bagus! Terus tingkatkan pemahaman Anda.');
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    await gradeSubmission(selectedSubmission.id, Number(inputScore), inputFeedback);
    setSelectedSubmission(null);
    showNotif('Nilai & Feedback berhasil diperbarui dan dipublikasikan!');
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span className="font-semibold">{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-slate-900">
            Rekapitulasi Raport, Peringkat & Evaluasi KKM
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Analisis peringkat nilai rata-rata siswa per kelas, predikat akademik (A/B/C/D), dan pemantauan ketuntasan KKM
          </p>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex rounded-2xl bg-white p-1.5 border border-slate-200/80 shadow-sm self-start lg:self-auto gap-1">
          <button
            onClick={() => setActiveSubTab('ranking')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'ranking'
                ? 'bg-[#3b5bf5] text-white shadow-md shadow-blue-500/25'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Peringkat & Rekap Raport Siswa</span>
          </button>
          <button
            onClick={() => setActiveSubTab('published')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'published'
                ? 'bg-[#3b5bf5] text-white shadow-md shadow-blue-500/25'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Arsip Nilai & Feedback ({grades.length})</span>
          </button>
        </div>
      </div>

      {/* Top Analytic Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#2a45d4] to-[#3b5bf5] text-white rounded-3xl p-5 shadow-md shadow-blue-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-100">
              Rata-Rata Akademik
            </span>
            <TrendingUp className="w-5 h-5 text-blue-100" />
          </div>
          <p className="text-3xl font-black mt-2">{analytics.overallAvg}</p>
          <p className="text-[11px] text-blue-100 mt-1">
            Dari {analytics.totalEvaluated} siswa yang telah dinilai
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Tuntas KKM (&ge; {kkmScore})
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">{analytics.passedCount}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Siswa memenuhi standar KKM
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
              Perlu Remedial (&lt; {kkmScore})
            </span>
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">{analytics.remedialCount}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Siswa di bawah batas KKM
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
              Predikat Unggul (A &amp; B)
            </span>
            <Trophy className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">
            {analytics.predA + analytics.predB}
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            {analytics.predA} Predikat A • {analytics.predB} Predikat B
          </p>
        </div>
      </div>

      {/* Filter Controls: Class, Search, & KKM Threshold */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama siswa atau NISN..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
            />
          </div>

          <div className="w-full sm:w-64">
            <CustomCombobox
              icon={<School className="w-4 h-4" />}
              prefixLabel="Kelas:"
              value={selectedClassId}
              onChange={(val) => setSelectedClassId(val)}
              options={[
                { value: 'all', label: 'Semua Kelas', badge: students.length },
                ...classes.map((c) => ({
                  value: c.id,
                  label: `Kelas ${c.name}`,
                  badge: students.filter((s) => s.class_id === c.id).length,
                })),
              ]}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <span className="text-xs font-bold text-slate-600">Standar Nilai KKM:</span>
          <input
            type="number"
            min={50}
            max={95}
            value={kkmScore}
            onChange={(e) => setKkmScore(Number(e.target.value))}
            className="w-20 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-extrabold text-[#3b5bf5] text-center focus:outline-none focus:border-[#3b5bf5]"
          />
        </div>
      </div>

      {/* Filter Banyaknya Data yang Ditampilkan */}
      <TablePaginationBar
        totalItems={activeSubTab === 'ranking' ? studentRecaps.length : filteredPublishedGrades.length}
        pageSize={pageSize}
        currentPage={currentPage}
        onPageSizeChange={setPageSize}
        onPageChange={setCurrentPage}
        itemLabel={activeSubTab === 'ranking' ? 'siswa' : 'data nilai'}
      />

      {activeSubTab === 'ranking' ? (
        /* Tabel Peringkat & Rekap Raport Akademik */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-extrabold">
                <tr>
                  <th className="py-4 px-5 w-20 text-center">Peringkat</th>
                  <th className="py-4 px-5">Nama Siswa &amp; NISN</th>
                  <th className="py-4 px-5">Kelas</th>
                  <th className="py-4 px-5 text-center">Tugas Dinilai</th>
                  <th className="py-4 px-5 text-center">Nilai Tertinggi / Terendah</th>
                  <th className="py-4 px-5 text-center">Rata-Rata Akhir</th>
                  <th className="py-4 px-5 text-center">Predikat</th>
                  <th className="py-4 px-5 text-center">Status KKM ({kkmScore})</th>
                  <th className="py-4 px-5 text-right">Rincian Transkrip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentRecaps.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                      Tidak ada data siswa pada filter ini.
                    </td>
                  </tr>
                ) : (
                  paginatedRecaps.map((item, idx) => {
                    const rank = pageSize <= 0 ? idx + 1 : (currentPage - 1) * pageSize + idx + 1;
                    return (
                      <tr key={item.student.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-5 text-center">
                          {rank === 1 && item.gradedCount > 0 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-700 font-black text-xs border border-amber-300">
                              #1
                            </span>
                          ) : rank === 2 && item.gradedCount > 0 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-black text-xs">
                              #2
                            </span>
                          ) : rank === 3 && item.gradedCount > 0 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-100 text-orange-800 font-black text-xs">
                              #3
                            </span>
                          ) : (
                            <span className="font-bold text-slate-400">#{rank}</span>
                          )}
                        </td>

                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.student.profile?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${item.student.nis_nisn}`}
                              alt=""
                              className="w-9 h-9 rounded-xl bg-slate-100 object-cover border border-slate-200"
                            />
                            <div>
                              <p className="font-extrabold text-slate-900">{item.student.profile?.full_name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{item.student.nis_nisn}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-5">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px]">
                            {item.className}
                          </span>
                        </td>

                        <td className="py-4 px-5 text-center font-bold text-slate-700">
                          {item.gradedCount} Tugas
                        </td>

                        <td className="py-4 px-5 text-center">
                          {item.gradedCount > 0 ? (
                            <span className="font-bold text-slate-700">
                              <span className="text-emerald-600">{item.highestScore}</span>
                              <span className="text-slate-300 mx-1.5">/</span>
                              <span className="text-rose-500">{item.lowestScore}</span>
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        <td className="py-4 px-5 text-center">
                          {item.gradedCount > 0 ? (
                            <span className="text-base font-black text-slate-900">
                              {item.avgScore}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-bold">Belum Ada</span>
                          )}
                        </td>

                        <td className="py-4 px-5 text-center">
                          {item.gradedCount > 0 ? (
                            <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${item.predicate.color}`}>
                              {item.predicate.letter} ({item.predicate.label})
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        <td className="py-4 px-5 text-center">
                          {item.gradedCount === 0 ? (
                            <span className="text-[11px] text-slate-400 font-medium">Belum Dinilai</span>
                          ) : item.isPassedKkm ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                              ✓ Tuntas KKM
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 font-bold text-[11px]">
                              ! Perlu Remedial
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-5 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedStudentDetail(item.student)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#3b5bf5] hover:text-white text-slate-700 font-bold text-[11px] transition-colors"
                          >
                            Lihat Raport
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Sub-tab 2: Daftar Nilai Terpublikasi & Feedback Guru */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-4 px-5">Nama Siswa</th>
                  <th className="py-4 px-5">Kelas</th>
                  <th className="py-4 px-5">Tugas / Ujian</th>
                  <th className="py-4 px-5">Nilai Akhir</th>
                  <th className="py-4 px-5">Evaluasi / Catatan Guru</th>
                  <th className="py-4 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPublishedGrades.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400 font-medium">
                      Belum ada nilai yang dipublikasikan.
                    </td>
                  </tr>
                ) : (
                  paginatedPublishedGrades.map((gr) => {
                      const student = students.find(s => s.id === gr.student_id);
                      const asg = assignments.find(a => a.id === gr.assignment_id);
                      const cls = classes.find(c => c.id === student?.class_id);
                      const relatedSub = submissions.find(
                        s => s.id === gr.submission_id || (s.student_id === gr.student_id && s.assignment_id === gr.assignment_id)
                      );

                      return (
                        <tr key={gr.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-4 px-5 font-bold text-slate-900">
                            {student?.profile?.full_name}
                          </td>
                          <td className="py-4 px-5 text-slate-600 font-medium">
                            {cls?.name}
                          </td>
                          <td className="py-4 px-5 text-slate-800 font-semibold">
                            {asg?.title}
                          </td>
                          <td className="py-4 px-5">
                            <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                              gr.score >= 80 ? 'bg-emerald-50 text-emerald-700' :
                              gr.score >= kkmScore ? 'bg-blue-50 text-[#3b5bf5]' : 'bg-rose-50 text-rose-600'
                            }`}>
                              {gr.score} / {gr.max_score}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-slate-500 max-w-xs truncate font-medium">
                            {gr.feedback || '—'}
                          </td>
                          <td className="py-4 px-5 text-right">
                            {relatedSub && (
                              <button
                                type="button"
                                onClick={() => handleOpenGradeModal(relatedSub)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#3b5bf5] hover:text-white text-slate-700 font-bold text-[11px] transition-colors"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Revisi Nilai</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Raport Transkrip Individual Siswa */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedStudentDetail.profile?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedStudentDetail.nis_nisn}`}
                  alt=""
                  className="w-11 h-11 rounded-2xl bg-slate-100 object-cover border border-slate-200"
                />
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">
                    Kartu Raport Tugas &amp; Ujian — {selectedStudentDetail.profile?.full_name}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    NISN: {selectedStudentDetail.nis_nisn} • Kelas: {classes.find(c => c.id === selectedStudentDetail.class_id)?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {assignments
                .filter(asg => {
                  if (Array.isArray(asg.class_ids) && asg.class_ids.length > 0) {
                    return Boolean(
                      selectedStudentDetail.class_id &&
                        asg.class_ids.includes(selectedStudentDetail.class_id)
                    );
                  }
                  return !asg.class_id || asg.class_id === selectedStudentDetail.class_id;
                })
                .map(asg => {
                  const gr = grades.find(
                    g => g.student_id === selectedStudentDetail.id && g.assignment_id === asg.id
                  );
                  const sub = submissions.find(
                    s => s.student_id === selectedStudentDetail.id && s.assignment_id === asg.id
                  );
                  const subj = subjects.find(s => s.id === asg.subject_id);
                  const score = gr ? gr.score : sub?.total_score;

                  return (
                    <div
                      key={asg.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4"
                    >
                      <div>
                        <p className="text-xs font-extrabold text-slate-900">{asg.title}</p>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {subj?.name || 'Mata Pelajaran'} • {asg.type === 'quiz' ? 'Kuis' : 'Tugas'}
                        </p>
                        {(gr?.feedback || sub?.teacher_feedback) && (
                          <p className="text-[11px] text-slate-600 italic mt-1">
                            Catatan Guru: &ldquo;{gr?.feedback || sub?.teacher_feedback}&rdquo;
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        {score !== null && score !== undefined ? (
                          <span className={`px-3 py-1 rounded-full text-xs font-black ${
                            score >= kkmScore ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {score} / {asg.total_points || 100}
                          </span>
                        ) : sub ? (
                          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                            Menunggu Koreksi
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold">
                            Belum Mengerjakan
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Nilai & Komentar */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-[#3b5bf5]" />
                Revisi Nilai &amp; Feedback
              </h4>
              <button onClick={() => setSelectedSubmission(null)} className="p-1 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGrade} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Input Nilai Akhir (Skala 0 - 100) *
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  required
                  value={inputScore}
                  onChange={(e) => setInputScore(Number(e.target.value))}
                  className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-2xl font-extrabold text-[#3b5bf5] focus:outline-none focus:border-[#3b5bf5] focus:bg-white text-center shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Ulasan / Catatan untuk Siswa *
                </label>
                <textarea
                  rows={4}
                  required
                  value={inputFeedback}
                  onChange={(e) => setInputFeedback(e.target.value)}
                  placeholder="Berikan saran membangun atau apresiasi atas jawaban siswa..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedSubmission(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#3b5bf5] hover:bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-500/25"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
