import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Check,
  Send,
  X,
  Layers,
  Lock,
  Eye,
  ShieldAlert,
  School,
  AlertTriangle,
  Flag,
  FileCheck2,
  Sparkles,
  Maximize2,
  Trophy,
  Zap,
  Compass,
  Smile,
  Edit3
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { Assignment, Question, Submission } from '../../../types/database.types';
import { TablePaginationBar, paginateArray } from '../../../components/TablePaginationBar';
import { CustomCombobox } from '../../../components/CustomCombobox';

export const StudentAssignments: React.FC = () => {
  const { currentStudent } = useAuth();
  const { assignments, questions, subjects, classes, submissions, grades, submitAssignment } = useData();

  // State pengerjaan & modal
  const [examRulesAsg, setExamRulesAsg] = useState<Assignment | null>(null);
  const [activeWorkingAsg, setActiveWorkingAsg] = useState<Assignment | null>(null);
  const [isExamModeActive, setIsExamModeActive] = useState<boolean>(false);
  const [isEditingSubmitted, setIsEditingSubmitted] = useState<boolean>(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [doubtfulQuestions, setDoubtfulQuestions] = useState<Record<string, boolean>>({});
  const [showFinishConfirm, setShowFinishConfirm] = useState<boolean>(false);
  const [navFilter, setNavFilter] = useState<'all' | 'unanswered' | 'doubtful'>('all');

  // Fullscreen enforcement states
  const [isFullscreenWarningOpen, setIsFullscreenWarningOpen] = useState<boolean>(false);
  const [fullscreenExitCount, setFullscreenExitCount] = useState<number>(0);

  const [previewOnlyAsg, setPreviewOnlyAsg] = useState<Assignment | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [filterScope, setFilterScope] = useState<'my_class' | 'all'>('my_class');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [answers, setAnswers] = useState<Record<string, { selected_option_id?: string; answer_text?: string }>>({});
  const [studentNotes, setStudentNotes] = useState('');
  const [fileInputUrl, setFileInputUrl] = useState('');
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [justSelectedAnim, setJustSelectedAnim] = useState<string | null>(null);

  const studentClass = classes.find(c => c.id === currentStudent?.class_id);
  const handleFinalSubmitRef = useRef<(forceByTimer?: boolean) => void>(() => {});

  // Helper: Ambil daftar butir soal untuk suatu Tugas / Ujian
  const getQuestionsForAssignment = (asg: Assignment | null): Question[] => {
    if (!asg) return [];
    if (asg.question_ids && asg.question_ids.length > 0) {
      return questions.filter(q => asg.question_ids!.includes(q.id));
    }
    return questions.filter(q => q.subject_id === asg.subject_id);
  };

  // Helper: Cek apakah tugas/ujian WAJIB masuk Mode Ujian CBT
  // 1. Jika HANYA soal Essay saja (atau tugas upload biasa) -> TIDAK masuk mode ujian
  // 2. Jika ada soal PG saja ATAU campuran PG + Essay -> WAJIB masuk Mode Ujian
  const requiresExamMode = (asg: Assignment | null): boolean => {
    if (!asg || asg.type !== 'quiz') return false;
    const qs = getQuestionsForAssignment(asg);
    if (qs.length === 0) return false;
    return qs.some(q => q.question_type !== 'essay');
  };

  // Helper: Ambil daftar ID kelas yang diizinkan untuk suatu Tugas / Ujian
  const getAllowedClassIds = (asg: Assignment): string[] => {
    if (Array.isArray(asg.class_ids) && asg.class_ids.length > 0) {
      return asg.class_ids;
    }
    if (asg.class_id) {
      return [asg.class_id];
    }
    const sub = subjects.find(s => s.id === asg.subject_id);
    if (sub?.class_ids && sub.class_ids.length > 0) {
      return sub.class_ids;
    }
    return [];
  };

  // Helper: Cek apakah siswa saat ini diizinkan mengerjakan tugas/ujian tersebut
  const isAssignmentAllowedForStudent = (asg: Assignment): boolean => {
    const allowedIds = getAllowedClassIds(asg);
    if (allowedIds.length === 0) return true;
    if (!currentStudent?.class_id) return false;
    return allowedIds.includes(currentStudent.class_id);
  };

  const getAllowedClassNames = (asg: Assignment): string => {
    const allowedIds = getAllowedClassIds(asg);
    if (allowedIds.length === 0) return 'Semua Kelas';
    const matched = classes.filter(c => allowedIds.includes(c.id));
    return matched.length > 0 ? matched.map(c => c.name).join(', ') : 'Kelas Tertentu';
  };

  const showNotif = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Request Fullscreen helper
  const enterFullscreen = async () => {
    try {
      const elem = document.documentElement as any;
      if (!document.fullscreenElement) {
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
          await elem.msRequestFullscreen();
        }
      }
      setIsFullscreenWarningOpen(false);
    } catch (e) {
      console.warn('Fullscreen request notice:', e);
      setIsFullscreenWarningOpen(false);
    }
  };

  const exitFullscreenSafe = async () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (e) {
      // ignore
    }
  };

  // Lock navigation & enforce Fullscreen while in Exam Mode
  useEffect(() => {
    if (!isExamModeActive || !activeWorkingAsg) return;

    // Prevent browser back button while in exam
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };

    // Prevent accidental tab close / refresh
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Ujian sedang berlangsung. Anda tidak dapat meninggalkan halaman sebelum menyelesaikan ujian.';
      return e.returnValue;
    };

    // Detect exiting fullscreen
    const handleFullscreenChange = () => {
      const isFull = Boolean(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      );
      if (!isFull && isExamModeActive) {
        setFullscreenExitCount(prev => prev + 1);
        setIsFullscreenWarningOpen(true);
      } else if (isFull) {
        setIsFullscreenWarningOpen(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [isExamModeActive, activeWorkingAsg]);

  // Timer countdown effect
  useEffect(() => {
    handleFinalSubmitRef.current = handleFinalSubmit;
  });

  useEffect(() => {
    if (!activeWorkingAsg || activeWorkingAsg.type !== 'quiz' || isEditingSubmitted) return;
    const durationMins = activeWorkingAsg.duration_minutes || (isExamModeActive ? 60 : 0);
    if (!durationMins) return;

    setTimeLeftSeconds(durationMins * 60);

    const interval = setInterval(() => {
      setTimeLeftSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimeout(() => {
            handleFinalSubmitRef.current(true);
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeWorkingAsg, isExamModeActive]);

  const studentSubmissions = submissions.filter(s => s.student_id === currentStudent?.id);
  const submittedMap: Record<string, boolean> = {};
  studentSubmissions.forEach(s => {
    submittedMap[s.assignment_id] = true;
  });

  const availableAssignments = assignments.filter(a => {
    if (a.is_active === false) return false;
    if (filterScope === 'my_class') {
      return isAssignmentAllowedForStudent(a);
    }
    return true;
  });

  const pendingCount = availableAssignments.filter(a => !submittedMap[a.id] && isAssignmentAllowedForStudent(a)).length;
  const completedCount = availableAssignments.filter(a => submittedMap[a.id]).length;

  const displayedAssignments = availableAssignments.filter(a => {
    if (selectedSubjectFilter !== 'all' && a.subject_id !== selectedSubjectFilter) return false;
    if (filterStatus === 'pending') return !submittedMap[a.id];
    if (filterStatus === 'completed') return submittedMap[a.id];
    return true;
  });

  // Saat klik "Mulai Kerjakan" pada kartu tugas/ujian
  const handleStartAssignment = (asg: Assignment) => {
    if (!isAssignmentAllowedForStudent(asg)) {
      setPreviewOnlyAsg(asg);
      return;
    }
    if (submittedMap[asg.id]) {
      alert('Anda telah mengumpulkan tugas ini sebelumnya!');
      return;
    }

    setAnswers({});
    setDoubtfulQuestions({});
    setCurrentQuestionIndex(0);
    setShowFinishConfirm(false);
    setNavFilter('all');
    setFullscreenExitCount(0);
    setIsFullscreenWarningOpen(false);
    setStudentNotes('');
    setFileInputUrl('');
    setIsEditingSubmitted(false);

    if (requiresExamMode(asg)) {
      setExamRulesAsg(asg);
    } else {
      setIsExamModeActive(false);
      setActiveWorkingAsg(asg);
    }
  };

  // Saat klik "Ubah Jawaban Essay" pada tugas/ujian yang belum dinilai guru
  const handleEditSubmittedEssay = (asg: Assignment, existingSub: Submission) => {
    const isAlreadyGraded =
      existingSub.status === 'graded' ||
      grades.some(g => g.student_id === currentStudent?.id && g.assignment_id === asg.id);

    if (isAlreadyGraded) {
      alert('Jawaban sudah dinilai oleh guru sehingga tidak dapat diubah kembali.');
      return;
    }

    const prefilledAnswers: Record<string, { selected_option_id?: string; answer_text?: string }> = {};
    (existingSub.answers || []).forEach(ans => {
      prefilledAnswers[ans.question_id] = {
        selected_option_id: ans.selected_option_id || undefined,
        answer_text: ans.answer_text || '',
      };
    });

    setAnswers(prefilledAnswers);
    setStudentNotes(existingSub.student_notes || '');
    setFileInputUrl(existingSub.file_urls?.[0] || '');
    setIsEditingSubmitted(true);
    setIsExamModeActive(false);
    setActiveWorkingAsg(asg);
  };

  // Saat klik "Mulai Mengerjakan" di dalam Pop-Up Peraturan Ujian -> Paksa Layar Full Screen!
  const handleConfirmStartExamMode = async () => {
    if (!examRulesAsg) return;
    const targetAsg = examRulesAsg;
    await enterFullscreen();
    setExamRulesAsg(null);
    setIsExamModeActive(true);
    setCurrentQuestionIndex(0);
    setDoubtfulQuestions({});
    setShowFinishConfirm(false);
    setActiveWorkingAsg(targetAsg);
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], selected_option_id: optionId }
    }));
    setJustSelectedAnim(optionId);
    setTimeout(() => setJustSelectedAnim(null), 500);
  };

  const handleTextAnswer = (questionId: string, text: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], answer_text: text }
    }));
  };

  const toggleDoubtful = (questionId: string) => {
    setDoubtfulQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  // Cek apakah suatu butir soal sudah dijawab oleh siswa
  const isQuestionAnswered = (q: Question): boolean => {
    const ans = answers[q.id];
    if (!ans) return false;
    if (q.question_type === 'multiple_choice' || q.question_type === 'true_false') {
      return Boolean(ans.selected_option_id);
    }
    return Boolean(ans.answer_text && ans.answer_text.trim().length > 0);
  };

  const activeQuestions: Question[] = getQuestionsForAssignment(activeWorkingAsg);
  const currentQuestion: Question | undefined = activeQuestions[currentQuestionIndex];

  // Statistik soal pada Mode Ujian
  const answeredQuestionsCount = activeQuestions.filter(q => isQuestionAnswered(q)).length;
  const doubtfulQuestionsCount = activeQuestions.filter(q => doubtfulQuestions[q.id]).length;
  const unansweredQuestionsList = activeQuestions
    .map((q, idx) => ({ q, idx }))
    .filter(item => !isQuestionAnswered(item.q));
  const unansweredQuestionsCount = unansweredQuestionsList.length;
  const progressPercentage =
    activeQuestions.length > 0
      ? Math.round((answeredQuestionsCount / activeQuestions.length) * 100)
      : 0;

  // Motivasi interaktif berdasarkan persentase pengerjaan
  const getHappyMoodMessage = () => {
    if (progressPercentage === 0) return { text: 'Ayo mulai! Baca soal dengan tenang ya 🚀', emoji: '🌟' };
    if (progressPercentage < 40) return { text: 'Awal yang mantap! Teruskan semangatmu 💪', emoji: '🔥' };
    if (progressPercentage < 75) return { text: 'Luar biasa! Kamu sudah setengah jalan lebih 🎯', emoji: '⚡' };
    if (progressPercentage < 100) return { text: 'Sedikit lagi selesai! Kamu hebat sekali 🌈', emoji: '🏆' };
    return { text: 'Semua soal sudah terjawab! Siap dikumpulkan 🎉', emoji: '👑' };
  };

  const handleFinalSubmit = async (forceByTimer: boolean = false) => {
    if (!activeWorkingAsg || !currentStudent) return;

    // Jika bukan karena waktu habis, WAJIB kerjakan semua soal terlebih dahulu
    if (isExamModeActive && !forceByTimer && unansweredQuestionsCount > 0) {
      setShowFinishConfirm(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await submitAssignment(
        activeWorkingAsg.id,
        currentStudent.id,
        answers,
        studentNotes,
        fileInputUrl ? [fileInputUrl] : undefined
      );

      if (res && !res.success) {
        alert('Terjadi kesalahan saat mengirim jawaban: ' + (res.error || 'Silakan coba lagi.'));
        return;
      }

      const finishedTitle = activeWorkingAsg.title;
      const wasEditing = isEditingSubmitted;
      setShowFinishConfirm(false);
      setIsFullscreenWarningOpen(false);
      setIsExamModeActive(false);
      setIsEditingSubmitted(false);
      setActiveWorkingAsg(null);
      await exitFullscreenSafe();
      showNotif(
        wasEditing
          ? `Perubahan jawaban esai untuk "${finishedTitle}" berhasil disimpan! ✨`
          : `Yeay! Jawaban untuk "${finishedTitle}" berhasil dikumpulkan! 🎉`
      );
    } catch (err: any) {
      alert('Terjadi kesalahan saat mengirim jawaban.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const remainingSecs = secs % 60;
    if (hrs > 0) {
      return `${hrs < 10 ? '0' : ''}${hrs}:${mins < 10 ? '0' : ''}${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
    }
    return `${mins < 10 ? '0' : ''}${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  const moodInfo = getHappyMoodMessage();

  return (
    <div className="space-y-6">
      {/* Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span className="font-semibold">{notification}</span>
        </div>
      )}

      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-extrabold text-slate-900">Daftar Tugas dan Ujian Kelas</h3>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#3b5bf5]">
              {studentClass ? studentClass.name : 'Semua Kelas'}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Kerjakan ujian interaktif berbasis komputer (CBT) atau kumpulkan lembar tugas esai &amp; mandiri
          </p>
        </div>

        {/* Scope Selector: Kelas Saya vs Semua Kelas */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-white border border-slate-200/80 p-1.5 rounded-2xl shadow-sm text-xs">
          <button
            type="button"
            onClick={() => setFilterScope('my_class')}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
              filterScope === 'my_class'
                ? 'bg-[#3b5bf5] text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kelas Saya ({studentClass?.name || 'Terkait'})
          </button>
          <button
            type="button"
            onClick={() => setFilterScope('all')}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
              filterScope === 'all'
                ? 'bg-[#3b5bf5] text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua Tugas ({assignments.length})
          </button>
        </div>
      </div>

      {/* Filter Tabs & Subject Combobox */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all ${
              filterStatus === 'all'
                ? 'bg-[#3b5bf5] text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 border border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            Semua ({availableAssignments.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('pending')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all ${
              filterStatus === 'pending'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 border border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            Belum Dikerjakan ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('completed')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all ${
              filterStatus === 'completed'
                ? 'bg-[#1cd485] text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 border border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            Sudah Selesai ({completedCount})
          </button>
        </div>

        <div className="w-full md:w-72">
          <CustomCombobox
            prefixLabel="Mapel:"
            value={selectedSubjectFilter}
            onChange={(val) => {
              setSelectedSubjectFilter(val);
              setCurrentPage(1);
            }}
            options={[
              { value: 'all', label: 'Semua Mata Pelajaran', badge: availableAssignments.length },
              ...subjects.map((s) => ({
                value: s.id,
                label: s.name,
                badge: availableAssignments.filter((a) => a.subject_id === s.id).length,
              })),
            ]}
          />
        </div>
      </div>

      {/* Filter Banyaknya Data yang Ditampilkan */}
      <TablePaginationBar
        totalItems={displayedAssignments.length}
        pageSize={pageSize}
        currentPage={currentPage}
        onPageSizeChange={setPageSize}
        onPageChange={setCurrentPage}
        itemLabel="tugas & ujian"
      />

      {/* Grid of assignments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayedAssignments.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-3xl border border-slate-200/80 shadow-sm text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#3b5bf5] flex items-center justify-center mx-auto">
              <ClipboardList className="w-7 h-7" />
            </div>
            <h4 className="text-base font-extrabold text-slate-900">Tidak Ada Tugas atau Ujian</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              {assignments.length > 0 && filterScope === 'my_class'
                ? `Terdapat ${assignments.length} tugas di sistem, namun ditargetkan ke kelas lain. Kelas Anda saat ini: ${studentClass?.name || 'Belum Terdaftar'}.`
                : assignments.length === 0
                ? 'Belum ada tugas atau ujian yang dipublikasikan oleh guru pengajar saat ini.'
                : 'Tidak ada tugas yang sesuai dengan filter yang Anda pilih.'}
            </p>
            {assignments.length > 0 && filterScope === 'my_class' && (
              <button
                type="button"
                onClick={() => setFilterScope('all')}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-[#3b5bf5] border border-blue-200 text-xs font-bold hover:bg-blue-100 transition-colors"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Tampilkan Semua Tugas ({assignments.length} Tugas Lintas Kelas)</span>
              </button>
            )}
          </div>
        ) : (
          paginateArray(displayedAssignments, pageSize, currentPage).map((asg) => {
            const subject = subjects.find(s => s.id === asg.subject_id);
            const allowedClassNames = getAllowedClassNames(asg);
            const isAllowed = isAssignmentAllowedForStudent(asg);
            const isSubmitted = submittedMap[asg.id];
            const sub = studentSubmissions.find(s => s.assignment_id === asg.id);
            const publishedGrade = grades.find(
              g => g.student_id === currentStudent?.id && g.assignment_id === asg.id
            );
            const isGradedByTeacher = Boolean(sub?.status === 'graded' || publishedGrade);
            const isCbtExam = requiresExamMode(asg);
            const asgQs = getQuestionsForAssignment(asg);
            const hasEssayOrTask = asg.type !== 'quiz' || asgQs.some(q => q.question_type === 'essay');
            const canEditSubmittedEssay = Boolean(isSubmitted && sub && !isGradedByTeacher && hasEssayOrTask);

            return (
              <div
                key={asg.id}
                className={`rounded-3xl p-6 border flex flex-col justify-between transition-all shadow-sm ${
                  !isAllowed
                    ? 'bg-slate-50/90 border-slate-200/90 opacity-90'
                    : isSubmitted
                    ? 'bg-white border-emerald-200 hover:shadow-md'
                    : 'bg-white border-slate-200/80 hover:border-[#3b5bf5]/50 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        isCbtExam
                          ? 'bg-indigo-50 text-[#3b5bf5] border border-indigo-200/80'
                          : asg.type === 'quiz'
                          ? 'bg-blue-50 text-[#3b5bf5]'
                          : 'bg-emerald-50 text-[#0fa868]'
                      }`}>
                        {isCbtExam
                          ? 'Mode Ujian CBT (Full Screen)'
                          : asg.type === 'quiz'
                          ? 'Lembar Soal Esai'
                          : 'Pengumpulan Tugas'}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${
                        isAllowed ? 'bg-slate-100 text-slate-700' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        <School className="w-3 h-3" />
                        {allowedClassNames}
                      </span>
                    </div>

                    {!isAllowed ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-200/80 text-slate-700 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-rose-600" /> Terkunci (Kelas Lain)
                      </span>
                    ) : isSubmitted ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#1cd485]/15 text-[#0fa868] flex items-center gap-1">
                        <Check className="w-3 h-3" /> Sudah Dikumpulkan
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600">
                        Wajib Dikerjakan
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-extrabold text-slate-900 mb-1.5 flex items-center gap-2">
                    {!isAllowed && <Lock className="w-4 h-4 text-slate-400 shrink-0" />}
                    <span>{asg.title}</span>
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                    {asg.description || 'Tidak ada deskripsi tambahan.'}
                  </p>

                  <div className="grid grid-cols-3 gap-2 text-xs py-2.5 border-t border-slate-100 text-slate-600">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Mata Pelajaran</span>
                      <span className="font-bold text-slate-800 truncate block">{subject?.name || 'Umum'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Jumlah Soal</span>
                      <span className="font-bold text-slate-800">
                        {asg.type === 'quiz' ? `${asgQs.length} Butir Soal` : 'Lembar Tugas'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Durasi Ujian</span>
                      <span className="font-bold text-slate-800">
                        {asg.duration_minutes ? `${asg.duration_minutes} Menit` : isCbtExam ? '60 Menit' : 'Tanpa Batasan'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  {!isAllowed ? (
                    <span className="text-[11px] text-rose-600 flex items-center gap-1 font-bold">
                      <Lock className="w-3.5 h-3.5 shrink-0" /> Khusus {allowedClassNames}
                    </span>
                  ) : isSubmitted ? (
                    <div className="text-xs text-slate-500 font-medium">
                      Status:{' '}
                      <strong className={isGradedByTeacher ? 'text-emerald-700 font-extrabold' : 'text-amber-600 font-bold'}>
                        {isGradedByTeacher
                          ? `Dinilai (${publishedGrade?.score ?? sub?.total_score ?? 0} Poin) • Terkunci`
                          : 'Menunggu Dinilai Guru'}
                      </strong>
                    </div>
                  ) : (
                    <span className="text-xs text-amber-600 flex items-center gap-1 font-semibold">
                      <Clock className="w-3.5 h-3.5" /> Siap Dikerjakan
                    </span>
                  )}

                  {!isAllowed ? (
                    <button
                      type="button"
                      onClick={() => setPreviewOnlyAsg(asg)}
                      className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-slate-200/80 hover:bg-slate-300/80 text-slate-700 transition-all shrink-0"
                      title="Hanya dapat melihat informasi tugas karena dikhususkan untuk kelas lain"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Lihat Saja (Terkunci)</span>
                    </button>
                  ) : canEditSubmittedEssay && sub ? (
                    <button
                      type="button"
                      onClick={() => handleEditSubmittedEssay(asg, sub)}
                      className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 transition-all shrink-0 cursor-pointer"
                      title="Perbaiki jawaban esai Anda sebelum dinilai oleh guru"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Ubah Jawaban Essay</span>
                    </button>
                  ) : (
                    <button
                      disabled={isSubmitted || !asg.is_active}
                      onClick={() => handleStartAssignment(asg)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                        isSubmitted
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-[#3b5bf5] hover:bg-blue-600 text-white shadow-md shadow-blue-500/25 cursor-pointer'
                      }`}
                    >
                      {isSubmitted && isGradedByTeacher && <Lock className="w-3.5 h-3.5" />}
                      <span>
                        {isSubmitted
                          ? isGradedByTeacher
                            ? 'Sudah Dinilai (Terkunci)'
                            : 'Tuntas'
                          : 'Mulai Kerjakan'}
                      </span>
                      {!isSubmitted && <ArrowRight className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ===================================================================== */}
      {/* POP-UP PERATURAN UJIAN (Muncul sebelum masuk ke Mode Ujian CBT)        */}
      {/* ===================================================================== */}
      {examRulesAsg && (() => {
        const rulesQuestions = getQuestionsForAssignment(examRulesAsg);
        const pgCount = rulesQuestions.filter(q => q.question_type !== 'essay').length;
        const essayCount = rulesQuestions.filter(q => q.question_type === 'essay').length;
        const subj = subjects.find(s => s.id === examRulesAsg.subject_id);
        const duration = examRulesAsg.duration_minutes || 60;

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[92vh] overflow-y-auto space-y-5">
              {/* Header Peraturan Ujian */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#3b5bf5] to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
                    <FileCheck2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-wider">
                      Wajib Layar Penuh (Full Screen)
                    </span>
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
                      Peraturan &amp; Tata Tertib Ujian
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setExamRulesAsg(null)}
                  className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Informasi Ringkas Ujian */}
              <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-emerald-50/60 rounded-2xl p-4 border border-blue-200/70 space-y-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Judul Ujian</p>
                  <p className="text-sm font-extrabold text-slate-900 mt-0.5">{examRulesAsg.title}</p>
                  <p className="text-xs text-[#3b5bf5] font-bold mt-0.5">
                    {subj?.name || 'Mata Pelajaran Umum'} &bull; Kelas {studentClass?.name || getAllowedClassNames(examRulesAsg)}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-blue-200/50 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 shadow-sm">
                    <span className="text-[10px] text-slate-400 font-semibold block">Komposisi Soal</span>
                    <span className="font-extrabold text-slate-900">
                      {rulesQuestions.length} Soal
                    </span>
                    <span className="text-[10px] text-slate-500 block font-medium">
                      {pgCount} PG{essayCount > 0 ? ` + ${essayCount} Esai` : ''}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 shadow-sm">
                    <span className="text-[10px] text-slate-400 font-semibold block">Waktu Ujian</span>
                    <span className="font-extrabold text-amber-600">{duration} Menit</span>
                    <span className="text-[10px] text-slate-500 block font-medium">Hitung Mundur</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 shadow-sm">
                    <span className="text-[10px] text-slate-400 font-semibold block">Bobot Nilai</span>
                    <span className="font-extrabold text-emerald-600">{examRulesAsg.total_points || 100} Poin</span>
                    <span className="text-[10px] text-slate-500 block font-medium">Skor Maksimal</span>
                  </div>
                </div>
              </div>

              {/* Daftar Peraturan Ujian */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-[#3b5bf5]" />
                  <span>Peraturan Wajib Selama Ujian Berlangsung:</span>
                </h4>
                <ul className="space-y-2.5 text-xs text-slate-700 font-medium bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#3b5bf5] text-white text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <span>
                      <strong>Wajib Mode Layar Penuh (Full Screen):</strong> Saat menekan tombol <strong>&ldquo;Mulai Mengerjakan&rdquo;</strong>, layar otomatis masuk ke mode <em>Full Screen</em>. Jika keluar dari <em>Full Screen</em>, ujian akan terkunci sementara oleh peringatan sistem.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#3b5bf5] text-white text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <span>
                      <strong>Tidak Dapat Kembali ke Dashboard:</strong> Selama ujian sedang berlangsung, Anda <strong>tidak dapat kembali ke menu Dashboard</strong> sebelum menyelesaikan dan mengumpulkan seluruh soal.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#3b5bf5] text-white text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <span>
                      <strong>Wajib Menjawab Seluruh Soal:</strong> Seluruh butir soal wajib dijawab terlebih dahulu sebelum tombol penyelesaian akhir dapat dikumpulkan.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#3b5bf5] text-white text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">4</span>
                    <span>
                      <strong>Gunakan Peta Misi Soal &amp; Ragu-Ragu:</strong> Anda dapat berpindah soal dengan tombol <strong>Lanjut</strong>, <strong>Kembali</strong>, <strong>Ragu-Ragu</strong>, atau menekan nomor soal di Peta Navigasi.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Tombol Batal & Mulai Mengerjakan */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setExamRulesAsg(null)}
                  className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmStartExamMode}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#3b5bf5] to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs font-extrabold shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all hover:-translate-y-0.5"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span>Mulai Mengerjakan (Full Screen)</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===================================================================== */}
      {/* Modal Mode Lihat Saja (Terkunci untuk Kelas Lain)                      */}
      {/* ===================================================================== */}
      {previewOnlyAsg && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative space-y-5">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-extrabold mb-2">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Mode Hanya Lihat &bull; Ujian Terkunci</span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">{previewOnlyAsg.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOnlyAsg(null)}
                className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 leading-relaxed">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-rose-900 mb-0.5">Akses Pengerjaan Dibatasi</p>
                <p>
                  Tugas/Ujian ini dikhususkan untuk kelas <strong>{getAllowedClassNames(previewOnlyAsg)}</strong>. Kelas Anda saat ini (<strong>{studentClass?.name || 'Kelas Lain'}</strong>) hanya dapat melihat informasi ringkas tugas ini dan tidak diizinkan membuka soal atau mengirimkan jawaban.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">Mata Pelajaran</span>
                <span className="font-extrabold text-slate-800">
                  {subjects.find(s => s.id === previewOnlyAsg.subject_id)?.name || 'Umum'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">Kelas yang Diizinkan</span>
                <span className="font-extrabold text-[#3b5bf5]">
                  {getAllowedClassNames(previewOnlyAsg)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">Tipe & Durasi</span>
                <span className="font-bold text-slate-800">
                  {previewOnlyAsg.type === 'quiz' ? 'Kuis Interaktif' : 'Pengumpulan Tugas'} &bull;{' '}
                  {previewOnlyAsg.duration_minutes ? `${previewOnlyAsg.duration_minutes} Menit` : 'Tanpa Timer'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">Bobot Maksimal</span>
                <span className="font-bold text-slate-800">{previewOnlyAsg.total_points} Poin</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <h5 className="text-xs font-extrabold text-slate-700">Deskripsi / Petunjuk Tugas:</h5>
              <p className="text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200/70 leading-relaxed">
                {previewOnlyAsg.description || 'Tidak ada deskripsi tambahan.'}
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewOnlyAsg(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm"
              >
                Tutup Mode Lihat Saja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 1. MODE UJIAN CBT HAPPY MOOD & INTERAKTIF (DI-PORTAL KE DOCUMENT.BODY) */}
      {/*    - Tidak ada tombol kembali ke dashboard                             */}
      {/*    - Wajib Full Screen + Peringatan jika keluar Full Screen            */}
      {/*    - Navigasi Peta Misi Soal 3D Interaktif                             */}
      {/*    - Wajib jawab semua soal sebelum bisa Selesai                       */}
      {/* ===================================================================== */}
      {activeWorkingAsg &&
        isExamModeActive &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-[#eef4ff] via-[#f6f3ff] to-[#ecfdf5] flex flex-col overflow-hidden select-none">
            {/* Top Header Mode Ujian Happy Mood (TANPA Tombol Kembali ke Dashboard!) */}
            <header className="bg-white/95 backdrop-blur-md border-b-2 border-indigo-100 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm shrink-0">
              {/* Left: Exam Brand & Title */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#3b5bf5] via-indigo-500 to-violet-500 text-white flex items-center justify-center font-black text-lg shadow-md shadow-indigo-500/25 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#3b5bf5] to-indigo-500 text-white text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Mode Fokus Ujian</span>
                    </span>
                    <span className="text-xs text-indigo-600 font-extrabold truncate hidden sm:inline">
                      {subjects.find(s => s.id === activeWorkingAsg.subject_id)?.name}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 truncate mt-0.5">
                    {activeWorkingAsg.title}
                  </h3>
                </div>
              </div>

              {/* Center: Interactive Happy Mood Progress Pill */}
              <div className="hidden xl:flex items-center gap-3 bg-gradient-to-r from-indigo-50/90 via-blue-50/90 to-emerald-50/90 px-4 py-2 rounded-2xl border border-indigo-200/70">
                <span className="text-lg">{moodInfo.emoji}</span>
                <div>
                  <div className="flex items-center justify-between gap-4 text-[11px] font-extrabold text-slate-800">
                    <span>{moodInfo.text}</span>
                    <span className="text-[#3b5bf5]">{progressPercentage}% Tuntas</span>
                  </div>
                  <div className="w-56 h-2 bg-white rounded-full overflow-hidden mt-1 p-0.5 border border-indigo-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#3b5bf5] via-indigo-500 to-emerald-500 transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Right: Student Capsule & Countdown Timer */}
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <img
                    src={
                      currentStudent?.profile?.avatar_url ||
                      `https://api.dicebear.com/7.x/bottts/svg?seed=${currentStudent?.nis_nisn}`
                    }
                    alt=""
                    className="w-7 h-7 rounded-xl object-cover border border-slate-200"
                  />
                  <div className="text-left">
                    <p className="text-xs font-extrabold text-slate-900 leading-tight">
                      {currentStudent?.profile?.full_name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-bold">
                      Kelas {studentClass?.name}
                    </p>
                  </div>
                </div>

                {/* Timer Ujian */}
                <div
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border-b-4 font-mono font-black text-sm sm:text-base shadow-sm transition-all ${
                    timeLeftSeconds <= 180
                      ? 'bg-rose-500 border-rose-700 text-white animate-pulse'
                      : timeLeftSeconds <= 600
                      ? 'bg-amber-400 border-amber-600 text-slate-900'
                      : 'bg-gradient-to-r from-[#3b5bf5] to-indigo-600 border-indigo-800 text-white'
                  }`}
                >
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>{formatTimer(timeLeftSeconds)}</span>
                </div>
              </div>
            </header>

            {/* Body Mode Ujian: Kiri (Area Soal Interaktif) & Kanan (Peta Misi Soal Menarik) */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6">
              <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* KOLOM KIRI (8 Cols): Kartu Soal Happy Mood & Interaktif */}
                <div className="lg:col-span-8 bg-white rounded-[2rem] border-2 border-indigo-100/90 shadow-xl shadow-indigo-500/5 flex flex-col justify-between min-h-[510px] p-5 sm:p-8 relative overflow-hidden">
                  {/* Top Decorative Gradient Accent */}
                  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#3b5bf5] via-violet-500 to-emerald-400" />

                  {currentQuestion ? (
                    <>
                      <div className="space-y-6 pt-1">
                        {/* Header Soal Aktif */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-4 py-1.5 rounded-2xl bg-gradient-to-r from-[#3b5bf5] to-indigo-600 text-white text-xs font-black shadow-md shadow-blue-500/20 flex items-center gap-1.5">
                              <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                              <span>
                                Tantangan Soal #{currentQuestionIndex + 1} dari {activeQuestions.length}
                              </span>
                            </span>
                            <span className="px-3 py-1.5 rounded-2xl bg-violet-50 text-violet-700 border border-violet-200/70 text-xs font-extrabold">
                              {currentQuestion.question_type === 'multiple_choice' && 'Pilihan Ganda'}
                              {currentQuestion.question_type === 'true_false' && 'Benar / Salah'}
                              {currentQuestion.question_type === 'short_answer' && 'Isian Singkat'}
                              {currentQuestion.question_type === 'essay' && 'Esai / Uraian'}
                            </span>
                            <span className="px-3 py-1.5 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/70 text-xs font-extrabold flex items-center gap-1">
                              <Trophy className="w-3.5 h-3.5 text-amber-500" />
                              <span>+{currentQuestion.points} Poin</span>
                            </span>
                          </div>

                          {/* Status Badge Soal Ini */}
                          <div>
                            {doubtfulQuestions[currentQuestion.id] ? (
                              <span className="px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-extrabold flex items-center gap-1.5 shadow-sm">
                                <Flag className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                                Ditandai Ragu-Ragu
                              </span>
                            ) : isQuestionAnswered(currentQuestion) ? (
                              <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-extrabold flex items-center gap-1.5 shadow-sm">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Mantap! Sudah Dijawab
                              </span>
                            ) : (
                              <span className="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
                                Yuk, pilih jawabanmu!
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Kotak Pertanyaan */}
                        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 border-2 border-indigo-100/80 shadow-inner">
                          <p className="text-sm sm:text-base font-extrabold text-slate-900 leading-relaxed whitespace-pre-wrap select-text">
                            {currentQuestion.question_text}
                          </p>
                        </div>

                        {/* Area Pilihan / Input Jawaban Interaktif */}
                        <div className="space-y-3">
                          {currentQuestion.question_type === 'multiple_choice' && (
                            <div className="space-y-3">
                              <p className="text-xs font-extrabold text-slate-500 flex items-center gap-1.5">
                                <Smile className="w-4 h-4 text-[#3b5bf5]" />
                                <span>Klik pada salah satu kartu jawaban yang paling tepat:</span>
                              </p>
                              <div className="grid grid-cols-1 gap-3">
                                {currentQuestion.options?.map((opt, i) => {
                                  const isSelected = answers[currentQuestion.id]?.selected_option_id === opt.id;
                                  const isAnimating = justSelectedAnim === opt.id;
                                  const optionLetter = String.fromCharCode(65 + i);

                                  const badgeColors = [
                                    'from-blue-500 to-indigo-600',
                                    'from-violet-500 to-purple-600',
                                    'from-emerald-500 to-teal-600',
                                    'from-amber-500 to-orange-500',
                                    'from-pink-500 to-rose-500',
                                  ];
                                  const colorGrad = badgeColors[i % badgeColors.length];

                                  return (
                                    <button
                                      key={opt.id}
                                      type="button"
                                      onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                                      className={`w-full p-4 rounded-2xl border-2 border-b-4 text-left flex items-center justify-between gap-3 transition-all duration-200 ${
                                        isAnimating ? 'scale-[1.01]' : ''
                                      } ${
                                        isSelected
                                          ? 'bg-gradient-to-r from-blue-50 via-indigo-50/70 to-emerald-50/50 border-[#3b5bf5] border-b-[#253ec7] text-slate-900 shadow-md -translate-y-0.5'
                                          : 'bg-white border-slate-200 border-b-slate-300 text-slate-700 hover:border-indigo-300 hover:border-b-indigo-400 hover:bg-indigo-50/20 hover:-translate-y-0.5 active:translate-y-0'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3.5 min-w-0">
                                        <span
                                          className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 transition-all ${
                                            isSelected
                                              ? `bg-gradient-to-tr ${colorGrad} text-white shadow-md scale-105`
                                              : 'bg-slate-100 text-slate-700'
                                          }`}
                                        >
                                          {optionLetter}
                                        </span>
                                        <span
                                          className={`text-xs sm:text-sm leading-relaxed ${
                                            isSelected ? 'font-extrabold text-slate-900' : 'font-semibold text-slate-700'
                                          }`}
                                        >
                                          {opt.option_text}
                                        </span>
                                      </div>
                                      {isSelected && (
                                        <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-[11px] font-extrabold flex items-center gap-1 shrink-0 shadow-sm">
                                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                                          <span className="hidden sm:inline">Terpilih</span>
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {currentQuestion.question_type === 'true_false' && (
                            <div className="space-y-2.5">
                              <p className="text-xs font-extrabold text-slate-500">
                                Pilih pernyataan ini Benar atau Salah:
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                {currentQuestion.options?.map((opt) => {
                                  const isSelected = answers[currentQuestion.id]?.selected_option_id === opt.id;
                                  return (
                                    <button
                                      key={opt.id}
                                      type="button"
                                      onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                                      className={`p-5 rounded-2xl border-2 border-b-4 text-sm font-black flex items-center justify-between transition-all hover:-translate-y-0.5 ${
                                        isSelected
                                          ? 'bg-blue-50 border-[#3b5bf5] border-b-[#253ec7] text-[#3b5bf5] shadow-md'
                                          : 'bg-white border-slate-200 border-b-slate-300 text-slate-700 hover:border-indigo-300'
                                      }`}
                                    >
                                      <span>{opt.option_text}</span>
                                      {isSelected && <CheckCircle2 className="w-5 h-5 text-[#3b5bf5]" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {currentQuestion.question_type === 'short_answer' && (
                            <div className="space-y-2">
                              <label className="block text-xs font-extrabold text-slate-700">
                                Ketik Jawaban Singkatmu:
                              </label>
                              <input
                                type="text"
                                placeholder="Tuliskan jawaban singkat di sini..."
                                value={answers[currentQuestion.id]?.answer_text || ''}
                                onChange={(e) => handleTextAnswer(currentQuestion.id, e.target.value)}
                                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#3b5bf5] focus:bg-white select-text"
                              />
                            </div>
                          )}

                          {currentQuestion.question_type === 'essay' && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="block text-xs font-extrabold text-slate-700">
                                  Tuliskan Uraian Jawaban Esai Kamu:
                                </label>
                                <span className="text-[11px] font-extrabold text-emerald-600">
                                  {answers[currentQuestion.id]?.answer_text?.trim()
                                    ? '✓ Jawaban Esai Tersimpan Otomatis'
                                    : 'Wajib diisi'}
                                </span>
                              </div>
                              <textarea
                                rows={6}
                                placeholder="Ketik penjelasan jawaban esai Anda dengan lengkap dan jelas di sini..."
                                value={answers[currentQuestion.id]?.answer_text || ''}
                                onChange={(e) => handleTextAnswer(currentQuestion.id, e.target.value)}
                                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#3b5bf5] focus:bg-white leading-relaxed select-text"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer Tombol Navigasi Bawah: Kembali, Ragu-Ragu, Lanjut / Selesai Ujian */}
                      <div className="pt-6 mt-8 border-t-2 border-slate-100 flex flex-wrap items-center justify-between gap-3">
                        {/* Tombol Kembali */}
                        <button
                          type="button"
                          disabled={currentQuestionIndex === 0}
                          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                          className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 border-b-4 border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all active:translate-y-0.5"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Kembali</span>
                        </button>

                        {/* Tombol Ragu-Ragu */}
                        <button
                          type="button"
                          onClick={() => toggleDoubtful(currentQuestion.id)}
                          className={`px-5 py-3 rounded-2xl border-2 border-b-4 text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all active:translate-y-0.5 ${
                            doubtfulQuestions[currentQuestion.id]
                              ? 'bg-amber-400 border-amber-500 border-b-amber-600 text-slate-900 shadow-md shadow-amber-500/20'
                              : 'bg-amber-50 border-amber-300 border-b-amber-400 text-amber-800 hover:bg-amber-100'
                          }`}
                        >
                          <Flag className={`w-4 h-4 ${doubtfulQuestions[currentQuestion.id] ? 'fill-slate-900' : ''}`} />
                          <span>
                            {doubtfulQuestions[currentQuestion.id] ? 'Ragu-Ragu (Aktif)' : 'Ragu-Ragu'}
                          </span>
                        </button>

                        {/* Tombol Lanjut ATAU Selesai Ujian pada Soal Terakhir */}
                        {currentQuestionIndex < activeQuestions.length - 1 ? (
                          <button
                            type="button"
                            onClick={() =>
                              setCurrentQuestionIndex(prev =>
                                Math.min(activeQuestions.length - 1, prev + 1)
                              )
                            }
                            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#3b5bf5] to-indigo-600 hover:from-blue-600 hover:to-indigo-700 border-b-4 border-indigo-800 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0"
                          >
                            <span>Lanjut</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowFinishConfirm(true)}
                            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-b-4 border-emerald-800 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Selesai Ujian</span>
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="p-12 text-center text-slate-400 text-sm">
                      Tidak ada soal ditemukan.
                    </div>
                  )}
                </div>

                {/* KOLOM KANAN (4 Cols): Peta Misi Navigasi Soal (Playful & Interaktif) */}
                <div className="lg:col-span-4 bg-white rounded-[2rem] border-2 border-indigo-100/90 shadow-xl shadow-indigo-500/5 p-5 sm:p-6 space-y-5 sticky top-4">
                  {/* Header Peta Misi Soal */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-[#3b5bf5] flex items-center justify-center">
                        <Compass className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900">Peta Misi Soal</h4>
                        <p className="text-[11px] text-slate-400 font-semibold">
                          Klik kotak nomor untuk lompat cepat
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[#3b5bf5] to-indigo-600 text-white text-xs font-black shadow-sm">
                      {answeredQuestionsCount}/{activeQuestions.length}
                    </span>
                  </div>

                  {/* Interactive Filter Pills */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setNavFilter('all')}
                      className={`p-2.5 rounded-2xl border-2 text-center transition-all ${
                        navFilter === 'all'
                          ? 'bg-emerald-50 border-emerald-400 shadow-sm'
                          : 'bg-slate-50 border-slate-200/70 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-base font-black text-emerald-600 block">
                        {answeredQuestionsCount}
                      </span>
                      <span className="text-[10px] font-extrabold text-slate-600">Dijawab</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNavFilter(navFilter === 'doubtful' ? 'all' : 'doubtful')}
                      className={`p-2.5 rounded-2xl border-2 text-center transition-all ${
                        navFilter === 'doubtful'
                          ? 'bg-amber-100 border-amber-400 shadow-sm'
                          : 'bg-amber-50/60 border-amber-200/70 hover:bg-amber-100/70'
                      }`}
                    >
                      <span className="text-base font-black text-amber-600 block">
                        {doubtfulQuestionsCount}
                      </span>
                      <span className="text-[10px] font-extrabold text-amber-800">Ragu-ragu</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNavFilter(navFilter === 'unanswered' ? 'all' : 'unanswered')}
                      className={`p-2.5 rounded-2xl border-2 text-center transition-all ${
                        navFilter === 'unanswered'
                          ? 'bg-rose-100 border-rose-400 shadow-sm'
                          : 'bg-rose-50/50 border-rose-200/70 hover:bg-rose-100/60'
                      }`}
                    >
                      <span className="text-base font-black text-rose-600 block">
                        {unansweredQuestionsCount}
                      </span>
                      <span className="text-[10px] font-extrabold text-rose-700">Belum</span>
                    </button>
                  </div>

                  {/* Grid Nomor Soal 3D Tactile */}
                  <div className="grid grid-cols-5 gap-2.5 max-h-72 overflow-y-auto p-1">
                    {activeQuestions.map((q, idx) => {
                      const isCurrent = idx === currentQuestionIndex;
                      const isDoubt = Boolean(doubtfulQuestions[q.id]);
                      const isAns = isQuestionAnswered(q);

                      // Filter highlight logic
                      const isDimmed =
                        (navFilter === 'unanswered' && isAns) ||
                        (navFilter === 'doubtful' && !isDoubt);

                      // Cari label opsi yang dipilih jika PG
                      let selectedBadge = '';
                      if (q.question_type === 'multiple_choice' && answers[q.id]?.selected_option_id) {
                        const optIdx = q.options?.findIndex(
                          o => o.id === answers[q.id]?.selected_option_id
                        );
                        if (optIdx !== undefined && optIdx >= 0) {
                          selectedBadge = String.fromCharCode(65 + optIdx);
                        }
                      } else if (isAns) {
                        selectedBadge = '✓';
                      }

                      let tileStyle =
                        'bg-white text-slate-700 border-2 border-slate-200 border-b-4 border-b-slate-300 hover:border-indigo-300 hover:-translate-y-0.5';
                      if (isDoubt) {
                        tileStyle =
                          'bg-gradient-to-b from-amber-400 to-amber-500 text-slate-900 border-2 border-amber-500 border-b-4 border-b-amber-700 shadow-sm';
                      } else if (isAns) {
                        tileStyle =
                          'bg-gradient-to-b from-emerald-400 to-emerald-500 text-white border-2 border-emerald-500 border-b-4 border-b-emerald-700 shadow-sm';
                      }

                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => setCurrentQuestionIndex(idx)}
                          className={`relative h-13 py-1.5 rounded-2xl font-black text-xs flex flex-col items-center justify-center transition-all duration-150 ${tileStyle} ${
                            isCurrent
                              ? 'ring-3 ring-offset-2 ring-[#3b5bf5] -translate-y-0.5 scale-105 z-10'
                              : ''
                          } ${isDimmed ? 'opacity-30 scale-95' : ''}`}
                        >
                          <span className="text-xs leading-none">{idx + 1}</span>
                          <span
                            className={`mt-1 px-1.5 py-0.2 rounded-md text-[9px] font-black leading-tight ${
                              isDoubt
                                ? 'bg-amber-900/20 text-slate-900'
                                : isAns
                                ? 'bg-white/25 text-white'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {isDoubt ? '🏳️' : selectedBadge || '•'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Quick Jump to First Unanswered if any */}
                  {unansweredQuestionsCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (unansweredQuestionsList.length > 0) {
                          setCurrentQuestionIndex(unansweredQuestionsList[0].idx);
                        }
                      }}
                      className="w-full py-2.5 px-3.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-[#3b5bf5] text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>
                        Lompat ke Soal Belum Dijawab (#{unansweredQuestionsList[0]?.idx + 1})
                      </span>
                    </button>
                  ) : (
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold text-center flex items-center justify-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>Semua soal telah dijawab!</span>
                    </div>
                  )}

                  {/* Keterangan Warna */}
                  <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 inline-block"></span>
                      <span>Sudah Dijawab</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-md bg-amber-400 inline-block"></span>
                      <span>Ragu-Ragu</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-md bg-white border-2 border-slate-300 inline-block"></span>
                      <span>Belum Dijawab</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-md border-2 border-[#3b5bf5] inline-block"></span>
                      <span>Sedang Dibuka</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* =================================================================== */}
            {/* OVERLAY PERINGATAN WAJIB FULL SCREEN (Jika Siswa Keluar Fullscreen) */}
            {/* =================================================================== */}
            {isFullscreenWarningOpen && (
              <div className="fixed inset-0 z-[10000] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
                <div className="bg-white border-2 border-rose-300 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl text-center space-y-5">
                  <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto animate-bounce">
                    <ShieldAlert className="w-9 h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-black uppercase tracking-wider">
                      Peringatan Keamanan Ujian #{fullscreenExitCount}
                    </span>
                    <h4 className="text-xl font-black text-slate-900">
                      Wajib Mode Layar Penuh!
                    </h4>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Anda terdeteksi keluar dari mode <strong>Full Screen (Layar Penuh)</strong>. Selama ujian berlangsung, Anda tidak diizinkan keluar dari layar penuh atau berpindah halaman.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={enterFullscreen}
                    className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#3b5bf5] to-indigo-600 hover:from-blue-600 hover:to-indigo-700 border-b-4 border-indigo-800 text-white text-xs sm:text-sm font-black shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all"
                  >
                    <Maximize2 className="w-4 h-4" />
                    <span>Kembali ke Mode Full Screen Sekarang</span>
                  </button>
                </div>
              </div>
            )}

            {/* =================================================================== */}
            {/* POP-UP KONFIRMASI SELESAI UJIAN (Wajib Kerjakan Semua Soal Dahulu!) */}
            {/* =================================================================== */}
            {showFinishConfirm && (
              <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white border-2 border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5">
                  {unansweredQuestionsCount > 0 || doubtfulQuestionsCount > 0 ? (
                    /* BLOKIR: Masih ada soal yang belum dikerjakan atau ragu-ragu */
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-base font-black text-slate-900">
                            Belum Bisa Mengumpulkan Ujian!
                          </h4>
                          <p className="text-xs text-rose-600 font-bold">
                            Wajib menyelesaikan seluruh soal terlebih dahulu
                          </p>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2.5">
                        {unansweredQuestionsCount > 0 && (
                          <div>
                            <p className="font-extrabold mb-1.5">
                              Masih ada {unansweredQuestionsCount} soal yang belum dikerjakan:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {unansweredQuestionsList.map(item => (
                                <button
                                  key={item.q.id}
                                  type="button"
                                  onClick={() => {
                                    setCurrentQuestionIndex(item.idx);
                                    setShowFinishConfirm(false);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-white border border-rose-300 text-rose-700 hover:bg-rose-600 hover:text-white font-black text-[11px] transition-colors"
                                >
                                  Soal #{item.idx + 1}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {doubtfulQuestionsCount > 0 && (
                          <p className="font-bold text-amber-800 pt-1">
                            ⚠️ Terdapat {doubtfulQuestionsCount} soal yang masih ditandai <strong>Ragu-Ragu</strong>. Silakan pastikan jawaban Anda dan lepaskan tanda ragu-ragu.
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (unansweredQuestionsList.length > 0) {
                              setCurrentQuestionIndex(unansweredQuestionsList[0].idx);
                            }
                            setShowFinishConfirm(false);
                          }}
                          className="w-full py-3 px-5 rounded-2xl bg-[#3b5bf5] hover:bg-blue-600 text-white text-xs font-extrabold shadow-md shadow-blue-500/25 flex items-center justify-center gap-2"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>
                            {unansweredQuestionsCount > 0
                              ? `Kerjakan Soal #${unansweredQuestionsList[0].idx + 1} Sekarang`
                              : 'Kembali Periksa Soal Ragu-Ragu'}
                          </span>
                        </button>
                      </div>
                    </>
                  ) : (
                    /* SEMUA SOAL SUDAH DIJAWAB -> Siap Dikumpulkan */
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                          <Trophy className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-base font-black text-slate-900">
                            Yeay! Semua Soal Sudah Terjawab 🎉
                          </h4>
                          <p className="text-xs text-slate-500 font-medium">
                            Seluruh {activeQuestions.length} butir soal telah selesai kamu kerjakan
                          </p>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2 text-xs">
                        <div className="flex items-center justify-between font-bold text-emerald-900">
                          <span>Total Soal Dijawab:</span>
                          <span className="font-black">
                            {answeredQuestionsCount} / {activeQuestions.length} Soal (100%)
                          </span>
                        </div>
                        <div className="flex items-center justify-between font-bold text-emerald-900">
                          <span>Sisa Waktu Ujian:</span>
                          <span className="font-mono font-black">{formatTimer(timeLeftSeconds)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2.5 pt-2">
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => setShowFinishConfirm(false)}
                          className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold"
                        >
                          Cek Lagi
                        </button>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleFinalSubmit(false)}
                          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-extrabold shadow-md shadow-emerald-600/25 flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isSubmitting ? 'Mengirim...' : 'Ya, Selesai & Kumpulkan'}</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>,
          document.body
        )}

      {/* ===================================================================== */}
      {/* 2. LEMBAR PENGERJAAN BIASA (Khusus Soal Essay Saja atau Upload Tugas)  */}
      {/* ===================================================================== */}
      {activeWorkingAsg && !isExamModeActive && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200/80 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[95vh] flex flex-col">
            {/* Header Lembar Pengerjaan */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4 shrink-0">
              <div>
                <span className="text-xs font-extrabold text-[#3b5bf5] uppercase tracking-wider">
                  {subjects.find(s => s.id === activeWorkingAsg.subject_id)?.name} &bull;{' '}
                  {isEditingSubmitted
                    ? 'Mode Perbaikan Jawaban Esai'
                    : activeWorkingAsg.type === 'quiz'
                    ? 'Lembar Pengerjaan Esai'
                    : 'Lembar Pengumpulan Tugas'}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">{activeWorkingAsg.title}</h3>
              </div>

              <div className="flex items-center gap-3">
                {activeWorkingAsg.type === 'quiz' && activeWorkingAsg.duration_minutes && !isEditingSubmitted && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 font-mono font-bold text-sm">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Sisa: {formatTimer(timeLeftSeconds)}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsEditingSubmitted(false);
                    setActiveWorkingAsg(null);
                  }}
                  className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
                  title="Tutup Lembar Pengerjaan"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {isEditingSubmitted && (
              <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2.5 shrink-0">
                <Edit3 className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Anda sedang mengedit jawaban yang telah dikirim. Jawaban masih dapat diperbaiki selama belum dinilai oleh guru.
                </span>
              </div>
            )}

            {/* Body Lembar Pengerjaan (Soal Essay Saja atau Upload Tugas) */}
            <div className="overflow-y-auto flex-1 pr-2 space-y-6">
              {activeWorkingAsg.type === 'quiz' ? (
                activeQuestions.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Belum ada butir soal yang dihubungkan ke tugas ini.
                  </div>
                ) : (
                  activeQuestions.map((q, index) => {
                    const isEssayOrShort = q.question_type === 'essay' || q.question_type === 'short_answer';
                    if (isEditingSubmitted && !isEssayOrShort) {
                      const chosenOpt = q.options?.find(o => o.id === answers[q.id]?.selected_option_id);
                      return (
                        <div key={q.id} className="p-4 rounded-2xl bg-slate-100/80 border border-slate-200/80 space-y-2 opacity-80">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-200 text-slate-700">
                              Soal Nomor {index + 1} (Pilihan Ganda • Terkunci)
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-700">{q.question_text}</p>
                          <p className="text-xs text-slate-600 font-semibold">
                            Jawaban Terpilih: <span className="text-[#3b5bf5]">{chosenOpt ? `${chosenOpt.option_key}. ${chosenOpt.option_text}` : '-'}</span>
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div key={q.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-blue-50 text-[#3b5bf5]">
                            Soal Nomor {index + 1} &bull; {q.points} Poin
                          </span>
                          <span className="text-[10px] text-emerald-600 uppercase tracking-wider font-extrabold">
                            Esai / Uraian (Dapat Diedit)
                          </span>
                        </div>

                        <p className="text-sm font-bold text-slate-900 leading-relaxed">
                          {q.question_text}
                        </p>

                        <div>
                          <textarea
                            rows={4}
                            placeholder="Tuliskan penjelasan dan pemaparan jawaban esai Anda secara lengkap..."
                            value={answers[q.id]?.answer_text || ''}
                            onChange={(e) => handleTextAnswer(q.id, e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] leading-relaxed"
                          />
                        </div>
                      </div>
                    );
                  })
                )
              ) : (
                /* Upload Tugas Area */
                <div className="space-y-5">
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <h4 className="text-sm font-bold text-slate-900">Petunjuk Tugas</h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {activeWorkingAsg.description || 'Kumpulkan hasil kerja Anda dalam format tautan PDF atau tuliskan uraian jawaban di bawah ini.'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Catatan / Teks Jawaban Anda
                    </label>
                    <textarea
                      rows={5}
                      value={studentNotes}
                      onChange={(e) => setStudentNotes(e.target.value)}
                      placeholder="Tuliskan uraian hasil kerja tugas Anda di sini..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      URL Lampiran Berkas Tugas (Google Drive / Cloud / PDF / Gambar)
                    </label>
                    <input
                      type="url"
                      value={fileInputUrl}
                      onChange={(e) => setFileInputUrl(e.target.value)}
                      placeholder="https://drive.google.com/file/... atau link dokumen Anda"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Lembar Pengerjaan */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsEditingSubmitted(false);
                  setActiveWorkingAsg(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Batal / Tutup
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleFinalSubmit(false)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#3b5bf5] hover:bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/25 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {isSubmitting
                    ? 'Menyimpan...'
                    : isEditingSubmitted
                    ? 'Simpan Perubahan Jawaban'
                    : 'Kumpulkan Jawaban'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
