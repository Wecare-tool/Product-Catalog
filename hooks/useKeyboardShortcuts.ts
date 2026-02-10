import { useEffect, useCallback } from 'react';

interface UseKeyboardShortcutsOptions {
    onNext: () => void;
    onPrev: () => void;
    onFirstPage: () => void;
    onLastPage: () => void;
}

/**
 * Hook bắt keyboard shortcuts để điều hướng flipbook.
 * Tự động disable khi user đang focus vào input/textarea.
 */
export function useKeyboardShortcuts({
    onNext,
    onPrev,
    onFirstPage,
    onLastPage,
}: UseKeyboardShortcutsOptions) {
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Không xử lý khi đang gõ trong input/textarea
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

        switch (e.key) {
            case 'ArrowRight':
                e.preventDefault();
                onNext();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                onPrev();
                break;
            case 'Home':
                e.preventDefault();
                onFirstPage();
                break;
            case 'End':
                e.preventDefault();
                onLastPage();
                break;
        }
    }, [onNext, onPrev, onFirstPage, onLastPage]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}
