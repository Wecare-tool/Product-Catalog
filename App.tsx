
import React, { useState } from 'react';
import { CatalogViewer } from './components/CatalogViewer';
import { CatalogPage } from './components/CatalogPage';
import { Controls } from './components/Controls';
import { TableOfContents } from './components/TableOfContents';
import { useCatalogData } from './hooks/useCatalogData';
import { useFlipBook } from './hooks/useFlipBook';
import { useViewport } from './hooks/useViewport';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { WECARE_LOGO } from './config';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Custom hooks
  const {
    isLoading, errorMsg, pages, tocItems, totalProducts,
    activeFilter, accessToken, customers, selectedCustomer,
    setSelectedCustomer, handleFilterChange, loadDemoData,
  } = useCatalogData();

  const {
    currentPage, setCurrentPage, totalPages, bookRef, containerRef,
    handleNext, handlePrev, handlePageSelect, handleJumpToPage,
    handleFlip, handlePrint, handleDownload,
  } = useFlipBook(pages);

  const {
    zoomLevel, setZoomLevel, isMobile, handleZoomIn, handleZoomOut,
  } = useViewport();

  // Keyboard shortcuts (P3)
  useKeyboardShortcuts({
    onNext: handleNext,
    onPrev: handlePrev,
    onFirstPage: () => handleJumpToPage(1),
    onLastPage: () => handleJumpToPage(totalPages),
  });

  // Filter change needs bookRef to reset page
  const onFilterChange = (newFilter: string) => {
    setCurrentPage(1);
    handleFilterChange(newFilter, bookRef);
  };

  // --- Render ---

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#2b2b2b] flex flex-col items-center justify-center z-50">
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 border-4 border-wecare-blue/30 rounded-full animate-pulse"></div>
          <div className="absolute inset-0 border-t-4 border-wecare-blue rounded-full animate-spin"></div>
          <img src={WECARE_LOGO} alt="Wecare Logo" className="absolute inset-0 m-auto w-10 h-auto opacity-80" />
        </div>
        <h2 className="text-white font-lexend text-xl tracking-wider font-light">WECARE CATALOGUE</h2>
        <p className="text-gray-500 font-roboto text-sm mt-2">Connecting to Dynamics 365...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="h-screen w-screen bg-[#2b2b2b] flex flex-col items-center justify-center z-50 p-4 text-center">
        <div className="bg-white/10 p-8 rounded-lg backdrop-blur-md max-w-md w-full border border-white/20">
          <h3 className="text-red-400 font-lexend text-xl mb-4 font-bold">Connection Issue</h3>
          <p className="text-gray-300 font-roboto mb-6">{errorMsg}</p>
          <button onClick={loadDemoData} className="bg-wecare-blue text-white px-6 py-3 rounded-lg hover:bg-wecare-darkBlue transition-colors font-medium font-lexend">
            Load Demo Catalogue
          </button>
          <p className="text-xs text-gray-500 mt-4">Check console for detailed API logs.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`h-screen w-screen bg-gradient-to-br from-[#2b2b2b] via-[#1f2937] to-[#1a1a2e] overflow-hidden print:hidden flex flex-col relative transition-[padding] duration-300 ${isSidebarOpen ? 'lg:pl-[320px]' : ''}`}>
        <Controls
          currentPage={currentPage}
          totalPages={totalPages}
          onNext={handleNext}
          onPrev={handlePrev}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onPrint={handlePrint}
          onDownload={handleDownload}
          onJumpToPage={handleJumpToPage}
          zoomLevel={zoomLevel}
          totalProducts={totalProducts}
          currentFilter={activeFilter}
          onFilterChange={onFilterChange}
          customers={customers}
          selectedCustomer={selectedCustomer}
          onCustomerSelect={setSelectedCustomer}
          isSidebarOpen={isSidebarOpen}
        />

        <TableOfContents
          key={`toc-${activeFilter}-${pages.length}`}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          onSelectPage={handlePageSelect}
          currentPage={currentPage}
          items={tocItems}
          pages={pages}
        />

        <div
          ref={containerRef}
          className="flex-1 relative overflow-auto flex items-center justify-center"
        >
          {pages.length > 0 ? (
            <div className="min-w-fit min-h-fit p-2 md:p-8 flex items-center justify-center">
              <CatalogViewer
                key={`${activeFilter}-${isMobile ? 'mobile' : 'desktop'}-${pages.length}-${selectedCustomer?.crdfd_customerid || 'def'}`}
                pages={pages}
                isMobile={isMobile}
                onFlip={handleFlip}
                bookRef={bookRef}
                zoomLevel={zoomLevel}
                onZoomChange={setZoomLevel}
                accessToken={accessToken}
                onPageClick={handleJumpToPage}
                currentPage={currentPage}
              />
            </div>
          ) : (
            <div className="text-white font-lexend text-center opacity-70">
              <p className="text-xl">Không có sản phẩm nào cho bộ lọc này.</p>
            </div>
          )}
        </div>
      </div>

      <div className="hidden print:block w-full">
        {pages.map(page => (
          <div
            key={page.id}
            id={`page-${page.id}`}
            className="w-[210mm] h-[297mm] overflow-hidden relative page-break-after-always bg-white"
          >
            <div style={{ transform: 'scale(1.334)', transformOrigin: 'top left', width: '595px', height: '842px' }}>
              <CatalogPage page={page} accessToken={accessToken} isVisible={true} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default App;
