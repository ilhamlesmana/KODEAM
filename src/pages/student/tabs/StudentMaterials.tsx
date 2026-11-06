import React, { useState } from 'react';
import {
  FileCode2,
  BookOpen,
  CheckCircle2,
  FileText,
  Video,
  ExternalLink,
  Check,
  ChevronRight,
  X
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { LearningMaterial } from '../../../types/database.types';
import { TablePaginationBar, paginateArray } from '../../../components/TablePaginationBar';
import { CustomCombobox } from '../../../components/CustomCombobox';

export const StudentMaterials: React.FC = () => {
  const { currentStudent } = useAuth();
  const { materials, subjects, markMaterialComplete, isMaterialCompleted } = useData();

  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all');
  const [activeMaterial, setActiveMaterial] = useState<LearningMaterial | null>(null);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const studentKey = currentStudent?.id || 'default_student';

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleToggleComplete = async (materialId: string, forceState?: boolean) => {
    const currentlyDone = isMaterialCompleted(materialId, studentKey);
    const nextDone = forceState !== undefined ? forceState : !currentlyDone;
    await markMaterialComplete(materialId, studentKey, nextDone);
    if (nextDone) {
      showToast('Materi berhasil ditandai selesai dipelajari!');
    } else {
      showToast('Status selesai materi dibatalkan.');
    }
  };

  const mySubjects = subjects.filter(sub => {
    if (!currentStudent?.class_id) return true;
    if (!sub.class_ids || sub.class_ids.length === 0) return true;
    return sub.class_ids.includes(currentStudent.class_id);
  });
  const mySubjectIds = mySubjects.map(s => s.id);

  const filtered = materials.filter(m => {
    if (m.subject_id && !mySubjectIds.includes(m.subject_id)) return false;
    if (currentStudent?.class_id && m.class_id && m.class_id !== currentStudent.class_id) {
      return false;
    }
    if (!m.is_published) return false;
    if (selectedSubjectFilter !== 'all' && m.subject_id !== selectedSubjectFilter) return false;
    return true;
  });

  const completedCount = filtered.filter(m => isMaterialCompleted(m.id, studentKey)).length;

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Modul & Materi Pembelajaran</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Pelajari modul bahan ajar terstruktur per bab, unduh bahan belajar PDF, dan tandai materi yang selesai
          </p>
        </div>

        <div className="px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center gap-2 self-start sm:self-auto">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-emerald-800">
            Progres Selesai: {completedCount} / {filtered.length} Modul
          </span>
        </div>
      </div>

      {/* Filter by Subject */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-600 font-bold">
          <BookOpen className="w-4 h-4 text-[#3b5bf5]" />
          <span>Filter Modul Berdasarkan Mata Pelajaran:</span>
        </div>
        <div className="w-full sm:w-80">
          <CustomCombobox
            icon={<BookOpen className="w-4 h-4" />}
            value={selectedSubjectFilter}
            onChange={(val) => setSelectedSubjectFilter(val)}
            options={[
              { value: 'all', label: 'Semua Mata Pelajaran', badge: `${filtered.length} Modul` },
              ...mySubjects.map((s) => ({
                value: s.id,
                label: s.name,
                badge: s.code,
              })),
            ]}
          />
        </div>
      </div>

      {/* Filter Banyaknya Data yang Ditampilkan */}
      <TablePaginationBar
        totalItems={filtered.length}
        pageSize={pageSize}
        currentPage={currentPage}
        onPageSizeChange={setPageSize}
        onPageChange={setCurrentPage}
        itemLabel="modul materi"
      />

      {/* Materials List */}
      <div className="space-y-3.5">
        {filtered.length === 0 ? (
          <div className="bg-white p-10 text-center rounded-3xl border border-slate-200/80 shadow-sm text-slate-400 text-xs">
            Belum ada materi pembelajaran yang tersedia untuk filter ini.
          </div>
        ) : (
          paginateArray(filtered, pageSize, currentPage).map((mat) => {
            const subject = subjects.find(s => s.id === mat.subject_id);
            const isDone = isMaterialCompleted(mat.id, studentKey);

            return (
              <div
                key={mat.id}
                className={`bg-white rounded-3xl p-5 border shadow-sm transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:shadow-md ${
                  isDone ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200/80 hover:border-[#3b5bf5]/40'
                }`}
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => handleToggleComplete(mat.id)}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all shrink-0 ${
                      isDone
                        ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm'
                        : 'bg-slate-100 border-slate-200 text-slate-400 hover:border-slate-400'
                    }`}
                    title={isDone ? 'Materi selesai (Klik untuk batal)' : 'Klik untuk tandai selesai'}
                  >
                    <Check className="w-5 h-5" />
                  </button>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {subject?.name || 'Umum'}
                      </span>
                      {isDone && (
                        <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Selesai Dipelajari
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-slate-900">{mat.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1 max-w-xl">
                      {mat.description || 'Tidak ada deskripsi tambahan.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                  <button
                    onClick={() => setActiveMaterial(mat)}
                    className="px-4 py-2 rounded-xl bg-[#3b5bf5] hover:bg-blue-600 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
                  >
                    <span>Baca Materi</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reader Modal */}
      {activeMaterial && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] flex flex-col border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6 shrink-0">
              <div>
                <span className="text-[11px] font-bold text-[#3b5bf5] uppercase tracking-wider">
                  {subjects.find(s => s.id === activeMaterial.subject_id)?.name}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">{activeMaterial.title}</h3>
              </div>
              <button onClick={() => setActiveMaterial(null)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-2 space-y-6">
              {(activeMaterial.pdf_url || activeMaterial.video_url) && (
                <div className="flex flex-wrap gap-3">
                  {activeMaterial.pdf_url && (
                    <a
                      href={activeMaterial.pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>Unduh Modul Lengkap (PDF)</span>
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  )}

                  {activeMaterial.video_url && (
                    <a
                      href={activeMaterial.video_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition-colors"
                    >
                      <Video className="w-4 h-4 text-rose-600" />
                      <span>Tonton Video Pembahasan</span>
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  )}
                </div>
              )}

              <div
                className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-sm leading-relaxed max-w-none"
                dangerouslySetInnerHTML={{ __html: activeMaterial.content_rich_text || '<p>Tidak ada isi teks.</p>' }}
              />
            </div>

            <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
              {isMaterialCompleted(activeMaterial.id, studentKey) ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Sudah Ditandai Selesai Dipelajari</span>
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      await handleToggleComplete(activeMaterial.id, false);
                    }}
                    className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 font-semibold text-xs transition-colors"
                  >
                    Batal Tandai
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    await handleToggleComplete(activeMaterial.id, true);
                    setActiveMaterial(null);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>Tandai Selesai Dipelajari</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveMaterial(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
