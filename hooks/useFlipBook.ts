import { useState, useRef, useCallback } from 'react';
import { CatalogPage as CatalogPageType } from '../types';

/**
 * Hook quản lý flipbook: navigation, page tracking, book reference.
 */
export function useFlipBook(pages: CatalogPageType[]) {
    const [currentPage, setCurrentPage] = useState(1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bookRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const totalPages = pages.length > 0 ? pages[pages.length - 1].id : 0;

    const handleNext = useCallback(() => {
        if (bookRef.current) {
            bookRef.current.pageFlip().flipNext();
        }
    }, []);

    const handlePrev = useCallback(() => {
        if (bookRef.current) {
            bookRef.current.pageFlip().flipPrev();
        }
    }, []);

    const handlePageSelect = useCallback((pageNumber: number) => {
        if (bookRef.current) {
            const targetIndex = pages.findIndex(p => p.id === pageNumber);

            if (targetIndex !== -1) {
                setTimeout(() => {
                    try {
                        const flipObject = bookRef.current.pageFlip();
                        if (flipObject) {
                            flipObject.turnToPage(targetIndex);
                        }
                    } catch {
                        // Fallback navigation - silently ignore flip errors
                    }
                }, 0);
            } else {
                const safeIndex = Math.max(0, Math.min(pageNumber - 1, pages.length - 1));
                try {
                    bookRef.current.pageFlip().turnToPage(safeIndex);
                } catch { /* ignore flip errors */ }
            }
        }
        if (containerRef.current) {
            containerRef.current.scrollTop = 0;
        }
    }, [pages]);

    const handleJumpToPage = useCallback((pageNumber: number) => {
        handlePageSelect(pageNumber);
    }, [handlePageSelect]);

    const handleFlip = useCallback((e: { data: number }) => {
        const pageIndex = e.data;
        const page = pages[pageIndex];
        if (page) {
            setCurrentPage(page.id);
            if (containerRef.current) {
                containerRef.current.scrollTop = 0;
            }
        }
    }, [pages]);

    const handlePrint = useCallback(() => {
        window.print();
    }, []);

    const handleDownload = useCallback(() => {
        window.print();
    }, []);

    return {
        currentPage,
        setCurrentPage,
        totalPages,
        bookRef,
        containerRef,
        handleNext,
        handlePrev,
        handlePageSelect,
        handleJumpToPage,
        handleFlip,
        handlePrint,
        handleDownload,
    };
}
