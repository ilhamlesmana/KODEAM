export type UserRole = 'admin' | 'student';
export type AccountStatus = 'active' | 'inactive' | 'suspended';
export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type AssignmentType = 'quiz' | 'assignment';
export type SubmissionStatus = 'in_progress' | 'submitted' | 'graded' | 'late';

export interface Profile {
  id: string;
  username: string | null;
  full_name: string;
  role: UserRole;
  status: AccountStatus;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClassItem {
  id: string;
  name: string;
  level: string;
  academic_year: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  student_count?: number;
}

export interface Student {
  id: string;
  profile_id: string;
  class_id: string | null;
  nis_nisn: string | null;
  gender: string | null;
  address: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  password?: string;
  created_at: string;
  updated_at: string;
  profile?: Profile;
  class?: ClassItem;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string | null;
  cover_image_url: string | null;
  color_accent: string;
  created_at: string;
  updated_at: string;
  class_ids?: string[];
}

export interface ClassSubject {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string | null;
  created_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  class_id: string;
  academic_year: string;
  status: string;
  enrolled_at: string;
}

export interface LearningMaterial {
  id: string;
  subject_id: string;
  class_id: string | null;
  title: string;
  description: string | null;
  content_rich_text: string | null;
  pdf_url: string | null;
  image_url: string | null;
  video_url: string | null;
  order_index: number;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  subject?: Subject;
  class?: ClassItem;
  is_completed?: boolean;
}

export interface MaterialAttachment {
  id: string;
  material_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size_bytes: number | null;
  created_at: string;
}

export interface MaterialCompletion {
  id: string;
  material_id: string;
  student_id: string;
  completed_at: string;
}

export interface QuestionOption {
  id: string;
  question_id?: string;
  option_key?: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

export interface Question {
  id: string;
  subject_id: string;
  class_id: string | null;
  category_name?: string | null;
  question_text: string;
  question_type: QuestionType;
  difficulty: QuestionDifficulty;
  points: number;
  explanation: string | null;
  short_answer_key: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  options?: QuestionOption[];
  subject?: Subject;
  class?: ClassItem;
}

export interface Assignment {
  id: string;
  title: string;
  description: string | null;
  type: AssignmentType;
  subject_id: string;
  class_id: string | null;
  class_ids?: string[];
  category_name?: string | null;
  start_time: string | null;
  due_date: string | null;
  duration_minutes: number | null;
  total_points: number;
  is_active: boolean;
  allow_late?: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  subject?: Subject;
  class?: ClassItem;
  question_count?: number;
  question_ids?: string[];
}

export interface AssignmentQuestion {
  id: string;
  assignment_id: string;
  question_id: string;
  order_index: number;
  question?: Question;
}

export interface SubmissionAnswer {
  id: string;
  submission_id: string;
  question_id: string;
  selected_option_id: string | null;
  answer_text: string | null;
  file_url: string | null;
  score: number | null;
  teacher_comment: string | null;
  created_at: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  started_at: string;
  submitted_at: string | null;
  status: SubmissionStatus;
  total_score: number | null;
  file_urls: string[] | null;
  student_notes: string | null;
  teacher_feedback: string | null;
  graded_by: string | null;
  graded_at: string | null;
  created_at: string;
  updated_at: string;
  student?: Student;
  assignment?: Assignment;
  answers?: SubmissionAnswer[];
}

export interface Grade {
  id: string;
  student_id: string;
  class_id: string;
  subject_id: string;
  assignment_id: string;
  submission_id: string | null;
  score: number;
  max_score: number;
  feedback: string | null;
  is_published: boolean;
  published_at: string;
  created_at: string;
  student?: Student;
  class?: ClassItem;
  subject?: Subject;
  assignment?: Assignment;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  target_role: 'all' | 'admin' | 'student';
  class_id: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface SiteSettings {
  id: number;
  site_name: string;
  tagline: string;
  browser_title?: string;
  logo_url: string | null;
  teacher_name: string;
  teacher_bio: string;
  teacher_photo_url: string | null;
  teacher_commitment?: string;
  teacher_specialty?: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  accent_color: string;
  created_at: string;
  updated_at: string;
}
