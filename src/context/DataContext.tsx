import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ClassItem,
  Subject,
  LearningMaterial,
  Question,
  Assignment,
  Student,
  Submission,
  SubmissionAnswer,
  Grade,
  Announcement,
  SiteSettings,
  Profile,
} from '../types/database.types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Helper: Menghasilkan UUID v4 yang valid untuk PostgreSQL Supabase
export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Helper: Memeriksa apakah string adalah UUID yang valid untuk PostgreSQL
export const isValidUUID = (str: string | null | undefined): boolean => {
  if (!str) return false;
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(str.trim());
};

// Helper: Encode & Decode Kategori/Paket Soal di dalam kolom explanation agar tidak perlu tabel baru di Supabase
export const encodeQuestionExplanation = (categoryName?: string | null, explanation?: string | null): string => {
  const cleanExp = (explanation || '').replace(/^\[PAKET:[^\]]+\]\s*/, '').trim();
  const cleanCat = (categoryName || '').trim();
  if (cleanCat) {
    return `[PAKET:${cleanCat}] ${cleanExp}`.trim();
  }
  return cleanExp;
};

export const decodeQuestionExplanation = (
  rawExplanation?: string | null,
  cachedCategory?: string | null
): { category_name: string; explanation: string } => {
  const raw = rawExplanation || '';
  const match = raw.match(/^\[PAKET:([^\]]+)\]\s*([\s\S]*)$/);
  if (match) {
    return {
      category_name: match[1].trim() || 'Umum',
      explanation: (match[2] || '').trim(),
    };
  }
  return {
    category_name: (cachedCategory && cachedCategory.trim()) ? cachedCategory.trim() : 'Umum',
    explanation: raw,
  };
};

// Helper: Encode & Decode Multi-Kelas (class_ids) dan Paket Soal (category_name) pada Assignment description
export const encodeAssignmentDescription = (
  classIds?: string[],
  categoryName?: string | null,
  description?: string | null
): string => {
  let cleanDesc = (description || '')
    .replace(/^(\[(KELAS|PAKET):[^\]]+\]\s*)+/, '')
    .trim();
  const prefixes: string[] = [];
  if (Array.isArray(classIds) && classIds.length > 0) {
    prefixes.push(`[KELAS:${classIds.filter(Boolean).join(',')}]`);
  }
  if (categoryName && categoryName.trim()) {
    prefixes.push(`[PAKET:${categoryName.trim()}]`);
  }
  if (prefixes.length > 0) {
    return `${prefixes.join('')} ${cleanDesc}`.trim();
  }
  return cleanDesc;
};

export const decodeAssignmentDescription = (
  rawDescription?: string | null,
  singleClassId?: string | null,
  cachedClassIds?: string[],
  cachedCategory?: string | null
): { class_ids: string[]; category_name: string | null; description: string } => {
  let text = rawDescription || '';
  let parsedClassIds: string[] = [];
  let parsedCategory: string | null = cachedCategory || null;

  const kelasMatch = text.match(/\[KELAS:([^\]]+)\]/);
  if (kelasMatch) {
    parsedClassIds = kelasMatch[1].split(',').map(s => s.trim()).filter(Boolean);
    text = text.replace(kelasMatch[0], '').trim();
  }

  const paketMatch = text.match(/\[PAKET:([^\]]+)\]/);
  if (paketMatch) {
    parsedCategory = paketMatch[1].trim();
    text = text.replace(paketMatch[0], '').trim();
  }

  if (parsedClassIds.length === 0) {
    if (Array.isArray(cachedClassIds) && cachedClassIds.length > 0) {
      parsedClassIds = cachedClassIds;
    } else if (singleClassId) {
      parsedClassIds = [singleClassId];
    }
  }

  return {
    class_ids: parsedClassIds,
    category_name: parsedCategory,
    description: text,
  };
};

// Helper: Encode & Decode Jawaban Siswa per Soal (termasuk Esai) di dalam student_notes agar 100% tersimpan ke Guru
export const encodeSubmissionNotes = (
  cleanNotes?: string | null,
  answersList?: SubmissionAnswer[]
): string | null => {
  const cleaned = (cleanNotes || '').replace(/^\[JAWABAN_JSON:[^\]]+\]\s*/, '').trim();
  if (Array.isArray(answersList) && answersList.length > 0) {
    try {
      const compact = answersList.map(a => ({
        id: a.id,
        submission_id: a.submission_id,
        question_id: a.question_id,
        selected_option_id: a.selected_option_id || null,
        answer_text: a.answer_text || null,
        score: a.score ?? null,
      }));
      const encoded = encodeURIComponent(JSON.stringify(compact));
      return `[JAWABAN_JSON:${encoded}] ${cleaned}`.trim();
    } catch (e) {
      return cleaned || null;
    }
  }
  return cleaned || null;
};

export const decodeSubmissionNotes = (
  rawNotes?: string | null,
  dbSubAnswers?: any[],
  cachedAnswers?: SubmissionAnswer[]
): { student_notes: string | null; answers: SubmissionAnswer[] } => {
  let text = rawNotes || '';
  let parsedAnswers: SubmissionAnswer[] = [];

  const match = text.match(/^\[JAWABAN_JSON:([^\]]+)\]\s*([\s\S]*)$/);
  if (match) {
    try {
      const decodedJson = JSON.parse(decodeURIComponent(match[1]));
      if (Array.isArray(decodedJson)) {
        parsedAnswers = decodedJson.map((item: any) => ({
          id: item.id || generateUUID(),
          submission_id: item.submission_id || '',
          question_id: item.question_id || '',
          selected_option_id: item.selected_option_id || null,
          answer_text: item.answer_text ?? item.student_answer_text ?? null,
          file_url: item.file_url || null,
          score: item.score ?? null,
          teacher_comment: item.teacher_comment || null,
          created_at: item.created_at || new Date().toISOString(),
        }));
      }
    } catch (e) {
      // ignore parse error
    }
    text = (match[2] || '').trim();
  }

  // Merge or fallback to relational submission_answers from DB if present
  if (Array.isArray(dbSubAnswers) && dbSubAnswers.length > 0) {
    parsedAnswers = dbSubAnswers.map((item: any) => ({
      id: item.id || generateUUID(),
      submission_id: item.submission_id || '',
      question_id: item.question_id || '',
      selected_option_id: item.selected_option_id || null,
      answer_text: item.student_answer_text ?? item.answer_text ?? null,
      file_url: item.file_url || null,
      score: item.score !== undefined && item.score !== null ? Number(item.score) : null,
      teacher_comment: item.teacher_comment || null,
      created_at: item.created_at || new Date().toISOString(),
    }));
  } else if (parsedAnswers.length === 0 && Array.isArray(cachedAnswers) && cachedAnswers.length > 0) {
    parsedAnswers = cachedAnswers;
  }

  return {
    student_notes: text || null,
    answers: parsedAnswers,
  };
};

const defaultSiteSettings: SiteSettings = {
  id: 1,
  site_name: 'NEXORA',
  tagline: 'Learn Beyond Limits.',
  browser_title: 'NEXORA × SMK MARHAS — Platform E-Learning Terpadu',
  logo_url: null,
  teacher_name: 'Ilham Lesmana',
  teacher_bio: 'Senior Educator & Technology Specialist berkomitmen menghadirkan metode belajar modern, interaktif, dan terstruktur untuk membimbing siswa mencapai potensi akademik terbaik.',
  teacher_photo_url: '',
  teacher_commitment: 'Pembelajaran Interaktif & Terarah',
  teacher_specialty: 'Matematika & Sains Digital',
  contact_email: 'ilham@nexora.sch.id',
  contact_phone: '+62 812-3456-7890',
  contact_address: 'Jakarta, Indonesia',
  accent_color: '#0ea5e9',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

interface DataContextType {
  siteSettings: SiteSettings;
  updateSiteSettings: (settings: Partial<SiteSettings>) => Promise<{ success: boolean; error?: string }>;
  
  classes: ClassItem[];
  addClass: (newClass: Omit<ClassItem, 'id' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean; error?: string }>;
  updateClass: (id: string, updated: Partial<ClassItem>) => Promise<{ success: boolean; error?: string }>;
  deleteClass: (id: string) => Promise<{ success: boolean; error?: string }>;

  subjects: Subject[];
  addSubject: (newSubject: Omit<Subject, 'id' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean; error?: string }>;
  updateSubject: (id: string, updated: Partial<Subject>) => Promise<{ success: boolean; error?: string }>;
  deleteSubject: (id: string) => Promise<{ success: boolean; error?: string }>;

  students: Student[];
  addStudent: (studentData: {
    full_name: string;
    username: string;
    nis_nisn: string;
    class_id: string;
    gender: string;
    address: string;
    parent_phone: string;
    password?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  updateStudent: (id: string, data: Partial<Student> & { full_name?: string; status?: string; avatar_url?: string }) => Promise<{ success: boolean; error?: string }>;
  deleteStudent: (id: string) => Promise<{ success: boolean; error?: string }>;

  materials: LearningMaterial[];
  addMaterial: (material: Omit<LearningMaterial, 'id' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean; error?: string }>;
  updateMaterial: (id: string, updated: Partial<LearningMaterial>) => Promise<{ success: boolean; error?: string }>;
  deleteMaterial: (id: string) => Promise<{ success: boolean; error?: string }>;
  markMaterialComplete: (materialId: string, studentId: string, completed?: boolean) => Promise<void>;
  isMaterialCompleted: (materialId: string, studentId?: string) => boolean;
  completedMaterialsMap: Record<string, string[]>;

  questions: Question[];
  addQuestion: (question: Omit<Question, 'id' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean; error?: string }>;
  updateQuestion: (id: string, updated: Partial<Question>) => Promise<{ success: boolean; error?: string }>;
  deleteQuestion: (id: string) => Promise<{ success: boolean; error?: string }>;
  duplicateQuestion: (id: string) => Promise<{ success: boolean; error?: string }>;

  assignments: Assignment[];
  addAssignment: (assignment: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>, questionIds?: string[]) => Promise<{ success: boolean; error?: string }>;
  updateAssignment: (id: string, updated: Partial<Assignment>, questionIds?: string[]) => Promise<{ success: boolean; error?: string }>;
  deleteAssignment: (id: string) => Promise<{ success: boolean; error?: string }>;

  submissions: Submission[];
  submitAssignment: (
    assignmentId: string, 
    studentId: string, 
    answers: Record<string, { answer_text?: string; selected_option_id?: string; file_url?: string }>,
    studentNotes?: string,
    fileUrls?: string[]
  ) => Promise<{ success: boolean; error?: string }>;
  gradeSubmission: (
    submissionId: string, 
    totalScore: number, 
    feedback: string, 
    itemScores?: Record<string, { score: number; comment?: string }>
  ) => Promise<{ success: boolean; error?: string }>;
  gradeStudentAssignment: (
    studentId: string,
    assignmentId: string,
    totalScore: number,
    feedback: string
  ) => Promise<{ success: boolean; error?: string }>;
  deleteSubmission: (submissionId: string) => Promise<{ success: boolean; error?: string }>;

  grades: Grade[];
  announcements: Announcement[];
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'created_at'>) => Promise<{ success: boolean; error?: string }>;
  deleteAnnouncement: (id: string) => Promise<{ success: boolean; error?: string }>;
  
  isLoading: boolean;
  supabaseStatus: 'connected' | 'error' | 'disconnected';
  supabaseError: string | null;
  retrySupabaseConnection: () => Promise<void>;
  clearLocalCache: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // MURNI DARI DATABASE — Tanpa data dummy
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
    const saved = localStorage.getItem('nexora_settings');
    return saved ? JSON.parse(saved) : defaultSiteSettings;
  });

  const [classes, setClasses] = useState<ClassItem[]>(() => {
    const saved = localStorage.getItem('nexora_classes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.every(c => isValidUUID(c.id))) return parsed;
      } catch (e) { /* ignore */ }
    }
    return [];
  });

  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem('nexora_subjects');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.every(s => isValidUUID(s.id))) return parsed;
      } catch (e) { /* ignore */ }
    }
    return [];
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('nexora_students');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.every(st => isValidUUID(st.id))) return parsed;
      } catch (e) { /* ignore */ }
    }
    return [];
  });

  const [materials, setMaterials] = useState<LearningMaterial[]>(() => {
    const saved = localStorage.getItem('nexora_materials');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.every(m => isValidUUID(m.id))) return parsed;
      } catch (e) { /* ignore */ }
    }
    return [];
  });

  const [questions, setQuestions] = useState<Question[]>(() => {
    const saved = localStorage.getItem('nexora_questions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.every(q => isValidUUID(q.id))) return parsed;
      } catch (e) { /* ignore */ }
    }
    return [];
  });

  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    const saved = localStorage.getItem('nexora_assignments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.every(a => isValidUUID(a.id))) return parsed;
      } catch (e) { /* ignore */ }
    }
    return [];
  });

  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    const saved = localStorage.getItem('nexora_submissions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) { /* ignore */ }
    }
    return [];
  });

  const [grades, setGrades] = useState<Grade[]>(() => {
    const saved = localStorage.getItem('nexora_grades');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) { /* ignore */ }
    }
    return [];
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem('nexora_announcements');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) { /* ignore */ }
    }
    return [];
  });

  const [completedMaterialsMap, setCompletedMaterialsMap] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('nexora_material_completions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
      } catch (e) { /* ignore */ }
    }
    return {};
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [supabaseStatus, setSupabaseStatus] = useState<'connected' | 'error' | 'disconnected'>('disconnected');
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  // Sync to LocalStorage, Dynamic Browser Tab Title & Favicon
  useEffect(() => {
    localStorage.setItem('nexora_settings', JSON.stringify(siteSettings));
    if (typeof document !== 'undefined') {
      // Update Browser Tab Title
      const activeTitle =
        siteSettings.browser_title && siteSettings.browser_title.trim().length > 0
          ? siteSettings.browser_title.trim()
          : `${siteSettings.site_name || 'NEXORA'} — ${siteSettings.tagline || 'Platform E-Learning Terpadu'}`;
      document.title = activeTitle;

      // Update Browser Tab Favicon
      const favicon = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
      if (siteSettings.logo_url) {
        if (favicon) {
          favicon.href = siteSettings.logo_url;
        } else {
          const newFavicon = document.createElement('link');
          newFavicon.rel = 'icon';
          newFavicon.href = siteSettings.logo_url;
          document.head.appendChild(newFavicon);
        }
      } else if (favicon) {
        favicon.href = '/vite.svg';
      }
    }
  }, [siteSettings]);

  useEffect(() => {
    localStorage.setItem('nexora_classes', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem('nexora_subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('nexora_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('nexora_materials', JSON.stringify(materials));
  }, [materials]);

  useEffect(() => {
    localStorage.setItem('nexora_questions', JSON.stringify(questions));
  }, [questions]);

  useEffect(() => {
    localStorage.setItem('nexora_assignments', JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem('nexora_submissions', JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    localStorage.setItem('nexora_grades', JSON.stringify(grades));
  }, [grades]);

  useEffect(() => {
    localStorage.setItem('nexora_announcements', JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem('nexora_material_completions', JSON.stringify(completedMaterialsMap));
  }, [completedMaterialsMap]);

  // Initial Fetch & Live Connection Test dengan Supabase
  const fetchSupabaseData = async () => {
    if (!isSupabaseConfigured) {
      setSupabaseStatus('disconnected');
      setSupabaseError('Konfigurasi Supabase .env belum terdeteksi.');
      return;
    }

    try {
      setIsLoading(true);
      setSupabaseError(null);

      // 1. Fetch Site Settings (id = 1)
      const { data: dbSettings, error: errSettings } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (errSettings) {
        console.error('Supabase settings query error:', errSettings);
        setSupabaseStatus('error');
        setSupabaseError(errSettings.message || 'Gagal membaca data dari Supabase.');
        return;
      }

      setSupabaseStatus('connected');

      if (dbSettings) {
        const localLogoOverride = localStorage.getItem('nexora_logo_url');
        const localBrowserTitle = localStorage.getItem('nexora_browser_title');
        setSiteSettings(prev => ({
          ...prev,
          ...dbSettings,
          logo_url:
            dbSettings.logo_url !== undefined && dbSettings.logo_url !== null
              ? dbSettings.logo_url
              : localLogoOverride !== null
                ? (localLogoOverride || null)
                : prev.logo_url,
          browser_title:
            dbSettings.browser_title !== undefined && dbSettings.browser_title !== null && dbSettings.browser_title !== ''
              ? dbSettings.browser_title
              : localBrowserTitle !== null && localBrowserTitle !== ''
                ? localBrowserTitle
                : (prev.browser_title || defaultSiteSettings.browser_title),
        }));
      } else {
        // Jika tabel site_settings kosong, inisialisasi baris id = 1
        try {
          await supabase.from('site_settings').insert([{
            id: 1,
            site_name: defaultSiteSettings.site_name,
            tagline: defaultSiteSettings.tagline,
            teacher_name: defaultSiteSettings.teacher_name,
            teacher_bio: defaultSiteSettings.teacher_bio,
            teacher_photo_url: defaultSiteSettings.teacher_photo_url,
            contact_email: defaultSiteSettings.contact_email,
            contact_phone: defaultSiteSettings.contact_phone,
            contact_address: defaultSiteSettings.contact_address,
            accent_color: defaultSiteSettings.accent_color,
          }]);
        } catch (e) {
          console.warn('Notice seeding site_settings:', e);
        }
      }

      // 2. Fetch Classes MURNI DARI DATABASE
      const { data: dbClasses, error: errClasses } = await supabase.from('classes').select('*').order('name');
      if (!errClasses) {
        setClasses(dbClasses || []);
      }

      // 3. Fetch Subjects MURNI DARI DATABASE
      const { data: dbSubjects, error: errSubjects } = await supabase.from('subjects').select('*').order('name');
      if (!errSubjects && dbSubjects) {
        setSubjects(prev => {
          return dbSubjects.map(dbSub => {
            const cached = prev.find(p => p.id === dbSub.id);
            return {
              ...dbSub,
              class_ids: Array.isArray(dbSub.class_ids) ? dbSub.class_ids : (cached?.class_ids || []),
            };
          });
        });
      }

      // 4. Fetch Announcements MURNI DARI DATABASE
      const { data: dbAnnouncements, error: errAnn } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
      if (!errAnn) {
        setAnnouncements(dbAnnouncements || []);
      }

      // 5. Fetch Students with Profiles MURNI DARI DATABASE
      const { data: dbStudents, error: errStudents } = await supabase
        .from('students')
        .select('*, profile:profiles(*)')
        .order('created_at', { ascending: false });
      if (!errStudents && dbStudents) {
        setStudents(prev => dbStudents.map((st: any) => {
          const cached = prev.find(p => p.id === st.id);
          return {
            ...st,
            password: st.password || cached?.password || 'siswa123',
            profile: st.profile ? {
              ...st.profile,
              avatar_url: st.profile.avatar_url || cached?.profile?.avatar_url || null,
            } : cached?.profile,
          };
        }));
      }

      // 6. Fetch Materials & Material Completions MURNI DARI DATABASE
      const { data: dbMaterials, error: errMaterials } = await supabase
        .from('learning_materials')
        .select('*')
        .order('order_index');
      if (!errMaterials) {
        setMaterials(dbMaterials || []);
      }

      try {
        const { data: dbCompletions, error: errCompletions } = await supabase
          .from('material_completions')
          .select('*');
        if (!errCompletions && Array.isArray(dbCompletions) && dbCompletions.length > 0) {
          setCompletedMaterialsMap(prev => {
            const merged: Record<string, string[]> = { ...prev };
            dbCompletions.forEach((row: any) => {
              if (row.student_id && row.material_id) {
                const existing = merged[row.student_id] || [];
                if (!existing.includes(row.material_id)) {
                  merged[row.student_id] = [...existing, row.material_id];
                }
              }
            });
            localStorage.setItem('nexora_material_completions', JSON.stringify(merged));
            return merged;
          });
        }
      } catch (e) {
        console.warn('Notice loading material completions:', e);
      }

      // 7. Fetch Questions with Options MURNI DARI DATABASE (Tahan Gangguan Relasi PostgREST)
      try {
        const { data: dbQuestions, error: errQuestions } = await supabase
          .from('questions')
          .select('*')
          .order('created_at', { ascending: false });

        if (!errQuestions && dbQuestions) {
          const { data: dbOptions } = await supabase
            .from('question_options')
            .select('*');

          const allOptions = Array.isArray(dbOptions) ? dbOptions : [];

          setQuestions(prev => {
            return dbQuestions.map((q: any) => {
              const cached = prev.find(p => p.id === q.id);
              let qOptions = allOptions
                .filter((opt: any) => opt.question_id === q.id)
                .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
                .map((opt: any, idx: number) => ({
                  ...opt,
                  option_key: opt.option_key || String.fromCharCode(65 + idx),
                }));

              // Jika tabel question_options di database masih kosong (misal insert lag), pertahankan dari cache lokal
              if (qOptions.length === 0 && cached && cached.options && cached.options.length > 0) {
                qOptions = cached.options;
              }

              const decoded = decodeQuestionExplanation(q.explanation, cached?.category_name);

              return {
                ...q,
                category_name: q.category_name || decoded.category_name,
                explanation: decoded.explanation,
                options: qOptions,
              };
            });
          });
        } else if (errQuestions) {
          console.warn('Notice fetching questions from Supabase:', errQuestions.message);
        }
      } catch (e) {
        console.warn('Notice loading questions:', e);
      }

      // 8. Fetch Assignments MURNI DARI DATABASE (dengan join assignment_questions)
      try {
        const { data: dbAssignments, error: errAssignments } = await supabase
          .from('assignments')
          .select('*, assignment_questions(question_id)')
          .order('created_at', { ascending: false });

        if (!errAssignments && dbAssignments && dbAssignments.length > 0) {
          setAssignments(prev => dbAssignments.map((a: any) => {
            const cached = prev.find(p => p.id === a.id);
            const decoded = decodeAssignmentDescription(
              a.description,
              a.class_id,
              cached?.class_ids,
              cached?.category_name
            );
            const qIds = Array.isArray(a.assignment_questions) && a.assignment_questions.length > 0
              ? a.assignment_questions.map((aq: any) => aq.question_id)
              : (a.question_ids || cached?.question_ids || []);
            return {
              ...a,
              description: decoded.description,
              class_ids: decoded.class_ids,
              category_name: decoded.category_name,
              due_date: a.due_date || a.end_time || null,
              question_ids: qIds,
              question_count: qIds.length > 0 ? qIds.length : (a.question_count || cached?.question_count || 0),
            };
          }));
        } else {
          // Fallback jika relasi assignment_questions belum terbentuk di database
          const { data: fallbackAsg } = await supabase
            .from('assignments')
            .select('*')
            .order('created_at', { ascending: false });
          if (fallbackAsg && fallbackAsg.length > 0) {
            setAssignments(prev => fallbackAsg.map((a: any) => {
              const cached = prev.find(p => p.id === a.id);
              const decoded = decodeAssignmentDescription(
                a.description,
                a.class_id,
                cached?.class_ids,
                cached?.category_name
              );
              return {
                ...a,
                description: decoded.description,
                class_ids: decoded.class_ids,
                category_name: decoded.category_name,
                due_date: a.due_date || a.end_time || null,
                question_ids: cached?.question_ids || a.question_ids || [],
                question_count: cached?.question_count || a.question_count || 0,
              };
            }));
          }
        }
      } catch (e) {
        console.warn('Notice fetching assignments:', e);
      }

      // 9. Fetch Submissions MURNI DARI DATABASE (beserta submission_answers)
      try {
        const { data: dbSubmissions, error: errSub } = await supabase
          .from('submissions')
          .select('*, submission_answers(*)')
          .order('submitted_at', { ascending: false });

        if (!errSub && dbSubmissions) {
          setSubmissions(prev => dbSubmissions.map((s: any) => {
            const cached = prev.find(p => p.id === s.id);
            const decoded = decodeSubmissionNotes(
              s.student_notes,
              s.submission_answers,
              cached?.answers
            );
            return {
              ...s,
              student_notes: decoded.student_notes,
              answers: decoded.answers,
            };
          }));
        } else {
          const { data: fallbackSub } = await supabase
            .from('submissions')
            .select('*')
            .order('submitted_at', { ascending: false });
          if (fallbackSub) {
            setSubmissions(prev => fallbackSub.map((s: any) => {
              const cached = prev.find(p => p.id === s.id);
              const decoded = decodeSubmissionNotes(
                s.student_notes,
                undefined,
                cached?.answers
              );
              return {
                ...s,
                student_notes: decoded.student_notes,
                answers: decoded.answers,
              };
            }));
          }
        }
      } catch (e) {
        console.warn('Notice fetching submissions:', e);
      }

      // 10. Fetch Grades MURNI DARI DATABASE
      const { data: dbGrades, error: errGrades } = await supabase
        .from('grades')
        .select('*')
        .order('created_at', { ascending: false });
      if (!errGrades) {
        setGrades(dbGrades || []);
      }

    } catch (err: any) {
      console.error('Supabase connection exception:', err);
      setSupabaseStatus('error');
      setSupabaseError(err?.message || 'Tidak dapat terhubung ke server Supabase.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSupabaseData();
  }, []);

  const retrySupabaseConnection = async () => {
    await fetchSupabaseData();
  };

  // ==========================================
  // SITE SETTINGS CRUD
  // ==========================================
  const updateSiteSettings = async (settings: Partial<SiteSettings>): Promise<{ success: boolean; error?: string }> => {
    const updatedSettings = { ...siteSettings, ...settings, updated_at: new Date().toISOString() };
    setSiteSettings(updatedSettings);
    if (settings.logo_url !== undefined) {
      localStorage.setItem('nexora_logo_url', settings.logo_url || '');
    }
    if (settings.browser_title !== undefined) {
      localStorage.setItem('nexora_browser_title', settings.browser_title || '');
    }

    if (isSupabaseConfigured) {
      try {
        const payload: Record<string, any> = {
          id: 1,
          site_name: updatedSettings.site_name,
          tagline: updatedSettings.tagline,
          browser_title: updatedSettings.browser_title || defaultSiteSettings.browser_title,
          logo_url: updatedSettings.logo_url || null,
          teacher_name: updatedSettings.teacher_name,
          teacher_bio: updatedSettings.teacher_bio,
          teacher_photo_url: updatedSettings.teacher_photo_url,
          teacher_commitment: updatedSettings.teacher_commitment || 'Pembelajaran Interaktif & Terarah',
          teacher_specialty: updatedSettings.teacher_specialty || 'Matematika & Sains Digital',
          contact_email: updatedSettings.contact_email,
          contact_phone: updatedSettings.contact_phone,
          contact_address: updatedSettings.contact_address,
          accent_color: updatedSettings.accent_color,
          updated_at: new Date().toISOString(),
        };

        const { error: upsertErr } = await supabase
          .from('site_settings')
          .upsert([payload], { onConflict: 'id' });

        if (upsertErr) {
          console.warn('Upsert notice, trying basic payload:', upsertErr);
          const basicPayload = {
            id: 1,
            site_name: updatedSettings.site_name,
            tagline: updatedSettings.tagline,
            teacher_name: updatedSettings.teacher_name,
            teacher_bio: updatedSettings.teacher_bio,
            teacher_photo_url: updatedSettings.teacher_photo_url,
            contact_email: updatedSettings.contact_email,
            contact_phone: updatedSettings.contact_phone,
            contact_address: updatedSettings.contact_address,
            accent_color: updatedSettings.accent_color,
          };
          const { error: basicErr } = await supabase
            .from('site_settings')
            .upsert([basicPayload], { onConflict: 'id' });

          if (basicErr) {
            console.error('Error updating site_settings in Supabase:', basicErr);
            return { success: false, error: basicErr.message };
          }
        }
      } catch (e: any) {
        console.error('Exception updating site settings:', e);
        return { success: false, error: e.message };
      }
    }
    return { success: true };
  };

  // ==========================================
  // CLASSES CRUD
  // ==========================================
  const addClass = async (newClass: Omit<ClassItem, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; error?: string }> => {
    const classId = generateUUID();
    const created: ClassItem = {
      ...newClass,
      id: classId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      student_count: 0,
    };

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('classes').insert([{
          id: classId,
          name: newClass.name,
          level: newClass.level,
          academic_year: newClass.academic_year,
          description: newClass.description || '',
        }]);
        if (error) {
          console.error('Error adding class in Supabase:', error);
          return { success: false, error: error.message };
        }
      } catch (e: any) {
        console.error('Exception adding class:', e);
        return { success: false, error: e.message };
      }
    }

    setClasses(prev => [created, ...prev]);
    return { success: true };
  };

  const updateClass = async (id: string, updated: Partial<ClassItem>): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured && isValidUUID(id)) {
      try {
        const payload: Record<string, any> = {};
        if (updated.name !== undefined) payload.name = updated.name;
        if (updated.level !== undefined) payload.level = updated.level;
        if (updated.academic_year !== undefined) payload.academic_year = updated.academic_year;
        if (updated.description !== undefined) payload.description = updated.description;

        const { error } = await supabase.from('classes').update(payload).eq('id', id);
        if (error) {
          console.error('Error updating class in Supabase:', error);
          return { success: false, error: error.message };
        }
      } catch (e: any) {
        console.error('Exception updating class:', e);
        return { success: false, error: e.message };
      }
    }

    setClasses(prev => prev.map(c => (c.id === id ? { ...c, ...updated, updated_at: new Date().toISOString() } : c)));
    return { success: true };
  };

  const deleteClass = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured && isValidUUID(id)) {
      try {
        // Cascade cleanup in Supabase to prevent foreign key errors
        await supabase.from('students').update({ class_id: null }).eq('class_id', id);
        await supabase.from('learning_materials').delete().eq('class_id', id);
        await supabase.from('grades').delete().eq('class_id', id);
        await supabase.from('assignments').delete().eq('class_id', id);
        await supabase.from('announcements').delete().eq('class_id', id);

        const { error } = await supabase.from('classes').delete().eq('id', id);
        if (error) {
          console.error('Error deleting class in Supabase:', error);
          return { success: false, error: error.message };
        }
      } catch (e: any) {
        console.error('Exception deleting class:', e);
        return { success: false, error: e.message };
      }
    }

    setClasses(prev => prev.filter(c => c.id !== id));
    setStudents(prev => prev.map(s => (s.class_id === id ? { ...s, class_id: null, class: undefined } : s)));
    setMaterials(prev => prev.filter(m => m.class_id !== id));
    setAssignments(prev => prev.filter(a => a.class_id !== id));
    return { success: true };
  };

  // ==========================================
  // SUBJECTS CRUD
  // ==========================================
  const addSubject = async (newSubject: Omit<Subject, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; error?: string }> => {
    const subjectId = generateUUID();
    const created: Subject = {
      ...newSubject,
      id: subjectId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const insertPayload: Record<string, any> = {
          id: subjectId,
          name: newSubject.name,
          code: newSubject.code,
          description: newSubject.description || '',
          color_accent: newSubject.color_accent || '#38bdf8',
          cover_image_url: newSubject.cover_image_url || null,
        };
        if (newSubject.class_ids && Array.isArray(newSubject.class_ids)) {
          insertPayload.class_ids = newSubject.class_ids;
        }

        let { error } = await supabase.from('subjects').insert([insertPayload]);
        // Fallback jika kolom class_ids belum ada di database
        if (error && error.message?.includes('class_ids')) {
          delete insertPayload.class_ids;
          const retry = await supabase.from('subjects').insert([insertPayload]);
          error = retry.error;
        }

        if (error) {
          console.error('Error adding subject in Supabase:', error);
          return { success: false, error: error.message };
        }
      } catch (e: any) {
        console.error('Exception adding subject:', e);
        return { success: false, error: e.message };
      }
    }

    setSubjects(prev => [created, ...prev]);
    return { success: true };
  };

  const updateSubject = async (id: string, updated: Partial<Subject>): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured && isValidUUID(id)) {
      try {
        const payload: Record<string, any> = {};
        if (updated.name !== undefined) payload.name = updated.name;
        if (updated.code !== undefined) payload.code = updated.code;
        if (updated.description !== undefined) payload.description = updated.description;
        if (updated.color_accent !== undefined) payload.color_accent = updated.color_accent;
        if (updated.cover_image_url !== undefined) payload.cover_image_url = updated.cover_image_url;
        if (updated.class_ids !== undefined) payload.class_ids = updated.class_ids;

        let { error } = await supabase.from('subjects').update(payload).eq('id', id);
        // Fallback jika kolom class_ids belum ada di database
        if (error && error.message?.includes('class_ids')) {
          delete payload.class_ids;
          const retry = await supabase.from('subjects').update(payload).eq('id', id);
          error = retry.error;
        }

        if (error) {
          console.error('Error updating subject in Supabase:', error);
          return { success: false, error: error.message };
        }
      } catch (e: any) {
        console.error('Exception updating subject:', e);
        return { success: false, error: e.message };
      }
    }

    setSubjects(prev => prev.map(s => (s.id === id ? { ...s, ...updated, updated_at: new Date().toISOString() } : s)));
    return { success: true };
  };

  const deleteSubject = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured && isValidUUID(id)) {
      try {
        // Cascade cleanup child references in Supabase
        await supabase.from('learning_materials').delete().eq('subject_id', id);
        await supabase.from('grades').delete().eq('subject_id', id);
        await supabase.from('assignments').delete().eq('subject_id', id);
        await supabase.from('questions').delete().eq('subject_id', id);

        const { error } = await supabase.from('subjects').delete().eq('id', id);
        if (error) {
          console.error('Error deleting subject in Supabase:', error);
          return { success: false, error: error.message };
        }
      } catch (e: any) {
        console.error('Exception deleting subject:', e);
        return { success: false, error: e.message };
      }
    }

    setSubjects(prev => prev.filter(s => s.id !== id));
    setMaterials(prev => prev.filter(m => m.subject_id !== id));
    setQuestions(prev => prev.filter(q => q.subject_id !== id));
    setAssignments(prev => prev.filter(a => a.subject_id !== id));
    return { success: true };
  };

  // ==========================================
  // STUDENTS CRUD
  // ==========================================
  const addStudent = async (studentData: {
    full_name: string;
    username: string;
    nis_nisn: string;
    class_id: string;
    gender: string;
    address: string;
    parent_phone: string;
    password?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const studentProfileId = generateUUID();
    const studentId = generateUUID();

    const newProfile: Profile = {
      id: studentProfileId,
      username: studentData.username,
      full_name: studentData.full_name,
      role: 'student',
      status: 'active',
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${studentData.username}`,
      phone: studentData.parent_phone,
      bio: `Siswa terdaftar`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const targetClass = classes.find(c => c.id === studentData.class_id);

    const newStudent: Student = {
      id: studentId,
      profile_id: studentProfileId,
      class_id: isValidUUID(studentData.class_id) ? studentData.class_id : null,
      nis_nisn: studentData.nis_nisn,
      gender: studentData.gender,
      address: studentData.address,
      parent_name: 'Wali Siswa ' + studentData.full_name,
      parent_phone: studentData.parent_phone,
      password: studentData.password || 'siswa123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profile: newProfile,
      class: targetClass,
    };

    if (isSupabaseConfigured) {
      try {
        const { error: errProf } = await supabase.from('profiles').insert([{
          id: studentProfileId,
          username: studentData.username,
          full_name: studentData.full_name,
          role: 'student',
          status: 'active',
          avatar_url: newProfile.avatar_url,
          phone: studentData.parent_phone,
        }]);
        if (errProf) console.error('Error inserting student profile:', errProf);

        const { error: errStud } = await supabase.from('students').insert([{
          id: studentId,
          profile_id: studentProfileId,
          class_id: isValidUUID(studentData.class_id) ? studentData.class_id : null,
          nis_nisn: studentData.nis_nisn,
          gender: studentData.gender,
          address: studentData.address,
          parent_phone: studentData.parent_phone,
          password: studentData.password || 'siswa123',
        }]);
        if (errStud) {
          console.error('Error inserting student:', errStud);
          return { success: false, error: errStud.message };
        }
      } catch (e: any) {
        console.error('Exception adding student to Supabase:', e);
        return { success: false, error: e.message };
      }
    }

    setStudents(prev => [newStudent, ...prev]);

    // Update class student count
    if (studentData.class_id) {
      setClasses(prev =>
        prev.map(c =>
          c.id === studentData.class_id ? { ...c, student_count: (c.student_count || 0) + 1 } : c
        )
      );
    }

    return { success: true };
  };

  const updateStudent = async (
    id: string, 
    data: Partial<Student> & { full_name?: string; status?: string; avatar_url?: string }
  ): Promise<{ success: boolean; error?: string }> => {
    const existingStudent = students.find(st => st.id === id);
    let studentProfileId: string | undefined = data.profile_id || existingStudent?.profile_id;

    setStudents(prev =>
      prev.map(st => {
        if (st.id === id) {
          studentProfileId = st.profile_id || studentProfileId;
          const updatedProfile = st.profile
            ? {
                ...st.profile,
                full_name: data.full_name ?? st.profile.full_name,
                status: (data.status as any) ?? st.profile.status,
                avatar_url: data.avatar_url !== undefined ? data.avatar_url : st.profile.avatar_url,
              }
            : undefined;

          const updatedClass = data.class_id
            ? classes.find(c => c.id === data.class_id)
            : st.class;

          return {
            ...st,
            ...data,
            profile: updatedProfile,
            class: updatedClass,
            updated_at: new Date().toISOString(),
          };
        }
        return st;
      })
    );

    if (isSupabaseConfigured && isValidUUID(id)) {
      try {
        const studentPayload: Record<string, any> = {};
        if (data.class_id !== undefined) studentPayload.class_id = isValidUUID(data.class_id) ? data.class_id : null;
        if (data.nis_nisn !== undefined) studentPayload.nis_nisn = data.nis_nisn;
        if (data.gender !== undefined) studentPayload.gender = data.gender;
        if (data.address !== undefined) studentPayload.address = data.address;
        if (data.parent_phone !== undefined) studentPayload.parent_phone = data.parent_phone;
        if (data.password !== undefined) studentPayload.password = data.password;

        if (Object.keys(studentPayload).length > 0) {
          const { error: errStud } = await supabase.from('students').update(studentPayload).eq('id', id);
          if (errStud) console.warn('Notice updating students table:', errStud.message);
        }

        if (
          studentProfileId &&
          isValidUUID(studentProfileId) &&
          (data.full_name !== undefined || data.status !== undefined || data.avatar_url !== undefined)
        ) {
          const profilePayload: Record<string, any> = {};
          if (data.full_name !== undefined) profilePayload.full_name = data.full_name;
          if (data.status !== undefined) profilePayload.status = data.status;
          if (data.avatar_url !== undefined) profilePayload.avatar_url = data.avatar_url;

          const { error: errProf } = await supabase.from('profiles').update(profilePayload).eq('id', studentProfileId);
          if (errProf) console.warn('Notice updating profile table:', errProf.message);
        }
      } catch (e: any) {
        console.error('Exception updating student:', e);
        return { success: false, error: e.message };
      }
    }
    return { success: true };
  };

  const deleteStudent = async (id: string): Promise<{ success: boolean; error?: string }> => {
    const studentToDelete = students.find(s => s.id === id);

    if (isSupabaseConfigured && isValidUUID(id)) {
      try {
        // Cascade delete grades & submissions
        await supabase.from('grades').delete().eq('student_id', id);
        await supabase.from('submissions').delete().eq('student_id', id);

        const { error: errStud } = await supabase.from('students').delete().eq('id', id);
        if (errStud) console.error('Error deleting student:', errStud);

        if (studentToDelete?.profile_id && isValidUUID(studentToDelete.profile_id)) {
          await supabase.from('profiles').delete().eq('id', studentToDelete.profile_id);
        }
      } catch (e: any) {
        console.error('Exception deleting student from Supabase:', e);
        return { success: false, error: e.message };
      }
    }

    setStudents(prev => prev.filter(st => st.id !== id));
    return { success: true };
  };

  // ==========================================
  // LEARNING MATERIALS CRUD
  // ==========================================
  const addMaterial = async (material: Omit<LearningMaterial, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; error?: string }> => {
    const materialId = generateUUID();
    const created: LearningMaterial = {
      ...material,
      id: materialId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const matPayload: Record<string, any> = {
          id: materialId,
          subject_id: isValidUUID(material.subject_id) ? material.subject_id : null,
          class_id: isValidUUID(material.class_id) ? material.class_id : null,
          title: material.title,
          description: material.description || '',
          content_rich_text: material.content_rich_text || '',
          pdf_url: material.pdf_url || null,
          image_url: material.image_url || null,
          video_url: material.video_url || null,
          order_index: material.order_index || 1,
          is_published: material.is_published ?? true,
        };

        let { error } = await supabase.from('learning_materials').insert([matPayload]);
        // Fallback jika kolom class_id di tabel learning_materials memiliki constraint NOT NULL
        if (error && error.message?.includes('class_id')) {
          const fallbackClassId = classes.find(c => isValidUUID(c.id))?.id || null;
          if (fallbackClassId) {
            const retry = await supabase.from('learning_materials').insert([{ ...matPayload, class_id: fallbackClassId }]);
            error = retry.error;
          }
        }
        if (error) {
          console.error('Error adding material in Supabase:', error);
          return { success: false, error: error.message };
        }
      } catch (e: any) {
        console.error('Exception adding material:', e);
        return { success: false, error: e.message };
      }
    }

    setMaterials(prev => [created, ...prev]);
    return { success: true };
  };

  const updateMaterial = async (id: string, updated: Partial<LearningMaterial>): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured && isValidUUID(id)) {
      try {
        const payload: Record<string, any> = {};
        if (updated.title !== undefined) payload.title = updated.title;
        if (updated.description !== undefined) payload.description = updated.description;
        if (updated.content_rich_text !== undefined) payload.content_rich_text = updated.content_rich_text;
        if (updated.pdf_url !== undefined) payload.pdf_url = updated.pdf_url;
        if (updated.image_url !== undefined) payload.image_url = updated.image_url;
        if (updated.video_url !== undefined) payload.video_url = updated.video_url;
        if (updated.class_id !== undefined) payload.class_id = isValidUUID(updated.class_id) ? updated.class_id : null;
        if (updated.subject_id !== undefined) payload.subject_id = isValidUUID(updated.subject_id) ? updated.subject_id : null;
        if (updated.order_index !== undefined) payload.order_index = updated.order_index;
        if (updated.is_published !== undefined) payload.is_published = updated.is_published;

        let { error } = await supabase.from('learning_materials').update(payload).eq('id', id);
        if (error && error.message?.includes('class_id')) {
          const fallbackClassId = classes.find(c => isValidUUID(c.id))?.id || null;
          if (fallbackClassId) {
            const retry = await supabase.from('learning_materials').update({ ...payload, class_id: fallbackClassId }).eq('id', id);
            error = retry.error;
          }
        }
        if (error) {
          console.error('Error updating material in Supabase:', error);
          return { success: false, error: error.message };
        }
      } catch (e: any) {
        console.error('Exception updating material:', e);
        return { success: false, error: e.message };
      }
    }

    setMaterials(prev => prev.map(m => (m.id === id ? { ...m, ...updated, updated_at: new Date().toISOString() } : m)));
    return { success: true };
  };

  const deleteMaterial = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured && isValidUUID(id)) {
      try {
        // Cascade delete completions if any
        try {
          await supabase.from('material_completions').delete().eq('material_id', id);
        } catch (e) {
          // ignore if table doesn't exist
        }

        const { error } = await supabase.from('learning_materials').delete().eq('id', id);
        if (error) {
          console.error('Error deleting material in Supabase:', error);
          return { success: false, error: error.message };
        }
      } catch (e: any) {
        console.error('Exception deleting material:', e);
        return { success: false, error: e.message };
      }
    }

    setMaterials(prev => prev.filter(m => m.id !== id));
    return { success: true };
  };

  const isMaterialCompleted = (materialId: string, studentId?: string): boolean => {
    const key = studentId || 'default_student';
    const studentList = completedMaterialsMap[key] || [];
    if (studentList.includes(materialId)) return true;
    const mat = materials.find(m => m.id === materialId);
    return Boolean(mat?.is_completed);
  };

  const markMaterialComplete = async (materialId: string, studentId: string, completed: boolean = true) => {
    const key = studentId || 'default_student';

    setCompletedMaterialsMap(prev => {
      const currentList = prev[key] || [];
      let updatedList: string[];
      if (completed) {
        updatedList = currentList.includes(materialId) ? currentList : [...currentList, materialId];
      } else {
        updatedList = currentList.filter(id => id !== materialId);
      }
      const nextMap = { ...prev, [key]: updatedList };
      localStorage.setItem('nexora_material_completions', JSON.stringify(nextMap));
      return nextMap;
    });

    setMaterials(prev =>
      prev.map(m => (m.id === materialId ? { ...m, is_completed: completed } : m))
    );

    if (isSupabaseConfigured && isValidUUID(materialId) && isValidUUID(studentId)) {
      try {
        if (completed) {
          const { data: existing } = await supabase
            .from('material_completions')
            .select('id')
            .eq('material_id', materialId)
            .eq('student_id', studentId)
            .maybeSingle();

          if (!existing) {
            await supabase.from('material_completions').insert([{
              material_id: materialId,
              student_id: studentId,
              completed_at: new Date().toISOString(),
            }]);
          }
        } else {
          await supabase
            .from('material_completions')
            .delete()
            .eq('material_id', materialId)
            .eq('student_id', studentId);
        }
      } catch (e) {
        console.warn('Notice syncing material completion to Supabase:', e);
      }
    }
  };

  // ==========================================
  // QUESTIONS (BANK SOAL) CRUD
  // ==========================================
  const addQuestion = async (question: Omit<Question, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; error?: string }> => {
    const questionId = generateUUID();
    const finalOptions = (question.options || []).map((opt, idx) => ({
      ...opt,
      id: opt.id || generateUUID(),
      option_key: opt.option_key || String.fromCharCode(65 + idx),
      option_text: opt.option_text || `Pilihan ${String.fromCharCode(65 + idx)}`,
      is_correct: Boolean(opt.is_correct),
      order_index: opt.order_index || idx + 1,
    }));

    const cleanCategory = (question.category_name || 'Umum').trim() || 'Umum';
    const cleanExplanation = (question.explanation || '').replace(/^\[PAKET:[^\]]+\]\s*/, '').trim();

    const created: Question = {
      ...question,
      id: questionId,
      category_name: cleanCategory,
      explanation: cleanExplanation,
      options: finalOptions,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        let subId = question.subject_id;
        if (!isValidUUID(subId)) {
          const matched = subjects.find(s => s.id === subId || s.name === subId);
          subId = matched && isValidUUID(matched.id) ? matched.id : (subjects.find(s => isValidUUID(s.id))?.id || null as any);
        }

        const qPayload: Record<string, any> = {
          id: questionId,
          subject_id: subId,
          class_id: isValidUUID(question.class_id) ? question.class_id : null,
          question_text: question.question_text,
          question_type: question.question_type,
          difficulty: question.difficulty,
          points: question.points,
          explanation: encodeQuestionExplanation(cleanCategory, cleanExplanation),
          short_answer_key: question.short_answer_key || null,
        };

        if (question.created_by && isValidUUID(question.created_by)) {
          qPayload.created_by = question.created_by;
        }

        const { error: errQ } = await supabase.from('questions').insert([qPayload]);
        if (errQ) {
          console.error('Error inserting question to Supabase:', errQ);
          // Tetap masukkan ke state lokal jika offline atau terjadi RLS lag
          setQuestions(prev => [created, ...prev]);
          return { success: false, error: 'Database notice: ' + errQ.message };
        }

        if (finalOptions.length > 0) {
          // Percobaan 1: Insert dengan option_key
          const rowsWithKey = finalOptions.map((opt, idx) => ({
            id: generateUUID(),
            question_id: questionId,
            option_key: opt.option_key || String.fromCharCode(65 + idx),
            option_text: opt.option_text,
            is_correct: opt.is_correct,
            order_index: opt.order_index,
          }));

          let { error: errOpt } = await supabase.from('question_options').insert(rowsWithKey);

          // Percobaan 2 (fallback): jika kolom option_key belum ada di database Supabase
          if (errOpt && (errOpt.message?.includes('option_key') || errOpt.code === '42703')) {
            console.warn('Retrying question_options without option_key column:', errOpt.message);
            const rowsWithoutKey = finalOptions.map(opt => ({
              id: generateUUID(),
              question_id: questionId,
              option_text: opt.option_text,
              is_correct: opt.is_correct,
              order_index: opt.order_index,
            }));
            const retry = await supabase.from('question_options').insert(rowsWithoutKey);
            errOpt = retry.error;
          }

          if (errOpt) {
            console.error('Error inserting question options in Supabase:', errOpt);
          }
        }
      } catch (e: any) {
        console.error('Exception adding question:', e);
        setQuestions(prev => [created, ...prev]);
        return { success: false, error: e.message };
      }
    }

    setQuestions(prev => [created, ...prev]);
    return { success: true };
  };

  const updateQuestion = async (id: string, updated: Partial<Question>): Promise<{ success: boolean; error?: string }> => {
    const existingQ = questions.find(q => q.id === id);
    const nextCategory = updated.category_name !== undefined
      ? (updated.category_name || 'Umum').trim()
      : (existingQ?.category_name || 'Umum');
    const nextExplanation = updated.explanation !== undefined
      ? (updated.explanation || '').replace(/^\[PAKET:[^\]]+\]\s*/, '').trim()
      : (existingQ?.explanation || '');

    if (isSupabaseConfigured && isValidUUID(id)) {
      try {
        const payload: Record<string, any> = {};
        if (updated.question_text !== undefined) payload.question_text = updated.question_text;
        if (updated.question_type !== undefined) payload.question_type = updated.question_type;
        if (updated.difficulty !== undefined) payload.difficulty = updated.difficulty;
        if (updated.points !== undefined) payload.points = updated.points;
        if (updated.explanation !== undefined || updated.category_name !== undefined) {
          payload.explanation = encodeQuestionExplanation(nextCategory, nextExplanation);
        }
        if (updated.short_answer_key !== undefined) payload.short_answer_key = updated.short_answer_key;
        if (updated.subject_id !== undefined) payload.subject_id = isValidUUID(updated.subject_id) ? updated.subject_id : null;
        if (updated.class_id !== undefined) payload.class_id = isValidUUID(updated.class_id) ? updated.class_id : null;

        const { error } = await supabase.from('questions').update(payload).eq('id', id);
        if (error) {
          console.error('Error updating question in Supabase:', error);
          return { success: false, error: error.message };
        }

        if (updated.options && Array.isArray(updated.options)) {
          try {
            await supabase.from('question_options').delete().eq('question_id', id);
            if (updated.options.length > 0) {
              const rowsWithKey = updated.options.map((opt, idx) => ({
                id: generateUUID(),
                question_id: id,
                option_key: opt.option_key || String.fromCharCode(65 + idx),
                option_text: opt.option_text || `Pilihan ${String.fromCharCode(65 + idx)}`,
                is_correct: Boolean(opt.is_correct),
                order_index: opt.order_index || idx + 1,
              }));

              let { error: errOpt } = await supabase.from('question_options').insert(rowsWithKey);
              if (errOpt && (errOpt.message?.includes('option_key') || errOpt.code === '42703')) {
                console.warn('Retrying update question_options without option_key:', errOpt.message);
                const rowsWithoutKey = updated.options.map((opt, idx) => ({
                  id: generateUUID(),
                  question_id: id,
                  option_text: opt.option_text || `Pilihan ${String.fromCharCode(65 + idx)}`,
                  is_correct: Boolean(opt.is_correct),
                  order_index: opt.order_index || idx + 1,
                }));
                const retry = await supabase.from('question_options').insert(rowsWithoutKey);
                errOpt = retry.error;
              }

              if (errOpt) {
                console.error('Error updating question options in Supabase:', errOpt);
              }
            }
          } catch (e) {
            console.warn('Notice updating question options:', e);
          }
        }
      } catch (e: any) {
        console.error('Exception updating question:', e);
        return { success: false, error: e.message };
      }
    }

    setQuestions(prev => prev.map(q => (q.id === id ? {
      ...q,
      ...updated,
      category_name: nextCategory,
      explanation: nextExplanation,
      updated_at: new Date().toISOString(),
    } : q)));
    return { success: true };
  };

  const deleteQuestion = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured && isValidUUID(id)) {
      try {
        // Cascade cleanup question options and assignment links
        await supabase.from('assignment_questions').delete().eq('question_id', id);
        await supabase.from('question_options').delete().eq('question_id', id);

        const { error } = await supabase.from('questions').delete().eq('id', id);
        if (error) {
          console.error('Error deleting question in Supabase:', error);
          return { success: false, error: error.message };
        }
      } catch (e: any) {
        console.error('Exception deleting question:', e);
        return { success: false, error: e.message };
      }
    }

    setQuestions(prev => prev.filter(q => q.id !== id));
    return { success: true };
  };

  const duplicateQuestion = async (id: string): Promise<{ success: boolean; error?: string }> => {
    const target = questions.find(q => q.id === id);
    if (!target) return { success: false, error: 'Soal tidak ditemukan' };
    
    const { id: _oldId, created_at: _oldCreated, updated_at: _oldUpdated, ...cleanTarget } = target;

    return await addQuestion({
      ...cleanTarget,
      question_text: `${target.question_text} (Salinan)`,
      options: target.options?.map(opt => ({
        ...opt,
        id: generateUUID(),
      })),
    });
  };

  // ==========================================
  // ASSIGNMENTS & UJIAN CRUD
  // ==========================================
  const addAssignment = async (
    assignment: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>, 
    questionIds?: string[]
  ): Promise<{ success: boolean; error?: string }> => {
    const asgId = generateUUID();
    const resolvedClassIds = Array.isArray(assignment.class_ids) && assignment.class_ids.length > 0
      ? assignment.class_ids
      : (assignment.class_id ? [assignment.class_id] : (classes[0]?.id ? [classes[0].id] : []));
    // Pastikan primaryClassId selalu berisi UUID kelas pertama agar tidak melanggar NOT NULL constraint di kolom class_id tabel assignments
    const primaryClassId =
      resolvedClassIds.find(id => isValidUUID(id)) ||
      (isValidUUID(assignment.class_id) ? assignment.class_id : null) ||
      classes.find(c => isValidUUID(c.id))?.id ||
      resolvedClassIds[0] ||
      null;
    const cleanDescription = (assignment.description || '').replace(/^(\[(KELAS|PAKET):[^\]]+\]\s*)+/, '').trim();

    const created: Assignment = {
      ...assignment,
      id: asgId,
      description: cleanDescription,
      class_id: primaryClassId,
      class_ids: resolvedClassIds,
      question_ids: questionIds || [],
      question_count: questionIds?.length || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const dueDateVal = assignment.due_date || (assignment as any).end_time || new Date(Date.now() + 86400000 * 7).toISOString();
        const encodedDescription = encodeAssignmentDescription(
          resolvedClassIds,
          assignment.category_name,
          cleanDescription
        );
        const basePayload: Record<string, any> = {
          id: asgId,
          title: assignment.title,
          description: encodedDescription,
          type: assignment.type,
          subject_id: isValidUUID(assignment.subject_id) ? assignment.subject_id : null,
          class_id: isValidUUID(primaryClassId) ? primaryClassId : null,
          duration_minutes: assignment.duration_minutes,
          total_points: assignment.total_points,
          is_active: assignment.is_active ?? true,
        };

        // Coba masukkan dengan kolom due_date dan start_time terlebih dahulu
        let insertData: Record<string, any> = {
          ...basePayload,
          start_time: assignment.start_time || new Date().toISOString(),
          due_date: dueDateVal,
        };

        let { error } = await supabase.from('assignments').insert([insertData]);

        // Fallback jika kolom due_date belum ada di database, gunakan end_time
        if (error && (error.message?.includes('due_date') || error.message?.includes("'due_date'"))) {
          insertData = {
            ...basePayload,
            start_time: assignment.start_time || new Date().toISOString(),
            end_time: dueDateVal,
          };
          const retry = await supabase.from('assignments').insert([insertData]);
          error = retry.error;

          // Jika end_time atau start_time juga tidak ada di schema tabel, gunakan payload minimal
          if (error && (error.message?.includes('end_time') || error.message?.includes('start_time'))) {
            insertData = { ...basePayload };
            const retryMinimal = await supabase.from('assignments').insert([insertData]);
            error = retryMinimal.error;
          }
        } else if (error && error.message?.includes('start_time')) {
          delete insertData.start_time;
          const retry = await supabase.from('assignments').insert([insertData]);
          error = retry.error;
        }

        if (error) {
          console.error('Error adding assignment in Supabase:', error);
          return { success: false, error: error.message };
        }

        if (questionIds && questionIds.length > 0) {
          const validQuestionIds = questionIds.filter(qid => isValidUUID(qid));
          if (validQuestionIds.length > 0) {
            const rows = validQuestionIds.map((qid, idx) => ({
              id: generateUUID(),
              assignment_id: asgId,
              question_id: qid,
              order_index: idx + 1,
            }));
            try {
              await supabase.from('assignment_questions').insert(rows);
            } catch (e) {
              console.warn('Notice inserting assignment_questions:', e);
            }
          }
        }
      } catch (e: any) {
        console.error('Exception adding assignment:', e);
        return { success: false, error: e.message };
      }
    }

    setAssignments(prev => [created, ...prev]);
    return { success: true };
  };

  const updateAssignment = async (
    id: string, 
    updated: Partial<Assignment>, 
    questionIds?: string[]
  ): Promise<{ success: boolean; error?: string }> => {
    const existingAsg = assignments.find(a => a.id === id);
    const nextClassIds = updated.class_ids !== undefined
      ? updated.class_ids
      : (updated.class_id !== undefined
          ? (updated.class_id ? [updated.class_id] : [])
          : (existingAsg?.class_ids || (existingAsg?.class_id ? [existingAsg.class_id] : [])));
    // Pastikan nextPrimaryClassId selalu berisi UUID kelas pertama agar tidak melanggar NOT NULL constraint di kolom class_id tabel assignments
    const nextPrimaryClassId =
      nextClassIds.find(id => isValidUUID(id)) ||
      (isValidUUID(updated.class_id) ? updated.class_id : null) ||
      (isValidUUID(existingAsg?.class_id) ? existingAsg?.class_id : null) ||
      classes.find(c => isValidUUID(c.id))?.id ||
      nextClassIds[0] ||
      null;
    const nextCategory = updated.category_name !== undefined ? updated.category_name : existingAsg?.category_name;
    const nextCleanDesc = updated.description !== undefined
      ? (updated.description || '').replace(/^(\[(KELAS|PAKET):[^\]]+\]\s*)+/, '').trim()
      : (existingAsg?.description || '');

    if (isSupabaseConfigured && isValidUUID(id)) {
      try {
        const payload: Record<string, any> = {};
        if (updated.title !== undefined) payload.title = updated.title;
        if (updated.description !== undefined || updated.class_ids !== undefined || updated.category_name !== undefined) {
          payload.description = encodeAssignmentDescription(nextClassIds, nextCategory, nextCleanDesc);
        }
        if (updated.type !== undefined) payload.type = updated.type;
        if (updated.is_active !== undefined) payload.is_active = updated.is_active;
        if (updated.duration_minutes !== undefined) payload.duration_minutes = updated.duration_minutes;
        if (updated.total_points !== undefined) payload.total_points = updated.total_points;
        payload.class_id = isValidUUID(nextPrimaryClassId) ? nextPrimaryClassId : null;
        if (updated.subject_id !== undefined) payload.subject_id = isValidUUID(updated.subject_id) ? updated.subject_id : null;

        if (updated.due_date !== undefined) {
          payload.due_date = updated.due_date;
        }

        let { error } = await supabase.from('assignments').update(payload).eq('id', id);

        // Fallback jika kolom due_date belum ada di database, gunakan end_time
        if (error && (error.message?.includes('due_date') || error.message?.includes("'due_date'"))) {
          delete payload.due_date;
          if (updated.due_date !== undefined) {
            payload.end_time = updated.due_date;
          }
          const retry = await supabase.from('assignments').update(payload).eq('id', id);
          error = retry.error;

          if (error && error.message?.includes('end_time')) {
            delete payload.end_time;
            const retryMinimal = await supabase.from('assignments').update(payload).eq('id', id);
            error = retryMinimal.error;
          }
        }

        if (error) {
          console.error('Error updating assignment in Supabase:', error);
          return { success: false, error: error.message };
        }

        // Sinkronkan relasi butir soal jika ada
        if (questionIds && Array.isArray(questionIds)) {
          const validQuestionIds = questionIds.filter(qid => isValidUUID(qid));
          try {
            await supabase.from('assignment_questions').delete().eq('assignment_id', id);
            if (validQuestionIds.length > 0) {
              const rows = validQuestionIds.map((qid, idx) => ({
                id: generateUUID(),
                assignment_id: id,
                question_id: qid,
                order_index: idx + 1,
              }));
              await supabase.from('assignment_questions').insert(rows);
            }
          } catch (e) {
            console.warn('Notice updating assignment_questions:', e);
          }
        }
      } catch (e: any) {
        console.error('Exception updating assignment:', e);
        return { success: false, error: e.message };
      }
    }

    setAssignments(prev => prev.map(a => {
      if (a.id === id) {
        return {
          ...a,
          ...updated,
          description: nextCleanDesc,
          class_id: nextPrimaryClassId,
          class_ids: nextClassIds,
          category_name: nextCategory,
          question_ids: questionIds !== undefined ? questionIds : a.question_ids,
          question_count: questionIds !== undefined ? questionIds.length : a.question_count,
          updated_at: new Date().toISOString(),
        };
      }
      return a;
    }));
    return { success: true };
  };

  const deleteAssignment = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured && isValidUUID(id)) {
      try {
        // Cascade cleanup child grades, submissions, and assignment questions
        await supabase.from('grades').delete().eq('assignment_id', id);
        await supabase.from('submissions').delete().eq('assignment_id', id);
        await supabase.from('assignment_questions').delete().eq('assignment_id', id);

        const { error } = await supabase.from('assignments').delete().eq('id', id);
        if (error) {
          console.error('Error deleting assignment in Supabase:', error);
          return { success: false, error: error.message };
        }
      } catch (e: any) {
        console.error('Exception deleting assignment:', e);
        return { success: false, error: e.message };
      }
    }

    setAssignments(prev => prev.filter(a => a.id !== id));
    return { success: true };
  };

  // ==========================================
  // SUBMISSIONS & PENILAIAN CRUD
  // ==========================================
  const submitAssignment = async (
    assignmentId: string,
    studentId: string,
    answers: Record<string, { answer_text?: string; selected_option_id?: string; file_url?: string }>,
    studentNotes?: string,
    fileUrls?: string[]
  ): Promise<{ success: boolean; error?: string }> => {
    const asg = assignments.find(a => a.id === assignmentId);
    const asgQuestions = asg
      ? (asg.question_ids && asg.question_ids.length > 0
          ? questions.filter(q => asg.question_ids!.includes(q.id))
          : questions.filter(q => q.subject_id === asg.subject_id))
      : questions;

    let autoScore = 0;
    let hasEssay = false;
    const nowIso = new Date().toISOString();
    const existingSub = submissions.find(
      s => s.assignment_id === assignmentId && s.student_id === studentId
    );
    const existingGrade = grades.find(
      g => g.assignment_id === assignmentId && g.student_id === studentId
    );

    // Jika sudah dinilai oleh guru, kunci jawaban agar tidak bisa diubah lagi
    if (existingSub && (existingSub.status === 'graded' || existingGrade)) {
      return {
        success: false,
        error: 'Jawaban sudah dinilai oleh guru dan tidak dapat diubah kembali.',
      };
    }

    const subId = existingSub ? existingSub.id : generateUUID();
    const submissionAnswersList: SubmissionAnswer[] = [];
    const essaySummaries: string[] = [];

    asgQuestions.forEach((q, idx) => {
      if (q.question_type === 'essay') {
        hasEssay = true;
      }
      const ans = answers[q.id];
      let questionScore: number | null = 0;

      if (ans) {
        if (q.question_type === 'multiple_choice' || q.question_type === 'true_false') {
          const correctOpt = q.options?.find(o => o.is_correct);
          if (correctOpt && ans.selected_option_id === correctOpt.id) {
            questionScore = Number(q.points);
            autoScore += Number(q.points);
          } else {
            questionScore = 0;
          }
        } else if (q.question_type === 'short_answer') {
          if (
            q.short_answer_key &&
            ans.answer_text?.trim().toLowerCase() === q.short_answer_key.trim().toLowerCase()
          ) {
            questionScore = Number(q.points);
            autoScore += Number(q.points);
          } else {
            questionScore = 0;
          }
          if (ans.answer_text && ans.answer_text.trim()) {
            essaySummaries.push(`No.${idx + 1} (Isian): ${ans.answer_text.trim()}`);
          }
        } else if (q.question_type === 'essay') {
          questionScore = null;
          if (ans.answer_text && ans.answer_text.trim()) {
            essaySummaries.push(`No.${idx + 1} (Esai): ${ans.answer_text.trim()}`);
          }
        }

        submissionAnswersList.push({
          id: generateUUID(),
          submission_id: subId,
          question_id: q.id,
          selected_option_id: ans.selected_option_id || null,
          answer_text: ans.answer_text || null,
          file_url: ans.file_url || null,
          score: questionScore,
          teacher_comment: null,
          created_at: nowIso,
        });
      } else if (q.question_type === 'essay' || q.question_type === 'short_answer') {
        submissionAnswersList.push({
          id: generateUUID(),
          submission_id: subId,
          question_id: q.id,
          selected_option_id: null,
          answer_text: '',
          file_url: null,
          score: q.question_type === 'essay' ? null : 0,
          teacher_comment: null,
          created_at: nowIso,
        });
      }
    });

    const isQuiz = asg?.type === 'quiz';
    const status = hasEssay || !isQuiz ? 'submitted' : 'graded';

    const resolvedCleanNotes =
      studentNotes && studentNotes.trim()
        ? studentNotes.trim()
        : essaySummaries.length > 0
        ? essaySummaries.join(' | ')
        : null;

    const newSub: Submission = {
      id: subId,
      assignment_id: assignmentId,
      student_id: studentId,
      started_at: nowIso,
      submitted_at: nowIso,
      status: status,
      total_score: status === 'graded' ? autoScore : (autoScore > 0 ? autoScore : null),
      file_urls: fileUrls || null,
      student_notes: resolvedCleanNotes,
      teacher_feedback: status === 'graded' ? 'Penilaian otomatis sistem selesai.' : null,
      graded_by: status === 'graded' ? 'system' : null,
      graded_at: status === 'graded' ? nowIso : null,
      created_at: nowIso,
      updated_at: nowIso,
      answers: submissionAnswersList,
    };

    setSubmissions(prev => [newSub, ...prev.filter(s => !(s.assignment_id === assignmentId && s.student_id === studentId))]);

    if (status === 'graded') {
      const studentObj = students.find(s => s.id === studentId);
      const gradeId = generateUUID();
      const newGrade: Grade = {
        id: gradeId,
        student_id: studentId,
        class_id: studentObj?.class_id || '',
        subject_id: asg?.subject_id || '',
        assignment_id: assignmentId,
        submission_id: subId,
        score: autoScore,
        max_score: asg?.total_points || 100,
        feedback: 'Dinilai secara otomatis oleh sistem.',
        is_published: true,
        published_at: nowIso,
        created_at: nowIso,
      };
      setGrades(prev => [newGrade, ...prev.filter(g => !(g.assignment_id === assignmentId && g.student_id === studentId))]);

      if (isSupabaseConfigured && isValidUUID(assignmentId) && isValidUUID(studentId)) {
        try {
          await supabase.from('grades').insert([{
            id: gradeId,
            student_id: studentId,
            class_id: isValidUUID(studentObj?.class_id) ? studentObj?.class_id : null,
            subject_id: isValidUUID(asg?.subject_id) ? asg?.subject_id : null,
            assignment_id: assignmentId,
            submission_id: subId,
            score: autoScore,
            max_score: asg?.total_points || 100,
            feedback: 'Dinilai secara otomatis oleh sistem.',
            is_published: true,
          }]);
        } catch (e) {
          console.warn('Notice inserting grade:', e);
        }
      }
    }

    if (isSupabaseConfigured && isValidUUID(assignmentId) && isValidUUID(studentId)) {
      try {
        const encodedNotes = encodeSubmissionNotes(resolvedCleanNotes, submissionAnswersList);
        const { error } = await supabase.from('submissions').upsert([{
          id: subId,
          assignment_id: assignmentId,
          student_id: studentId,
          submitted_at: nowIso,
          status: status,
          total_score: status === 'graded' ? autoScore : (autoScore > 0 ? autoScore : null),
          student_notes: encodedNotes,
          file_urls: fileUrls || null,
        }], { onConflict: 'assignment_id,student_id' });

        if (error) {
          console.error('Error submitting to Supabase:', error);
          return { success: false, error: error.message };
        }

        // Simpan juga ke tabel submission_answers untuk setiap soal
        if (submissionAnswersList.length > 0) {
          const validRows = submissionAnswersList
            .filter(sa => isValidUUID(sa.question_id))
            .map(sa => ({
              id: sa.id,
              submission_id: subId,
              question_id: sa.question_id,
              selected_option_id: isValidUUID(sa.selected_option_id) ? sa.selected_option_id : null,
              student_answer_text: sa.answer_text || null,
              file_url: sa.file_url || null,
              score: sa.score ?? 0,
            }));

          if (validRows.length > 0) {
            await supabase.from('submission_answers').upsert(validRows, {
              onConflict: 'submission_id,question_id',
            });
          }
        }
      } catch (e: any) {
        console.error('Exception submitting assignment:', e);
        return { success: false, error: e.message };
      }
    }

    return { success: true };
  };

  const gradeSubmission = async (
    submissionId: string,
    totalScore: number,
    feedback: string,
    _itemScores?: Record<string, { score: number; comment?: string }>
  ): Promise<{ success: boolean; error?: string }> => {
    const existingSub = submissions.find(s => s.id === submissionId);
    const nowIso = new Date().toISOString();

    const updatedSub: Submission | undefined = existingSub
      ? {
          ...existingSub,
          total_score: totalScore,
          teacher_feedback: feedback,
          status: 'graded',
          graded_by: 'p-admin',
          graded_at: nowIso,
          updated_at: nowIso,
        }
      : undefined;

    setSubmissions(prev =>
      prev.map(s => (s.id === submissionId && updatedSub ? updatedSub : s))
    );

    if (updatedSub) {
      const sub = updatedSub;
      const asg = assignments.find(a => a.id === sub.assignment_id);
      const studentObj = students.find(s => s.id === sub.student_id);
      const existingGrade = grades.find(
        g => g.assignment_id === sub.assignment_id && g.student_id === sub.student_id
      );
      const gradeId = existingGrade?.id || generateUUID();

      const newGrade: Grade = {
        id: gradeId,
        student_id: sub.student_id,
        class_id: studentObj?.class_id || '',
        subject_id: asg?.subject_id || '',
        assignment_id: sub.assignment_id,
        submission_id: sub.id,
        score: totalScore,
        max_score: asg?.total_points || 100,
        feedback: feedback,
        is_published: true,
        published_at: nowIso,
        created_at: existingGrade?.created_at || nowIso,
      };

      setGrades(prev => [
        newGrade,
        ...prev.filter(g => !(g.assignment_id === sub.assignment_id && g.student_id === sub.student_id)),
      ]);

      if (isSupabaseConfigured && isValidUUID(submissionId)) {
        try {
          await supabase.from('submissions').update({
            total_score: totalScore,
            teacher_feedback: feedback,
            status: 'graded',
            graded_at: nowIso,
          }).eq('id', submissionId);

          if (isValidUUID(sub.student_id) && isValidUUID(sub.assignment_id)) {
            await supabase.from('grades').upsert([{
              id: gradeId,
              student_id: sub.student_id,
              class_id: isValidUUID(studentObj?.class_id) ? studentObj?.class_id : null,
              subject_id: isValidUUID(asg?.subject_id) ? asg?.subject_id : null,
              assignment_id: sub.assignment_id,
              submission_id: sub.id,
              score: totalScore,
              max_score: asg?.total_points || 100,
              feedback: feedback,
              is_published: true,
            }]);
          }
        } catch (e: any) {
          console.error('Exception grading submission in Supabase:', e);
          return { success: false, error: e.message };
        }
      }
    }
    return { success: true };
  };

  const gradeStudentAssignment = async (
    studentId: string,
    assignmentId: string,
    totalScore: number,
    feedback: string
  ): Promise<{ success: boolean; error?: string }> => {
    const existingSub = submissions.find(
      s => s.student_id === studentId && s.assignment_id === assignmentId
    );
    if (existingSub) {
      return gradeSubmission(existingSub.id, totalScore, feedback);
    }

    const nowIso = new Date().toISOString();
    const subId = generateUUID();
    const asg = assignments.find(a => a.id === assignmentId);
    const studentObj = students.find(s => s.id === studentId);
    const existingGrade = grades.find(
      g => g.assignment_id === assignmentId && g.student_id === studentId
    );
    const gradeId = existingGrade?.id || generateUUID();

    const newSub: Submission = {
      id: subId,
      assignment_id: assignmentId,
      student_id: studentId,
      started_at: nowIso,
      submitted_at: nowIso,
      status: 'graded',
      total_score: totalScore,
      student_notes: 'Penilaian langsung oleh guru.',
      file_urls: null,
      teacher_feedback: feedback,
      graded_by: 'p-admin',
      graded_at: nowIso,
      created_at: nowIso,
      updated_at: nowIso,
    };

    const newGrade: Grade = {
      id: gradeId,
      student_id: studentId,
      class_id: studentObj?.class_id || '',
      subject_id: asg?.subject_id || '',
      assignment_id: assignmentId,
      submission_id: subId,
      score: totalScore,
      max_score: asg?.total_points || 100,
      feedback: feedback,
      is_published: true,
      published_at: nowIso,
      created_at: existingGrade?.created_at || nowIso,
    };

    setSubmissions(prev => [
      newSub,
      ...prev.filter(s => !(s.assignment_id === assignmentId && s.student_id === studentId)),
    ]);
    setGrades(prev => [
      newGrade,
      ...prev.filter(g => !(g.assignment_id === assignmentId && g.student_id === studentId)),
    ]);

    if (isSupabaseConfigured && isValidUUID(studentId) && isValidUUID(assignmentId)) {
      try {
        await supabase.from('submissions').insert([{
          id: subId,
          assignment_id: assignmentId,
          student_id: studentId,
          submitted_at: nowIso,
          status: 'graded',
          total_score: totalScore,
          student_notes: 'Penilaian langsung oleh guru.',
          teacher_feedback: feedback,
          graded_at: nowIso,
        }]);

        await supabase.from('grades').upsert([{
          id: gradeId,
          student_id: studentId,
          class_id: isValidUUID(studentObj?.class_id) ? studentObj?.class_id : null,
          subject_id: isValidUUID(asg?.subject_id) ? asg?.subject_id : null,
          assignment_id: assignmentId,
          submission_id: subId,
          score: totalScore,
          max_score: asg?.total_points || 100,
          feedback: feedback,
          is_published: true,
        }]);
      } catch (e: any) {
        console.warn('Notice saving manual grade to Supabase:', e);
      }
    }

    return { success: true };
  };

  const deleteSubmission = async (
    submissionId: string
  ): Promise<{ success: boolean; error?: string }> => {
    const targetSub = submissions.find(s => s.id === submissionId);

    // Hapus dari state lokal (otomatis tersimpan ke localStorage dan memunculkan kembali soal di siswa)
    setSubmissions(prev => prev.filter(s => s.id !== submissionId));
    if (targetSub) {
      setGrades(prev =>
        prev.filter(
          g =>
            g.submission_id !== submissionId &&
            !(g.student_id === targetSub.student_id && g.assignment_id === targetSub.assignment_id)
        )
      );
    } else {
      setGrades(prev => prev.filter(g => g.submission_id !== submissionId));
    }

    // Hapus dari Supabase jika terkoneksi
    if (isSupabaseConfigured) {
      try {
        if (isValidUUID(submissionId)) {
          await supabase.from('submission_answers').delete().eq('submission_id', submissionId);
          await supabase.from('grades').delete().eq('submission_id', submissionId);
          await supabase.from('submissions').delete().eq('id', submissionId);
        }
        if (targetSub && isValidUUID(targetSub.student_id) && isValidUUID(targetSub.assignment_id)) {
          await supabase
            .from('grades')
            .delete()
            .eq('student_id', targetSub.student_id)
            .eq('assignment_id', targetSub.assignment_id);
          await supabase
            .from('submissions')
            .delete()
            .eq('student_id', targetSub.student_id)
            .eq('assignment_id', targetSub.assignment_id);
        }
      } catch (e: any) {
        console.warn('Notice deleting submission from Supabase:', e);
      }
    }

    return { success: true };
  };

  // ==========================================
  // ANNOUNCEMENTS CRUD
  // ==========================================
  const addAnnouncement = async (announcement: Omit<Announcement, 'id' | 'created_at'>): Promise<{ success: boolean; error?: string }> => {
    const annId = generateUUID();
    const created: Announcement = {
      ...announcement,
      id: annId,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('announcements').insert([{
          id: annId,
          title: announcement.title,
          content: announcement.content,
          target_role: announcement.target_role || 'all',
          class_id: isValidUUID(announcement.class_id) ? announcement.class_id : null,
          is_active: announcement.is_active ?? true,
        }]);
        if (error) {
          console.error('Error adding announcement to Supabase:', error);
          return { success: false, error: error.message };
        }
      } catch (e: any) {
        console.error('Exception adding announcement:', e);
        return { success: false, error: e.message };
      }
    }

    setAnnouncements(prev => [created, ...prev]);
    return { success: true };
  };

  const deleteAnnouncement = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured && isValidUUID(id)) {
      try {
        const { error } = await supabase.from('announcements').delete().eq('id', id);
        if (error) {
          console.error('Error deleting announcement from Supabase:', error);
          return { success: false, error: error.message };
        }
      } catch (e: any) {
        console.error('Exception deleting announcement:', e);
        return { success: false, error: e.message };
      }
    }

    setAnnouncements(prev => prev.filter(a => a.id !== id));
    return { success: true };
  };

  const clearLocalCache = async () => {
    localStorage.removeItem('nexora_classes');
    localStorage.removeItem('nexora_subjects');
    localStorage.removeItem('nexora_students');
    localStorage.removeItem('nexora_materials');
    localStorage.removeItem('nexora_questions');
    localStorage.removeItem('nexora_assignments');
    localStorage.removeItem('nexora_submissions');
    localStorage.removeItem('nexora_grades');
    localStorage.removeItem('nexora_announcements');
    await fetchSupabaseData();
  };

  return (
    <DataContext.Provider
      value={{
        siteSettings,
        updateSiteSettings,
        classes,
        addClass,
        updateClass,
        deleteClass,
        subjects,
        addSubject,
        updateSubject,
        deleteSubject,
        students,
        addStudent,
        updateStudent,
        deleteStudent,
        materials,
        addMaterial,
        updateMaterial,
        deleteMaterial,
        markMaterialComplete,
        isMaterialCompleted,
        completedMaterialsMap,
        questions,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        duplicateQuestion,
        assignments,
        addAssignment,
        updateAssignment,
        deleteAssignment,
        submissions,
        submitAssignment,
        gradeSubmission,
        gradeStudentAssignment,
        deleteSubmission,
        grades,
        announcements,
        addAnnouncement,
        deleteAnnouncement,
        isLoading,
        supabaseStatus,
        supabaseError,
        retrySupabaseConnection,
        clearLocalCache,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};
