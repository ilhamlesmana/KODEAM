import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, Student, UserRole } from '../types/database.types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface AdminCredentials {
  email: string;
  username: string;
  password: string;
  updated_at: string;
}

const DEFAULT_ADMIN_CREDENTIALS: AdminCredentials = {
  email: 'admin@nexora.sch.id',
  username: 'guru_ilham',
  password: 'admin123',
  updated_at: new Date().toISOString(),
};

const defaultAdminProfile: Profile = {
  id: '11111111-0000-0000-0000-000000000000',
  username: 'guru_ilham',
  full_name: 'Ilham Lesmana',
  role: 'admin',
  status: 'active',
  avatar_url: '',
  phone: '+62 812-3456-7890',
  bio: 'Pengajar utama dan administrator sistem NEXORA LMS.',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Helper untuk menyisipkan kredensial login guru di kolom bio/metadata Supabase agar tersinkron lintas perangkat
const encodeAdminBioWithAuth = (cleanBio: string, creds: AdminCredentials): string => {
  const stripped = (cleanBio || '').replace(/\[ADMIN_AUTH:[^\]]+\]\s*/g, '').trim();
  const payload = encodeURIComponent(JSON.stringify({
    e: creds.email,
    u: creds.username,
    p: creds.password,
    t: creds.updated_at,
  }));
  return `[ADMIN_AUTH:${payload}] ${stripped}`.trim();
};

const decodeAdminBioAndAuth = (rawBio?: string | null): { cleanBio: string; creds: AdminCredentials | null } => {
  if (!rawBio) return { cleanBio: '', creds: null };
  const match = rawBio.match(/\[ADMIN_AUTH:([^\]]+)\]/);
  if (!match) return { cleanBio: rawBio, creds: null };

  let parsedCreds: AdminCredentials | null = null;
  try {
    const obj = JSON.parse(decodeURIComponent(match[1]));
    if (obj && obj.e && obj.p) {
      parsedCreds = {
        email: String(obj.e).trim().toLowerCase(),
        username: String(obj.u || 'guru_ilham').trim(),
        password: String(obj.p),
        updated_at: obj.t || new Date().toISOString(),
      };
    }
  } catch (e) {
    // ignore parse error
  }
  const cleanBio = rawBio.replace(/\[ADMIN_AUTH:[^\]]+\]\s*/g, '').trim();
  return { cleanBio, creds: parsedCreds };
};

interface AuthContextType {
  currentUser: Profile | null;
  currentStudent: Student | null;
  adminCredentials: AdminCredentials;
  role: UserRole | null;
  isAuthenticated: boolean;
  loginAdmin: (emailOrUsername: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginStudent: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  updateCurrentStudentAuth: (updates: { avatar_url?: string; password?: string; full_name?: string }) => void;
  updateAdminAccount: (updates: {
    email?: string;
    username?: string;
    currentPassword?: string;
    newPassword?: string;
    full_name?: string;
    avatar_url?: string;
    phone?: string;
    bio?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminCredentials, setAdminCredentials] = useState<AdminCredentials>(() => {
    const saved = localStorage.getItem('nexora_admin_credentials');
    if (saved) {
      try {
        return { ...DEFAULT_ADMIN_CREDENTIALS, ...JSON.parse(saved) };
      } catch (e) {
        return DEFAULT_ADMIN_CREDENTIALS;
      }
    }
    return DEFAULT_ADMIN_CREDENTIALS;
  });

  const [currentUser, setCurrentUser] = useState<Profile | null>(() => {
    const saved = localStorage.getItem('nexora_auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentStudent, setCurrentStudent] = useState<Student | null>(() => {
    const saved = localStorage.getItem('nexora_auth_student');
    return saved ? JSON.parse(saved) : null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sinkronisasi awal profil & kredensial admin dari Supabase jika tersedia
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    (async () => {
      try {
        const { data: dbAdmin } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'admin')
          .maybeSingle();

        if (dbAdmin) {
          const { cleanBio, creds } = decodeAdminBioAndAuth(dbAdmin.bio);
          if (creds) {
            setAdminCredentials(prev => {
              const next = { ...prev, ...creds };
              localStorage.setItem('nexora_admin_credentials', JSON.stringify(next));
              return next;
            });
          }
          setCurrentUser(prev => {
            if (!prev || prev.role !== 'admin') return prev;
            const merged: Profile = {
              ...prev,
              ...dbAdmin,
              bio: cleanBio || prev.bio,
              avatar_url: dbAdmin.avatar_url || prev.avatar_url,
            };
            localStorage.setItem('nexora_auth_user', JSON.stringify(merged));
            return merged;
          });
        }
      } catch (e) {
        // ignore background sync notice
      }
    })();
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('nexora_auth_user', JSON.stringify(currentUser));
      if (currentUser.role === 'student' && !currentStudent) {
        const savedStudentsStr = localStorage.getItem('nexora_students');
        if (savedStudentsStr) {
          try {
            const allStudents: Student[] = JSON.parse(savedStudentsStr);
            const student = allStudents.find(s => s.profile_id === currentUser.id);
            if (student) {
              setCurrentStudent(student);
              localStorage.setItem('nexora_auth_student', JSON.stringify(student));
            }
          } catch (e) { /* ignore */ }
        }
      } else if (currentUser.role !== 'student') {
        setCurrentStudent(null);
        localStorage.removeItem('nexora_auth_student');
      }
    } else {
      localStorage.removeItem('nexora_auth_user');
      localStorage.removeItem('nexora_auth_student');
      setCurrentStudent(null);
    }
  }, [currentUser]);

  // LOGIN KHUSUS GURU / ADMIN (Mendukung Email Baru, Username, & Password yang Diubah Guru)
  const loginAdmin = async (emailOrUsername: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const cleanInput = emailOrUsername.trim().toLowerCase();

    try {
      // Baca kredensial terbaru dari state / localStorage
      let activeCreds = adminCredentials;
      const savedCredsStr = localStorage.getItem('nexora_admin_credentials');
      if (savedCredsStr) {
        try {
          activeCreds = { ...DEFAULT_ADMIN_CREDENTIALS, ...JSON.parse(savedCredsStr) };
        } catch (e) { /* ignore */ }
      }

      // Ambil juga profil admin terbaru dari Supabase bila terkoneksi
      let remoteAdminProfile: Profile | null = null;
      if (isSupabaseConfigured) {
        try {
          const { data: dbAdmin } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'admin')
            .maybeSingle();

          if (dbAdmin) {
            const { cleanBio, creds } = decodeAdminBioAndAuth(dbAdmin.bio);
            remoteAdminProfile = { ...dbAdmin, bio: cleanBio };
            if (creds && !savedCredsStr) {
              activeCreds = creds;
              setAdminCredentials(creds);
              localStorage.setItem('nexora_admin_credentials', JSON.stringify(creds));
            }
          }
        } catch (e) { /* ignore */ }
      }

      // 1. Validasi terhadap Kredensial Guru Aktif (Email atau Username + Password)
      const isMatchingEmail = cleanInput === activeCreds.email.toLowerCase();
      const isMatchingUsername = cleanInput === activeCreds.username.toLowerCase();
      // Izinkan alias ilham@nexora.sch.id hanya jika email belum diganti dari default
      const isDefaultAlias =
        activeCreds.email.toLowerCase() === 'admin@nexora.sch.id' &&
        cleanInput === 'ilham@nexora.sch.id';

      if ((isMatchingEmail || isMatchingUsername || isDefaultAlias) && pass === activeCreds.password) {
        const savedAdminProfileStr = localStorage.getItem('nexora_admin_profile');
        let cachedAdminProfile: Partial<Profile> = {};
        if (savedAdminProfileStr) {
          try {
            cachedAdminProfile = JSON.parse(savedAdminProfileStr);
          } catch (e) { /* ignore */ }
        }

        const finalProfile: Profile = {
          ...defaultAdminProfile,
          ...(remoteAdminProfile || {}),
          ...cachedAdminProfile,
          username: activeCreds.username || remoteAdminProfile?.username || defaultAdminProfile.username,
          role: 'admin',
        };

        setCurrentUser(finalProfile);
        localStorage.setItem('nexora_auth_user', JSON.stringify(finalProfile));
        return { success: true };
      }

      // 2. Coba login melalui Supabase Auth jika menggunakan akun Supabase Auth
      if (isSupabaseConfigured && cleanInput.includes('@')) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: cleanInput,
            password: pass,
          });
          if (!error && data?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .maybeSingle();

            if (profile) {
              if (profile.role === 'admin') {
                const { cleanBio } = decodeAdminBioAndAuth(profile.bio);
                const cleanProfile = { ...profile, bio: cleanBio };
                setCurrentUser(cleanProfile);
                return { success: true };
              } else {
                return { success: false, error: 'Akses ditolak: Akun Anda terdaftar sebagai Siswa, bukan Guru/Admin.' };
              }
            }
          }
        } catch (authErr) {
          console.warn('Supabase Auth attempt notice:', authErr);
        }
      }

      return {
        success: false,
        error: 'Email/Username atau kata sandi pengajar tidak cocok. Silakan periksa kembali kredensial Anda.',
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal login guru' };
    } finally {
      setIsLoading(false);
    }
  };

  // UPDATE AKUN LOGIN & PROFIL GURU (EMAIL, USERNAME, PASSWORD, FOTO, BIO)
  const updateAdminAccount = async (updates: {
    email?: string;
    username?: string;
    currentPassword?: string;
    newPassword?: string;
    full_name?: string;
    avatar_url?: string;
    phone?: string;
    bio?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      // Jika mengubah email atau password, verifikasi password saat ini terlebih dahulu
      if (updates.currentPassword !== undefined) {
        if (updates.currentPassword !== adminCredentials.password) {
          return {
            success: false,
            error: 'Kata sandi saat ini tidak sesuai. Mohon masukkan kata sandi lama yang benar.',
          };
        }
      }

      const nextCreds: AdminCredentials = {
        email: updates.email ? updates.email.trim().toLowerCase() : adminCredentials.email,
        username: updates.username ? updates.username.trim() : adminCredentials.username,
        password: updates.newPassword ? updates.newPassword : adminCredentials.password,
        updated_at: new Date().toISOString(),
      };

      setAdminCredentials(nextCreds);
      localStorage.setItem('nexora_admin_credentials', JSON.stringify(nextCreds));

      const baseUser = currentUser?.role === 'admin' ? currentUser : defaultAdminProfile;
      const nextProfile: Profile = {
        ...baseUser,
        username: nextCreds.username,
        full_name: updates.full_name !== undefined ? updates.full_name : baseUser.full_name,
        avatar_url: updates.avatar_url !== undefined ? updates.avatar_url : baseUser.avatar_url,
        phone: updates.phone !== undefined ? updates.phone : baseUser.phone,
        bio: updates.bio !== undefined ? updates.bio : baseUser.bio,
        updated_at: new Date().toISOString(),
      };

      setCurrentUser(nextProfile);
      localStorage.setItem('nexora_auth_user', JSON.stringify(nextProfile));
      localStorage.setItem('nexora_admin_profile', JSON.stringify(nextProfile));

      // Sinkronkan ke Supabase jika terkoneksi
      if (isSupabaseConfigured) {
        try {
          const encodedBio = encodeAdminBioWithAuth(nextProfile.bio || '', nextCreds);
          await supabase
            .from('profiles')
            .update({
              username: nextProfile.username,
              full_name: nextProfile.full_name,
              avatar_url: nextProfile.avatar_url,
              phone: nextProfile.phone,
              bio: encodedBio,
              updated_at: nextProfile.updated_at,
            })
            .eq('id', nextProfile.id);

          // Jika ada session Supabase Auth aktif, update juga user auth-nya
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session) {
            const authPayload: { email?: string; password?: string } = {};
            if (updates.email) authPayload.email = nextCreds.email;
            if (updates.newPassword) authPayload.password = nextCreds.password;
            if (Object.keys(authPayload).length > 0) {
              await supabase.auth.updateUser(authPayload);
            }
          }
        } catch (supaErr) {
          console.warn('Supabase admin profile sync notice:', supaErr);
        }
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal memperbarui akun pengajar.' };
    }
  };

  // LOGIN KHUSUS SISWA (MURNI DARI DATABASE SUPABASE & CACHE LOKAL)
  const loginStudent = async (identifier: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const cleanId = identifier.trim().toLowerCase();

    try {
      // 1. Cek langsung ke database Supabase
      if (isSupabaseConfigured) {
        try {
          let foundStudent: any = null;

          // A. Cari berdasarkan nis_nisn di tabel students
          const { data: stByNis, error: errNis } = await supabase
            .from('students')
            .select('*, profile:profiles(*), class:classes(*)')
            .ilike('nis_nisn', cleanId)
            .maybeSingle();

          if (!errNis && stByNis) {
            foundStudent = stByNis;
          }

          // B. Jika tidak ketemu lewat NISN, cari lewat username di profiles
          if (!foundStudent) {
            const { data: prf } = await supabase
              .from('profiles')
              .select('id')
              .ilike('username', cleanId)
              .maybeSingle();

            if (prf?.id) {
              const { data: stByPrf } = await supabase
                .from('students')
                .select('*, profile:profiles(*), class:classes(*)')
                .eq('profile_id', prf.id)
                .maybeSingle();
              if (stByPrf) {
                foundStudent = stByPrf;
              }
            }
          }

          if (foundStudent && foundStudent.profile) {
            if (foundStudent.profile.role !== 'student') {
              return { success: false, error: 'Akun ini bukan akun siswa.' };
            }
            if (foundStudent.profile.status === 'inactive') {
              return { success: false, error: 'Akun siswa ini sedang dinonaktifkan oleh guru.' };
            }

            // Cek juga apakah ada password atau avatar terbaru di cache lokal nexora_students
            let localCachedStudent: Student | undefined;
            const savedStudentsStr = localStorage.getItem('nexora_students');
            if (savedStudentsStr) {
              try {
                const allLocal: Student[] = JSON.parse(savedStudentsStr);
                localCachedStudent = allLocal.find(s => s.id === foundStudent.id);
              } catch (e) { /* ignore */ }
            }

            // Validasi kata sandi dari database atau cache terbaru
            const studentPassword = foundStudent.password || localCachedStudent?.password || 'siswa123';
            if (pass !== studentPassword && (!localCachedStudent?.password || pass !== localCachedStudent.password)) {
              return { success: false, error: 'Kata sandi salah. Silakan coba kembali atau hubungi guru Anda.' };
            }

            const mergedProfile: Profile = {
              ...foundStudent.profile,
              avatar_url: foundStudent.profile.avatar_url || localCachedStudent?.profile?.avatar_url || null,
            };
            const mergedStudent: Student = {
              ...foundStudent,
              password: studentPassword,
              profile: mergedProfile,
            };

            setCurrentUser(mergedProfile);
            setCurrentStudent(mergedStudent);
            localStorage.setItem('nexora_auth_user', JSON.stringify(mergedProfile));
            localStorage.setItem('nexora_auth_student', JSON.stringify(mergedStudent));
            return { success: true };
          }
        } catch (dbErr) {
          console.warn('Supabase student lookup notice:', dbErr);
        }
      }

      // 2. Cek ke cache lokal siswa (siswa yang telah didaftarkan guru)
      const savedStudentsStr = localStorage.getItem('nexora_students');
      if (savedStudentsStr) {
        try {
          const allStudents: Student[] = JSON.parse(savedStudentsStr);
          const localStudent = allStudents.find(
            s => (s.nis_nisn && s.nis_nisn.trim().toLowerCase() === cleanId) ||
                 (s.profile?.username && s.profile.username.trim().toLowerCase() === cleanId)
          );

          if (localStudent && localStudent.profile) {
            if (localStudent.profile.status === 'inactive') {
              return { success: false, error: 'Akun siswa ini sedang dinonaktifkan oleh guru.' };
            }

            const expectedPass = localStudent.password || 'siswa123';
            if (pass === expectedPass) {
              setCurrentUser(localStudent.profile);
              setCurrentStudent(localStudent);
              localStorage.setItem('nexora_auth_user', JSON.stringify(localStudent.profile));
              localStorage.setItem('nexora_auth_student', JSON.stringify(localStudent));
              return { success: true };
            } else {
              return { success: false, error: 'Kata sandi salah. Silakan periksa kembali kata sandi Anda.' };
            }
          }
        } catch (e) { /* ignore */ }
      }

      return {
        success: false,
        error: `NISN atau Username "${identifier}" tidak ditemukan di database. Pastikan pengajar telah mendaftarkan akun Anda di menu Manajemen Siswa.`,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal login siswa' };
    } finally {
      setIsLoading(false);
    }
  };

  const updateCurrentStudentAuth = (updates: { avatar_url?: string; password?: string; full_name?: string }) => {
    setCurrentUser(prev => {
      if (!prev) return prev;
      const nextUser: Profile = {
        ...prev,
        avatar_url: updates.avatar_url !== undefined ? updates.avatar_url : prev.avatar_url,
        full_name: updates.full_name !== undefined ? updates.full_name : prev.full_name,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem('nexora_auth_user', JSON.stringify(nextUser));
      return nextUser;
    });

    setCurrentStudent(prev => {
      if (!prev) return prev;
      const nextProfile = prev.profile
        ? {
            ...prev.profile,
            avatar_url: updates.avatar_url !== undefined ? updates.avatar_url : prev.profile.avatar_url,
            full_name: updates.full_name !== undefined ? updates.full_name : prev.profile.full_name,
          }
        : undefined;
      const nextStudent: Student = {
        ...prev,
        password: updates.password !== undefined ? updates.password : prev.password,
        profile: nextProfile,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem('nexora_auth_student', JSON.stringify(nextStudent));
      return nextStudent;
    });
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) { /* ignore */ }
    }
    setCurrentUser(null);
    setCurrentStudent(null);
    localStorage.removeItem('nexora_auth_user');
    localStorage.removeItem('nexora_auth_student');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentStudent,
        adminCredentials,
        role: currentUser?.role || null,
        isAuthenticated: !!currentUser,
        loginAdmin,
        loginStudent,
        updateCurrentStudentAuth,
        updateAdminAccount,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
