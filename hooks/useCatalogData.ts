import { useState, useEffect, useCallback } from 'react';
import { CatalogPage as CatalogPageType, TableOfContentsItem, CRMProduct, CRMCustomer } from '../types';
import { INDUSTRY_IDS } from '../config';
import { getAccessToken } from '../services/authService';
import { fetchCatalogData, fetchCustomers } from '../services/crmService';
import { generatePagesFromData } from '../utils/catalogGenerator';
import { CATALOG_PAGES as FALLBACK_PAGES, TOC_ITEMS as FALLBACK_TOC } from '../constants';

/**
 * Hook quản lý catalog data: fetching, filtering, customer selection.
 */
export function useCatalogData() {
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [allProducts, setAllProducts] = useState<CRMProduct[]>([]);
    const [pages, setPages] = useState<CatalogPageType[]>([]);
    const [tocItems, setTocItems] = useState<TableOfContentsItem[]>([]);
    const [totalProducts, setTotalProducts] = useState<number>(0);
    const [activeFilter, setActiveFilter] = useState<string>('metal');
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [customers, setCustomers] = useState<CRMCustomer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<CRMCustomer | null>(null);

    const updateCatalogData = useCallback((products: CRMProduct[], filter: string, customer: CRMCustomer | null) => {
        let filtered: CRMProduct[] = [];

        if (filter === 'all') {
            filtered = products;
        } else if (filter === 'water') {
            filtered = products.filter(p => p.enriched_industry_id === INDUSTRY_IDS.WATER);
        } else if (filter === 'electric') {
            filtered = products.filter(p => p.enriched_industry_id === INDUSTRY_IDS.ELECTRIC);
        } else if (filter === 'metal') {
            filtered = products.filter(p =>
                p.enriched_industry_id !== INDUSTRY_IDS.WATER &&
                p.enriched_industry_id !== INDUSTRY_IDS.ELECTRIC
            );
        }

        setTotalProducts(filtered.length);

        if (filtered.length === 0) {
            setPages([]);
            setTocItems([]);
        } else {
            const generated = generatePagesFromData(filtered, filter, customer);
            setPages(generated.pages);
            setTocItems(generated.toc);
        }
    }, []);

    // Init: fetch auth token + CRM data
    useEffect(() => {
        const initApp = async () => {
            try {
                const tokenData = await getAccessToken();

                if (tokenData && tokenData.access_token) {
                    setAccessToken(tokenData.access_token);

                    const [crmData, customerList] = await Promise.all([
                        fetchCatalogData(tokenData.access_token),
                        fetchCustomers(tokenData.access_token),
                    ]);

                    if (customerList.length > 0) {
                        setCustomers(customerList);
                    }

                    if (crmData.length > 0) {
                        setAllProducts(crmData);
                        updateCatalogData(crmData, 'metal', null);
                    } else {
                        setTotalProducts(0);
                        setErrorMsg('Connected to CRM but found no products matching the criteria.');
                    }
                } else {
                    console.warn('Failed to get token.');
                    setErrorMsg('Failed to retrieve access token. Please check the Power Automate connection.');
                }
            } catch (err) {
                console.error('Initialization error:', err);
                setErrorMsg('An unexpected error occurred during initialization.');
            } finally {
                setIsLoading(false);
            }
        };

        initApp();
    }, [updateCatalogData]);

    // Re-generate when customer changes
    useEffect(() => {
        if (allProducts.length > 0) {
            updateCatalogData(allProducts, activeFilter, selectedCustomer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCustomer]);

    const handleFilterChange = useCallback((newFilter: string, bookRef: { current: any }) => {
        setActiveFilter(newFilter);
        updateCatalogData(allProducts, newFilter, selectedCustomer);

        setTimeout(() => {
            try {
                if (bookRef.current) {
                    const flipObject = bookRef.current.pageFlip();
                    if (flipObject) {
                        flipObject.turnToPage(0);
                    }
                }
            } catch (e) {
                console.error('Flip error', e);
            }
        }, 100);
    }, [allProducts, selectedCustomer, updateCatalogData]);

    const loadDemoData = useCallback(() => {
        setPages(FALLBACK_PAGES);
        setTocItems(FALLBACK_TOC);
        setTotalProducts(57);
        setErrorMsg(null);
    }, []);

    return {
        isLoading,
        errorMsg,
        pages,
        tocItems,
        totalProducts,
        activeFilter,
        accessToken,
        customers,
        selectedCustomer,
        setSelectedCustomer,
        handleFilterChange,
        loadDemoData,
    };
}
