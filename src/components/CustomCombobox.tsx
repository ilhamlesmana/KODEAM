import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface ComboboxOption {
  value: string | number;
  label: string;
  badge?: string | number;
  description?: string;
  icon?: React.ReactNode;
}

export interface CustomComboboxProps {
  value: string | number;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  icon?: React.ReactNode;
  prefixLabel?: string;
  size?: 'sm' | 'md';
  searchable?: boolean;
  className?: string;
  disabled?: boolean;
  align?: 'left' | 'right';
}

export const CustomCombobox: React.FC<CustomComboboxProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Pilih opsi...',
  icon,
  prefixLabel,
  size = 'md',
  searchable,
  className = '',
  disabled = false,
  align = 'left',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(
    () => options.find((opt) => String(opt.value) === String(value)),
    [options, value]
  );

  // Tampilkan kolom pencarian otomatis jika opsi lebih dari 6 atau searchable=true
  const showSearch = searchable ?? options.length > 6;

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.description && opt.description.toLowerCase().includes(q)) ||
        (opt.badge !== undefined && String(opt.badge).toLowerCase().includes(q))
    );
  }, [options, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      if (showSearch) {
        setTimeout(() => searchInputRef.current?.focus(), 40);
      }
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, showSearch]);

  const handleSelect = (optValue: string | number) => {
    onChange(String(optValue));
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 text-left transition-all duration-200 select-none cursor-pointer ${
          size === 'sm'
            ? 'px-3 py-1.5 rounded-xl text-xs'
            : 'px-3.5 py-2.5 rounded-2xl text-xs'
        } ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-slate-100 border border-slate-200 text-slate-400'
            : isOpen
            ? 'bg-white border-[#3b5bf5] ring-4 ring-[#3b5bf5]/15 text-slate-900 shadow-sm border'
            : 'bg-slate-50/90 hover:bg-white border border-slate-200/90 hover:border-[#3b5bf5]/50 text-slate-800 hover:shadow-xs'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {icon && (
            <span
              className={`shrink-0 transition-colors ${
                isOpen ? 'text-[#3b5bf5]' : 'text-slate-400'
              }`}
            >
              {icon}
            </span>
          )}

          {prefixLabel && (
            <span className="text-slate-400 font-bold shrink-0">{prefixLabel}</span>
          )}

          <span
            className={`truncate ${
              selectedOption
                ? 'font-extrabold text-slate-800'
                : 'font-medium text-slate-400'
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>

          {selectedOption?.badge !== undefined && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-[#3b5bf5] border border-blue-200/60 shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <span
          className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${
            isOpen
              ? 'bg-[#3b5bf5] text-white rotate-180 shadow-xs'
              : 'bg-slate-200/70 text-slate-500 group-hover:bg-blue-50 group-hover:text-[#3b5bf5]'
          }`}
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </span>
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          className={`absolute z-50 mt-2 min-w-[210px] w-full bg-white rounded-2xl border border-slate-200/90 shadow-2xl shadow-slate-900/15 p-1.5 animate-in fade-in zoom-in-95 duration-150 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {/* Optional Search Input inside Combobox */}
          {showSearch && (
            <div className="p-1.5 pb-2 mb-1 border-b border-slate-100">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari pilihan..."
                  className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#3b5bf5] focus:bg-white"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 p-0.5 rounded-md text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto space-y-0.5 pr-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-4 px-3 text-center text-xs text-slate-400 font-medium">
                Tidak ada opsi yang cocok
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#3b5bf5] to-indigo-600 text-white font-extrabold shadow-sm shadow-blue-500/20'
                        : 'text-slate-700 hover:bg-blue-50/70 hover:text-[#3b5bf5] font-semibold'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                        <span className="truncate">{opt.label}</span>
                      </div>
                      {opt.description && (
                        <p
                          className={`text-[10px] truncate mt-0.5 ${
                            isSelected ? 'text-blue-100' : 'text-slate-400 font-normal'
                          }`}
                        >
                          {opt.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.badge !== undefined && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
