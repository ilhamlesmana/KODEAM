import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  School,
  Image as ImageIcon,
  Palette
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { Subject } from '../../../types/database.types';
import { TablePaginationBar, paginateArray } from '../../../components/TablePaginationBar';

export const AdminSubjects: React.FC = () => {
  const { subjects, classes, addSubject, updateSubject, deleteSubject } = useData();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [notification, setNotification] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    cover_image_url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=800',
    color_accent: '#0ea5e9',
    class_ids: classes.map(c => c.id),
  });

  const showNotif = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;

    await addSubject({
      name: formData.name,
      code: formData.code.toUpperCase(),
      description: formData.description,
      cover_image_url: formData.cover_image_url,
      color_accent: formData.color_accent,
      class_ids: formData.class_ids,
    });

    setIsAddModalOpen(false);
    setFormData({
      name: '',
      code: '',
      description: '',
      cover_image_url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=800',
      color_accent: '#0ea5e9',
      class_ids: classes.map(c => c.id),
    });
    showNotif('Mata pelajaran berhasil ditambahkan!');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;

    const res = await updateSubject(editingSubject.id, {
      name: editingSubject.name,
      code: editingSubject.code,
      description: editingSubject.description,
      cover_image_url: editingSubject.cover_image_url,
      color_accent: editingSubject.color_accent,
      class_ids: editingSubject.class_ids || [],
    });

    if (res && !res.success) {
      alert('Gagal memperbarui mata pelajaran: ' + (res.error || 'Terjadi kesalahan pada database'));
      return;
    }

    setEditingSubject(null);
    showNotif('Mata pelajaran berhasil diperbarui!');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus mata pelajaran ini? Seluruh materi pembelajaran dan kuis terkait akan ikut terhapus.')) {
      const res = await deleteSubject(id);
      if (res && !res.success) {
        alert('Gagal menghapus mata pelajaran: ' + (res.error || 'Terjadi kesalahan pada database'));
        return;
      }
      showNotif('Mata pelajaran berhasil dihapus.');
    }
  };

  const toggleClassSelection = (classId: string, currentList: string[]) => {
    if (currentList.includes(classId)) {
      return currentList.filter(id => id !== classId);
    } else {
      return [...currentList, classId];
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span className="font-semibold">{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-slate-900">Manajemen Mata Pelajaran</h3>
          <p className="text-xs text-slate-500 font-medium">
            Kelola mata pelajaran kurikulum sekolah dan tautkan ke kelas yang sesuai
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#3b5bf5] hover:bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Mata Pelajaran</span>
        </button>
      </div>

      {/* Filter Banyaknya Data Mata Pelajaran yang Ditampilkan */}
      <TablePaginationBar
        totalItems={subjects.length}
        pageSize={pageSize}
        currentPage={currentPage}
        onPageSizeChange={setPageSize}
        onPageChange={setCurrentPage}
        itemLabel="mata pelajaran"
      />

      {/* Grid Mata Pelajaran */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginateArray(subjects, pageSize, currentPage).map((sub) => (
          <div
            key={sub.id}
            className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm flex flex-col justify-between group hover:border-[#3b5bf5]/40 hover:shadow-md transition-all"
          >
            <div>
              {/* Cover Image */}
              <div className="h-44 w-full relative bg-slate-100 overflow-hidden">
                <img
                  src={sub.cover_image_url || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=800'}
                  alt={sub.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-xs font-mono font-extrabold text-[#3b5bf5] shadow-sm">
                    {sub.code}
                  </span>
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <button
                    onClick={() => setEditingSubject(sub)}
                    className="p-2 rounded-xl bg-white/90 backdrop-blur-md hover:bg-white text-slate-700 shadow-sm transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(sub.id)}
                    className="p-2 rounded-xl bg-white/90 backdrop-blur-md hover:bg-rose-50 text-slate-700 hover:text-rose-600 shadow-sm transition-colors"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                <h4 className="text-base font-extrabold text-slate-900 mb-1.5">{sub.name}</h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2 font-medium">
                  {sub.description || 'Tidak ada deskripsi.'}
                </p>

                {/* Linked classes pills */}
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Diajarkan di Kelas:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {classes.map((cls) => {
                      const isLinked = (sub.class_ids || []).includes(cls.id);
                      return (
                        <span
                          key={cls.id}
                          className={`text-[10px] px-2.5 py-1 rounded-full font-bold border transition-colors ${
                            isLinked
                              ? 'bg-blue-50 text-[#3b5bf5] border-blue-200'
                              : 'bg-slate-50 text-slate-400 border-slate-200/60 opacity-60'
                          }`}
                        >
                          {cls.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Tambah Mata Pelajaran */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#3b5bf5]" />
                Tambah Mata Pelajaran Baru
              </h4>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Nama Mata Pelajaran *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Fisika Terapan"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Kode Mapel *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="FIS-01"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">URL Gambar Cover</label>
                <input
                  type="url"
                  value={formData.cover_image_url}
                  onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Deskripsi Ringkas</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Deskripsi kurikulum dan kompetensi dasar..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Tautkan ke Kelas</label>
                <div className="grid grid-cols-2 gap-2">
                  {classes.map((cls) => {
                    const isChecked = formData.class_ids.includes(cls.id);
                    return (
                      <label
                        key={cls.id}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-blue-50 border-blue-200 text-[#3b5bf5] font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 font-medium'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() =>
                            setFormData({
                              ...formData,
                              class_ids: toggleClassSelection(cls.id, formData.class_ids),
                            })
                          }
                          className="rounded border-slate-300 text-[#3b5bf5] focus:ring-0"
                        />
                        <span>{cls.name}</span>
                      </label>
                    );
                  })}
                </div>
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
                  Simpan Mata Pelajaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Mata Pelajaran */}
      {editingSubject && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#3b5bf5]" />
                Edit Mata Pelajaran
              </h4>
              <button onClick={() => setEditingSubject(null)} className="p-1 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Nama Mata Pelajaran</label>
                  <input
                    type="text"
                    required
                    value={editingSubject.name}
                    onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Kode Mapel</label>
                  <input
                    type="text"
                    required
                    value={editingSubject.code}
                    onChange={(e) => setEditingSubject({ ...editingSubject, code: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">URL Gambar Cover</label>
                <input
                  type="url"
                  value={editingSubject.cover_image_url || ''}
                  onChange={(e) => setEditingSubject({ ...editingSubject, cover_image_url: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Deskripsi</label>
                <textarea
                  rows={2}
                  value={editingSubject.description || ''}
                  onChange={(e) => setEditingSubject({ ...editingSubject, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Tautkan ke Kelas</label>
                <div className="grid grid-cols-2 gap-2">
                  {classes.map((cls) => {
                    const currentList = editingSubject.class_ids || [];
                    const isChecked = currentList.includes(cls.id);
                    return (
                      <label
                        key={cls.id}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-blue-50 border-blue-200 text-[#3b5bf5] font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 font-medium'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() =>
                            setEditingSubject({
                              ...editingSubject,
                              class_ids: toggleClassSelection(cls.id, currentList),
                            })
                          }
                          className="rounded border-slate-300 text-[#3b5bf5] focus:ring-0"
                        />
                        <span>{cls.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingSubject(null)}
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
