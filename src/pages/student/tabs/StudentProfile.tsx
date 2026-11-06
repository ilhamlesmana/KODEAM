import React, { useState, useRef } from 'react';
import {
  User,
  School,
  Phone,
  MapPin,
  ShieldCheck,
  Camera,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Upload,
  Sparkles,
  Check,
  Save,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';

export const StudentProfile: React.FC = () => {
  const { currentUser, currentStudent, updateCurrentStudentAuth } = useAuth();
  const { classes, students, updateStudent } = useData();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const liveStudent = students.find(s => s.id === currentStudent?.id) || currentStudent;
  const studentClass = classes.find(c => c.id === liveStudent?.class_id);

  const currentAvatar =
    currentUser?.avatar_url ||
    liveStudent?.profile?.avatar_url ||
    `https://api.dicebear.com/7.x/bottts/svg?seed=${liveStudent?.nis_nisn || 'student'}`;

  // State untuk Ganti Foto Profil
  const [previewAvatar, setPreviewAvatar] = useState<string>(currentAvatar);
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [isSavingPhoto, setIsSavingPhoto] = useState<boolean>(false);

  // State untuk Ganti Kata Sandi
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showOldPass, setShowOldPass] = useState<boolean>(false);
  const [showNewPass, setShowNewPass] = useState<boolean>(false);
  const [showConfirmPass, setShowConfirmPass] = useState<boolean>(false);
  const [isSavingPassword, setIsSavingPassword] = useState<boolean>(false);

  // Notifikasi
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Daftar preset avatar menarik untuk siswa
  const seedBase = encodeURIComponent(currentUser?.full_name || liveStudent?.nis_nisn || 'marhas');
  const avatarPresets = [
    { label: 'Adventurer', url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${seedBase}` },
    { label: 'Notionist', url: `https://api.dicebear.com/7.x/notionists/svg?seed=${seedBase}` },
    { label: 'Lorelei', url: `https://api.dicebear.com/7.x/lorelei/svg?seed=${seedBase}` },
    { label: 'Avataaars', url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${seedBase}` },
    { label: 'Fun Emoji', url: `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${seedBase}` },
    { label: 'Bottts', url: `https://api.dicebear.com/7.x/bottts/svg?seed=${seedBase}` },
  ];

  // Kompresi file gambar dari perangkat menjadi DataURL ringan (256x256 JPEG)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Harap pilih file gambar (JPG, PNG, atau WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setPreviewAvatar(compressedDataUrl);
        }
      };
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = async (targetAvatarUrl?: string) => {
    const finalAvatar = (targetAvatarUrl ?? previewAvatar).trim();
    if (!finalAvatar) {
      showToast('error', 'Pilih atau unggah foto profil terlebih dahulu.');
      return;
    }

    setIsSavingPhoto(true);
    try {
      if (liveStudent?.id) {
        await updateStudent(liveStudent.id, {
          avatar_url: finalAvatar,
          profile_id: currentUser?.id || liveStudent.profile_id,
        });
      }
      updateCurrentStudentAuth({ avatar_url: finalAvatar });
      setPreviewAvatar(finalAvatar);
      showToast('success', 'Foto profil Anda berhasil diperbarui!');
    } catch (err: any) {
      showToast('error', 'Gagal menyimpan foto profil: ' + (err.message || 'Coba lagi.'));
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const expectedCurrentPassword = liveStudent?.password || currentStudent?.password || 'siswa123';

    if (!oldPassword.trim()) {
      showToast('error', 'Masukkan kata sandi saat ini terlebih dahulu.');
      return;
    }

    if (oldPassword !== expectedCurrentPassword) {
      showToast('error', 'Kata sandi saat ini tidak sesuai. Silakan periksa kembali.');
      return;
    }

    if (newPassword.trim().length < 4) {
      showToast('error', 'Kata sandi baru minimal harus 4 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('error', 'Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    if (newPassword === oldPassword) {
      showToast('error', 'Kata sandi baru harus berbeda dari kata sandi lama.');
      return;
    }

    setIsSavingPassword(true);
    try {
      if (liveStudent?.id) {
        await updateStudent(liveStudent.id, {
          password: newPassword.trim(),
          profile_id: currentUser?.id || liveStudent.profile_id,
        });
      }
      updateCurrentStudentAuth({ password: newPassword.trim() });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('success', 'Kata sandi berhasil diperbarui! Gunakan kata sandi baru saat login berikutnya.');
    } catch (err: any) {
      showToast('error', 'Gagal memperbarui kata sandi: ' + (err.message || 'Silakan coba lagi.'));
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3.5 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2.5 transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-rose-600 text-white border-rose-500'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <div>
        <h3 className="text-xl font-extrabold text-slate-900">Profil & Pengaturan Akun Pelajar</h3>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          Kelola foto profil, kata sandi keamanan akun, serta periksa data registrasi resmi Anda
        </p>
      </div>

      {/* Kartu Utama Identitas & Ganti Foto Profil */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100 text-center sm:text-left">
          <div className="relative group shrink-0">
            <img
              src={previewAvatar}
              alt={currentUser?.full_name}
              className="w-28 h-28 rounded-3xl bg-slate-100 object-cover border-2 border-[#3b5bf5]/30 shadow-md"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-9 h-9 rounded-2xl bg-[#3b5bf5] hover:bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 transition-transform hover:scale-105"
              title="Unggah Foto dari Perangkat"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-[#3b5bf5] border border-blue-200">
                Siswa Terverifikasi
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                {studentClass?.name || 'Kelas Aktif'}
              </span>
            </div>
            <h4 className="text-2xl font-extrabold text-slate-900 mt-2 truncate">
              {currentUser?.full_name || 'Nama Siswa'}
            </h4>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              NISN / Nomor Induk: <strong className="text-slate-700">{liveStudent?.nis_nisn || '—'}</strong> &bull; Username:{' '}
              <strong className="text-slate-700">{currentUser?.username || '—'}</strong>
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-[#3b5bf5]" />
                <span>Unggah Foto dari HP / Laptop</span>
              </button>

              {previewAvatar !== currentAvatar && (
                <button
                  type="button"
                  disabled={isSavingPhoto}
                  onClick={() => handleSavePhoto()}
                  className="px-4 py-2 rounded-xl bg-[#3b5bf5] hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/25 transition-all disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingPhoto ? 'Menyimpan...' : 'Simpan Foto Baru'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Pilihan Avatar Instan & URL Foto */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-2.5">
            <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#3b5bf5]" />
              Pilih Karakter Avatar Instan (Klik untuk Memilih)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {avatarPresets.map((preset) => {
                const isSelected = previewAvatar === preset.url;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setPreviewAvatar(preset.url);
                      handleSavePhoto(preset.url);
                    }}
                    className={`p-2 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-blue-50/80 border-[#3b5bf5] ring-2 ring-[#3b5bf5]/20'
                        : 'bg-slate-50 border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <img src={preset.url} alt={preset.label} className="w-11 h-11 rounded-xl object-cover" />
                    <span className="text-[10px] font-bold text-slate-600 truncate w-full text-center">
                      {preset.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-2">
            <label className="block text-xs font-extrabold text-slate-800">
              Atau Gunakan Link URL Foto
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                placeholder="https://contoh.com/foto-saya.jpg"
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
              />
              <button
                type="button"
                disabled={!customUrlInput.trim() || isSavingPhoto}
                onClick={() => {
                  const clean = customUrlInput.trim();
                  if (clean) {
                    setPreviewAvatar(clean);
                    handleSavePhoto(clean);
                    setCustomUrlInput('');
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-[#3b5bf5] hover:bg-blue-600 text-white text-xs font-bold shrink-0 disabled:opacity-40"
              >
                Pakai URL
              </button>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Anda dapat mengunggah foto langsung dari galeri HP/komputer atau menempelkan tautan foto.
            </p>
          </div>
        </div>
      </div>

      {/* Grid 2 Kolom: Form Ganti Kata Sandi & Data Akademik */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Ganti Kata Sandi (Password) */}
        <div className="lg:col-span-6 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#3b5bf5] flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-900">Ganti Kata Sandi (Password)</h4>
                <p className="text-[11px] text-slate-400 font-medium">
                  Perbarui kata sandi untuk menjaga keamanan akun belajar Anda
                </p>
              </div>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kata Sandi Saat Ini *
                </label>
                <div className="relative">
                  <input
                    type={showOldPass ? 'text' : 'password'}
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Masukkan kata sandi lama Anda"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kata Sandi Baru * <span className="text-[10px] font-normal text-slate-400">(Min. 4 karakter)</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    minLength={4}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Buat kata sandi baru"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Konfirmasi Kata Sandi Baru *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    minLength={4}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang kata sandi baru"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#3b5bf5] hover:bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isSavingPassword ? 'Menyimpan Kata Sandi...' : 'Simpan Kata Sandi Baru'}</span>
                </button>
              </div>
            </form>
          </div>

          <div className="mt-5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 leading-relaxed">
            💡 <strong>Tips Keamanan:</strong> Gunakan kombinasi huruf dan angka yang mudah Anda ingat namun sulit ditebak orang lain.
          </div>
        </div>

        {/* Data Akademik & Informasi Domisili */}
        <div className="lg:col-span-6 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#0fa868] flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-900">Biodata Akademik Siswa</h4>
                <p className="text-[11px] text-slate-400 font-medium">
                  Data induk siswa yang terdaftar pada sistem sekolah
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 block mb-1 text-[11px]">Rombel / Kelas</span>
                <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5 text-[#3b5bf5]" />
                  {studentClass?.name || 'Kelas Belum Ditentukan'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 block mb-1 text-[11px]">Jenis Kelamin</span>
                <span className="font-extrabold text-slate-900 text-sm">
                  {liveStudent?.gender || 'Laki-laki'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 block mb-1 text-[11px]">Nama Orang Tua / Wali</span>
                <span className="font-bold text-slate-900 text-xs">
                  {liveStudent?.parent_name || '—'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 block mb-1 text-[11px]">Kontak / WhatsApp Wali</span>
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-600" />
                  {liveStudent?.parent_phone || '—'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
              <span className="text-slate-400 flex items-center gap-1 mb-1 text-[11px]">
                <MapPin className="w-3 h-3 text-[#3b5bf5]" />
                Alamat Domisili Siswa
              </span>
              <span className="font-semibold text-slate-800 leading-relaxed block">
                {liveStudent?.address || 'Alamat belum dilengkapi.'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#1cd485]/10 border border-[#1cd485]/30 text-[#0fa868] text-xs flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-[#0fa868] shrink-0" />
            <span>
              Akun Anda terverifikasi dan terhubung langsung dengan database utama NEXORA SMK MARHAS.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
