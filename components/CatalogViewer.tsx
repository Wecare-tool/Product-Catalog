
import React, { useRef, useState, useCallback } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { CatalogPage as CatalogPageType } from '../types';
import { CatalogPage } from './CatalogPage';

interface CatalogViewerProps {
  pages: CatalogPageType[];
  isMobile: boolean;
  onFlip: (e: any) => void;
  bookRef: React.MutableRefObject<any>;
  zoomLevel: number;
  onZoomChange?: (zoom: number) => void;
  accessToken?: string | null;
  onPageClick?: (pageNumber: number) => void;
  highlightTerm?: string;
  currentPage?: number; // Added to calculate visibility
}

export const CatalogViewer: React.FC<CatalogViewerProps> = ({ 
  pages,
  isMobile,
  onFlip,
  bookRef,
  zoomLevel,
  onZoomChange,
  accessToken,
  onPageClick,
  highlightTerm,
  currentPage = 1
}) => {
  // Base dimensions per page (A4 standard at ~72 PPI)
  const baseWidth = 595; 
  const baseHeight = 842; 

  const totalWidth = isMobile ? baseWidth : baseWidth * 2;
  const totalHeight = baseHeight;

  // Touch handling for pinch-to-zoom
  const touchStartDist = useRef<number | null>(null);
  const startZoomLevel = useRef<number>(zoomLevel);
  const [isPinching, setIsPinching] = useState(false);

  // Wheel handling debounce
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      setIsPinching(true);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDist.current = dist;
      startZoomLevel.current = zoomLevel;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDist.current !== null && onZoomChange) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      
      const ratio = dist / touchStartDist.current;
      // Clamp zoom level between 0.4 and 2.5
      const newZoom = Math.min(Math.max(startZoomLevel.current * ratio, 0.4), 2.5);
      
      onZoomChange(newZoom);
      
      // Prevent default to avoid native browser zoom/scroll while pinching
      if (e.cancelable) e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    setIsPinching(false);
    touchStartDist.current = null;
  };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    // Only flip if not zoomed in significantly (to allow scrolling content if zoomed)
    // or if the implementation requires strict page flipping.
    // Here we check if a scroll timeout is active to debounce.
    
    if (scrollTimeout.current) return;
    
    // Threshold to prevent accidental small scrolls
    if (Math.abs(e.deltaY) < 30) return;

    // Check availability of bookRef
    if (bookRef.current && bookRef.current.pageFlip()) {
      const flipBook = bookRef.current.pageFlip();
      
      if (e.deltaY > 0) {
        flipBook.flipNext();
      } else {
        flipBook.flipPrev();
      }

      // Set cooldown period (e.g., 600ms)
      scrollTimeout.current = setTimeout(() => {
        scrollTimeout.current = null;
      }, 600);
    }
  }, [bookRef]);

  // VIRTUALIZATION LOGIC
  const isPageVisible = (pageId: number) => {
      const buffer = 4;
      return Math.abs(pageId - currentPage) <= buffer;
  };

  // DOUBLE CLICK NAVIGATION LOGIC
  const handleDoubleClick = (e: React.MouseEvent) => {
    // 1. Check if user is trying to select text (Double click on word selects it)
    // If text is selected, DO NOT flip the page.
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
        return;
    }

    if (!bookRef.current) return;

    const { clientX } = e;
    const windowWidth = window.innerWidth;
    const flipObject = bookRef.current.pageFlip();

    if (!flipObject) return;

    // 2. Determine direction based on click position relative to screen center
    if (clientX > windowWidth / 2) {
        flipObject.flipNext();
    } else {
        flipObject.flipPrev();
    }
  };

  return (
    <div 
      style={{
        width: `${totalWidth * zoomLevel}px`,
        height: `${totalHeight * zoomLevel}px`,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      }}
      className="relative mx-auto touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick} // Add Double Click Listener
    >
      <div
        style={{
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'top left',
          width: `${totalWidth}px`,
          height: `${totalHeight}px`,
          willChange: 'transform' 
        }}
        className={`${isPinching ? '' : 'transition-transform duration-300 ease-out'}`}
      >
        <HTMLFlipBook
          width={baseWidth}
          height={baseHeight}
          size="fixed"
          minWidth={300}
          maxWidth={2000}
          minHeight={400}
          maxHeight={2000}
          maxShadowOpacity={0.5} 
          showCover={true}
          mobileScrollSupport={true}
          className="demo-book"
          ref={bookRef}
          onFlip={onFlip}
          usePortrait={isMobile}
          startPage={0}
          drawShadow={true}
          flippingTime={800}
          useMouseEvents={false} // CHANGED: Disable mouse drag to flip
          swipeDistance={20}
          style={{}}
          startZIndex={0}
          autoSize={true}
          clickEventForward={true}
          showPageCorners={false} 
          disableFlipByClick={true} 
        >
          {pages.map((page) => (
            <CatalogPage 
                key={page.id} 
                page={page} 
                accessToken={accessToken} 
                onPageClick={onPageClick}
                highlightTerm={highlightTerm}
                isVisible={isPageVisible(page.id)}
            />
          ))}
        </HTMLFlipBook>
      </div>
    </div>
  );
};
