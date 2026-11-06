import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Copy,
  CheckCircle2,
  X,
  Filter,
  Check,
  FolderKanban,
  Tag,
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { Question, QuestionType, QuestionDifficulty } from '../../../types/database.types';
import { TablePaginationBar, paginateArray } from '../../../components/TablePaginationBar';
import { CustomCombobox } from '../../../components/CustomCombobox';

export interface QuestionFormOption {
  id: string;
  option_key?: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

export interface QuestionFormData {
  subject_id: string;
  class_id: string;
  category_name: string;
  question_text: string;
  question_type: QuestionType;
  points: number;
  difficulty: QuestionDifficulty;
  explanation: string;
  short_answer_key: string;
  options: QuestionFormOption[];
}

const PRESET_CATEGORIES = [
  'Tugas 1',
  'Tugas 2',
  'Tugas 3',
  'Kuis 1',
  'Kuis 2',
  'Ulangan Harian 1',
  'UTS',
  'UAS',
];

export const AdminQuestionBank: React.FC = () => {
  const { questions, subjects, classes, addQuestion, updateQuestion, deleteQuestion, duplicateQuestion } = useData();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editFormData, setEditFormData] = useState<QuestionFormData | null>(null);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [notification, setNotification] = useState<string | null>(null);

  // Kumpulkan seluruh daftar nama Paket / Kategori unik yang sudah ada di Bank Soal
  const existingCategories = Array.from(
    new Set(
      questions
        .filter(q => selectedSubjectFilter === 'all' || q.subject_id === selectedSubjectFilter)
        .map(q => (q.category_name || 'Umum').trim())
        .filter(Boolean)
    )
  );

  const quickCategoryOptions = Array.from(new Set([...existingCategories, ...PRESET_CATEGORIES]));

  // Form state
  const [formData, setFormData] = useState<QuestionFormData>({
    subject_id: subjects[0]?.id || '',
    class_id: classes[0]?.id || '',
    category_name: 'Tugas 1',
    question_text: '',
    question_type: 'multiple_choice',
    points: 10,
    difficulty: 'medium',
    explanation: '',
    short_answer_key: '',
    options: [
      { id: '1', option_key: 'A', option_text: 'Pilihan A', is_correct: true, order_index: 1 },
      { id: '2', option_key: 'B', option_text: 'Pilihan B', is_correct: false, order_index: 2 },
      { id: '3', option_key: 'C', option_text: 'Pilihan C', is_correct: false, order_index: 3 },
      { id: '4', option_key: 'D', option_text: 'Pilihan D', is_correct: false, order_index: 4 },
    ]
  });

  const showNotif = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddOption = () => {
    if (formData.options.length >= 5) {
      alert('Maksimal 5 pilihan jawaban');
      return;
    }
    const nextOrder = formData.options.length + 1;
    setFormData({
      ...formData,
      options: [
        ...formData.options,
        {
          id: String(Date.now()),
          option_key: String.fromCharCode(64 + nextOrder),
          option_text: `Pilihan ${String.fromCharCode(64 + nextOrder)}`,
          is_correct: false,
          order_index: nextOrder,
        }
      ]
    });
  };

  const handleRemoveOption = (index: number) => {
    if (formData.options.length <= 2) {
      alert('Minimal 2 pilihan jawaban');
      return;
    }
    const updated = formData.options.filter((_, i) => i !== index);
    const hasCorrect = updated.some(o => o.is_correct);
    if (!hasCorrect && updated.length > 0) {
      updated[0].is_correct = true;
    }
    setFormData({ ...formData, options: updated });
  };

  const setCorrectOption = (index: number) => {
    const updated = formData.options.map((opt, i) => ({
      ...opt,
      is_correct: i === index,
    }));
    setFormData({ ...formData, options: updated });
  };

  const handleOpenAddModal = () => {
    if (subjects.length === 0) {
      alert('Belum ada Mata Pelajaran. Silakan buat mata pelajaran terlebih dahulu di menu Mata Pelajaran.');
      return;
    }
    const defaultSubId = (selectedSubjectFilter !== 'all' ? selectedSubjectFilter : subjects[0]?.id) || subjects[0]?.id || '';
    const defaultCategory = selectedCategoryFilter !== 'all'
      ? selectedCategoryFilter
      : (formData.category_name || 'Tugas 1');
    setFormData({
      subject_id: defaultSubId,
      class_id: classes[0]?.id || '',
      category_name: defaultCategory,
      question_text: '',
      question_type: 'multiple_choice',
      points: 10,
      difficulty: 'medium',
      explanation: '',
      short_answer_key: '',
      options: [
        { id: '1', option_key: 'A', option_text: 'Pilihan A', is_correct: true, order_index: 1 },
        { id: '2', option_key: 'B', option_text: 'Pilihan B', is_correct: false, order_index: 2 },
        { id: '3', option_key: 'C', option_text: 'Pilihan C', is_correct: false, order_index: 3 },
        { id: '4', option_key: 'D', option_text: 'Pilihan D', is_correct: false, order_index: 4 },
      ]
    });
    setIsAddModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveSubjectId = formData.subject_id || (selectedSubjectFilter !== 'all' ? selectedSubjectFilter : subjects[0]?.id) || subjects[0]?.id || '';

    if (!formData.question_text.trim()) {
      alert('Teks soal wajib diisi!');
      return;
    }
    if (!effectiveSubjectId) {
      alert('Pilih mata pelajaran terlebih dahulu!');
      return;
    }

    let finalOptions = formData.options;
    if (formData.question_type === 'true_false') {
      finalOptions = [
        { id: 'tf_1', option_key: 'A', option_text: 'Benar', is_correct: formData.options[0]?.is_correct ?? true, order_index: 1 },
        { id: 'tf_2', option_key: 'B', option_text: 'Salah', is_correct: !(formData.options[0]?.is_correct ?? true), order_index: 2 },
      ];
    } else if (formData.question_type === 'short_answer' || formData.question_type === 'essay') {
      finalOptions = [];
    } else if (formData.question_type === 'multiple_choice') {
      finalOptions = formData.options.map((opt, idx) => ({
        ...opt,
        option_key: opt.option_key || String.fromCharCode(65 + idx),
        order_index: idx + 1,
      }));
    }

    const res = await addQuestion({
      subject_id: effectiveSubjectId,
      class_id: formData.class_id || null,
      category_name: (formData.category_name || 'Umum').trim() || 'Umum',
      question_text: formData.question_text,
      question_type: formData.question_type,
      points: Number(formData.points) || 10,
      difficulty: formData.difficulty,
      explanation: formData.explanation,
      short_answer_key: formData.question_type === 'short_answer' ? formData.short_answer_key : null,
      options: finalOptions,
    });

    if (res && !res.success) {
      alert('Informasi Database: ' + (res.error || 'Terjadi kendala pada database Supabase. Soal diamankan di penyimpanan aplikasi.'));
    }

    setIsAddModalOpen(false);
    showNotif(`Soal berhasil ditambahkan ke Paket "${(formData.category_name || 'Umum').trim()}"!`);
  };

  const handleOpenEditModal = (q: Question) => {
    setEditingQuestion(q);
    setEditFormData({
      subject_id: q.subject_id,
      class_id: q.class_id || '',
      category_name: q.category_name || 'Umum',
      question_text: q.question_text,
      question_type: q.question_type,
      points: q.points,
      difficulty: q.difficulty,
      explanation: q.explanation || '',
      short_answer_key: q.short_answer_key || '',
      options: q.options && q.options.length > 0
        ? q.options.map(o => ({ ...o }))
        : [
            { id: '1', option_key: 'A', option_text: 'Pilihan A', is_correct: true, order_index: 1 },
            { id: '2', option_key: 'B', option_text: 'Pilihan B', is_correct: false, order_index: 2 },
            { id: '3', option_key: 'C', option_text: 'Pilihan C', is_correct: false, order_index: 3 },
            { id: '4', option_key: 'D', option_text: 'Pilihan D', is_correct: false, order_index: 4 },
          ]
    });
  };

  const handleAddEditOption = () => {
    if (!editFormData || editFormData.options.length >= 5) {
      alert('Maksimal 5 pilihan jawaban');
      return;
    }
    const nextOrder = editFormData.options.length + 1;
    setEditFormData({
      ...editFormData,
      options: [
        ...editFormData.options,
        {
          id: String(Date.now()),
          option_key: String.fromCharCode(64 + nextOrder),
          option_text: `Pilihan ${String.fromCharCode(64 + nextOrder)}`,
          is_correct: false,
          order_index: nextOrder,
        }
      ]
    });
  };

  const handleRemoveEditOption = (index: number) => {
    if (!editFormData || editFormData.options.length <= 2) {
      alert('Minimal 2 pilihan jawaban');
      return;
    }
    const updated = editFormData.options.filter((_, i) => i !== index);
    const hasCorrect = updated.some(o => o.is_correct);
    if (!hasCorrect && updated.length > 0) {
      updated[0].is_correct = true;
    }
    setEditFormData({ ...editFormData, options: updated });
  };

  const setCorrectEditOption = (index: number) => {
    if (!editFormData) return;
    const updated = editFormData.options.map((opt, i) => ({
      ...opt,
      is_correct: i === index,
    }));
    setEditFormData({ ...editFormData, options: updated });
  };

  const handleUpdateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion || !editFormData || !editFormData.question_text || !editFormData.subject_id) return;

    let finalOptions = editFormData.options;
    if (editFormData.question_type === 'true_false') {
      finalOptions = [
        { id: 'tf_1', option_key: 'A', option_text: 'Benar', is_correct: editFormData.options[0]?.is_correct ?? true, order_index: 1 },
        { id: 'tf_2', option_key: 'B', option_text: 'Salah', is_correct: !(editFormData.options[0]?.is_correct ?? true), order_index: 2 },
      ];
    } else if (editFormData.question_type === 'short_answer' || editFormData.question_type === 'essay') {
      finalOptions = [];
    } else if (editFormData.question_type === 'multiple_choice') {
      finalOptions = editFormData.options.map((opt, idx) => ({
        ...opt,
        option_key: opt.option_key || String.fromCharCode(65 + idx),
        order_index: idx + 1,
      }));
    }

    const res = await updateQuestion(editingQuestion.id, {
      subject_id: editFormData.subject_id,
      class_id: editFormData.class_id || null,
      category_name: (editFormData.category_name || 'Umum').trim() || 'Umum',
      question_text: editFormData.question_text,
      question_type: editFormData.question_type,
      points: Number(editFormData.points),
      difficulty: editFormData.difficulty,
      explanation: editFormData.explanation,
      short_answer_key: editFormData.question_type === 'short_answer' ? editFormData.short_answer_key : null,
      options: finalOptions,
    });

    if (res && !res.success) {
      alert('Gagal memperbarui soal: ' + (res.error || 'Terjadi kesalahan pada database'));
      return;
    }

    setEditingQuestion(null);
    setEditFormData(null);
    showNotif('Soal berhasil diperbarui!');
  };

  const handleDuplicate = async (id: string) => {
    await duplicateQuestion(id);
    showNotif('Soal berhasil diduplikasi!');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus soal ini dari Bank Soal?')) {
      await deleteQuestion(id);
      showNotif('Soal berhasil dihapus.');
    }
  };

  const filteredQuestions = questions.filter(q => {
    const matchSubject = selectedSubjectFilter === 'all' || q.subject_id === selectedSubjectFilter;
    const qCat = (q.category_name || 'Umum').trim();
    const matchCategory = selectedCategoryFilter === 'all' || qCat === selectedCategoryFilter;
    const matchType = selectedTypeFilter === 'all' || q.question_type === selectedTypeFilter;
    return matchSubject && matchCategory && matchType;
  });

  const paginatedQuestions = paginateArray(filteredQuestions, pageSize, currentPage);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-slate-900">Bank Soal Terpadu & Paket Kategori</h3>
          <p className="text-xs text-slate-500 font-medium">
            Kelompokkan butir soal ke dalam Paket Tugas / Ujian (misal: Tugas 1, Tugas 2, UTS, UAS) agar tinggal dipanggil 1 klik saat membuat Tugas & Ujian
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#3b5bf5] hover:bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Soal Baru</span>
        </button>
      </div>

      {/* Filters & Paket Soal Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <CustomCombobox
            icon={<Filter className="w-4 h-4" />}
            prefixLabel="Mapel:"
            value={selectedSubjectFilter}
            onChange={(val) => {
              setSelectedSubjectFilter(val);
              setSelectedCategoryFilter('all');
            }}
            options={[
              { value: 'all', label: 'Semua Mapel', badge: subjects.length },
              ...subjects.map((s) => ({
                value: s.id,
                label: s.name,
                badge: s.code,
              })),
            ]}
          />

          <CustomCombobox
            icon={<FolderKanban className="w-4 h-4" />}
            prefixLabel="Paket:"
            value={selectedCategoryFilter}
            onChange={(val) => setSelectedCategoryFilter(val)}
            options={[
              {
                value: 'all',
                label: 'Semua Paket Kategori',
                badge: `${
                  questions.filter(
                    (q) => selectedSubjectFilter === 'all' || q.subject_id === selectedSubjectFilter
                  ).length
                } Soal`,
              },
              ...existingCategories.map((cat) => {
                const count = questions.filter(
                  (q) =>
                    (selectedSubjectFilter === 'all' || q.subject_id === selectedSubjectFilter) &&
                    (q.category_name || 'Umum').trim() === cat
                ).length;
                return {
                  value: cat,
                  label: `Paket: ${cat}`,
                  badge: `${count} Soal`,
                };
              }),
            ]}
          />

          <CustomCombobox
            prefixLabel="Tipe:"
            value={selectedTypeFilter}
            onChange={(val) => setSelectedTypeFilter(val)}
            searchable={false}
            options={[
              { value: 'all', label: 'Semua Tipe Soal' },
              { value: 'multiple_choice', label: 'Pilihan Ganda' },
              { value: 'true_false', label: 'Benar / Salah' },
              { value: 'short_answer', label: 'Isian Singkat' },
              { value: 'essay', label: 'Esai (Uraian)' },
            ]}
          />
        </div>

        {/* Quick Paket Pills */}
        {existingCategories.length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 mr-1">Filter Cepat Paket:</span>
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter('all')}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                selectedCategoryFilter === 'all'
                  ? 'bg-[#3b5bf5] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Paket
            </button>
            {existingCategories.map(cat => {
              const count = questions.filter(
                q => (selectedSubjectFilter === 'all' || q.subject_id === selectedSubjectFilter) && (q.category_name || 'Umum').trim() === cat
              ).length;
              const isSelected = selectedCategoryFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/60'
                  }`}
                >
                  <Tag className="w-3 h-3" />
                  <span>{cat}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Filter Banyaknya Data Soal yang Ditampilkan */}
      <TablePaginationBar
        totalItems={filteredQuestions.length}
        pageSize={pageSize}
        currentPage={currentPage}
        onPageSizeChange={setPageSize}
        onPageChange={setCurrentPage}
        itemLabel="butir soal"
      />

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="bg-white p-12 text-center text-slate-400 rounded-3xl border border-slate-200/80 shadow-sm text-xs font-medium">
            Belum ada soal pada kriteria filter ini. Klik &quot;Buat Soal Baru&quot; untuk menambahkan.
          </div>
        ) : (
          paginatedQuestions.map((q, index) => {
            const subject = subjects.find(s => s.id === q.subject_id);

            return (
              <div
                key={q.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4 hover:border-[#3b5bf5]/40 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#3b5bf5]">
                      {subject?.name || 'Mapel'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70 flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      Paket: {q.category_name || 'Umum'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {q.question_type === 'multiple_choice' && 'Pilihan Ganda'}
                      {q.question_type === 'true_false' && 'Benar / Salah'}
                      {q.question_type === 'short_answer' && 'Isian Singkat'}
                      {q.question_type === 'essay' && 'Esai'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                      Bobot: {q.points} Poin
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      q.difficulty === 'easy' ? 'bg-[#1cd485]/15 text-[#0fa868]' :
                      q.difficulty === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {q.difficulty === 'easy' ? 'Mudah' : q.difficulty === 'medium' ? 'Sedang' : 'Sulit'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleOpenEditModal(q)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-[#3b5bf5] transition-colors"
                      title="Edit Soal"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDuplicate(q.id)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                      title="Duplikasi Soal"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors"
                      title="Hapus Soal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <p className="text-sm font-bold text-slate-900 leading-relaxed">
                  <span className="text-[#3b5bf5] mr-2">Q{index + 1}.</span>
                  {q.question_text}
                </p>

                {/* Options display */}
                {q.question_type === 'multiple_choice' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                    {q.options?.map((opt, i) => (
                      <div
                        key={opt.id}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                          opt.is_correct
                            ? 'bg-[#1cd485]/15 border-emerald-200 text-[#0fa868] font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-700 font-medium'
                        }`}
                      >
                        <span>
                          <strong className="mr-1.5">{String.fromCharCode(65 + i)}.</strong>
                          {opt.option_text}
                        </span>
                        {opt.is_correct && <Check className="w-4 h-4 text-[#0fa868] shrink-0" />}
                      </div>
                    ))}
                  </div>
                )}

                {q.question_type === 'true_false' && (
                  <div className="flex gap-3 pt-2">
                    {q.options?.map((opt) => (
                      <div
                        key={opt.id}
                        className={`px-4 py-2 rounded-xl border text-xs flex items-center gap-2 ${
                          opt.is_correct
                            ? 'bg-[#1cd485]/15 border-emerald-200 text-[#0fa868] font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-700 font-medium'
                        }`}
                      >
                        <span>{opt.option_text}</span>
                        {opt.is_correct && <Check className="w-4 h-4 text-[#0fa868]" />}
                      </div>
                    ))}
                  </div>
                )}

                {q.question_type === 'short_answer' && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-slate-500 font-medium">Kunci Jawaban Singkat: </span>
                    <span className="font-mono font-extrabold text-[#3b5bf5]">{q.short_answer_key}</span>
                  </div>
                )}

                {q.question_type === 'essay' && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                    <span className="text-[#3b5bf5] font-bold">Petunjuk Koreksi Manual: </span>
                    {q.explanation || 'Guru memeriksa jawaban teks siswa secara manual dan memberikan nilai.'}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Tambah Soal Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#3b5bf5]" />
                Tambah Soal ke Bank Soal
              </h4>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Paket / Kategori Tugas & Ujian */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                    <FolderKanban className="w-4 h-4 text-[#3b5bf5]" />
                    Paket / Kategori Tugas & Ujian *
                  </label>
                  <span className="text-[10px] font-semibold text-indigo-600">
                    Agar tinggal dipanggil 1 klik saat Buat Tugas / Ujian
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={formData.category_name}
                  onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                  placeholder="Ketik nama paket (contoh: Tugas 1, Tugas 2, Ulangan Harian 1, UTS)..."
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-indigo-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#3b5bf5]"
                />
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-slate-500 mr-1">Pilih Cepat:</span>
                  {quickCategoryOptions.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormData({ ...formData, category_name: cat })}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        formData.category_name === cat
                          ? 'bg-[#3b5bf5] text-white shadow-sm'
                          : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Mata Pelajaran *</label>
                  <CustomCombobox
                    value={formData.subject_id}
                    onChange={(val) => setFormData({ ...formData, subject_id: val })}
                    options={subjects.map((s) => ({
                      value: s.id,
                      label: s.name,
                      badge: s.code,
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Tipe Soal *</label>
                  <CustomCombobox
                    value={formData.question_type}
                    onChange={(val) => setFormData({ ...formData, question_type: val as QuestionType })}
                    searchable={false}
                    options={[
                      { value: 'multiple_choice', label: 'Pilihan Ganda (PG)' },
                      { value: 'true_false', label: 'Benar atau Salah' },
                      { value: 'short_answer', label: 'Isian Singkat' },
                      { value: 'essay', label: 'Esai (Manual Review)' },
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Bobot Nilai (Poin)</label>
                  <input
                    type="number"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Tingkat Kesulitan</label>
                  <CustomCombobox
                    value={formData.difficulty}
                    onChange={(val) => setFormData({ ...formData, difficulty: val as QuestionDifficulty })}
                    searchable={false}
                    options={[
                      { value: 'easy', label: 'Mudah' },
                      { value: 'medium', label: 'Sedang' },
                      { value: 'hard', label: 'Sulit' },
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Teks Soal / Pertanyaan *</label>
                <textarea
                  rows={3}
                  required
                  value={formData.question_text}
                  onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                  placeholder="Tuliskan butir soal di sini..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
                />
              </div>

              {/* Tipe Pilihan Ganda Form */}
              {formData.question_type === 'multiple_choice' && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      Opsi Jawaban (Pilih centang hijau untuk kunci jawaban benar)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddOption}
                      disabled={formData.options.length >= 5}
                      className="text-xs text-[#3b5bf5] hover:underline font-bold disabled:opacity-40"
                    >
                      + Tambah Opsi (Max 5)
                    </button>
                  </div>

                  {formData.options.map((opt, i) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCorrectOption(i)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all shrink-0 ${
                          opt.is_correct
                            ? 'bg-[#1cd485] border-emerald-500 text-white shadow-sm'
                            : 'bg-slate-100 border-slate-200 text-slate-400 hover:border-slate-400'
                        }`}
                        title="Tandai sebagai jawaban benar"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-bold text-slate-500 w-4">{String.fromCharCode(65 + i)}.</span>
                      <input
                        type="text"
                        value={opt.option_text}
                        onChange={(e) => {
                          const newOpts = [...formData.options];
                          newOpts[i].option_text = e.target.value;
                          setFormData({ ...formData, options: newOpts });
                        }}
                        className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
                      />
                      {formData.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(i)}
                          className="p-1.5 text-slate-400 hover:text-rose-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Tipe Benar Salah */}
              {formData.question_type === 'true_false' && (
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold text-slate-700">Kunci Jawaban yang Benar</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="tf_correct"
                        checked={formData.options[0]?.is_correct}
                        onChange={() => {
                          const opts = [...formData.options];
                          opts[0].is_correct = true;
                          setFormData({ ...formData, options: opts });
                        }}
                        className="text-[#3b5bf5] focus:ring-0"
                      />
                      <span>Pernyataan ini Benar</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="tf_correct"
                        checked={!formData.options[0]?.is_correct}
                        onChange={() => {
                          const opts = [...formData.options];
                          opts[0].is_correct = false;
                          setFormData({ ...formData, options: opts });
                        }}
                        className="text-[#3b5bf5] focus:ring-0"
                      />
                      <span>Pernyataan ini Salah</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Tipe Isian Singkat */}
              {formData.question_type === 'short_answer' && (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Kunci Jawaban Singkat Tepat</label>
                  <input
                    type="text"
                    value={formData.short_answer_key}
                    onChange={(e) => setFormData({ ...formData, short_answer_key: e.target.value })}
                    placeholder="Contoh: 10 atau Fotosintesis (case-insensitive)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Penjelasan / Pembahasan Soal</label>
                <textarea
                  rows={2}
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  placeholder="Pembahasan langkah solusi untuk siswa..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#3b5bf5] hover:bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-500/25"
                >
                  Simpan ke Bank Soal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Soal */}
      {editingQuestion && editFormData && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#3b5bf5]" />
                Edit Butir Soal
              </h4>
              <button
                onClick={() => {
                  setEditingQuestion(null);
                  setEditFormData(null);
                }}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateQuestion} className="space-y-4">
              {/* Paket / Kategori Tugas & Ujian saat Edit */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                    <FolderKanban className="w-4 h-4 text-[#3b5bf5]" />
                    Paket / Kategori Tugas & Ujian *
                  </label>
                  <span className="text-[10px] font-semibold text-indigo-600">
                    Kelompok soal untuk dipanggil di menu Tugas & Ujian
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={editFormData.category_name}
                  onChange={(e) => setEditFormData({ ...editFormData, category_name: e.target.value })}
                  placeholder="Contoh: Tugas 1, Tugas 2, Ulangan Harian 1, UTS..."
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-indigo-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#3b5bf5]"
                />
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-slate-500 mr-1">Pilih Cepat:</span>
                  {quickCategoryOptions.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, category_name: cat })}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        editFormData.category_name === cat
                          ? 'bg-[#3b5bf5] text-white shadow-sm'
                          : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Mata Pelajaran *</label>
                  <CustomCombobox
                    value={editFormData.subject_id}
                    onChange={(val) => setEditFormData({ ...editFormData, subject_id: val })}
                    options={subjects.map((s) => ({
                      value: s.id,
                      label: s.name,
                      badge: s.code,
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Tipe Soal *</label>
                  <CustomCombobox
                    value={editFormData.question_type}
                    onChange={(val) => setEditFormData({ ...editFormData, question_type: val as QuestionType })}
                    searchable={false}
                    options={[
                      { value: 'multiple_choice', label: 'Pilihan Ganda (PG)' },
                      { value: 'true_false', label: 'Benar atau Salah' },
                      { value: 'short_answer', label: 'Isian Singkat' },
                      { value: 'essay', label: 'Esai (Manual Review)' },
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Bobot Nilai (Poin)</label>
                  <input
                    type="number"
                    value={editFormData.points}
                    onChange={(e) => setEditFormData({ ...editFormData, points: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Tingkat Kesulitan</label>
                  <CustomCombobox
                    value={editFormData.difficulty}
                    onChange={(val) => setEditFormData({ ...editFormData, difficulty: val as QuestionDifficulty })}
                    searchable={false}
                    options={[
                      { value: 'easy', label: 'Mudah' },
                      { value: 'medium', label: 'Sedang' },
                      { value: 'hard', label: 'Sulit' },
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Teks Soal / Pertanyaan *</label>
                <textarea
                  rows={3}
                  required
                  value={editFormData.question_text}
                  onChange={(e) => setEditFormData({ ...editFormData, question_text: e.target.value })}
                  placeholder="Tuliskan butir soal di sini..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
                />
              </div>

              {/* Tipe Pilihan Ganda Form */}
              {editFormData.question_type === 'multiple_choice' && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      Opsi Jawaban (Pilih centang hijau untuk kunci jawaban benar)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddEditOption}
                      disabled={editFormData.options.length >= 5}
                      className="text-xs text-[#3b5bf5] hover:underline font-bold disabled:opacity-40"
                    >
                      + Tambah Opsi (Max 5)
                    </button>
                  </div>

                  {editFormData.options.map((opt, i) => (
                    <div key={opt.id || i} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCorrectEditOption(i)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all shrink-0 ${
                          opt.is_correct
                            ? 'bg-[#1cd485] border-emerald-500 text-white shadow-sm'
                            : 'bg-slate-100 border-slate-200 text-slate-400 hover:border-slate-400'
                        }`}
                        title="Tandai sebagai jawaban benar"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-bold text-slate-500 w-4">{String.fromCharCode(65 + i)}.</span>
                      <input
                        type="text"
                        value={opt.option_text}
                        onChange={(e) => {
                          const newOpts = [...editFormData.options];
                          newOpts[i].option_text = e.target.value;
                          setEditFormData({ ...editFormData, options: newOpts });
                        }}
                        className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
                      />
                      {editFormData.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveEditOption(i)}
                          className="p-1.5 text-slate-400 hover:text-rose-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Tipe Benar Salah */}
              {editFormData.question_type === 'true_false' && (
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold text-slate-700">Kunci Jawaban yang Benar</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="edit_tf_correct"
                        checked={editFormData.options[0]?.is_correct}
                        onChange={() => {
                          const opts = [...editFormData.options];
                          opts[0].is_correct = true;
                          setEditFormData({ ...editFormData, options: opts });
                        }}
                        className="text-[#3b5bf5] focus:ring-0"
                      />
                      <span>Pernyataan ini Benar</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="edit_tf_correct"
                        checked={!editFormData.options[0]?.is_correct}
                        onChange={() => {
                          const opts = [...editFormData.options];
                          opts[0].is_correct = false;
                          setEditFormData({ ...editFormData, options: opts });
                        }}
                        className="text-[#3b5bf5] focus:ring-0"
                      />
                      <span>Pernyataan ini Salah</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Tipe Isian Singkat */}
              {editFormData.question_type === 'short_answer' && (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Kunci Jawaban Singkat Tepat</label>
                  <input
                    type="text"
                    value={editFormData.short_answer_key}
                    onChange={(e) => setEditFormData({ ...editFormData, short_answer_key: e.target.value })}
                    placeholder="Contoh: 10 atau Fotosintesis (case-insensitive)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Penjelasan / Pembahasan Soal</label>
                <textarea
                  rows={2}
                  value={editFormData.explanation}
                  onChange={(e) => setEditFormData({ ...editFormData, explanation: e.target.value })}
                  placeholder="Pembahasan langkah solusi untuk siswa..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingQuestion(null);
                    setEditFormData(null);
                  }}
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
