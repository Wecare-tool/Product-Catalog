
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import { TableOfContentsItem } from '../types';

interface TableOfContentsProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPage: (page: number) => void;
  currentPage: number;
  items?: TableOfContentsItem[];
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  isOpen,
  onClose,
  onSelectPage,
  currentPage,
  items = []
}) => {
  const activeItemRef = useRef<HTMLButtonElement>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Scroll active item into view when sidebar opens or page changes
  useEffect(() => {
    if (isOpen && activeItemRef.current) {
      setTimeout(() => {
        activeItemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300); // Increased timeout slightly to ensure sidebar transition is done
    }
  }, [isOpen, currentPage]);

  // Reset search when sidebar closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => setSearchTerm(''), 300);
    }
  }, [isOpen]);

  // Calculate active item ID based on current page
  // Logic: Highlight the item that starts on the current page (Exact match).
  // If no exact match, highlight the section we are currently inside (Range).
  const activeItemId = useMemo(() => {
    let bestId: string | null = null;
    let bestPage = -1;
    let exactMatchFound = false;

    const scan = (nodes: TableOfContentsItem[]) => {
      for (const node of nodes) {
        // If we found an exact match previously, stop scanning unless this is also an exact match (edge case)

        if (node.pageNumber === currentPage) {
          bestPage = node.pageNumber;
          bestId = node.id;
          exactMatchFound = true;
        } else if (!exactMatchFound && node.pageNumber < currentPage) {
          // Only update bestPage if we haven't found an exact match yet
          // and this node is closer to the current page than the previous best
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

  // Recursive filtering logic
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;

    const lowerTerm = searchTerm.toLowerCase();

    const filterNodes = (nodes: TableOfContentsItem[]): TableOfContentsItem[] => {
      return nodes.reduce((acc, node) => {
        const matchesSelf = node.title.toLowerCase().includes(lowerTerm);
        const filteredChildren = node.children ? filterNodes(node.children) : [];

        if (matchesSelf || filteredChildren.length > 0) {
          acc.push({
            ...node,
            // If parent matches, show all children
            children: filteredChildren.length > 0 ? filteredChildren : (matchesSelf ? node.children : [])
          });
        }
        return acc;
      }, [] as TableOfContentsItem[]);
    };

    return filterNodes(items);
  }, [items, searchTerm]);

  const renderItem = (item: TableOfContentsItem, depth = 0) => {
    const isActive = activeItemId === item.id;

    return (
      <div key={item.id} className="w-full">
        <button
          ref={isActive ? activeItemRef : null}
          onClick={() => {
            onSelectPage(item.pageNumber);
            // Close sidebar on mobile/tablet after selection
            if (window.innerWidth < 1024) {
              onClose();
            }
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
            <span className={`text-sm leading-snug font-bold ${depth === 0 ? 'uppercase' : ''} pr-1 bg-inherit z-10 relative`} title={item.title}>
              {item.title}
            </span>

            {/* Dot Leader */}
            <div className="flex-grow border-b-2 border-dotted border-gray-300 mx-1 relative -top-1 opacity-50 group-hover:border-wecare-blue"></div>

            <span className={`text-sm font-bold shrink-0 pl-1 bg-inherit z-10 relative ${isActive ? 'text-wecare-blue' : 'text-gray-500 group-hover:text-wecare-blue'}`}>
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
      {/* Backdrop - Only visible on Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 lg:w-[400px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col border-r border-gray-200
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="bg-white p-5 shrink-0 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-lexend font-bold text-xl tracking-wide text-wecare-darkBlue flex items-center gap-2">
              <span className="w-1.5 h-6 bg-wecare-blue rounded-full block"></span>
              Mục Lục
            </h2>
            <button onClick={onClose} aria-label="Đóng mục lục" className="hover:bg-gray-100 p-2 rounded-full transition-colors text-gray-500 hover:text-red-500">
              <X size={20} />
            </button>
          </div>

          {/* Search Input in Sidebar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm danh mục..."
              className="w-full bg-gray-100 text-wecare-charcoal rounded-md pl-9 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-wecare-lightBlue/50 focus:bg-white text-sm font-roboto transition-all border border-transparent focus:border-wecare-lightBlue/30"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                aria-label="Xóa tìm kiếm"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
          {filteredItems.length > 0 ? (
            <div className="py-2 divide-y divide-gray-50">
              {filteredItems.map(item => renderItem(item))}
            </div>
          ) : (
            <div className="p-8 text-center flex flex-col items-center justify-center text-gray-400 h-64">
              <Search size={32} className="mb-2 opacity-20" />
              <p className="text-sm font-roboto font-medium text-gray-500">
                Không tìm thấy kết quả
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 shrink-0">
          <p className="text-xs text-gray-500 text-center font-roboto">
            &copy; 2026 Wecare Digital Catalogue
          </p>
        </div>
      </div>
    </>
  );
};
