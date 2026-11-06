import React, { useState, useRef } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  Sparkles,
  User,
  Mail,
  Phone,
  MapPin,
  Bell,
  Trash2,
  Plus,
  Upload,
  Image as ImageIcon,
  Compass,
  Award,
  X,
  RefreshCw,
  Database
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';

export const AdminSettings: React.FC = () => {
  const { siteSettings, updateSiteSettings, announcements, addAnnouncement, deleteAnnouncement, clearLocalCache, retrySupabaseConnection } = useData();

  const [formData, setFormData] = useState({
    site_name: siteSettings.site_name,
    tagline: siteSettings.tagline,
    browser_title:
      siteSettings.browser_title || 'NEXORA × SMK MARHAS — Platform E-Learning Terpadu',
    logo_url: siteSettings.logo_url || '',
    teacher_name: siteSettings.teacher_name,
    teacher_bio: siteSettings.teacher_bio,
    teacher_photo_url: siteSettings.teacher_photo_url || '',
    teacher_commitment: siteSettings.teacher_commitment || 'Pembelajaran Interaktif & Terarah',
    teacher_specialty: siteSettings.teacher_specialty || 'Matematika & Sains Digital',
    contact_email: siteSettings.contact_email,
    contact_phone: siteSettings.contact_phone,
    contact_address: siteSettings.contact_address,
    accent_color: siteSettings.accent_color,
  });

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const showNotif = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Fungsi Upload Logo Website dari Perangkat (PNG/JPG/SVG/WebP dengan dukungan transparansi)
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar logo yang valid (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file logo terlalu besar. Maksimal 5MB.');
      return;
    }

    setIsUploadingLogo(true);

    try {
      let uploadedUrl: string | null = null;
      if (isSupabaseConfigured) {
        try {
          const fileExt = file.name.split('.').pop() || 'png';
          const fileName = `site_logo_${Date.now()}.${fileExt}`;
          const filePath = `logos/${fileName}`;

          const { error: uploadErr } = await supabase.storage
            .from('nexora-files')
            .upload(filePath, file, { cacheControl: '3600', upsert: true });

          if (!uploadErr) {
            const { data: publicUrlData } = supabase.storage
              .from('nexora-files')
              .getPublicUrl(filePath);

            if (publicUrlData?.publicUrl) {
              uploadedUrl = publicUrlData.publicUrl;
            }
          }
        } catch (storageErr) {
          console.warn('Logo storage upload notice (falling back to Base64):', storageErr);
        }
      }

      if (!uploadedUrl) {
        uploadedUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (file.type === 'image/svg+xml') {
              resolve(event.target?.result as string);
              return;
            }
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;
              const maxDim = 400;

              if (width > maxDim || height > maxDim) {
                if (width > height) {
                  height = Math.round((height * maxDim) / width);
                  width = maxDim;
                } else {
                  width = Math.round((width * maxDim) / height);
                  height = maxDim;
                }
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.clearRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
                // Gunakan image/png agar background transparan logo tetap terjaga
                const dataUrl = canvas.toDataURL('image/png');
                resolve(dataUrl);
              } else {
                resolve(event.target?.result as string);
              }
            };
            img.onerror = () => resolve(event.target?.result as string);
            img.src = event.target?.result as string;
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const updatedForm = { ...formData, logo_url: uploadedUrl || '' };
      setFormData(updatedForm);
      await updateSiteSettings({ logo_url: uploadedUrl || null });
      showNotif('Logo website berhasil diunggah dan langsung diterapkan!');
    } catch (err: any) {
      console.error('Error uploading logo:', err);
      alert('Gagal memproses logo: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  // Fungsi Upload Foto Manual dari Perangkat
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar yang valid (JPG, PNG, WebP).');
      return;
    }

    // Maksimal 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran foto terlalu besar. Maksimal 5MB.');
      return;
    }

    setIsUploading(true);

    try {
      // 1. Coba upload ke Supabase Storage terlebih dahulu jika terkoneksi
      let uploadedUrl: string | null = null;
      if (isSupabaseConfigured) {
        try {
          const fileExt = file.name.split('.').pop() || 'png';
          const fileName = `teacher_profile_${Date.now()}.${fileExt}`;
          const filePath = `avatars/${fileName}`;

          const { error: uploadErr } = await supabase.storage
            .from('nexora-files')
            .upload(filePath, file, { cacheControl: '3600', upsert: true });

          if (!uploadErr) {
            const { data: publicUrlData } = supabase.storage
              .from('nexora-files')
              .getPublicUrl(filePath);

            if (publicUrlData?.publicUrl) {
              uploadedUrl = publicUrlData.publicUrl;
            }
          }
        } catch (storageErr) {
          console.warn('Storage upload notice (falling back to Base64):', storageErr);
        }
      }

      // 2. Jika storage belum aktif atau offline, gunakan Base64 Data URL terkompresi
      if (!uploadedUrl) {
        uploadedUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;
              const maxDim = 600;

              if (width > maxDim || height > maxDim) {
                if (width > height) {
                  height = Math.round((height * maxDim) / width);
                  width = maxDim;
                } else {
                  width = Math.round((width * maxDim) / height);
                  height = maxDim;
                }
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                resolve(dataUrl);
              } else {
                resolve(event.target?.result as string);
              }
            };
            img.onerror = () => resolve(event.target?.result as string);
            img.src = event.target?.result as string;
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      setFormData(prev => ({ ...prev, teacher_photo_url: uploadedUrl || '' }));
      showNotif('Foto pengajar berhasil dipilih dan diunggah!');
    } catch (err: any) {
      console.error('Error uploading photo:', err);
      alert('Gagal memproses foto: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await updateSiteSettings({
      ...formData,
      logo_url: formData.logo_url || null,
      teacher_photo_url: formData.teacher_photo_url || null,
    });
    if (res.success) {
      showNotif('Pengaturan website NEXORA berhasil disimpan & tersinkronisasi!');
    } else {
      showNotif('Perhatian: Tersimpan secara lokal, error server: ' + (res.error || ''));
    }
  };

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.title || !newAnnouncement.content) return;

    await addAnnouncement({
      title: newAnnouncement.title,
      content: newAnnouncement.content,
      target_role: 'all',
      class_id: null,
      is_active: true,
      created_by: 'p-admin',
    });

    setNewAnnouncement({ title: '', content: '' });
    showNotif('Pengumuman baru berhasil diterbitkan!');
  };

  const handleDeleteAnnouncement = async (id: string) => {
    await deleteAnnouncement(id);
    showNotif('Pengumuman berhasil dihapus.');
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span className="font-semibold">{notification}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h3 className="text-xl font-extrabold text-slate-900">Pengaturan Website & Identitas Brand</h3>
        <p className="text-xs text-slate-500 font-medium">
          Ubah konfigurasi nama brand, foto dan profil pengajar, komitmen pengajaran, spesialisasi, pengumuman, dan kontak resmi
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Platform Identity */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
          <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#3b5bf5]" />
            Identitas Platform LMS & Logo Website
          </h4>

          {/* Pengaturan & Upload Logo Website */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 border border-slate-200/90 flex flex-col sm:flex-row items-center gap-5">
            {/* Live Preview Box */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-[#3b5bf5]/30 shadow-md bg-white flex items-center justify-center p-2 relative group">
                {formData.logo_url ? (
                  <img
                    src={formData.logo_url}
                    alt={formData.site_name || 'Logo Website'}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3b5bf5] to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
                    <Sparkles className="w-7 h-7" />
                  </div>
                )}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 shadow-2xs">
                {formData.logo_url ? 'Logo Kustom Aktif' : 'Logo Default'}
              </span>
            </div>

            {/* Kontrol Upload & URL Logo */}
            <div className="flex-1 space-y-3 text-center sm:text-left w-full">
              <div>
                <p className="text-xs font-extrabold text-slate-900">Logo Website / Sekolah</p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Logo ini akan tampil otomatis di Navbar utama, Sidebar Guru & Siswa, Halaman Login, Footer, serta ikon tab browser (Favicon). Disarankan format PNG transparan atau SVG.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <input
                  type="file"
                  ref={logoInputRef}
                  accept="image/png, image/jpeg, image/webp, image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="website-logo-upload"
                />
                <button
                  type="button"
                  disabled={isUploadingLogo}
                  onClick={() => logoInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#3b5bf5] hover:bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingLogo ? 'Sedang Mengunggah Logo...' : 'Pilih & Upload Logo Baru'}</span>
                </button>

                {formData.logo_url && (
                  <button
                    type="button"
                    onClick={async () => {
                      setFormData(prev => ({ ...prev, logo_url: '' }));
                      await updateSiteSettings({ logo_url: null });
                      showNotif('Logo dikembalikan ke logo default NEXORA.');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold hover:bg-rose-100 transition-all cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reset ke Logo Default</span>
                  </button>
                )}
              </div>

              {/* Input URL Logo Opsional */}
              <div className="pt-1">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Atau Tempel Link URL Gambar Logo (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="https://contoh.sch.id/logo-sekolah.png"
                  value={formData.logo_url.startsWith('data:') ? '' : formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#3b5bf5]"
                />
                {formData.logo_url.startsWith('data:') && (
                  <p className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1 justify-center sm:justify-start">
                    <CheckCircle2 className="w-3 h-3" /> Menggunakan file gambar logo yang diunggah dari perangkat Anda
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Nama Platform LMS</label>
              <input
                type="text"
                required
                value={formData.site_name}
                onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Tagline Resmi</label>
              <input
                type="text"
                required
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
              />
            </div>
          </div>

          {/* Pengaturan Title pada Bar Tab Browser + Live Browser Tab Preview */}
          <div className="p-5 rounded-2xl bg-slate-50/90 border border-slate-200/90 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-extrabold text-slate-900">
                  Judul Bar Tab Browser (Browser Tab Title)
                </label>
                <p className="text-[11px] text-slate-500 font-medium">
                  Teks ini tampil langsung pada bagian atas tab browser pengguna (Chrome, Edge, Safari, Firefox) beserta ikon logo/favicon.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setFormData(prev => ({
                      ...prev,
                      browser_title: `${prev.site_name || 'NEXORA'} — ${prev.tagline || 'Platform E-Learning Terpadu'}`,
                    }))
                  }
                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-blue-50 text-slate-700 hover:text-[#3b5bf5] border border-slate-200 text-[10px] font-bold transition-colors cursor-pointer"
                >
                  Sesuaikan Nama &amp; Tagline
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData(prev => ({
                      ...prev,
                      browser_title: 'NEXORA × SMK MARHAS — Platform E-Learning Terpadu',
                    }))
                  }
                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold transition-colors cursor-pointer"
                >
                  Reset Default
                </button>
              </div>
            </div>

            <input
              type="text"
              required
              placeholder="Contoh: NEXORA × SMK MARHAS — Platform E-Learning Terpadu"
              value={formData.browser_title}
              onChange={(e) => setFormData({ ...formData, browser_title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#3b5bf5]"
            />

            {/* Simulasi Pratinjau Bar Tab Browser */}
            <div className="pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Live Preview Bar Tab Browser:
              </span>
              <div className="rounded-xl bg-slate-200/80 border border-slate-300/80 px-3 pt-2 pb-0 flex items-center gap-3 overflow-hidden shadow-inner">
                {/* Traffic Lights */}
                <div className="flex items-center gap-1.5 pb-2 shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                </div>

                {/* Active Browser Tab */}
                <div className="flex items-center gap-2 bg-white rounded-t-xl px-3.5 py-2 border-t border-x border-slate-300/80 shadow-2xs max-w-xs sm:max-w-md min-w-0">
                  <div className="w-4 h-4 rounded-sm flex items-center justify-center shrink-0 overflow-hidden">
                    {formData.logo_url ? (
                      <img
                        src={formData.logo_url}
                        alt="Favicon"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-4 h-4 rounded-sm bg-[#3b5bf5] text-white flex items-center justify-center">
                        <Sparkles className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-slate-800 truncate">
                    {formData.browser_title.trim() ||
                      `${formData.site_name || 'NEXORA'} — ${formData.tagline || 'Platform E-Learning'}`}
                  </span>
                  <X className="w-3 h-3 text-slate-400 ml-2 shrink-0" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Teacher Profile & Teaching Specialization */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
          <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-[#3b5bf5]" />
            Profil Pengajar, Komitmen & Spesialisasi (Tampil di Landing Page)
          </h4>

          {/* Upload Foto Manual Profil Pengajar */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-5">
            <div className="relative group shrink-0">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-[#3b5bf5]/30 shadow-md bg-white flex items-center justify-center">
                {formData.teacher_photo_url ? (
                  <img
                    src={formData.teacher_photo_url}
                    alt={formData.teacher_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-400" />
                )}
              </div>
            </div>

            <div className="flex-1 space-y-2 text-center sm:text-left w-full">
              <div>
                <p className="text-xs font-bold text-slate-900">Foto Profil Pengajar</p>
                <p className="text-[11px] text-slate-500 font-medium">
                  Unggah langsung foto Anda dari HP / Komputer tanpa perlu menyalin link URL.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="teacher-photo-upload"
                />
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3b5bf5] hover:bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Sedang Memproses Foto...' : 'Pilih & Upload Foto Manual'}</span>
                </button>

                {formData.teacher_photo_url && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, teacher_photo_url: '' })}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold hover:bg-rose-100 transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Hapus Foto</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Nama Lengkap & Gelar</label>
              <input
                type="text"
                required
                value={formData.teacher_name}
                onChange={(e) => setFormData({ ...formData, teacher_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                URL Foto Alternatif (Opsional jika ingin pakai link luar)
              </label>
              <input
                type="text"
                value={formData.teacher_photo_url.startsWith('data:') ? '(Foto tersimpan secara internal)' : formData.teacher_photo_url}
                onChange={(e) => setFormData({ ...formData, teacher_photo_url: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Biodata / Deskripsi Pengajar</label>
            <textarea
              rows={3}
              value={formData.teacher_bio}
              onChange={(e) => setFormData({ ...formData, teacher_bio: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
            />
          </div>

          {/* Komitmen Pengajaran & Spesialisasi Pengajar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[#3b5bf5]" />
                <span>Komitmen Pengajaran (Kotak Kiri di Landing Page)</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Pembelajaran Interaktif & Terarah"
                value={formData.teacher_commitment}
                onChange={(e) => setFormData({ ...formData, teacher_commitment: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#3b5bf5]" />
                <span>Spesialisasi Pengajar (Kotak Kanan di Landing Page)</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Matematika & Sains Digital"
                value={formData.teacher_specialty}
                onChange={(e) => setFormData({ ...formData, teacher_specialty: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Contacts */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#1cd485]" />
            Informasi Kontak Resmi
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Kontak</label>
              <input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Nomor Telepon / WA</label>
              <input
                type="text"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Alamat Lembaga / Sekolah</label>
            <input
              type="text"
              value={formData.contact_address}
              onChange={(e) => setFormData({ ...formData, contact_address: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#3b5bf5] hover:bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Perubahan Pengaturan Website</span>
          </button>
        </div>
      </form>

      {/* Announcements Manager */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
        <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-500" />
          Kelola Pengumuman Sekolah
        </h4>

        <form onSubmit={handleAddAnnouncement} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <h5 className="text-xs font-bold text-slate-800">Buat Pengumuman Baru</h5>
          <input
            type="text"
            required
            placeholder="Judul Pengumuman..."
            value={newAnnouncement.title}
            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5]"
          />
          <textarea
            rows={2}
            required
            placeholder="Isi pesan pengumuman..."
            value={newAnnouncement.content}
            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#3b5bf5]"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#3b5bf5] hover:bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/25"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Terbitkan Pengumuman</span>
            </button>
          </div>
        </form>

        <div className="space-y-2">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-4"
            >
              <div>
                <p className="text-xs font-bold text-slate-900">{ann.title}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">{ann.content}</p>
              </div>
              <button
                onClick={() => handleDeleteAnnouncement(ann.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                title="Hapus pengumuman"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Database Sync & Cache Purge */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-[#3b5bf5]" />
          Sinkronisasi Database & Pembersihan Cache Browser
        </h4>
        <p className="text-xs text-slate-500 font-medium">
          Jika Anda telah menghapus atau mengubah data di Supabase dan browser masih menampilkan cache lama, gunakan opsi di bawah ini untuk sinkronisasi seketika.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={async () => {
              await retrySupabaseConnection();
              showNotif('Data berhasil disinkronkan langsung dari Supabase!');
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-all shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#3b5bf5]" />
            <span>Segarkan Data dari Supabase</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              if (confirm('Bersihkan seluruh cache browser (localStorage) dan muat ulang data asli dari database Supabase?')) {
                await clearLocalCache();
                showNotif('Cache browser berhasil dibersihkan & disinkronkan!');
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-xs font-bold text-rose-600 transition-all shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Bersihkan Cache Browser & Muat Ulang</span>
          </button>
        </div>
      </div>
    </div>
  );
};
