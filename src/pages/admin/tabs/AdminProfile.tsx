import React, { useState, useRef } from 'react';
import {
  User,
  Mail,
  Lock,
  KeyRound,
  ShieldCheck,
  Camera,
  Upload,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Phone,
  Award,
  Save,
  AtSign,
  BadgeCheck,
  Sparkles,
  FileText,
  Compass,
  Building2
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';

export const AdminProfile: React.FC = () => {
  const { currentUser, adminCredentials, updateAdminAccount } = useAuth();
  const { siteSettings, updateSiteSettings, classes, students, subjects } = useData();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentAvatar =
    currentUser?.avatar_url ||
    siteSettings.teacher_photo_url ||
    `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(currentUser?.full_name || 'Ilham')}`;

  // 1. State Ubah Email & Username Login
  const [loginEmail, setLoginEmail] = useState<string>(adminCredentials.email || 'admin@nexora.sch.id');
  const [loginUsername, setLoginUsername] = useState<string>(adminCredentials.username || currentUser?.username || 'guru_ilham');
  const [emailVerifyPass, setEmailVerifyPass] = useState<string>('');
  const [showEmailVerifyPass, setShowEmailVerifyPass] = useState<boolean>(false);
  const [syncContactEmail, setSyncContactEmail] = useState<boolean>(true);
  const [isSavingEmail, setIsSavingEmail] = useState<boolean>(false);

  // 2. State Ubah Password Login
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showOldPass, setShowOldPass] = useState<boolean>(false);
  const [showNewPass, setShowNewPass] = useState<boolean>(false);
  const [showConfirmPass, setShowConfirmPass] = useState<boolean>(false);
  const [isSavingPassword, setIsSavingPassword] = useState<boolean>(false);

  // 3. State Biodata & Foto Profil Guru
  const [previewAvatar, setPreviewAvatar] = useState<string>(currentAvatar);
  const [fullName, setFullName] = useState<string>(currentUser?.full_name || siteSettings.teacher_name || 'Ilham Lesmana');
  const [phone, setPhone] = useState<string>(currentUser?.phone || siteSettings.contact_phone || '');
  const [specialty, setSpecialty] = useState<string>(siteSettings.teacher_specialty || 'Matematika & Sains Digital');
  const [commitment, setCommitment] = useState<string>(siteSettings.teacher_commitment || 'Pembelajaran Interaktif & Terarah');
  const [bio, setBio] = useState<string>(currentUser?.bio || siteSettings.teacher_bio || '');
  const [isSavingBio, setIsSavingBio] = useState<boolean>(false);

  // Show current password peek in summary card
  const [peekActivePass, setPeekActivePass] = useState<boolean>(false);

  // Toast Notification
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  // Preset avatar pengajar profesional
  const seedBase = encodeURIComponent(fullName || 'Teacher');
  const avatarPresets = [
    { label: 'Notionist', url: `https://api.dicebear.com/7.x/notionists/svg?seed=${seedBase}` },
    { label: 'Adventurer', url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${seedBase}` },
    { label: 'Lorelei', url: `https://api.dicebear.com/7.x/lorelei/svg?seed=${seedBase}` },
    { label: 'Avataaars', url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${seedBase}` },
    { label: 'Micah', url: `https://api.dicebear.com/7.x/micah/svg?seed=${seedBase}` },
    { label: 'Shapes', url: `https://api.dicebear.com/7.x/shapes/svg?seed=${seedBase}` },
  ];

  // Kalkulasi kekuatan password baru
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'Belum diisi', color: 'bg-slate-200', textColor: 'text-slate-400' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) || /[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass) || pass.length >= 10) score += 1;

    if (score <= 1) return { score: 25, label: 'Lemah', color: 'bg-rose-500', textColor: 'text-rose-600' };
    if (score === 2) return { score: 50, label: 'Cukup', color: 'bg-amber-500', textColor: 'text-amber-600' };
    if (score === 3) return { score: 75, label: 'Kuat', color: 'bg-blue-500', textColor: 'text-blue-600' };
    return { score: 100, label: 'Sangat Kuat', color: 'bg-emerald-500', textColor: 'text-emerald-600' };
  };

  const passStrength = getPasswordStrength(newPassword);

  // Upload & Kompresi Foto Profil dari perangkat
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Harap pilih file gambar yang valid (JPG, PNG, atau WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400;
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
          showToast('success', 'Foto berhasil dipilih! Klik "Simpan Profil & Biodata Guru" untuk menerapkan.');
        }
      };
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  // Handler 1: Simpan Perubahan Email & Username Login
  const handleSaveEmailAndUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMail = loginEmail.trim().toLowerCase();
    const cleanUser = loginUsername.trim();

    if (!cleanMail || !cleanMail.includes('@')) {
      showToast('error', 'Masukkan alamat email login yang valid.');
      return;
    }
    if (!cleanUser || cleanUser.length < 3) {
      showToast('error', 'Username login minimal harus terdiri dari 3 karakter.');
      return;
    }
    if (!emailVerifyPass) {
      showToast('error', 'Masukkan kata sandi saat ini untuk mengonfirmasi perubahan email login.');
      return;
    }

    setIsSavingEmail(true);
    try {
      const res = await updateAdminAccount({
        email: cleanMail,
        username: cleanUser,
        currentPassword: emailVerifyPass,
      });

      if (!res.success) {
        showToast('error', res.error || 'Gagal memperbarui email login.');
        return;
      }

      if (syncContactEmail) {
        await updateSiteSettings({ contact_email: cleanMail });
      }

      setEmailVerifyPass('');
      showToast('success', 'Email & Username login pengajar berhasil diperbarui!');
    } finally {
      setIsSavingEmail(false);
    }
  };

  // Handler 2: Simpan Perubahan Kata Sandi Login
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!oldPassword) {
      showToast('error', 'Masukkan kata sandi saat ini terlebih dahulu.');
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

    setIsSavingPassword(true);
    try {
      const res = await updateAdminAccount({
        currentPassword: oldPassword,
        newPassword: newPassword.trim(),
      });

      if (!res.success) {
        showToast('error', res.error || 'Gagal mengubah kata sandi.');
        return;
      }

      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('success', 'Kata sandi login pengajar berhasil diperbarui!');
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Handler 3: Simpan Biodata & Foto Profil Guru
  const handleSaveBiodata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast('error', 'Nama lengkap pengajar tidak boleh kosong.');
      return;
    }

    setIsSavingBio(true);
    try {
      const res = await updateAdminAccount({
        full_name: fullName.trim(),
        avatar_url: previewAvatar,
        phone: phone.trim(),
        bio: bio.trim(),
      });

      await updateSiteSettings({
        teacher_name: fullName.trim(),
        teacher_photo_url: previewAvatar,
        contact_phone: phone.trim(),
        teacher_specialty: specialty.trim(),
        teacher_commitment: commitment.trim(),
        teacher_bio: bio.trim(),
      });

      if (res.success) {
        showToast('success', 'Foto profil & biodata pengajar berhasil diperbarui di seluruh sistem!');
      } else {
        showToast('error', res.error || 'Terjadi kesalahan saat menyimpan profil.');
      }
    } finally {
      setIsSavingBio(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-950 text-white border-emerald-500/40'
              : 'bg-rose-950 text-white border-rose-500/40'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-[#1cd485] shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-bold">{toast.message}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* FULL-WIDTH HERO BANNER: IDENTITAS & STATUS AKUN GURU     */}
      {/* ======================================================== */}
      <div className="w-full bg-gradient-to-r from-slate-900 via-[#1e2e6e] to-[#3b5bf5] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-900/10 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 -bottom-24 w-64 h-64 bg-[#1cd485]/15 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">
          {/* Left: Teacher Photo & Primary Info */}
          <div className="xl:col-span-7 flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="relative group self-start shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-2 border-white/40 shadow-2xl bg-white/10 backdrop-blur-md">
                <img
                  src={previewAvatar}
                  alt={fullName}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Unggah Foto Profil Baru"
                className="absolute -bottom-2 -right-2 w-9 h-9 rounded-2xl bg-[#1cd485] text-slate-950 flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-extrabold text-[#1cd485]">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  <span>Administrator &amp; Pengajar Utama</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-bold text-blue-100">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{siteSettings.site_name}</span>
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {fullName}
              </h2>

              <p className="text-xs sm:text-sm text-blue-100/90 font-medium max-w-2xl leading-relaxed">
                {bio || 'Kelola identitas profil pengajar, foto tampilan publik, alamat email login, serta kata sandi keamanan akun Anda dalam satu tampilan terpadu.'}
              </p>

              <div className="pt-1 flex flex-wrap items-center gap-4 text-xs text-blue-200 font-semibold">
                <span>📚 {subjects.length} Mata Pelajaran</span>
                <span>🏫 {classes.length} Kelas Diampu</span>
                <span>👨‍🎓 {students.length} Siswa Terdaftar</span>
              </div>
            </div>
          </div>

          {/* Right: Active Login Credentials Card */}
          <div className="xl:col-span-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-blue-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#1cd485]" />
                Informasi Akses Login Aktif
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#1cd485] text-slate-950 text-[10px] font-black">
                Aktif &amp; Aman
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="p-3 rounded-xl bg-slate-950/30 border border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-blue-200/70 font-bold block">
                  Email Login Guru
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-white truncate block mt-0.5">
                  {adminCredentials.email}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/30 border border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-blue-200/70 font-bold block">
                  Username Alternatif
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-amber-300 truncate block mt-0.5">
                  @{adminCredentials.username}
                </span>
              </div>
            </div>

            <div className="px-3.5 py-2.5 rounded-xl bg-slate-950/30 border border-white/10 flex items-center justify-between">
              <span className="text-xs text-blue-200/80 font-semibold">Kata Sandi Aktif:</span>
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs sm:text-sm font-extrabold text-white tracking-wider">
                  {peekActivePass ? adminCredentials.password : '••••••••••'}
                </span>
                <button
                  type="button"
                  onClick={() => setPeekActivePass(!peekActivePass)}
                  className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-blue-100 hover:text-white transition-colors cursor-pointer"
                  title={peekActivePass ? 'Sembunyikan Sandi' : 'Lihat Sandi Aktif'}
                >
                  {peekActivePass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* FULL-WIDTH 12-COLUMN BENTO GRID: ALL SECTIONS VISIBLE    */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* ====================================================== */}
        {/* LEFT COLUMN (7 COLS): FOTO PROFIL & BIODATA PENGAJAR   */}
        {/* ====================================================== */}
        <div className="xl:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-[#3b5bf5]" />
                <span>Profil, Foto &amp; Identitas Pengajar</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Data profil ini otomatis ditampilkan pada Dashboard Guru dan Halaman Depan (Landing Page).
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-blue-50 text-[#3b5bf5] text-xs font-bold self-start sm:self-auto">
              Identitas Publik &amp; LMS
            </span>
          </div>

          <form onSubmit={handleSaveBiodata} className="space-y-6">
            {/* Photo Upload & Avatar Presets */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-5">
                <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-[#3b5bf5]/30 shadow-md bg-white shrink-0">
                  <img src={previewAvatar} alt="Preview" className="w-full h-full object-cover" />
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1">
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                    Foto Profil Pengajar
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Unggah foto resmi Anda dari komputer/HP (JPG, PNG, WebP) atau pilih ilustrasi avatar di bawah ini.
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2.5 rounded-xl bg-[#3b5bf5] hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Foto dari Perangkat</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Preset Avatars */}
              <div className="pt-3 border-t border-slate-200/70">
                <p className="text-[11px] font-bold text-slate-500 mb-2.5">
                  Atau pilih cepat karakter avatar pengajar:
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  {avatarPresets.map((preset) => {
                    const isSelected = previewAvatar === preset.url;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setPreviewAvatar(preset.url)}
                        className={`p-2 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-[#3b5bf5] ring-2 ring-[#3b5bf5]/20'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <img src={preset.url} alt={preset.label} className="w-10 h-10 rounded-xl object-cover" />
                        <span className="text-[10px] font-bold text-slate-700">{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Biodata Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Nama Lengkap &amp; Gelar Pengajar
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Masukkan nama lengkap dan gelar"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#3b5bf5] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Nomor Telepon / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: +62 812-xxxx-xxxx"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#3b5bf5] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Bidang / Spesialisasi Pengajar
                </label>
                <div className="relative">
                  <Award className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="Contoh: Matematika & Sains Digital"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#3b5bf5] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Komitmen Pengajaran
                </label>
                <div className="relative">
                  <Compass className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={commitment}
                    onChange={(e) => setCommitment(e.target.value)}
                    placeholder="Contoh: Pembelajaran Interaktif & Terarah"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#3b5bf5] focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Biodata Singkat &amp; Pesan Pendidik
              </label>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tuliskan deskripsi singkat profil pengajar..."
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-[#3b5bf5] focus:bg-white transition-all"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSavingBio}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#3b5bf5] hover:bg-blue-600 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingBio ? 'Menyimpan Profil...' : 'Simpan Profil & Biodata Guru'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* ====================================================== */}
        {/* RIGHT COLUMN (5 COLS): EMAIL LOGIN & PASSWORD LOGIN    */}
        {/* ====================================================== */}
        <div className="xl:col-span-5 space-y-6">
          {/* CARD 1: UBAH EMAIL & USERNAME LOGIN */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-[#3b5bf5]" />
                  <span>Ubah Email &amp; Username Login</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Atur alamat email atau username yang digunakan saat masuk ke Portal Guru.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveEmailAndUsername} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Email Login Guru
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="Masukkan email login baru"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#3b5bf5] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Username Login Alternatif
                </label>
                <div className="relative">
                  <AtSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="Masukkan username alternatif"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#3b5bf5] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Konfirmasi Kata Sandi Saat Ini
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showEmailVerifyPass ? 'text' : 'password'}
                    required
                    value={emailVerifyPass}
                    onChange={(e) => setEmailVerifyPass(e.target.value)}
                    placeholder="Ketik kata sandi saat ini untuk verifikasi"
                    className="w-full pl-10 pr-11 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#3b5bf5] focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmailVerifyPass(!showEmailVerifyPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showEmailVerifyPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer select-none pt-0.5">
                <input
                  type="checkbox"
                  checked={syncContactEmail}
                  onChange={(e) => setSyncContactEmail(e.target.checked)}
                  className="w-4 h-4 rounded text-[#3b5bf5] focus:ring-[#3b5bf5]"
                />
                <span className="text-xs font-semibold text-slate-600">
                  Jadikan juga sebagai email kontak resmi di Landing Page
                </span>
              </label>

              <button
                type="submit"
                disabled={isSavingEmail}
                className="w-full py-3.5 px-5 rounded-xl bg-[#3b5bf5] hover:bg-blue-600 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingEmail ? 'Menyimpan...' : 'Simpan Email & Username Login'}</span>
              </button>
            </form>
          </div>

          {/* CARD 2: UBAH KATA SANDI LOGIN */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-emerald-600" />
                  <span>Ganti Kata Sandi Login</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Perbarui kata sandi keamanan untuk akses Portal Guru.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-bold">
                Keamanan
              </span>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Kata Sandi Saat Ini
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showOldPass ? 'text' : 'password'}
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Masukkan kata sandi lama"
                    className="w-full pl-10 pr-11 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#3b5bf5] focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Masukkan kata sandi baru (min. 4 karakter)"
                    className="w-full pl-10 pr-11 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#3b5bf5] focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Konfirmasi Kata Sandi Baru
                </label>
                <div className="relative">
                  <CheckCircle2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang kata sandi baru"
                    className="w-full pl-10 pr-11 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#3b5bf5] focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Strength Meter */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600">Kekuatan Kata Sandi:</span>
                  <span className={`font-extrabold ${passStrength.textColor}`}>{passStrength.label}</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${passStrength.color}`}
                    style={{ width: `${passStrength.score}%` }}
                  />
                </div>
                {confirmPassword && (
                  <p className={`text-[11px] font-bold pt-0.5 ${newPassword === confirmPassword ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {newPassword === confirmPassword
                      ? '✓ Konfirmasi kata sandi baru cocok'
                      : '✗ Konfirmasi kata sandi belum sama'}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSavingPassword}
                className="w-full py-3.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-slate-900/15 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                <KeyRound className="w-4 h-4 text-[#1cd485]" />
                <span>{isSavingPassword ? 'Memperbarui Sandi...' : 'Perbarui Kata Sandi Login'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
