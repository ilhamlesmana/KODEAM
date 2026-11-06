import React, { useState } from 'react';
import { History, CheckCircle2, Clock, FileText, Award, Edit3, Lock, X, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { Submission, Assignment, Question } from '../../../types/database.types';
import { TablePaginationBar, paginateArray } from '../../../components/TablePaginationBar';

export const StudentHistory: React.FC = () => {
  const { currentStudent } = useAuth();
  const { submissions, assignments, subjects, questions, grades, submitAssignment } = useData();
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // State untuk edit jawaban essay langsung dari Riwayat
  const [editingSub, setEditingSub] = useState<Submission | null>(null);
  const [editingAsg, setEditingAsg] = useState<Assignment | null>(null);
  const [essayEdits, setEssayEdits] = useState<Record<string, string>>({});
  const [notesEdit, setNotesEdit] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const mySubmissions = submissions.filter(s => s.student_id === currentStudent?.id);
  const paginatedSubmissions = paginateArray(mySubmissions, pageSize, currentPage);

  const getAssignmentQuestions = (asg?: Assignment): Question[] => {
    if (!asg) return [];
    if (asg.question_ids && asg.question_ids.length > 0) {
      return questions.filter(q => asg.question_ids!.includes(q.id));
    }
    return questions.filter(q => q.subject_id === asg.subject_id);
  };

  const handleOpenEditModal = (sub: Submission, asg?: Assignment) => {
    if (!asg) return;
    const isGraded =
      sub.status === 'graded' ||
      grades.some(g => g.student_id === currentStudent?.id && g.assignment_id === asg.id);

    if (isGraded) {
      showToast('error', 'Jawaban sudah dinilai oleh guru dan tidak dapat diubah kembali.');
      return;
    }

    const initialEssays: Record<string, string> = {};
    (sub.answers || []).forEach(a => {
      if (a.answer_text) {
        initialEssays[a.question_id] = a.answer_text;
      }
    });

    setEditingSub(sub);
    setEditingAsg(asg);
    setEssayEdits(initialEssays);
    setNotesEdit(sub.student_notes || '');
  };

  const handleSaveEditedEssay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub || !editingAsg || !currentStudent) return;

    const isGradedNow =
      editingSub.status === 'graded' ||
      grades.some(g => g.student_id === currentStudent.id && g.assignment_id === editingAsg.id);

    if (isGradedNow) {
      showToast('error', 'Jawaban sudah dinilai oleh guru dan terkunci.');
      setEditingSub(null);
      setEditingAsg(null);
      return;
    }

    setSaving(true);
    const asgQuestions = getAssignmentQuestions(editingAsg);

    const answersPayload: Record<string, { answer_text?: string; selected_option_id?: string; file_url?: string }> = {};

    asgQuestions.forEach(q => {
      const existingAns = (editingSub.answers || []).find(a => a.question_id === q.id);
      if (q.question_type === 'essay' || q.question_type === 'short_answer') {
        const textVal = (essayEdits[q.id] ?? existingAns?.answer_text ?? '').trim();
        answersPayload[q.id] = { answer_text: textVal };
      } else if (existingAns) {
        answersPayload[q.id] = {
          selected_option_id: existingAns.selected_option_id || undefined,
          answer_text: existingAns.answer_text || undefined,
          file_url: existingAns.file_url || undefined,
        };
      }
    });

    const formattedEssaySummary = asgQuestions
      .map((q, idx) => {
        if (q.question_type === 'essay' || q.question_type === 'short_answer') {
          const textAns = (essayEdits[q.id] || '').trim();
          return textAns ? `[Soal #${idx + 1} - ${q.question_type.toUpperCase()}]: ${textAns}` : null;
        }
        return null;
      })
      .filter(Boolean)
      .join('\n\n');

    const finalNotes =
      editingAsg.type === 'assignment'
        ? notesEdit
        : formattedEssaySummary || notesEdit || 'Lembar jawaban diperbarui oleh siswa.';

    const res = await submitAssignment(
      editingAsg.id,
      currentStudent.id,
      answersPayload,
      finalNotes,
      editingSub.file_urls || undefined
    );

    setSaving(false);

    if (!res.success) {
      showToast('error', res.error || 'Gagal menyimpan perubahan jawaban.');
      return;
    }

    setEditingSub(null);
    setEditingAsg(null);
    showToast('success', 'Perubahan jawaban esai berhasil disimpan!');
  };

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl border shadow-xl flex items-center gap-2.5 text-xs sm:text-sm font-bold ${
            toastMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      <div>
        <h3 className="text-xl font-bold text-slate-900">Riwayat Pengumpulan &amp; Pengerjaan</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Daftar seluruh kuis dan tugas yang telah Anda kumpulkan. Jawaban esai masih dapat diperbaiki selama belum dinilai oleh guru.
        </p>
      </div>

      {/* Filter Banyaknya Data yang Ditampilkan */}
      <TablePaginationBar
        totalItems={mySubmissions.length}
        pageSize={pageSize}
        currentPage={currentPage}
        onPageSizeChange={setPageSize}
        onPageChange={setCurrentPage}
        itemLabel="riwayat pengumpulan"
      />

      <div className="space-y-4">
        {mySubmissions.length === 0 ? (
          <div className="bg-white p-12 text-center text-slate-400 rounded-3xl border border-slate-200/80 shadow-sm text-xs">
            Belum ada riwayat pengerjaan tugas atau kuis.
          </div>
        ) : (
          paginatedSubmissions.map((sub) => {
            const asg = assignments.find(a => a.id === sub.assignment_id);
            const subject = subjects.find(s => s.id === asg?.subject_id);
            const asgQuestions = getAssignmentQuestions(asg);
            const essayQuestions = asgQuestions.filter(
              q => q.question_type === 'essay' || q.question_type === 'short_answer'
            );
            const hasEditableContent = asg?.type === 'assignment' || essayQuestions.length > 0;
            const isGraded =
              sub.status === 'graded' ||
              grades.some(g => g.student_id === currentStudent?.id && g.assignment_id === sub.assignment_id);

            return (
              <div
                key={sub.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4 hover:shadow-md transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {subject?.name || 'Umum'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Dikirim:{' '}
                      {new Date(sub.submitted_at || sub.started_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-extrabold self-start sm:self-auto flex items-center gap-1.5 ${
                      isGraded
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {isGraded ? (
                      <>
                        <Lock className="w-3 h-3" />
                        <span>Sudah Dinilai Guru (Jawaban Terkunci)</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3" />
                        <span>Menunggu Koreksi Guru</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h4 className="text-base font-bold text-slate-900">{asg?.title || 'Tugas Siswa'}</h4>

                  {hasEditableContent && (
                    <div>
                      {!isGraded ? (
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(sub, asg)}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold shadow-sm transition-all inline-flex items-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Perbaiki Jawaban Essay</span>
                        </button>
                      ) : (
                        <span className="px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-[11px] font-bold inline-flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Tidak Dapat Diubah (Sudah Dinilai)</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Daftar Jawaban Essay Siswa */}
                {essayQuestions.length > 0 && (
                  <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#3b5bf5]">
                      Jawaban Essay / Uraian Anda ({essayQuestions.length} Soal):
                    </p>
                    {essayQuestions.map((q, idx) => {
                      const ans = (sub.answers || []).find(a => a.question_id === q.id);
                      return (
                        <div key={q.id} className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
                          <p className="text-[11px] font-bold text-slate-500">
                            Soal #{idx + 1}: {q.question_text}
                          </p>
                          <p className="text-xs font-semibold text-slate-900 whitespace-pre-wrap">
                            {ans?.answer_text || '(Belum diisi)'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {sub.student_notes && essayQuestions.length === 0 && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 italic">
                    Catatan / Jawaban Anda: &quot;{sub.student_notes}&quot;
                  </p>
                )}

                {sub.teacher_feedback && (
                  <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-xs">
                    <span className="font-semibold text-blue-900">Catatan Guru: </span>
                    <span className="text-blue-800">{sub.teacher_feedback}</span>
                  </div>
                )}

                <div className="pt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                  <span>Hasil Akhir:</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {sub.total_score !== null ? `${sub.total_score} / 100 Poin` : 'Sedang Diperiksa Guru'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Edit Jawaban Essay */}
      {editingSub && editingAsg && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">
                    Perbaiki Jawaban Essay — {editingAsg.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Anda masih dapat memperbaiki salah ketik (typo) sebelum jawaban dinilai oleh guru.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingSub(null);
                  setEditingAsg(null);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedEssay} className="space-y-4">
              {(() => {
                const asgQuestions = getAssignmentQuestions(editingAsg);
                const essayQuestions = asgQuestions.filter(
                  q => q.question_type === 'essay' || q.question_type === 'short_answer'
                );

                if (essayQuestions.length > 0) {
                  return essayQuestions.map((q, idx) => (
                    <div key={q.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                          Soal Essay #{idx + 1} • {q.points} Poin
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 leading-relaxed">{q.question_text}</p>
                      <textarea
                        rows={4}
                        required
                        value={essayEdits[q.id] || ''}
                        onChange={(e) =>
                          setEssayEdits(prev => ({
                            ...prev,
                            [q.id]: e.target.value,
                          }))
                        }
                        placeholder="Ketik perbaikan jawaban esai Anda di sini..."
                        className="w-full p-3.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  ));
                }

                return (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Jawaban / Catatan Tugas Anda
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={notesEdit}
                      onChange={(e) => setNotesEdit(e.target.value)}
                      placeholder="Perbaiki jawaban tugas Anda di sini..."
                      className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                );
              })()}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditingSub(null);
                    setEditingAsg(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold shadow-md shadow-amber-500/20 inline-flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan Jawaban'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
