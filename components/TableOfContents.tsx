
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { X, Search, Package, Droplets, Zap, Wrench, ChevronLeft, ChevronRight } from 'lucide-react';
import { TableOfContentsItem, CatalogPage } from '../types';

interface ProductSearchResult {
  name: string;
  price: string;
  pageNumber: number;
}

interface TableOfContentsProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle?: () => void;
  onSelectPage: (page: number) => void;
  currentPage: number;
  items?: TableOfContentsItem[];
  pages?: CatalogPage[];
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  isOpen,
  onClose,
  onToggle,
  onSelectPage,
  currentPage,
  items = [],
  pages = []
}) => {
  const activeItemRef = useRef<HTMLButtonElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState<'toc' | 'product'>('toc');

  // Scroll active item into view when sidebar opens or page changes
  useEffect(() => {
    if (isOpen && activeItemRef.current) {
      setTimeout(() => {
        activeItemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [isOpen, currentPage]);

  // Reset search when sidebar closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setSearchTerm('');
        setSearchMode('toc');
      }, 300);
    }
  }, [isOpen]);

  // Calculate active item ID
  const activeItemId = useMemo(() => {
    let bestId: string | null = null;
    let bestPage = -1;
    let exactMatchFound = false;

    const scan = (nodes: TableOfContentsItem[]) => {
      for (const node of nodes) {
        if (node.pageNumber === currentPage) {
          bestPage = node.pageNumber;
          bestId = node.id;
          exactMatchFound = true;
        } else if (!exactMatchFound && node.pageNumber < currentPage) {
          if (node.pageNumber > bestPage) {
            bestPage = node.pageNumber;
            bestId = node.id;
          }
        }
        if (node.children) scan(node.children);
      }
    };

    scan(items);
    return bestId;
  }, [items, currentPage]);

  // Product search results — extract from pages data
  const productResults = useMemo((): ProductSearchResult[] => {
    if (searchMode !== 'product' || !searchTerm.trim() || searchTerm.length < 2) return [];
    const lowerTerm = searchTerm.toLowerCase();
    const results: ProductSearchResult[] = [];

    for (const page of pages) {
      if (page.items) {
        for (const item of page.items) {
          if (item.type === 'product' && item.model) {
            if (item.model.toLowerCase().includes(lowerTerm)) {
              results.push({
                name: item.model,
                price: item.price || 'Liên hệ',
                pageNumber: page.id,
              });
            }
          }
        }
      }
      if (results.length >= 50) break; // Cap at 50 results
    }

    return results;
  }, [pages, searchTerm, searchMode]);

  // TOC filtering
  const filteredItems = useMemo(() => {
    if (searchMode !== 'toc' || !searchTerm.trim()) return items;
    const lowerTerm = searchTerm.toLowerCase();

    const filterNodes = (nodes: TableOfContentsItem[]): TableOfContentsItem[] => {
      return nodes.reduce((acc, node) => {
        const matchesSelf = node.title.toLowerCase().includes(lowerTerm);
        const filteredChildren = node.children ? filterNodes(node.children) : [];
        if (matchesSelf || filteredChildren.length > 0) {
          acc.push({
            ...node,
            children: filteredChildren.length > 0 ? filteredChildren : (matchesSelf ? node.children : [])
          });
        }
        return acc;
      }, [] as TableOfContentsItem[]);
    };

    return filterNodes(items);
  }, [items, searchTerm, searchMode]);

  // Category icon mapping
  const getCategoryIcon = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes('nước') || lower.includes('van') || lower.includes('ống')) return <Droplets size={12} className="text-blue-400" />;
    if (lower.includes('điện') || lower.includes('cáp') || lower.includes('dây')) return <Zap size={12} className="text-yellow-500" />;
    if (lower.includes('kim') || lower.includes('khí') || lower.includes('inox')) return <Wrench size={12} className="text-gray-400" />;
    return null;
  };

  const renderItem = (item: TableOfContentsItem, depth = 0) => {
    const isActive = activeItemId === item.id;

    return (
      <div key={item.id} className="w-full">
        <button
          ref={isActive ? activeItemRef : null}
          onClick={() => {
            onSelectPage(item.pageNumber);
            if (window.innerWidth < 1024) onClose();
          }}
          className={`w-full text-left py-2 px-5 transition-all duration-200 block group relative
            ${depth > 0 ? 'pl-8' : ''}
            ${isActive
              ? 'bg-blue-50 text-wecare-blue border-l-4 border-l-wecare-blue'
              : 'text-gray-600 hover:bg-gray-50 hover:text-wecare-blue border-l-4 border-l-transparent'
            }
          `}
        >
          <div className="flex items-baseline w-full justify-between">
            <span className={`text-xs leading-snug font-bold ${depth === 0 ? 'uppercase' : ''} pr-1 bg-inherit z-10 relative`} title={item.title}>
              {item.title}
            </span>
            <div className="flex-grow border-b-2 border-dotted border-gray-300 mx-1 relative -top-1 opacity-50 group-hover:border-wecare-blue"></div>
            <span className={`text-xs font-bold shrink-0 pl-1 bg-inherit z-10 relative ${isActive ? 'text-wecare-blue' : 'text-gray-500 group-hover:text-wecare-blue'}`}>
              {item.pageNumber}
            </span>
          </div>
        </button>
        {item.children && item.children.length > 0 && (
          <div className="bg-gray-50/30 border-t border-gray-100">
            {item.children.map(child => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Expand toggle — visible when sidebar is closed on desktop */}
      <button
        onClick={onToggle}
        className={`hidden lg:flex fixed left-0 top-1/2 -translate-y-1/2 w-5 h-14 bg-wecare-blue hover:bg-wecare-darkBlue items-center justify-center rounded-r-lg shadow-lg z-30 transition-all duration-300
          ${isOpen ? 'opacity-0 pointer-events-none -translate-x-full' : 'opacity-100 pointer-events-auto translate-x-0'}
        `}
        title="Mở sidebar"
      >
        <ChevronRight size={16} className="text-white" />
      </button>

      {/* Backdrop - Only visible on Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-full sm:w-72 lg:w-[320px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col border-r border-gray-200
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} z-50
          lg:z-20
        `}
      >
        {/* Collapse toggle — desktop only */}
        <button
          onClick={onClose}
          className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 w-4 h-12 bg-wecare-blue hover:bg-wecare-darkBlue items-center justify-center rounded-r-md shadow-md z-10 transition-colors"
          title="Thu gọn sidebar"
        >
          <ChevronLeft size={14} className="text-white" />
        </button>
        {/* Header — compact */}
        <div className="bg-wecare-blue px-3 py-2.5 shrink-0">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <img
                src="https://i.imgur.com/tD07Yrv.png"
                alt="Wecare Logo"
                className="h-5 w-auto object-contain bg-white rounded p-0.5"
              />
              <span className="text-white font-lexend font-bold text-xs tracking-widest uppercase">Catalogue</span>
            </div>
            <button onClick={onClose} aria-label="Đóng mục lục" className="lg:hidden hover:bg-white/15 p-1.5 rounded-full transition-colors text-white/70 hover:text-white">
              <X size={16} />
            </button>
          </div>

          {/* Search with inline mode toggle */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <Search size={14} className="text-wecare-blue/50" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchMode === 'toc' ? 'Tìm danh mục...' : 'Tìm sản phẩm (≥2 ký tự)...'}
              className="w-full bg-white/95 text-wecare-charcoal rounded-lg pl-8 pr-24 py-1.5 focus:outline-none focus:ring-2 focus:ring-white/50 text-xs font-roboto transition-all shadow-inner"
            />
            <div className="absolute inset-y-0 right-0 pr-1 flex items-center gap-0.5">
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-gray-400 hover:text-red-500 p-0.5 transition-colors"
                  aria-label="Xóa"
                >
                  <X size={12} />
                </button>
              )}
              <button
                onClick={() => { setSearchMode('toc'); setSearchTerm(''); }}
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded transition-all ${searchMode === 'toc' ? 'bg-wecare-blue text-white' : 'text-gray-400 hover:text-gray-600'}`}
                title="Danh mục"
              >
                Mục
              </button>
              <button
                onClick={() => { setSearchMode('product'); setSearchTerm(''); }}
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded transition-all ${searchMode === 'product' ? 'bg-wecare-blue text-white' : 'text-gray-400 hover:text-gray-600'}`}
                title="Sản phẩm"
              >
                SP
              </button>
            </div>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white pb-16">
          {searchMode === 'toc' ? (
            // TOC Mode
            filteredItems.length > 0 ? (
              <div className="py-2 divide-y divide-gray-50">
                {filteredItems.map(item => renderItem(item))}
                <div className="h-20" />
              </div>
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center text-gray-400 h-64">
                <Search size={32} className="mb-2 opacity-20" />
                <p className="text-sm font-roboto font-medium text-gray-500">
                  Không tìm thấy kết quả
                </p>
              </div>
            )
          ) : (
            // Product Search Mode
            searchTerm.length < 2 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center text-gray-400 h-64">
                <Package size={32} className="mb-2 opacity-20" />
                <p className="text-sm font-roboto font-medium text-gray-500">
                  Nhập ≥2 ký tự để tìm sản phẩm
                </p>
                <p className="text-xs text-gray-400 mt-1">Ví dụ: "bu lông", "đai ốc"</p>
              </div>
            ) : productResults.length > 0 ? (
              <div className="py-1">
                <div className="px-4 py-2 text-xs text-gray-500 font-medium border-b border-gray-100">
                  Tìm thấy {productResults.length} sản phẩm {productResults.length >= 50 && '(tối đa 50)'}
                </div>
                {productResults.map((result, idx) => (
                  <button
                    key={`${result.pageNumber}-${idx}`}
                    onClick={() => {
                      onSelectPage(result.pageNumber);
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-50 group"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-sm font-roboto text-wecare-charcoal font-medium line-clamp-1 min-w-0" title={result.name}>
                        {result.name}
                      </span>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-sm font-bold text-wecare-darkBlue">
                          {result.price}₫
                        </span>
                        <span className="text-[9px] text-gray-400 group-hover:text-wecare-blue">
                          Trang {result.pageNumber}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center text-gray-400 h-64">
                <Search size={32} className="mb-2 opacity-20" />
                <p className="text-sm font-roboto font-medium text-gray-500">
                  Không tìm thấy sản phẩm "{searchTerm}"
                </p>
              </div>
            )
          )}
        </div>


      </div>
    </>
  );
};
