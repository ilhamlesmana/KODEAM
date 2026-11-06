import React from 'react';
import { BookOpen, ChevronRight, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';

interface StudentSubjectsProps {
  onNavigate: (tab: string) => void;
}

export const StudentSubjects: React.FC<StudentSubjectsProps> = ({ onNavigate }) => {
  const { currentStudent } = useAuth();
  const { subjects, materials, assignments, classes } = useData();

  const studentClass = classes.find(c => c.id === currentStudent?.class_id);

  const mySubjects = subjects.filter((sub) => {
    if (!currentStudent?.class_id) return true;
    if (!sub.class_ids || sub.class_ids.length === 0) return true;
    return sub.class_ids.includes(currentStudent.class_id);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Mata Pelajaran Kelas Saya</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {studentClass ? `Kurikulum resmi untuk ${studentClass.name}` : 'Pilih mata pelajaran untuk mengakses modul materi, tugas, dan latihan'}
          </p>
        </div>
        {studentClass && (
          <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#3b5bf5] text-xs font-semibold">
            Kelas: {studentClass.name}
          </span>
        )}
      </div>

      {mySubjects.length === 0 ? (
        <div className="bg-white p-10 rounded-3xl border border-slate-200/80 shadow-sm text-center space-y-3">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="text-base font-bold text-slate-900">Belum Ada Mata Pelajaran untuk Kelas Anda</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Guru pengajar belum menautkan mata pelajaran ke {studentClass?.name || 'kelas Anda'}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {mySubjects.map((sub) => {
            const subjectMaterials = materials.filter(m => m.subject_id === sub.id && (!m.class_id || m.class_id === currentStudent?.class_id));
            const subjectAssignments = assignments.filter(a => a.subject_id === sub.id && (!a.class_id || a.class_id === currentStudent?.class_id));

            return (
              <div
                key={sub.id}
                className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm flex flex-col justify-between group hover:shadow-md hover:border-[#3b5bf5]/30 transition-all"
              >
                <div>
                  <div className="h-40 w-full relative bg-slate-100 overflow-hidden">
                    <img
                      src={sub.cover_image_url || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=800'}
                      alt={sub.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                    <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-lg bg-white/90 backdrop-blur-md text-[11px] font-mono font-bold text-slate-900 shadow-sm">
                      {sub.code}
                    </span>
                  </div>

                  <div className="p-5">
                    <h4 className="text-base font-bold text-slate-900 mb-1.5">{sub.name}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                      {sub.description || 'Kurikulum terpadu mata pelajaran.'}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-slate-400 pt-3 border-t border-slate-100">
                      <span>{subjectMaterials.length} Materi</span>
                      <span>&bull;</span>
                      <span>{subjectAssignments.length} Tugas & Kuis</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <button
                    onClick={() => onNavigate('materials')}
                    className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-[#3b5bf5] text-slate-700 hover:text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 border border-slate-200 hover:border-transparent"
                  >
                    <span>Buka Materi Pembelajaran</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
