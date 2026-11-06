import { 
  SiteSettings, 
  ClassItem, 
  Subject, 
  LearningMaterial, 
  Question, 
  Assignment, 
  Student, 
  Profile, 
  Submission, 
  Grade, 
  Announcement 
} from '../types/database.types';

// DATA AWAL KOSONG — Murni dari database Supabase (Zero Dummy Data)
export const initialSiteSettings: SiteSettings = {
  id: 1,
  site_name: 'NEXORA',
  tagline: 'Learn Beyond Limits.',
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

export const initialClasses: ClassItem[] = [];
export const initialSubjects: Subject[] = [];
export const initialProfiles: Profile[] = [];
export const initialStudents: Student[] = [];
export const initialMaterials: LearningMaterial[] = [];
export const initialQuestions: Question[] = [];
export const initialAssignments: Assignment[] = [];
export const initialSubmissions: Submission[] = [];
export const initialGrades: Grade[] = [];
export const initialAnnouncements: Announcement[] = [];
