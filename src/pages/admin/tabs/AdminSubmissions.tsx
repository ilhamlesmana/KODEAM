import React, { useState, useMemo } from 'react';
import {
  Inbox,
  CheckCircle2,
  Clock,
  FileText,
  Search,
  ExternalLink,
  School,
  ClipboardList,
  Eye,
  X,
  Calendar,
  HelpCircle,
  Check,
  AlertCircle,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { Submission, Question, Assignment } from '../../../types/database.types';
import { TablePaginationBar, paginateArray } from '../../../components/TablePaginationBar';
import { CustomCombobox } from '../../../components/CustomCombobox';

export const AdminSubmissions: React.FC = () => {
  const { submissions, students, assignments, questions, classes, subjects, gradeSubmission, deleteSubmission } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'graded'>('all');
  const [classFilter, setClassFilter] = useState('all');
  const [assignmentFilter, setAssignmentFilter] = useState('all');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Detail & Quick Review Modal
  const [inspectedSub, setInspectedSub] = useState<Submission | null>(null);
  const [quickScore, setQuickScore] = useState<number>(85);
  const [quickFeedback, setQuickFeedback] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);

  // Konfirmasi Hapus & Kembalikan Soal ke Siswa
  const [confirmDeleteSub, setConfirmDeleteSub] = useState<Submission | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const showNotif = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Helper to get questions for an assignment
  const getAssignmentQuestions = (asg?: Assignment): Question[] => {
    if (!asg) return [];
    if (asg.question_ids && asg.question_ids.length > 0) {
      return questions.filter(q => asg.question_ids!.includes(q.id));
    }
    return questions.filter(q => q.subject_id === asg.subject_id);
  };

  // Assignments filtered by selected class for the dropdown
  const availableAssignments = useMemo(() => {
    if (classFilter === 'all') return assignments;
    return assignments.filter(asg => {
      if (Array.isArray(asg.class_ids) && asg.class_ids.length > 0) {
        return asg.class_ids.includes(classFilter);
      }
      return !asg.class_id || asg.class_id === classFilter;
    });
  }, [assignments, classFilter]);

  const filtered = useMemo(() => {
    return submissions
      .filter((sub) => {
        const student = students.find(s => s.id === sub.student_id);
        const asg = assignments.find(a => a.id === sub.assignment_id);

        const matchSearch =
          (student?.profile?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (student?.nis_nisn || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (asg?.title || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchStatus = statusFilter === 'all' || sub.status === statusFilter;
        const matchClass = classFilter === 'all' || student?.class_id === classFilter;
        const matchAsg = assignmentFilter === 'all' || sub.assignment_id === assignmentFilter;

        return matchSearch && matchStatus && matchClass && matchAsg;
      })
      .sort((a, b) => {
        const dateA = new Date(a.submitted_at || a.started_at).getTime();
        const dateB = new Date(b.submitted_at || b.started_at).getTime();
        return dateB - dateA;
      });
  }, [submissions, students, assignments, searchTerm, statusFilter, classFilter, assignmentFilter]);

  const paginatedSubmissions = useMemo(
    () => paginateArray(filtered, pageSize, currentPage),
    [filtered, pageSize, currentPage]
  );

  const pendingCount = submissions.filter(s => s.status === 'submitted').length;
  const gradedCount = submissions.filter(s => s.status === 'graded').length;
  const withFilesCount = submissions.filter(s => s.file_urls && s.file_urls.length > 0).length;

  const handleInspectSubmission = (sub: Submission) => {
    setInspectedSub(sub);
    setQuickScore(sub.total_score ?? 85);
    setQuickFeedback(sub.teacher_feedback || 'Jawaban telah diterima dan diperiksa dengan baik.');
  };

  const handleSaveInspectionGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectedSub) return;
    await gradeSubmission(inspectedSub.id, Number(quickScore), quickFeedback);
    setInspectedSub(null);
    showNotif('Jawaban berhasil diperiksa dan nilai telah dipublikasikan (Jawaban Siswa Terkunci)!');
  };

  const handleConfirmDeleteAndReset = async () => {
    if (!confirmDeleteSub) return;
    setIsDeleting(true);
    const st = students.find(s => s.id === confirmDeleteSub.student_id);
    const asg = assignments.find(a => a.id === confirmDeleteSub.assignment_id);

    const res = await deleteSubmission(confirmDeleteSub.id);
    setIsDeleting(false);

    if (res.success) {
      if (inspectedSub?.id === confirmDeleteSub.id) {
        setInspectedSub(null);
      }
      setConfirmDeleteSub(null);
      showNotif(
        `Pengumpulan jawaban ${st?.profile?.full_name || 'siswa'} dihapus. Soal "${asg?.title || 'Tugas'}" telah muncul kembali di akun siswa!`
      );
    }
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm shadow-xl flex items-center gap-2 max-w-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-bold">{notification}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-slate-900">
            Kotak Masuk Pengumpulan Jawaban (Inbox Siswa)
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Pantau kiriman jawaban esai, kuis, dan berkas tugas siswa secara kronologis, berikan penilaian, atau hapus &amp; reset agar soal muncul kembali di siswa
          </p>
        </div>
      </div>

      {/* Inbox Counter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setStatusFilter('submitted')}
          className={`cursor-pointer rounded-3xl p-5 border transition-all flex items-center justify-between ${
            statusFilter === 'submitted'
              ? 'bg-amber-50 border-amber-300 shadow-sm'
              : 'bg-white border-slate-200/80 hover:border-amber-200'
          }`}
        >
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700">
              Menunggu Diperiksa
            </p>
            <p className="text-3xl font-black text-slate-900 mt-1">{pendingCount}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Siswa masih dapat memperbaiki esai sebelum dinilai
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('graded')}
          className={`cursor-pointer rounded-3xl p-5 border transition-all flex items-center justify-between ${
            statusFilter === 'graded'
              ? 'bg-emerald-50 border-emerald-300 shadow-sm'
              : 'bg-white border-slate-200/80 hover:border-emerald-200'
          }`}
        >
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
              Selesai Diperiksa
            </p>
            <p className="text-3xl font-black text-slate-900 mt-1">{gradedCount}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Jawaban sudah dinilai &amp; terkunci otomatis
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('all')}
          className={`cursor-pointer rounded-3xl p-5 border transition-all flex items-center justify-between ${
            statusFilter === 'all'
              ? 'bg-blue-50/70 border-blue-300 shadow-sm'
              : 'bg-white border-slate-200/80 hover:border-blue-200'
          }`}
        >
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#3b5bf5]">
              Total Jawaban Masuk
            </p>
            <p className="text-3xl font-black text-slate-900 mt-1">{submissions.length}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              {withFilesCount} kiriman melampirkan berkas
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#3b5bf5] flex items-center justify-center">
            <Inbox className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama siswa, NISN, judul tugas..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
          />
        </div>

        <CustomCombobox
          icon={<School className="w-4 h-4" />}
          value={classFilter}
          onChange={(val) => {
            setClassFilter(val);
            setAssignmentFilter('all');
          }}
          options={[
            { value: 'all', label: 'Semua Kelas', badge: classes.length },
            ...classes.map((c) => ({
              value: c.id,
              label: `Kelas ${c.name}`,
              description: `Tingkat ${c.level}`,
            })),
          ]}
        />

        <CustomCombobox
          icon={<ClipboardList className="w-4 h-4" />}
          value={assignmentFilter}
          onChange={(val) => setAssignmentFilter(val)}
          options={[
            { value: 'all', label: 'Semua Tugas / Ujian', badge: availableAssignments.length },
            ...availableAssignments.map((a) => ({
              value: a.id,
              label: a.title,
              badge: a.type === 'quiz' ? 'Kuis' : 'Tugas',
            })),
          ]}
        />

        <CustomCombobox
          value={statusFilter}
          onChange={(val) => setStatusFilter(val as any)}
          searchable={false}
          options={[
            { value: 'all', label: 'Semua Status Kiriman', badge: submissions.length },
            { value: 'submitted', label: '⏳ Menunggu Diperiksa', badge: pendingCount },
            { value: 'graded', label: '✓ Sudah Diperiksa', badge: gradedCount },
          ]}
        />
      </div>

      {/* Filter Banyaknya Data yang Ditampilkan */}
      <TablePaginationBar
        totalItems={filtered.length}
        pageSize={pageSize}
        currentPage={currentPage}
        onPageSizeChange={setPageSize}
        onPageChange={setCurrentPage}
        itemLabel="kiriman jawaban"
      />

      {/* Inbox Feed Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">Kotak Masuk Kosong</p>
            <p className="text-xs text-slate-400 mt-1">
              Belum ada pengumpulan jawaban siswa yang sesuai dengan filter di atas.
            </p>
          </div>
        ) : (
          paginatedSubmissions.map((sub) => {
            const student = students.find(s => s.id === sub.student_id);
            const asg = assignments.find(a => a.id === sub.assignment_id);
            const cls = classes.find(c => c.id === student?.class_id);
            const subj = subjects.find(s => s.id === asg?.subject_id);
            const asgQuestions = getAssignmentQuestions(asg);

            // Extract essay/text answers for preview on card
            const essayAnswersPreview = (sub.answers || []).filter(ans => {
              const q = asgQuestions.find(item => item.id === ans.question_id);
              return (
                (q?.question_type === 'essay' || q?.question_type === 'short_answer') &&
                ans.answer_text &&
                ans.answer_text.trim().length > 0
              );
            });

            const submittedDate = new Date(sub.submitted_at || sub.started_at);
            const dueDate = asg?.due_date ? new Date(asg.due_date) : null;
            const isLate = dueDate ? submittedDate.getTime() > dueDate.getTime() : false;

            return (
              <div
                key={sub.id}
                className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:border-[#3b5bf5]/40 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Left: Student & Submission Info */}
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <img
                    src={student?.profile?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${student?.nis_nisn}`}
                    alt=""
                    className="w-12 h-12 rounded-2xl bg-slate-100 object-cover border border-slate-200 shrink-0"
                  />

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-slate-900 text-sm">
                        {student?.profile?.full_name || 'Siswa'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        ({student?.nis_nisn})
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-[10px]">
                        Kelas {cls?.name || '—'}
                      </span>
                      {isLate ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[10px] font-bold border border-rose-200">
                          Terlambat Mengumpulkan
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                          Tepat Waktu
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-extrabold text-[#3b5bf5]">
                        {asg?.title || 'Tugas Kelas'}
                      </span>
                      {subj && (
                        <span className="text-[11px] text-slate-400 font-medium">
                          • {subj.name}
                        </span>
                      )}
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-[#3b5bf5] font-bold">
                        {asg?.type === 'quiz' ? 'Lembar Kuis / Ujian' : 'Kiriman Tugas'}
                      </span>
                    </div>

                    {/* Preview Jawaban Esai / Catatan Siswa */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700 space-y-2">
                      {essayAnswersPreview.length > 0 ? (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#3b5bf5]">
                            Preview Jawaban Esai / Isian Siswa ({essayAnswersPreview.length} Soal):
                          </p>
                          {essayAnswersPreview.slice(0, 2).map((ans, idx) => {
                            const q = asgQuestions.find(item => item.id === ans.question_id);
                            return (
                              <div key={ans.id || idx} className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                                <p className="text-[11px] font-bold text-slate-500 line-clamp-1">
                                  Soal: {q?.question_text || `Butir Soal #${idx + 1}`}
                                </p>
                                <p className="text-xs font-semibold text-slate-900 mt-0.5 line-clamp-2">
                                  Jawaban: &ldquo;{ans.answer_text}&rdquo;
                                </p>
                              </div>
                            );
                          })}
                          {essayAnswersPreview.length > 2 && (
                            <p className="text-[11px] text-[#3b5bf5] font-bold">
                              + {essayAnswersPreview.length - 2} jawaban lainnya (Klik &ldquo;Periksa Jawaban&rdquo; untuk melihat semua)
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="italic line-clamp-2">
                          &ldquo;{sub.student_notes || 'Siswa telah mengirimkan lembar pengerjaan.'}&rdquo;
                        </p>
                      )}

                      {sub.file_urls && sub.file_urls.length > 0 && (
                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                          {sub.file_urls.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[#3b5bf5] hover:bg-blue-50 text-[11px] font-bold transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Lampiran Berkas #{idx + 1}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Timestamp, Status & Action Buttons */}
                <div className="flex sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                  <div className="text-left lg:text-right">
                    <div className="flex items-center lg:justify-end gap-1.5 text-[11px] text-slate-400 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        Dikirim:{' '}
                        {submittedDate.toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="mt-1.5 flex items-center lg:justify-end gap-2">
                      {sub.status === 'graded' ? (
                        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Nilai: {sub.total_score} / {asg?.total_points || 100} (Terkunci)
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                          Menunggu Koreksi Guru
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteSub(sub)}
                      title="Hapus jawaban ini agar soal muncul kembali di akun siswa"
                      className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Hapus &amp; Reset ke Siswa</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInspectSubmission(sub)}
                      className="px-4 py-2.5 rounded-xl bg-[#3b5bf5] hover:bg-blue-600 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Periksa Jawaban Lengkap</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Konfirmasi Hapus & Munculkan Kembali Soal ke Siswa */}
      {confirmDeleteSub && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-900">
                  Hapus &amp; Munculkan Kembali Soal ke Siswa?
                </h4>
                <p className="text-xs text-slate-500">
                  Tindakan ini akan mereset status pengerjaan siswa pada tugas/ujian ini.
                </p>
              </div>
            </div>

            {(() => {
              const st = students.find(s => s.id === confirmDeleteSub.student_id);
              const asg = assignments.find(a => a.id === confirmDeleteSub.assignment_id);
              return (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
                  <p className="text-slate-600">
                    Siswa: <span className="font-extrabold text-slate-900">{st?.profile?.full_name || 'Siswa'}</span> ({st?.nis_nisn})
                  </p>
                  <p className="text-slate-600">
                    Tugas / Soal: <span className="font-extrabold text-[#3b5bf5]">{asg?.title || 'Tugas'}</span>
                  </p>
                  <p className="text-[11px] text-rose-600 font-semibold pt-1">
                    • Jawaban yang telah dikumpulkan akan dihapus dari kotak masuk.
                    <br />• Soal ini akan langsung muncul kembali di menu &ldquo;Belum Dikerjakan&rdquo; pada akun siswa agar siswa dapat mengerjakan ulang dari awal.
                  </p>
                </div>
              );
            })()}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteSub(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAndReset}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-md shadow-rose-600/20 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus & Munculkan Kembali ke Siswa'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Inspeksi Jawaban per Soal (Esai, Isian, PG) & Penilaian */}
      {inspectedSub && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-50 text-[#3b5bf5] flex items-center justify-center">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">
                    Lembar Jawaban Siswa &amp; Penilaian Guru
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Periksa seluruh jawaban soal esai, isian singkat, pilihan ganda, atau berkas tugas siswa
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectedSub(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const st = students.find(s => s.id === inspectedSub.student_id);
              const asg = assignments.find(a => a.id === inspectedSub.assignment_id);
              const cls = classes.find(c => c.id === st?.class_id);
              const asgQuestions = getAssignmentQuestions(asg);
              const subAnswers = inspectedSub.answers || [];

              return (
                <div className="space-y-5">
                  {/* Info Siswa */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-extrabold text-slate-900">
                        {st?.profile?.full_name} <span className="text-xs font-mono text-slate-400">({st?.nis_nisn})</span>
                      </p>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        Kelas: <span className="text-slate-800 font-bold">{cls?.name || '-'}</span> • Tugas:{' '}
                        <span className="text-[#3b5bf5] font-bold">{asg?.title}</span>
                      </p>
                    </div>
                    {inspectedSub.total_score !== null && (
                      <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-right shrink-0">
                        <span className="text-[10px] font-bold text-slate-500 block">Skor Saat Ini</span>
                        <span className="text-sm font-black text-[#3b5bf5]">
                          {inspectedSub.total_score} / {asg?.total_points || 100}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Daftar Jawaban per Butir Soal (Termasuk Soal Esai!) */}
                  {asg?.type === 'quiz' && asgQuestions.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <HelpCircle className="w-4 h-4 text-[#3b5bf5]" />
                          <span>Rincian Jawaban Siswa per Butir Soal ({asgQuestions.length} Soal)</span>
                        </h5>
                      </div>

                      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                        {asgQuestions.map((q, idx) => {
                          const ans = subAnswers.find(a => a.question_id === q.id);
                          const selectedOpt = q.options?.find(o => o.id === ans?.selected_option_id);
                          const correctOpt = q.options?.find(o => o.is_correct);

                          return (
                            <div
                              key={q.id}
                              className={`p-4 rounded-2xl border space-y-2 ${
                                q.question_type === 'essay'
                                  ? 'bg-amber-50/40 border-amber-200'
                                  : 'bg-slate-50 border-slate-200/80'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-100 text-[#3b5bf5]">
                                  Soal #{idx + 1} • Bobot {q.points} Poin
                                </span>
                                <span
                                  className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                                    q.question_type === 'essay'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  {q.question_type === 'essay'
                                    ? 'Soal Esai (Uraian)'
                                    : q.question_type === 'short_answer'
                                    ? 'Isian Singkat'
                                    : q.question_type === 'true_false'
                                    ? 'Benar / Salah'
                                    : 'Pilihan Ganda'}
                                </span>
                              </div>

                              <p className="text-xs font-bold text-slate-900 leading-relaxed">
                                {q.question_text}
                              </p>

                              {/* Tampilan Jawaban Siswa Berdasarkan Tipe Soal */}
                              {q.question_type === 'essay' || q.question_type === 'short_answer' ? (
                                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1.5">
                                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#3b5bf5]">
                                    Jawaban {q.question_type === 'essay' ? 'Esai' : 'Isian'} Siswa:
                                  </p>
                                  {ans?.answer_text && ans.answer_text.trim() ? (
                                    <p className="text-xs font-semibold text-slate-900 whitespace-pre-wrap leading-relaxed">
                                      {ans.answer_text}
                                    </p>
                                  ) : (
                                    <p className="text-xs italic text-rose-500 font-medium">
                                      (Siswa tidak mengisi jawaban pada soal ini)
                                    </p>
                                  )}
                                  {q.question_type === 'short_answer' && q.short_answer_key && (
                                    <p className="text-[11px] text-emerald-700 font-bold pt-1 border-t border-slate-100">
                                      Kunci Jawaban: {q.short_answer_key}
                                    </p>
                                  )}
                                  {q.question_type === 'essay' && q.explanation && (
                                    <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                                      Pedoman / Pembahasan Guru: {q.explanation}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div className="p-3 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-400 block">
                                      Pilihan Siswa:
                                    </span>
                                    <span className="font-bold text-slate-900">
                                      {selectedOpt ? selectedOpt.option_text : 'Tidak dijawab'}
                                    </span>
                                  </div>
                                  <div className="sm:text-right">
                                    {selectedOpt ? (
                                      selectedOpt.is_correct ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                                          <Check className="w-3 h-3" /> Benar (+{q.points} Poin)
                                        </span>
                                      ) : (
                                        <div className="space-y-0.5">
                                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-extrabold">
                                            Salah (0 Poin)
                                          </span>
                                          {correctOpt && (
                                            <p className="text-[10px] text-emerald-700 font-bold">
                                              Kunci: {correctOpt.option_text}
                                            </p>
                                          )}
                                        </div>
                                      )
                                    ) : (
                                      <span className="text-[10px] text-rose-500 font-bold">Kosong</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Catatan Umum / Jawaban Teks & Berkas */}
                  {(inspectedSub.student_notes ||
                    (inspectedSub.file_urls && inspectedSub.file_urls.length > 0)) && (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <p className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                        Catatan / Ringkasan Jawaban Siswa:
                      </p>
                      <p className="text-xs text-slate-800 bg-white p-3 rounded-xl border border-slate-200 whitespace-pre-wrap leading-relaxed">
                        {inspectedSub.student_notes || 'Tidak ada catatan tambahan.'}
                      </p>
                      {inspectedSub.file_urls && inspectedSub.file_urls.length > 0 && (
                        <div className="pt-2">
                          <p className="text-[11px] font-bold text-slate-500 mb-1.5">Berkas Lampiran:</p>
                          <div className="flex flex-wrap gap-2">
                            {inspectedSub.file_urls.map((u, i) => (
                              <a
                                key={i}
                                href={u}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-[#3b5bf5] text-xs font-bold"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Buka Berkas #{i + 1}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Form Input Nilai */}
                  <form onSubmit={handleSaveInspectionGrade} className="space-y-4 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Nilai Akhir Pemeriksaan (0 - {asg?.total_points || 100})
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={asg?.total_points || 100}
                        required
                        value={quickScore}
                        onChange={(e) => setQuickScore(Number(e.target.value))}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-2xl font-black text-[#3b5bf5] text-center focus:outline-none focus:border-[#3b5bf5]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Komentar / Feedback Pemeriksaan Guru
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={quickFeedback}
                        onChange={(e) => setQuickFeedback(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5]"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteSub(inspectedSub)}
                        className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Hapus &amp; Munculkan Kembali ke Siswa</span>
                      </button>

                      <div className="flex items-center gap-2 ml-auto">
                        <button
                          type="button"
                          onClick={() => setInspectedSub(null)}
                          className="px-4 py-2.5 rounded-xl bg-slate-100 text-xs font-bold text-slate-600"
                        >
                          Tutup
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2.5 rounded-xl bg-[#3b5bf5] hover:bg-blue-600 text-white text-xs font-extrabold shadow-md shadow-blue-500/25"
                        >
                          Simpan &amp; Publikasikan Nilai
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
