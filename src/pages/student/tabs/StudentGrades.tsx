import React, { useState } from 'react';
import { Award, TrendingUp, BookOpen, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { TablePaginationBar, paginateArray } from '../../../components/TablePaginationBar';

export const StudentGrades: React.FC = () => {
  const { currentStudent } = useAuth();
  const { grades, assignments, subjects } = useData();
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const myGrades = grades.filter(g => g.student_id === currentStudent?.id && g.is_published);
  const paginatedGrades = paginateArray(myGrades, pageSize, currentPage);

  const averageScore = myGrades.length > 0
    ? (myGrades.reduce((acc, curr) => acc + Number(curr.score), 0) / myGrades.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-slate-900">Transkrip Nilai & Laporan Akademik</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Nilai resmi yang telah diperiksa dan dipublikasikan oleh guru pengajar
        </p>
      </div>

      {/* Summary Score Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#2a45d4] to-[#3b5bf5] flex items-center justify-center text-white shadow-md shadow-blue-500/25">
            <Award className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Rata-Rata Nilai Keseluruhan</span>
            <p className="text-3xl font-extrabold text-slate-900 mt-0.5">{averageScore} / 100</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#0fa868] font-bold bg-[#1cd485]/15 px-3.5 py-2 rounded-2xl">
          <CheckCircle2 className="w-4 h-4" />
          <span>{myGrades.length} Evaluasi Selesai</span>
        </div>
      </div>

      {/* Filter Banyaknya Data yang Ditampilkan */}
      <TablePaginationBar
        totalItems={myGrades.length}
        pageSize={pageSize}
        currentPage={currentPage}
        onPageSizeChange={setPageSize}
        onPageChange={setCurrentPage}
        itemLabel="nilai evaluasi"
      />

      {/* Grades Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-5">Tugas / Kuis</th>
                <th className="py-3.5 px-4">Mata Pelajaran</th>
                <th className="py-3.5 px-4">Skor / Nilai</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5">Catatan & Ulasan Guru</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myGrades.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    Belum ada nilai yang dipublikasikan oleh guru.
                  </td>
                </tr>
              ) : (
                paginatedGrades.map((gr) => {
                  const asg = assignments.find(a => a.id === gr.assignment_id);
                  const subject = subjects.find(s => s.id === gr.subject_id);

                  return (
                    <tr key={gr.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-900">
                        {asg?.title || 'Tugas Evaluasi'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {subject?.name || 'Mata Pelajaran'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                          gr.score >= 80 ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                          gr.score >= 70 ? 'bg-blue-50 text-[#3b5bf5] border border-blue-200' :
                          'bg-amber-50 text-amber-600 border border-amber-200'
                        }`}>
                          {gr.score} / {gr.max_score}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-bold border border-emerald-200">
                          Terbit
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-600 italic">
                        {gr.feedback || 'Hasil pengerjaan Anda sangat memuaskan.'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
