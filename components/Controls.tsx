
import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ZoomIn,
  ZoomOut,
  Menu,
  Printer,
  Download,
  Filter,

  User,
  Check,
  Gift,
  X // Added X Icon
} from 'lucide-react';
import { Button } from './Button';
import { CRMCustomer } from '../types';

interface ControlsProps {
  currentPage: number;
  totalPages: number;
  onNext: () => void;
  onPrev: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleSidebar: () => void;
  onPrint: () => void;
  onDownload: () => void;
  onJumpToPage: (page: number) => void;
  zoomLevel: number;
  totalProducts?: number;
  currentFilter: string;
  onFilterChange: (filter: string) => void;

  // Customer Search Props
  customers?: CRMCustomer[];
  onCustomerSelect?: (customer: CRMCustomer | null) => void;
  selectedCustomer?: CRMCustomer | null;
}

export const Controls: React.FC<ControlsProps> = ({
  currentPage,
  totalPages,
  onNext,
  onPrev,
  onZoomIn,
  onZoomOut,
  onToggleSidebar,
  onPrint,
  onDownload,
  onJumpToPage,
  zoomLevel,
  totalProducts: _totalProducts = 0,
  currentFilter,
  onFilterChange,
  customers = [],
  onCustomerSelect,
  selectedCustomer
}) => {
  const [inputPage, setInputPage] = useState(currentPage.toString());
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only update input from prop if NOT focused to avoid fighting with user typing
    if (!isInputFocused) {
      setInputPage(currentPage.toString());
    }
  }, [currentPage, isInputFocused]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setInputPage(value);
    }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsInputFocused(true);
    e.target.select();
  };

  const handleInputBlur = () => {
    setIsInputFocused(false);
    handlePageSubmit();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur(); // This will trigger handleInputBlur -> handlePageSubmit
    }
  };

  const handlePageSubmit = () => {
    let pageNum = parseInt(inputPage, 10);
    if (isNaN(pageNum)) {
      setInputPage(currentPage.toString());
      return;
    }
    if (pageNum < 1) pageNum = 1;
    if (pageNum > totalPages) pageNum = totalPages;

    // Only update if strictly different to avoid unnecessary jumps
    if (pageNum !== currentPage) {
      onJumpToPage(pageNum);
    } else {
      // If same page, just reset input to ensure formatting matches
      setInputPage(pageNum.toString());
    }
  };

  // Filter customers based on search query
  const filteredCustomers = customers.filter(c =>
    c.crdfd_name && c.crdfd_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="fixed top-0 left-0 right-0 h-16 bg-wecare-blue shadow-md z-30 flex items-center justify-between px-4 print:hidden gap-4">
        <div className="flex items-center gap-4 shrink-0">
          <Button variant="icon" onClick={onToggleSidebar} title="Mục lục">
            <Menu size={24} />
          </Button>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex bg-white p-1.5 rounded-md shadow-sm items-center justify-center">
              <img
                src="https://i.imgur.com/tD07Yrv.png"
                alt="Wecare Logo"
                className="h-8 w-auto object-contain"
              />
            </div>

            <div className="flex flex-col md:flex-row md:items-center">
              <span className="text-white font-lexend font-bold text-lg tracking-wide md:border-l md:border-white/30 md:pl-3 md:ml-1 hidden xl:block">
                CATALOGUE
              </span>
            </div>
          </div>
        </div>

        {/* Center Section: Customer Search + Rewards */}
        <div className="flex-1 max-w-xl relative flex items-center gap-3">
          <div className="relative flex-1 min-w-0" ref={searchRef}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User size={16} className="text-wecare-blue opacity-70" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder={selectedCustomer ? `KH: ${selectedCustomer.crdfd_name}` : "Tìm kiếm khách hàng..."}
              className="w-full bg-white/90 text-wecare-darkBlue placeholder-wecare-blue/50 rounded-full pl-9 pr-10 py-1.5 focus:outline-none focus:ring-2 focus:ring-white focus:bg-white shadow-inner text-sm font-lexend transition-all"
            />

            {/* Right Controls (Check / Clear) */}
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
              {selectedCustomer && !searchQuery && (
                <span className="text-green-600 bg-green-100 rounded-full p-0.5 pointer-events-none">
                  <Check size={12} />
                </span>
              )}
              {(searchQuery || selectedCustomer) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowDropdown(false);
                    if (onCustomerSelect) onCustomerSelect(null);
                  }}
                  className="text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-full p-1 transition-colors"
                  title="Hủy tìm kiếm"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Dropdown Results */}
            {showDropdown && searchQuery && (
              <div className="absolute top-full mt-2 left-0 w-full bg-white rounded-lg shadow-xl border border-gray-100 max-h-60 overflow-y-auto z-50">
                {filteredCustomers.length > 0 ? (
                  <ul className="py-1">
                    {filteredCustomers.map((c) => (
                      <li key={c.crdfd_customerid}>
                        <button
                          onClick={() => {
                            if (onCustomerSelect) onCustomerSelect(c);
                            setSearchQuery('');
                            setShowDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-wecare-lightBlue/10 text-sm font-roboto text-wecare-charcoal flex flex-col"
                        >
                          <span className="font-bold">{c.crdfd_name}</span>
                          <span className="text-[10px] text-gray-400">
                            {c["crdfd_trangthaicskh@OData.Community.Display.V1.FormattedValue"]}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-3 text-center text-gray-500 text-xs font-roboto">
                    Không tìm thấy khách hàng phù hợp.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Rewards Display (Only if Customer Selected) */}
          {selectedCustomer && (
            <div className="flex shrink-0 items-center gap-1.5 md:gap-2 bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-200 text-orange-700 px-2 py-1 md:px-3 md:py-1.5 rounded-lg shadow-sm animate-[fadeIn_0.3s_ease-in]">
              <div className="bg-orange-100 p-1 rounded-full">
                <Gift size={14} className="text-orange-500 md:w-4 md:h-4" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-wider text-orange-400 hidden sm:block">Wecare Rewards</span>
                <span className="font-lexend font-bold text-xs md:text-sm">
                  {selectedCustomer["crdfd_wecare_rewards@OData.Community.Display.V1.FormattedValue"] || selectedCustomer.crdfd_wecare_rewards || '0'}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-3 shrink-0">

          <div className="relative group hidden sm:block">
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
              <Filter size={14} className="text-wecare-blue" />
            </div>
            <select
              aria-label="Lọc theo ngành"
              value={currentFilter}
              onChange={(e) => onFilterChange(e.target.value)}
              className="appearance-none bg-white text-wecare-blue font-bold text-xs md:text-sm rounded pl-8 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-wecare-lightBlue shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
              style={{ minWidth: '120px' }}
            >
              <option value="all">Tất cả ngành</option>
              <option value="water">Ngành Nước</option>
              <option value="electric">Ngành Điện</option>
              <option value="metal">Ngành Kim Khí</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-wecare-blue">
              <ChevronRight size={14} className="rotate-90" />
            </div>
          </div>

          <Button
            variant="secondary"
            className="!bg-white !text-wecare-blue !border-none hover:!bg-gray-100 shadow-sm hidden md:flex"
            onClick={onDownload}
            title="Tải xuống PDF"
          >
            <Download size={18} className="md:mr-2" />
            <span className="hidden lg:inline font-bold">PDF</span>
          </Button>

          <Button
            variant="positive"
            onClick={onPrint}
            title="In trang này"
            className="hidden md:flex"
          >
            <Printer size={18} className="mr-2" />
            <span className="hidden lg:inline">In</span>
          </Button>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-16 bg-wecare-charcoal/95 backdrop-blur text-white z-30 flex items-center justify-between px-2 md:px-8 border-t border-white/10 print:hidden">

        <div className="flex items-center gap-1 md:gap-4">
          <Button variant="icon" onClick={() => onJumpToPage(1)} disabled={currentPage <= 1} title="Về trang đầu" className="hidden sm:flex">
            <ChevronsLeft size={24} />
          </Button>

          <Button variant="icon" onClick={onPrev} disabled={currentPage <= 1} title="Trang trước">
            <ChevronLeft size={24} />
          </Button>

          <div className="font-roboto text-sm md:text-base text-gray-300 flex items-center gap-1 md:gap-2 whitespace-nowrap">
            <span className="hidden sm:inline">Trang</span>
            <input
              type="text"
              value={inputPage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              title={`Nhập số từ 1 đến ${totalPages}`}
              className="w-10 md:w-12 h-8 text-center bg-white/10 border border-white/20 rounded text-white font-bold focus:outline-none focus:border-wecare-blue focus:bg-white/20 transition-colors"
              aria-label="Nhập số trang"
            />
            <span>/ {totalPages}</span>
          </div>

          <Button variant="icon" onClick={onNext} disabled={currentPage >= totalPages} title="Trang sau">
            <ChevronRight size={24} />
          </Button>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <span className="text-[10px] text-gray-500 font-mono mr-2 hidden sm:inline-block">
            v1.1.0
          </span>
          <Button variant="icon" onClick={onZoomOut} disabled={zoomLevel <= 0.5} title="Thu nhỏ">
            <ZoomOut size={20} />
          </Button>
          <span className="text-xs font-mono w-10 md:w-12 text-center text-gray-400">
            {Math.round(zoomLevel * 100)}%
          </span>
          <Button variant="icon" onClick={onZoomIn} disabled={zoomLevel >= 2.0} title="Phóng to">
            <ZoomIn size={20} />
          </Button>
        </div>
      </div>
    </>
  );
};
