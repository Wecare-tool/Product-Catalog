
import React, { forwardRef, useState, useEffect, useMemo } from 'react';
import { CatalogPage as CatalogPageType, CatalogItem } from '../types';

interface CatalogPageProps {
  page: CatalogPageType;
  side?: 'left' | 'right'; 
  accessToken?: string | null;
  onPageClick?: (pageNumber: number) => void;
  highlightTerm?: string;
  isVisible?: boolean; // New prop for virtualization
}

const WECARE_LOGO = "https://i.imgur.com/tD07Yrv.png";

// Helper component to highlight text
const HighlightedText: React.FC<{ text: string, term?: string }> = React.memo(({ text, term }) => {
    if (!term || !text) return <>{text}</>;
    
    const parts = text.split(new RegExp(`(${term})`, 'gi'));
    return (
        <span>
            {parts.map((part, i) => 
                part.toLowerCase() === term.toLowerCase() ? (
                    <mark key={i} className="bg-yellow-300 text-black px-0.5 rounded-sm">{part}</mark>
                ) : (
                    part
                )
            )}
        </span>
    );
});

// Sub-component for Group Header to handle its own secure image loading
const GroupHeaderItem: React.FC<{ item: CatalogItem, accessToken?: string | null, highlightTerm?: string, isVisible: boolean }> = React.memo(({ item, accessToken, highlightTerm, isVisible }) => {
    const [imgSrc, setImgSrc] = useState<string | undefined>(isVisible ? undefined : WECARE_LOGO);
    
    useEffect(() => {
        if (!isVisible) return; // Don't fetch if not visible

        let isMounted = true;
        let objectUrl: string | null = null;

        if (item.image && item.image.includes('dynamics.com') && accessToken) {
            fetch(item.image, { headers: { 'Authorization': `Bearer ${accessToken}` } })
                .then(r => r.ok ? r.blob() : Promise.reject())
                .then(blob => {
                    if (isMounted) {
                        objectUrl = URL.createObjectURL(blob);
                        setImgSrc(objectUrl);
                    }
                })
                .catch(() => {
                    if (isMounted) setImgSrc(WECARE_LOGO);
                }); 
        } else {
            setImgSrc(item.image);
        }

        return () => { 
            isMounted = false; 
            if (objectUrl) URL.revokeObjectURL(objectUrl); // Memory Cleanup
        };
    }, [item.image, accessToken, isVisible]);

    if (!isVisible) {
        // Render skeletal placeholder
        return (
             <div className="w-full mb-1 mt-2 p-2 bg-gray-50 rounded border border-gray-100 flex gap-3 shadow-sm h-[70px]">
                <div className="w-12 h-12 bg-gray-200 rounded animate-pulse" />
                <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                </div>
             </div>
        );
    }

    return (
        <div className="w-full break-inside-avoid break-after-avoid mb-1 mt-2 first:mt-0 p-2 bg-gray-50 rounded border border-gray-100 flex gap-3 shadow-sm group-header select-text cursor-auto">
            <div className="w-12 h-12 shrink-0 rounded overflow-hidden bg-white border border-gray-200 select-none">
                <img 
                    src={imgSrc || WECARE_LOGO} 
                    alt="icon" 
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = WECARE_LOGO; }}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-baseline justify-between">
                     <h3 className="font-lexend font-bold text-wecare-darkBlue text-base uppercase pr-2 leading-tight">
                        <HighlightedText text={item.title || ''} term={highlightTerm} />
                     </h3>
                     <span className="text-xs font-roboto text-wecare-mediumGrey shrink-0 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                        {item.count} SP
                     </span>
                </div>
                {item.desc && (
                    <p className="font-roboto text-gray-500 text-[10px] mt-0.5 text-justify leading-relaxed line-clamp-2">
                        {item.desc}
                    </p>
                )}
            </div>
        </div>
    );
});

// Use React.memo to prevent unnecessary re-renders during page flip
export const CatalogPage = React.memo(forwardRef<HTMLDivElement, CatalogPageProps>(({ page, side, accessToken, onPageClick, highlightTerm, isVisible = true }, ref) => {
  const isOdd = page.id % 2 !== 0;
  const FALLBACK_LOGO = WECARE_LOGO;

  const isCategoryPage = page.section === 'Danh mục';
  const isTocPage = page.section === 'Mục lục';
  const isIntroPage = page.section === 'Giới thiệu';

  const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
  const [isFallback, setIsFallback] = useState(false);

  // Effect for main page image
  useEffect(() => {
    // Only fetch for non-table pages that have a main image AND are visible
    if (page.type === 'table' || !isVisible) return; 

    let isMounted = true;
    let objectUrl: string | null = null;

    if (page.image && page.image.includes('dynamics.com') && accessToken) {
        fetch(page.image, { headers: { 'Authorization': `Bearer ${accessToken}` } })
        .then(res => res.ok ? res.blob() : Promise.reject())
        .then(blob => {
            if (isMounted) {
                objectUrl = URL.createObjectURL(blob);
                setImageSrc(objectUrl);
                setIsFallback(false);
            }
        })
        .catch(() => {
            if (isMounted) handleImageError();
        });
    } else {
        setImageSrc(page.image);
        setIsFallback(page.image === FALLBACK_LOGO);
    }
    
    return () => { 
        isMounted = false; 
        if (objectUrl) URL.revokeObjectURL(objectUrl); // Memory Cleanup
    };
  }, [page.image, accessToken, page.type, isVisible]);

  const handleImageError = () => {
    if (!isFallback) {
        setImageSrc(FALLBACK_LOGO);
        setIsFallback(true);
    }
  };

  const shouldContain = isFallback || isCategoryPage || isIntroPage || isTocPage;
  const usePadding = isFallback || isCategoryPage;
  const imageClasses = `w-full h-full ${shouldContain ? 'object-contain' : 'object-cover'} ${usePadding ? 'p-8' : ''}`;

  // --- VIRTUALIZATION CHECK ---
  // If not visible, render a simplified lightweight container to maintain page dimensions
  if (!isVisible) {
      return (
        <div 
          ref={ref} 
          className="bg-white shadow-sm overflow-hidden relative border border-gray-200 h-full w-full"
          style={{ backfaceVisibility: 'hidden' }}
        >
             {/* Simple loading indicator */}
             <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-8 h-8 border-2 border-wecare-lightBlue border-t-transparent rounded-full animate-spin opacity-50"></div>
             </div>
             {/* Maintain Page Number */}
             <div className="absolute bottom-2 left-4 right-4 flex justify-between items-end pointer-events-none">
                <span className="font-lexend text-2xl text-gray-300 font-black select-none">{page.id}</span>
             </div>
        </div>
      );
  }

  // --- CONTENT RENDERERS WITH SELECT-TEXT ENABLED ---

  const renderStandardContent = () => (
    <div className="absolute inset-0 flex flex-col h-full select-text cursor-auto">
      <div className="h-2 w-full bg-wecare-blue opacity-0 group-hover:opacity-100 transition-opacity absolute top-0 z-10 pointer-events-none" />
      <div className="relative h-2/5 w-full overflow-hidden bg-white flex items-center justify-center select-none">
          <img 
            src={imageSrc} 
            alt={page.title} 
            className={imageClasses} 
            loading="lazy"
            decoding="async" 
            onError={handleImageError} 
            referrerPolicy="no-referrer"
          />
      </div>
      <div className="flex-1 p-6 md:p-8 flex flex-col bg-white overflow-hidden">
          <div className="flex items-center gap-2 mb-2 shrink-0">
            <div className="h-1 w-8 bg-wecare-green rounded-full" />
            <span className="text-sm font-bold text-wecare-blue uppercase tracking-widest">{page.section}</span>
          </div>
          <h2 className="font-lexend font-bold text-3xl md:text-4xl text-wecare-charcoal mb-4 leading-tight shrink-0">
            {page.title}
          </h2>
          <p className="font-roboto text-wecare-mediumGrey text-base md:text-lg leading-relaxed whitespace-pre-line overflow-y-auto">
            {page.content}
          </p>
      </div>
    </div>
  );

  const renderCoverContent = () => (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-white select-none">
      <img 
        src={imageSrc} 
        alt={page.title} 
        className={imageClasses} 
        loading="eager"
        decoding="async" 
        onError={handleImageError}
        referrerPolicy="no-referrer"
      />
    </div>
  );

  const renderFlowContent = () => {
      const items = page.items || [];
      const pageTitle = isTocPage ? "Mục lục" : "Danh mục sản phẩm";
      
      const columnClasses = isTocPage 
        ? 'md:columns-2 print:columns-2 gap-x-8' 
        : 'columns-2 print:columns-2 gap-4';

      return (
        <div className="absolute inset-0 flex flex-col h-full bg-white p-4 select-text cursor-auto">
             <div className="border-b border-wecare-blue mb-3 pb-2 shrink-0 flex justify-between items-end">
                <h2 className="font-lexend font-bold text-xl md:text-2xl text-wecare-darkBlue uppercase leading-tight">
                    {pageTitle}
                </h2>
                <span className="text-xs text-wecare-mediumGrey font-roboto">Wecare Price List 2026</span>
            </div>

            <div className="flex-1 overflow-hidden">
                <div className={`${columnClasses} w-full h-full pb-1 text-left`}>
                    {items.map((item, idx) => {
                        if (item.type === 'toc_entry') {
                            return (
                                <div key={idx} className="flex items-end justify-between w-full py-0.5 break-inside-avoid no-underline cursor-pointer hover:bg-gray-100" onClick={() => onPageClick && item.pageReference && onPageClick(item.pageReference)}>
                                    <span className="font-lexend font-bold text-wecare-darkBlue text-[12px] uppercase bg-white pr-2 relative z-10 shrink" title={item.title}>
                                        {item.title}
                                    </span>
                                    <div className="flex-grow border-b border-dotted border-gray-400 mb-1 mx-1 opacity-50 shrink-0 min-w-[20px]"></div>
                                    <span className="font-roboto font-bold text-wecare-charcoal text-[12px] bg-white pl-1 relative z-10 shrink-0">
                                        Trang {item.pageReference}
                                    </span>
                                </div>
                            );
                        }

                        if (item.type === 'group_header') {
                            return <GroupHeaderItem key={idx} item={item} accessToken={accessToken} highlightTerm={highlightTerm} isVisible={isVisible} />;
                        }
                        
                        if (item.type === 'table_header') {
                             if (item.hasSpecs && !item.hasDiscount) {
                                return (
                                    <div key={idx} className="flex bg-wecare-lightBlue text-white text-[10px] font-bold p-1 mb-1 break-inside-avoid rounded-sm">
                                        <span className="w-[30%] pl-1">Tên SP</span>
                                        <span className="w-[10%] text-center">ĐVT</span>
                                        <span className="w-[25%] text-left pl-1">Quy cách</span>
                                        <span className="w-[10%] text-center">MOQ</span>
                                        <span className="w-[25%] text-right pr-1">Giá</span>
                                    </div>
                                );
                             }
                             if (item.hasDiscount) {
                                return (
                                    <div key={idx} className="flex bg-wecare-lightBlue text-white text-[10px] font-bold p-1 mb-1 break-inside-avoid rounded-sm">
                                        <span className="w-[35%] pl-1">Tên sản phẩm</span>
                                        <span className="w-[10%] text-center">ĐVT</span>
                                        <span className="w-[25%] text-right pr-2">Giá niêm yết</span>
                                        <span className="w-[30%] text-right pr-1 text-yellow-200">Giá ưu đãi</span>
                                    </div>
                                );
                             }
                             return (
                                <div key={idx} className="flex bg-wecare-lightBlue text-white text-[10px] font-bold p-1 mb-1 break-inside-avoid rounded-sm">
                                    <span className="w-[60%] pl-1">Tên sản phẩm</span>
                                    <span className="w-[15%] text-center">ĐVT</span>
                                    <span className="w-[25%] text-right pr-1">Giá</span>
                                </div>
                             );
                        }

                        if (item.type === 'product') {
                            if (item.hasSpecs && !item.hasDiscount) {
                                return (
                                    <div key={idx} className="flex border-b border-gray-100 py-1 break-inside-avoid text-[11px] font-roboto text-wecare-charcoal leading-tight hover:bg-gray-50 items-start">
                                        <span className="w-[30%] pl-1 font-medium pr-1">
                                            <HighlightedText text={item.model || ''} term={highlightTerm} />
                                        </span>
                                        <span className="w-[10%] text-gray-500 text-center">{item.size}</span>
                                        <span className="w-[25%] text-gray-500 pl-1 pr-1 whitespace-normal">{item.specification || '-'}</span>
                                        <span className="w-[10%] text-gray-500 text-center">{item.moq || '-'}</span>
                                        <span className="w-[25%] text-right pr-1 font-medium text-wecare-darkBlue">{item.price}</span>
                                    </div>
                                );
                            }
                            if (item.hasDiscount) {
                                return (
                                    <div key={idx} className="flex border-b border-gray-100 py-1 break-inside-avoid text-[11px] font-roboto text-wecare-charcoal leading-tight hover:bg-gray-50 items-center">
                                        <span className="w-[35%] pl-1 font-medium pr-1">
                                            <HighlightedText text={item.model || ''} term={highlightTerm} />
                                        </span>
                                        <span className="w-[10%] text-gray-500 text-center">{item.size}</span>
                                        <span className="w-[25%] text-right pr-2 text-gray-400 line-through decoration-gray-400">{item.price}</span>
                                        <span className="w-[30%] text-right pr-1 font-bold text-red-600">
                                            {item.discountedPrice || item.price}
                                        </span>
                                    </div>
                                );
                            }
                            return (
                                <div key={idx} className="flex border-b border-gray-100 py-1 break-inside-avoid text-[11px] font-roboto text-wecare-charcoal leading-tight hover:bg-gray-50 items-start">
                                    <span className="w-[60%] pl-1 font-medium pr-1">
                                        <HighlightedText text={item.model || ''} term={highlightTerm} />
                                    </span>
                                    <span className="w-[15%] text-gray-500 text-center">{item.size}</span>
                                    <span className="w-[25%] text-right pr-1 font-medium text-wecare-darkBlue">{item.price}</span>
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>
            </div>

            <div className="mt-1 pt-1 border-t border-wecare-lightGrey text-[11px] text-wecare-mediumGrey text-center shrink-0">
                * Giá đã bao gồm VAT. Liên hệ hotline để có chiết khấu tốt nhất.
            </div>
        </div>
      );
  };

  return (
    <div 
      ref={ref} 
      className="bg-white shadow-sm overflow-hidden relative border border-gray-200 h-full w-full group"
      style={{ backfaceVisibility: 'hidden' }}
    >
        <div className={`absolute inset-y-0 w-6 pointer-events-none z-20 opacity-10 bg-gradient-to-r from-black to-transparent left-0`} />

        {isOdd ? (
          <div className="absolute bottom-0 right-0 w-8 h-8 pointer-events-none z-30" style={{
            background: 'linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.1) 50%, rgba(255,255,255,0.8) 55%, #f1f1f1 100%)',
            boxShadow: '-1px -1px 2px rgba(0,0,0,0.05)'
          }} />
        ) : (
           <div className="absolute bottom-0 left-0 w-8 h-8 pointer-events-none z-30" style={{
            background: 'linear-gradient(-135deg, transparent 50%, rgba(0,0,0,0.1) 50%, rgba(255,255,255,0.8) 55%, #f1f1f1 100%)',
            boxShadow: '1px -1px 2px rgba(0,0,0,0.05)'
          }} />
        )}

        {page.type === 'table' ? renderFlowContent() : 
         page.type === 'cover' ? renderCoverContent() : 
         renderStandardContent()}

        {page.type !== 'cover' && (
          <div className="absolute bottom-2 left-4 right-4 flex justify-between items-end pointer-events-none select-none">
            <span className="font-lexend text-2xl text-wecare-darkBlue font-black">{page.id}</span>
            <div className="w-6 h-6 rounded-full border border-wecare-lightGrey flex items-center justify-center bg-white/80 backdrop-blur-sm">
                <img src={FALLBACK_LOGO} alt="logo" className="w-3 opacity-100" />
            </div>
          </div>
        )}
    </div>
  );
}));

CatalogPage.displayName = 'CatalogPage';
