import React from 'react';
import { ChevronLeft, ChevronRight, ListFilter } from 'lucide-react';
import { CustomCombobox } from './CustomCombobox';

export interface TablePaginationBarProps {
  totalItems: number;
  pageSize: number; // 0 means 'Semua' (All)
  currentPage: number;
  onPageSizeChange: (newSize: number) => void;
  onPageChange: (newPage: number) => void;
  itemLabel?: string;
  pageSizeOptions?: number[];
}

export const TablePaginationBar: React.FC<TablePaginationBarProps> = ({
  totalItems,
  pageSize,
  currentPage,
  onPageSizeChange,
  onPageChange,
  itemLabel = 'data',
  pageSizeOptions = [5, 10, 25, 50, 100],
}) => {
  const effectivePageSize = pageSize <= 0 ? Math.max(1, totalItems) : pageSize;
  const totalPages = Math.max(1, Math.ceil(totalItems / effectivePageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = totalItems === 0 ? 0 : (safePage - 1) * effectivePageSize + 1;
  const endIndex = totalItems === 0 ? 0 : Math.min(totalItems, safePage * effectivePageSize);

  const comboboxOptions = [
    ...pageSizeOptions.map((opt) => ({
      value: opt,
      label: `${opt} Baris`,
    })),
    {
      value: 0,
      label: `Semua Data (${totalItems})`,
    },
  ];

  // Build visible page numbers
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, safePage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
      {/* Left: Page Size Custom Combobox & Range Info */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-52">
          <CustomCombobox
            size="sm"
            icon={<ListFilter className="w-3.5 h-3.5" />}
            prefixLabel="Tampilkan:"
            value={pageSize}
            options={comboboxOptions}
            searchable={false}
            onChange={(val) => {
              onPageSizeChange(Number(val));
              onPageChange(1);
            }}
          />
        </div>

        <span className="text-slate-500 font-medium">
          Menampilkan{' '}
          <strong className="text-slate-900 font-extrabold">
            {startIndex}&ndash;{endIndex}
          </strong>{' '}
          dari <strong className="text-slate-900 font-extrabold">{totalItems}</strong> {itemLabel}
        </span>
      </div>

      {/* Right: Page Navigation Buttons */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1 self-end sm:self-auto">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
            className="p-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Halaman Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {getPageNumbers().map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`min-w-[30px] h-7 px-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                p === safePage
                  ? 'bg-[#3b5bf5] text-white shadow-sm shadow-blue-500/25'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80'
              }`}
            >
              {p}
            </button>
          ))}

          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(safePage + 1)}
            className="p-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Halaman Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export function paginateArray<T>(items: T[], pageSize: number, currentPage: number): T[] {
  if (pageSize <= 0) return items;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const start = (safePage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}
