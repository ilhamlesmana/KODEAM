import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  KeyRound,
  ShieldAlert,
  CheckCircle2,
  X,
  Filter,
  Phone,
  School,
  Lock
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { Student } from '../../../types/database.types';
import { TablePaginationBar, paginateArray } from '../../../components/TablePaginationBar';
import { CustomCombobox } from '../../../components/CustomCombobox';

export const AdminStudents: React.FC = () => {
  const { students, classes, addStudent, updateStudent, deleteStudent } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [resetPassStudent, setResetPassStudent] = useState<Student | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    nis_nisn: '',
    class_id: classes[0]?.id || '',
    gender: 'Laki-laki',
    address: '',
    parent_phone: '',
    password: 'siswa123',
  });

  const showNotif = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredStudents = students.filter((st) => {
    const matchesSearch =
      (st.profile?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.nis_nisn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.profile?.username?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass =
      selectedClassFilter === 'all' || st.class_id === selectedClassFilter;

    return matchesSearch && matchesClass;
  });

  const paginatedStudents = paginateArray(filteredStudents, pageSize, currentPage);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.nis_nisn || !formData.class_id) {
      alert('Nama lengkap, NISN, dan kelas wajib diisi');
      return;
    }

    const generatedUsername =
      formData.username.trim() ||
      formData.full_name.toLowerCase().replace(/\s+/g, '_') + '_' + formData.nis_nisn.slice(-4);

    await addStudent({
      ...formData,
      username: generatedUsername,
    });

    setIsAddModalOpen(false);
    setFormData({
      full_name: '',
      username: '',
      nis_nisn: '',
      class_id: classes[0]?.id || '',
      gender: 'Laki-laki',
      address: '',
      parent_phone: '',
      password: 'siswa123',
    });
    showNotif('Akun siswa berhasil ditambahkan!');
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    await updateStudent(editingStudent.id, {
      full_name: editingStudent.profile?.full_name,
      nis_nisn: editingStudent.nis_nisn,
      class_id: editingStudent.class_id,
      gender: editingStudent.gender,
      address: editingStudent.address,
      parent_phone: editingStudent.parent_phone,
    });

    setEditingStudent(null);
    showNotif('Data siswa berhasil diperbarui!');
  };

  const handleToggleStatus = async (student: Student) => {
    const newStatus = student.profile?.status === 'active' ? 'inactive' : 'active';
    await updateStudent(student.id, { status: newStatus });
    showNotif(`Status akun diubah menjadi ${newStatus === 'active' ? 'Aktif' : 'Nonaktif'}`);
  };

  const handleResetPassword = async () => {
    if (!resetPassStudent) return;
    const targetPass = newPassword.trim() || 'siswa123';
    await updateStudent(resetPassStudent.id, { password: targetPass });
    showNotif(`Kata sandi untuk ${resetPassStudent.profile?.full_name} berhasil di-reset ke "${targetPass}"`);
    setResetPassStudent(null);
    setNewPassword('');
  };

  const handleDelete = async (id: string) => {
    const res = await deleteStudent(id);
    setDeleteConfirmId(null);
    if (res && !res.success) {
      alert('Gagal menghapus siswa: ' + (res.error || 'Terjadi kesalahan pada database'));
      return;
    }
    showNotif('Akun siswa berhasil dihapus.');
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

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-slate-900">Manajemen Akun Siswa</h3>
          <p className="text-xs text-slate-500 font-medium">
            Guru memiliki kendali penuh untuk membuat, mengedit, menonaktifkan, atau mereset akun siswa
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#3b5bf5] hover:bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Akun Siswa Baru</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama, NISN, atau username..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
          />
        </div>

        <div className="w-full sm:w-64">
          <CustomCombobox
            icon={<Filter className="w-4 h-4" />}
            prefixLabel="Kelas:"
            value={selectedClassFilter}
            onChange={(val) => setSelectedClassFilter(val)}
            options={[
              { value: 'all', label: 'Semua Kelas', badge: students.length },
              ...classes.map((c) => ({
                value: c.id,
                label: c.name,
                badge: students.filter((s) => s.class_id === c.id).length,
              })),
            ]}
          />
        </div>
      </div>

      {/* Filter Jumlah Data Ditampilkan */}
      <TablePaginationBar
        totalItems={filteredStudents.length}
        pageSize={pageSize}
        currentPage={currentPage}
        onPageSizeChange={setPageSize}
        onPageChange={setCurrentPage}
        itemLabel="siswa"
      />

      {/* Student List Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-4 px-5">Siswa</th>
                <th className="py-4 px-5">NISN / Username</th>
                <th className="py-4 px-5">Kelas</th>
                <th className="py-4 px-5">Kontak Wali</th>
                <th className="py-4 px-5">Status Akun</th>
                <th className="py-4 px-5 text-right">Aksi Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 font-medium">
                    Tidak ada data siswa yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <img
                          src={st.profile?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${st.nis_nisn}`}
                          alt={st.profile?.full_name}
                          className="w-9 h-9 rounded-full bg-slate-100 object-cover border border-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{st.profile?.full_name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{st.gender || '-'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <div className="font-mono font-bold text-slate-800">{st.nis_nisn}</div>
                      <div className="text-[10px] text-slate-400">@{st.profile?.username}</div>
                    </td>

                    <td className="py-4 px-5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#3b5bf5] font-bold text-[11px]">
                        <School className="w-3 h-3" />
                        {st.class?.name || classes.find(c => c.id === st.class_id)?.name || 'Belum Masuk Kelas'}
                      </span>
                    </td>

                    <td className="py-4 px-5">
                      <p className="font-bold text-slate-800">{st.parent_name || 'Wali Siswa'}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{st.parent_phone || '-'}</p>
                    </td>

                    <td className="py-4 px-5">
                      <button
                        onClick={() => handleToggleStatus(st)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                          st.profile?.status === 'active'
                            ? 'bg-[#1cd485]/15 text-[#0fa868] border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                        }`}
                        title="Klik untuk ubah status akun"
                      >
                        {st.profile?.status === 'active' ? '● Aktif' : '○ Nonaktif'}
                      </button>
                    </td>

                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setResetPassStudent(st);
                            setNewPassword('');
                          }}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-500 hover:text-amber-600 transition-colors"
                          title="Reset Kata Sandi"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingStudent(st)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-[#3b5bf5] transition-colors"
                          title="Edit Siswa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(st.id)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors"
                          title="Hapus Akun Siswa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Tambah Siswa */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#3b5bf5]" />
                Tambah Akun Siswa Baru
              </h4>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Nama Lengkap Siswa *</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Contoh: Muhammad Rizky Pratama"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">NISN / Nomor Induk *</label>
                  <input
                    type="text"
                    required
                    value={formData.nis_nisn}
                    onChange={(e) => setFormData({ ...formData, nis_nisn: e.target.value })}
                    placeholder="Contoh: 202607005"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Username Login</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Otomatis jika kosong"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Kelas *</label>
                  <CustomCombobox
                    value={formData.class_id}
                    onChange={(val) => setFormData({ ...formData, class_id: val })}
                    options={classes.map((c) => ({
                      value: c.id,
                      label: c.name,
                      badge: `Tingkat ${c.level}`,
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Jenis Kelamin</label>
                  <CustomCombobox
                    value={formData.gender}
                    onChange={(val) => setFormData({ ...formData, gender: val })}
                    searchable={false}
                    options={[
                      { value: 'Laki-laki', label: 'Laki-laki' },
                      { value: 'Perempuan', label: 'Perempuan' },
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">No. WhatsApp Wali</label>
                  <input
                    type="text"
                    value={formData.parent_phone}
                    onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                    placeholder="+62 812-xxxx-xxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Kata Sandi Awal</label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Alamat Tempat Tinggal</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Alamat lengkap..."
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
                  Simpan Akun Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Siswa */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#3b5bf5]" />
                Edit Data Siswa
              </h4>
              <button onClick={() => setEditingStudent(null)} className="p-1 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={editingStudent.profile?.full_name || ''}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      profile: editingStudent.profile
                        ? { ...editingStudent.profile, full_name: e.target.value }
                        : undefined,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">NISN</label>
                  <input
                    type="text"
                    value={editingStudent.nis_nisn || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, nis_nisn: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Kelas</label>
                  <CustomCombobox
                    value={editingStudent.class_id || ''}
                    onChange={(val) => setEditingStudent({ ...editingStudent, class_id: val })}
                    options={classes.map((c) => ({
                      value: c.id,
                      label: c.name,
                      badge: `Tingkat ${c.level}`,
                    }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">No. Telepon Wali</label>
                  <input
                    type="text"
                    value={editingStudent.parent_phone || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, parent_phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Jenis Kelamin</label>
                  <CustomCombobox
                    value={editingStudent.gender || 'Laki-laki'}
                    onChange={(val) => setEditingStudent({ ...editingStudent, gender: val })}
                    searchable={false}
                    options={[
                      { value: 'Laki-laki', label: 'Laki-laki' },
                      { value: 'Perempuan', label: 'Perempuan' },
                    ]}
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#3b5bf5] hover:bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-500/25"
                >
                  Perbarui Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Password */}
      {resetPassStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-3xl max-w-sm w-full p-6 shadow-2xl">
            <h4 className="text-base font-extrabold text-slate-900 mb-2 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-500" />
              Reset Sandi Siswa
            </h4>
            <p className="text-xs text-slate-500 mb-4 font-medium">
              Atur ulang kata sandi untuk <span className="text-slate-900 font-bold">{resetPassStudent.profile?.full_name}</span>.
            </p>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">Kata Sandi Baru</label>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Misal: nexora2026"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono font-bold focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
              />
            </div>

            <div className="pt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setResetPassStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                onClick={handleResetPassword}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/25"
              >
                Reset Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Konfirmasi Hapus */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h4 className="text-base font-extrabold text-slate-900 mb-2">Hapus Akun Siswa?</h4>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed font-medium">
              Tindakan ini permanen. Semua data riwayat tugas, jawaban, dan nilai siswa ini akan dihapus dari sistem.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                Batalkan
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/25"
              >
                Ya, Hapus Akun
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
