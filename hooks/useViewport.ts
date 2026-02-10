import { useState, useEffect, useCallback } from 'react';
import { BASE_PAGE_WIDTH, MIN_ZOOM, MAX_ZOOM } from '../config';

/**
 * Hook quản lý viewport: mobile detection, zoom level, resize handling.
 */
export function useViewport() {
    const calculateResponsiveZoom = useCallback(() => {
        const width = window.innerWidth;
        if (width < 768) {
            return Math.min((width - 32) / BASE_PAGE_WIDTH, 1.0);
        }
        return 0.85;
    }, []);

    const [zoomLevel, setZoomLevel] = useState(calculateResponsiveZoom);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            setZoomLevel(calculateResponsiveZoom());
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [calculateResponsiveZoom]);

    const handleZoomIn = useCallback(() => {
        setZoomLevel(prev => Math.min(prev + 0.1, MAX_ZOOM));
    }, []);

    const handleZoomOut = useCallback(() => {
        setZoomLevel(prev => Math.max(prev - 0.1, MIN_ZOOM));
    }, []);

    return {
        zoomLevel,
        setZoomLevel,
        isMobile,
        handleZoomIn,
        handleZoomOut,
    };
}
