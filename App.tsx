
import React, { useState, useEffect, useRef } from 'react';
import { CatalogViewer } from './components/CatalogViewer';
import { CatalogPage } from './components/CatalogPage'; // For print view
import { Controls } from './components/Controls';
import { TableOfContents } from './components/TableOfContents';
import { getAccessToken } from './services/authService';
import { fetchCatalogData, fetchCustomers } from './services/crmService';
import { generatePagesFromData } from './utils/catalogGenerator';
import { CatalogPage as CatalogPageType, TableOfContentsItem, CRMProduct, CRMCustomer } from './types';
import { CATALOG_PAGES as FALLBACK_PAGES, TOC_ITEMS as FALLBACK_TOC } from './constants';

const INDUSTRY_IDS = {
  WATER: '7c9f66a1-af65-ef11-a670-000d3aa290f1',
  ELECTRIC: '0c6ebf33-11c9-4fc6-b236-49f46f9d0b4c'
};

const App: React.FC = () => {
  // Helper to calculate best fit zoom
  const calculateResponsiveZoom = () => {
    const width = window.innerWidth;
    const BASE_PAGE_WIDTH = 595; // Standard A4 pixel width used in viewer

    if (width < 768) {
      // Mobile: Fit to width with margin (32px total padding + safety)
      // Example: Screen 390px -> (390 - 32) / 595 = ~0.60 zoom
      return Math.min((width - 32) / BASE_PAGE_WIDTH, 1.0);
    }
    return 0.85; // Desktop default
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(calculateResponsiveZoom());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Data State
  const [allProducts, setAllProducts] = useState<CRMProduct[]>([]); // Store raw full list
  const [pages, setPages] = useState<CatalogPageType[]>([]);
  const [tocItems, setTocItems] = useState<TableOfContentsItem[]>([]);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [activeFilter, setActiveFilter] = useState<string>('metal'); // Default filter set to Kim Khí
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Customer State
  const [customers, setCustomers] = useState<CRMCustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CRMCustomer | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookRef = useRef<any>(null); // HTMLFlipBook has no typed ref
  const containerRef = useRef<HTMLDivElement>(null); // Ref for scrolling container

  useEffect(() => {
    const initApp = async () => {
      try {
        // 1. Get Access Token
        const tokenData = await getAccessToken();

        if (tokenData && tokenData.access_token) {
          setAccessToken(tokenData.access_token);

          // Parallel Fetch: CRM Products AND Customers
          const [crmData, customerList] = await Promise.all([
            fetchCatalogData(tokenData.access_token),
            fetchCustomers(tokenData.access_token)
          ]);

          // Handle Customers
          if (customerList.length > 0) {
            setCustomers(customerList);
          }

          // Handle Products
          if (crmData.length > 0) {
            setAllProducts(crmData);
            // Initial Generation (Default Filter: Metal)
            updateCatalogData(crmData, 'metal', null);
          } else {
            setTotalProducts(0);
            setErrorMsg("Connected to CRM but found no products matching the criteria.");
          }
        } else {
          console.warn("Failed to get token.");
          setErrorMsg("Failed to retrieve access token. Please check the Power Automate connection.");
        }

      } catch (err) {
        console.error("Initialization error:", err);
        setErrorMsg("An unexpected error occurred during initialization.");
      } finally {
        setIsLoading(false);
      }
    };

    initApp();

    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Recalculate zoom on resize
      setZoomLevel(calculateResponsiveZoom());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);  

  // Update catalog when selected customer changes
  useEffect(() => {
    if (allProducts.length > 0) {
      // Keep current filter and page (if possible), but regenerate content
      updateCatalogData(allProducts, activeFilter, selectedCustomer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustomer]);

  const updateCatalogData = (products: CRMProduct[], filter: string, customer: CRMCustomer | null) => {
    // Apply Filtering Logic
    let filtered: CRMProduct[] = [];

    if (filter === 'all') {
      filtered = products;
    } else if (filter === 'water') {
      filtered = products.filter(p => p.enriched_industry_id === INDUSTRY_IDS.WATER);
    } else if (filter === 'electric') {
      filtered = products.filter(p => p.enriched_industry_id === INDUSTRY_IDS.ELECTRIC);
    } else if (filter === 'metal') {
      // Kim khí: data còn lại (Neither Water nor Electric)
      filtered = products.filter(p =>
        p.enriched_industry_id !== INDUSTRY_IDS.WATER &&
        p.enriched_industry_id !== INDUSTRY_IDS.ELECTRIC
      );
    }

    setTotalProducts(filtered.length);

    if (filtered.length === 0) {
      // Handle empty state if filter returns nothing
      setPages([]);
      setTocItems([]);
    } else {
      const generated = generatePagesFromData(filtered, filter, customer);
      setPages(generated.pages);
      setTocItems(generated.toc);
    }
  };

  const handleFilterChange = (newFilter: string) => {
    setActiveFilter(newFilter);
    setCurrentPage(1); // Reset to cover
    updateCatalogData(allProducts, newFilter, selectedCustomer);

    // Attempt to flip to page 1
    setTimeout(() => {
      try {
        if (bookRef.current) {
          const flipObject = bookRef.current.pageFlip();
          if (flipObject) {
            // Try to flip to index 0 (Cover)
            flipObject.turnToPage(0);
          }
        }
      } catch (e) {
        console.error("Flip error", e);
      }
    }, 100);
  };

  const totalPages = pages.length > 0 ? pages[pages.length - 1].id : 0; // Use Last Page ID as total pages

  const handleNext = () => {
    if (bookRef.current) {
      bookRef.current.pageFlip().flipNext();
    }
  };

  const handlePrev = () => {
    if (bookRef.current) {
      bookRef.current.pageFlip().flipPrev();
    }
  };

  const handlePageSelect = (pageNumber: number) => {
    if (bookRef.current) {
      // Robust navigation: Find the INDEX of the page with the specific ID
      // Because pages are 1-based IDs and sequential in the array:
      // Index = PageID - 1

      const targetIndex = pages.findIndex(p => p.id === pageNumber);

      if (targetIndex !== -1) {
        // Use a short timeout to ensure UI is ready if triggered rapidly
        setTimeout(() => {
          try {
            // Use turnToPage instead of flip for Jump Navigation
            // turnToPage is instant and less prone to animation errors on mobile
            const flipObject = bookRef.current.pageFlip();  
            if (flipObject) {
              flipObject.turnToPage(targetIndex);
            }
          } catch {
            // Fallback navigation - silently ignore flip errors
          }
        }, 0);
      } else {
        // Fallback if ID not found (e.g. out of bounds), clamp to limits
        const safeIndex = Math.max(0, Math.min(pageNumber - 1, pages.length - 1));
        try {
          bookRef.current.pageFlip().turnToPage(safeIndex);
        } catch { /* ignore flip errors */ }
      }
    }
    // Scroll container to top to ensure header is visible on mobile
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  };

  const handleJumpToPage = (pageNumber: number) => {
    handlePageSelect(pageNumber);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    window.print();
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2.5)); // Increased max zoom for better readability
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.4));
  };

  const handleFlip = (e: { data: number }) => {
    // e.data is the index of the page in the array
    const pageIndex = e.data;
    const page = pages[pageIndex];
    if (page) {
      // Sync the current page number with the actual ID of the page being shown
      setCurrentPage(page.id);

      // Ensure scroll to top on flip as well (mostly for mobile swipe navigation)
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
    }
  };

  const loadDemoData = () => {
    setPages(FALLBACK_PAGES);
    setTocItems(FALLBACK_TOC);
    setTotalProducts(57); // Giả lập số lượng demo
    setErrorMsg(null);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#2b2b2b] flex flex-col items-center justify-center z-50">
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 border-4 border-wecare-blue/30 rounded-full animate-pulse"></div>
          <div className="absolute inset-0 border-t-4 border-wecare-blue rounded-full animate-spin"></div>
          <img src="https://i.imgur.com/tD07Yrv.png" alt="Wecare Logo" className="absolute inset-0 m-auto w-10 h-auto opacity-80" />
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
      <div className="h-screen w-screen bg-[#2b2b2b] overflow-hidden print:hidden flex flex-col relative">
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
          onFilterChange={handleFilterChange}
          // Pass Customer Props
          customers={customers}
          selectedCustomer={selectedCustomer}
          onCustomerSelect={setSelectedCustomer}
        />

        <TableOfContents
          // CRITICAL: Force re-mount of TOC when filter changes using 'key'.
          // This prevents the sidebar from showing stale items (e.g., items from 'All' while 'Metal' is active)
          // which causes navigation to wrong page IDs (e.g. clicking Page 74 when book only has 60 pages).
          key={`toc-${activeFilter}-${pages.length}`}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onSelectPage={handlePageSelect}
          currentPage={currentPage}
          items={tocItems}
        />

        {/* 
            Changed from overflow-hidden to overflow-auto to allow panning when zoomed in.
            Added onScroll to help with mobile touch interactions if needed.
        */}
        <div
          ref={containerRef}
          className="flex-1 relative overflow-auto flex items-center justify-center bg-[#2b2b2b]"
        >
          {pages.length > 0 ? (
            <div className="min-w-fit min-h-fit p-2 md:p-8 flex items-center justify-center">
              <CatalogViewer
                // CRITICAL: Include pages.length in key to force remount when content changes.
                // This ensures HTMLFlipBook's internal index matches the React children array.
                // Also adding selectedCustomer?.crdfd_customerid to force remount on price change if needed for reliability
                key={`${activeFilter}-${isMobile ? 'mobile' : 'desktop'}-${pages.length}-${selectedCustomer?.crdfd_customerid || 'def'}`}
                pages={pages}
                isMobile={isMobile}
                onFlip={handleFlip}
                bookRef={bookRef}
                zoomLevel={zoomLevel}
                onZoomChange={setZoomLevel}
                accessToken={accessToken}
                onPageClick={handleJumpToPage}
                currentPage={currentPage} // PASSED HERE
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
            {/* Scale 595x842 (Base size) to fit A4 (210mm x 297mm approx 794x1123px) 
                 Scale factor ~ 1.334
             */}
            <div style={{ transform: 'scale(1.334)', transformOrigin: 'top left', width: '595px', height: '842px' }}>
              {/* For print, we force isVisible=true */}
              <CatalogPage page={page} accessToken={accessToken} isVisible={true} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default App;
