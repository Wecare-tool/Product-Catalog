
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
  Droplets,
  Zap,
  Wrench,
  User,
  Check,
  Gift,
  X
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
  customers?: CRMCustomer[];
  onCustomerSelect?: (customer: CRMCustomer | null) => void;
  selectedCustomer?: CRMCustomer | null;
  isSidebarOpen?: boolean;
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
  selectedCustomer,
  isSidebarOpen = false
}) => {
  const [inputPage, setInputPage] = useState(currentPage.toString());
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Auto-hide header
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const hideHeaderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const sidebarOpenRef = useRef(isSidebarOpen);
  sidebarOpenRef.current = isSidebarOpen;

  const resetHeaderTimer = () => {
    setIsHeaderVisible(true);
    if (hideHeaderTimerRef.current) clearTimeout(hideHeaderTimerRef.current);
    hideHeaderTimerRef.current = setTimeout(() => setIsHeaderVisible(false), 3000);
  };

  // Show header on mouse near top (outside sidebar), hide after 3s
  useEffect(() => {
    const isDesktop = () => window.innerWidth >= 1024; // lg breakpoint
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY < 80) {
        // On desktop with sidebar open, ignore if cursor is over sidebar area (0-320px)
        if (isDesktop() && sidebarOpenRef.current && e.clientX < 320) return;
        resetHeaderTimer();
      }
    };
    const handleClick = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        // Don't hide if clicking inside sidebar
        if (isDesktop() && sidebarOpenRef.current && e.clientX < 320) return;
        setIsHeaderVisible(false);
        if (hideHeaderTimerRef.current) clearTimeout(hideHeaderTimerRef.current);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleClick);
    hideHeaderTimerRef.current = setTimeout(() => setIsHeaderVisible(false), 3000);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleClick);
      if (hideHeaderTimerRef.current) clearTimeout(hideHeaderTimerRef.current);
    };
  }, []);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileFabOpen, setMobileFabOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
      e.currentTarget.blur();
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

    if (pageNum !== currentPage) {
      onJumpToPage(pageNum);
    } else {
      setInputPage(pageNum.toString());
    }
  };

  // Filter customers based on search query
  const filteredCustomers = customers.filter(c =>
    c.crdfd_name && c.crdfd_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* ===== HEADER — auto-hide ===== */}
      <div
        ref={headerRef}
        className={`fixed top-0 left-0 ${isSidebarOpen ? 'lg:left-[320px]' : ''} right-0 h-12 bg-wecare-blue shadow-md z-30 flex items-center justify-between px-3 print:hidden gap-2 transition-all duration-300 ease-in-out ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}
        onMouseEnter={resetHeaderTimer}
      >
        {/* LEFT: Mobile hamburger + Filter Tabs */}
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="icon" onClick={onToggleSidebar} title="Mục lục" className="lg:hidden">
            <Menu size={20} />
          </Button>

          {/* Desktop Filter Tabs */}
          <div className="hidden sm:flex items-center bg-white/15 backdrop-blur-sm rounded-lg p-0.5 gap-0.5">
            {[
              { value: 'all', label: 'Tất cả', icon: null },
              { value: 'water', label: 'Nước', icon: <Droplets size={14} /> },
              { value: 'electric', label: 'Điện', icon: <Zap size={14} /> },
              { value: 'metal', label: 'Kim Khí', icon: <Wrench size={14} /> },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => onFilterChange(tab.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-lexend font-medium transition-all duration-200 whitespace-nowrap
                  ${currentFilter === tab.value
                    ? 'bg-white text-wecare-blue shadow-sm'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
              >
                {tab.icon}
                <span className="hidden lg:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Mobile Filter Button */}
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="sm:hidden flex items-center gap-1 bg-white/15 text-white px-2.5 py-1.5 rounded-lg text-xs font-lexend font-medium"
            aria-label="Lọc theo ngành"
            title="Lọc theo ngành"
          >
            <Wrench size={14} />
          </button>
        </div>

        {/* CENTER: Page Navigation */}
        <div className="flex items-center gap-1 md:gap-2">
          <Button variant="icon" onClick={() => onJumpToPage(1)} disabled={currentPage <= 1} title="Về trang đầu" className="hidden sm:flex">
            <ChevronsLeft size={20} />
          </Button>

          <Button variant="icon" onClick={onPrev} disabled={currentPage <= 1} title="Trang trước">
            <ChevronLeft size={20} />
          </Button>

          <div className="font-roboto text-sm text-white/80 flex items-center gap-1 whitespace-nowrap">
            <input
              type="text"
              value={inputPage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              title={`Nhập số từ 1 đến ${totalPages}`}
              className="w-10 h-7 text-center bg-white/10 border border-white/20 rounded text-white font-bold text-xs focus:outline-none focus:border-white focus:bg-white/20 transition-colors"
              aria-label="Nhập số trang"
            />
            <span className="text-xs">/ {totalPages}</span>
          </div>

          <Button variant="icon" onClick={onNext} disabled={currentPage >= totalPages} title="Trang sau">
            <ChevronRight size={20} />
          </Button>
        </div>

        {/* RIGHT: Customer Search + Download/Print */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Customer Search */}
          <div className="relative hidden md:block min-w-0" ref={searchRef}>
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <User size={14} className="text-wecare-blue opacity-70" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder={selectedCustomer ? `${selectedCustomer.crdfd_name}` : "Khách hàng..."}
              className="w-36 lg:w-44 bg-white/90 text-wecare-darkBlue placeholder-wecare-blue/50 rounded-full pl-8 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-white focus:bg-white focus:w-56 focus:shadow-lg shadow-inner text-xs font-lexend transition-all"
            />

            <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
              {selectedCustomer && !searchQuery && (
                <span className="text-green-600 bg-green-100 rounded-full p-0.5 pointer-events-none">
                  <Check size={10} />
                </span>
              )}
              {(searchQuery || selectedCustomer) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowDropdown(false);
                    if (onCustomerSelect) onCustomerSelect(null);
                  }}
                  className="text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-full p-0.5 transition-colors"
                  title="Hủy"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {showDropdown && searchQuery && (
              <div className="absolute top-full mt-2 left-0 w-56 bg-white rounded-lg shadow-xl border border-gray-100 max-h-60 overflow-y-auto z-50">
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
                          className="w-full text-left px-3 py-1.5 hover:bg-wecare-lightBlue/10 text-xs font-roboto text-wecare-charcoal flex flex-col gap-0.5"
                        >
                          <span className="font-semibold">{c.crdfd_name}</span>
                          <span className="text-[10px] text-gray-400">
                            {c["crdfd_trangthaicskh@OData.Community.Display.V1.FormattedValue"]}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-3 text-center text-gray-500 text-xs font-roboto">
                    Không tìm thấy khách hàng.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Rewards Badge */}
          {selectedCustomer && (
            <div className="hidden lg:flex shrink-0 items-center gap-1.5 bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-200 text-orange-700 px-2 py-1 rounded-lg shadow-sm">
              <Gift size={12} className="text-orange-500" />
              <span className="font-lexend font-bold text-xs">
                {selectedCustomer["crdfd_wecare_rewards@OData.Community.Display.V1.FormattedValue"] || selectedCustomer.crdfd_wecare_rewards || '0'}
              </span>
            </div>
          )}

          {/* Download / Print */}
          <div className="hidden md:flex items-center gap-0.5">
            <Button variant="icon" onClick={onDownload} title="Tải xuống PDF" className="hover:bg-white/15">
              <Download size={16} />
            </Button>
            <Button variant="icon" onClick={onPrint} title="In trang này" className="hover:bg-white/15">
              <Printer size={16} />
            </Button>
          </div>
        </div>
      </div>


      {/* ===== FLOATING ZOOM — Vertical, mid-right edge ===== */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-30 print:hidden hidden md:flex flex-col items-center gap-1 bg-wecare-charcoal/80 backdrop-blur-md rounded-l-lg px-1.5 py-2 shadow-lg border border-white/10">
        <button onClick={onZoomIn} disabled={zoomLevel >= 2.0} className="text-white/70 hover:text-white disabled:opacity-30 p-1 transition-colors" title="Phóng to">
          <ZoomIn size={16} />
        </button>
        <span className="text-[10px] font-mono text-gray-400">
          {Math.round(zoomLevel * 100)}%
        </span>
        <button onClick={onZoomOut} disabled={zoomLevel <= 0.5} className="text-white/70 hover:text-white disabled:opacity-30 p-1 transition-colors" title="Thu nhỏ">
          <ZoomOut size={16} />
        </button>
      </div>

      {/* ===== MOBILE: Filter Bottom Sheet ===== */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 sm:hidden" onClick={() => setMobileFilterOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
            <h3 className="font-lexend font-bold text-wecare-darkBlue text-sm mb-3">Lọc theo ngành</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'all', label: 'Tất cả', icon: null },
                { value: 'water', label: 'Ngành Nước', icon: <Droplets size={16} /> },
                { value: 'electric', label: 'Ngành Điện', icon: <Zap size={16} /> },
                { value: 'metal', label: 'Ngành Kim Khí', icon: <Wrench size={16} /> },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => { onFilterChange(tab.value); setMobileFilterOpen(false); }}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-lexend font-medium transition-all
                    ${currentFilter === tab.value
                      ? 'bg-wecare-blue text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== MOBILE FAB: PDF/Print ===== */}
      <div className="fixed bottom-4 right-4 z-40 md:hidden print:hidden flex flex-col items-end gap-2">
        {mobileFabOpen && (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => { onDownload(); setMobileFabOpen(false); }}
              className="bg-white shadow-lg rounded-full p-3 text-wecare-blue hover:bg-gray-50 transition-colors"
              title="Tải PDF"
              aria-label="Tải PDF"
            >
              <Download size={20} />
            </button>
            <button
              onClick={() => { onPrint(); setMobileFabOpen(false); }}
              className="bg-white shadow-lg rounded-full p-3 text-wecare-green hover:bg-gray-50 transition-colors"
              title="In"
              aria-label="In trang"
            >
              <Printer size={20} />
            </button>
          </div>
        )}
        <button
          onClick={() => setMobileFabOpen(!mobileFabOpen)}
          className={`bg-wecare-blue shadow-lg rounded-full p-3.5 text-white hover:bg-wecare-darkBlue transition-all duration-200 ${mobileFabOpen ? 'rotate-45' : ''}`}
          aria-label="Thêm hành động"
          title="Thêm"
        >
          <X size={22} className={`transition-transform duration-200 ${mobileFabOpen ? '' : 'rotate-45'}`} />
        </button>
      </div>
    </>
  );
};
