
import { CatalogPage, TableOfContentsItem, CRMProduct, CatalogItem, CRMCustomer } from '../types';



const STATIC_IMAGES = {
    cover: "https://image2url.com/images/1765513580412-dc31c3b9-944d-4f96-b44a-4a85216efb77.jpg",
    intro: "https://image2url.com/images/1766024464521-74c5b723-7505-4eda-ab09-f2b49e96212a.png",
    appendix: "https://images.unsplash.com/photo-1581093588401-fbb0736527a1?q=80&w=1200&auto=format&fit=crop"
};

// Use Google Drive thumbnail endpoint to avoid quota/disposition errors
const COVER_IMAGES: Record<string, string> = {
    default: "https://image2url.com/images/1765513580412-dc31c3b9-944d-4f96-b44a-4a85216efb77.jpg",
    electric: "https://drive.google.com/thumbnail?id=1eNHxhMNDA6vupInDa36aebOfR5VElrUQ&sz=w2500",
    water: "https://drive.google.com/thumbnail?id=1jF956NW_K81CaiQt5AKxM4yb8YbBfWvK&sz=w2500",
    metal: "https://drive.google.com/thumbnail?id=1Uz216gEpfE2WmE8lMOMnUDF_TIEK-ZO7&sz=w2500"
};

const getFallbackGroupImage = (groupName: string): string => {
    const lower = groupName.toLowerCase();
    if (lower.includes('bu lông') || lower.includes('bolt')) return "https://images.unsplash.com/photo-1616405391509-5a1e8a8b0c84?q=80&w=800&auto=format&fit=crop";
    if (lower.includes('ốc') || lower.includes('vít') || lower.includes('screw')) return "https://images.unsplash.com/photo-1504198322253-cfa87a0ff25f?q=80&w=800&auto=format&fit=crop";
    if (lower.includes('đai ốc') || lower.includes('nut')) return "https://images.unsplash.com/photo-1622325367699-f5383a651f67?q=80&w=800&auto=format&fit=crop";
    return "https://images.unsplash.com/photo-1589985902809-39d10d64201d?q=80&w=800&auto=format&fit=crop";
};

// --- CONFIGURATION ---
const MAX_WEIGHT_PER_PAGE = 48;
const ITEMS_PER_TOC_PAGE = 80;
const WEIGHTS = {
    PRODUCT_ROW: 1.0,   // Standard row
    TABLE_HEADER: 2.0,  // Reduced header weight
    GROUP_HEADER: 3.5   // Reduced significantly
};

// Reusable formatters and regex for performance
const currencyFormatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const NUMBER_REGEX = /số\s*(\d+)/i;

// Discount Matrix based on User Requirement
// Structure: [RewardTier][MarginGroup] = DiscountRate
// Margin Groups assumed: B1, B2, C1, C2, D1, D2 (Mapping the last "C2" in input to "D2")
const DISCOUNT_RATES: Record<string, Record<string, number>> = {
    "Diamond": {
        "B1": 0.01,
        "B2": 0.015,
        "C1": 0.02,
        "C2": 0.025,
        "D1": 0.035,
        "D2": 0.04 // Assumed last item is D2
    },
    "Platium": { // Note: Input spelling "Platium" kept as key, but we'll match variations
        "B1": 0.008,
        "B2": 0.013,
        "C1": 0.018,
        "C2": 0.022,
        "D1": 0.03,
        "D2": 0.035
    },
    "Gold": {
        "B1": 0.005,
        "B2": 0.01,
        "C1": 0.013,
        "C2": 0.02,
        "D1": 0.025,
        "D2": 0.027
    },
    "Silver": {
        "B1": 0.0,
        "B2": 0.08, // As per input
        "C1": 0.01,
        "C2": 0.015,
        "D1": 0.02,
        "D2": 0.02
    }
};

const normalizeReward = (reward: string): string | null => {
    if (!reward) return null;
    const r = reward.toLowerCase();
    if (r.includes('diamond')) return 'Diamond';
    if (r.includes('platium') || r.includes('platinum')) return 'Platium';
    if (r.includes('gold')) return 'Gold';
    // Logic update: "New" implies "Silver" benefits
    if (r.includes('silver') || r === 'new' || r.includes('new')) return 'Silver';
    return null;
};

const getMarginGroupCode = (groupStr: string): string | null => {
    if (!groupStr || typeof groupStr !== 'string') return null;
    const upper = groupStr.toUpperCase();
    if (upper.includes("B1")) return "B1";
    if (upper.includes("B2")) return "B2";
    if (upper.includes("C1")) return "C1";
    if (upper.includes("C2")) return "C2";
    if (upper.includes("D1")) return "D1";
    if (upper.includes("D2")) return "D2";
    return null;
};

// Formula: (PriceNoVAT - (PriceNoVAT * DiscountRate)) * (1 + VAT)
const calculateDiscountedPrice = (product: CRMProduct, customer: CRMCustomer | null): number | null => {
    if (!customer) return null;

    // 1. Get Reward Tier
    const rewardVal = customer["crdfd_wecare_rewards@OData.Community.Display.V1.FormattedValue"] || customer.crdfd_wecare_rewards;
    const tier = normalizeReward(typeof rewardVal === 'string' ? rewardVal : '');

    if (!tier || !DISCOUNT_RATES[tier]) return null;

    // 2. Get Margin Group
    const marginGroup = getMarginGroupCode(product.crdfd_nhommargin || "");
    if (!marginGroup) return null;

    // 3. Get Discount Rate
    const rate = DISCOUNT_RATES[tier][marginGroup];
    if (rate === undefined) return null;

    // 4. Get Price Components
    const priceNoVat = product.cr1bb_giakhongvat;
    const vatRate = product.cr1bb_gtgt;

    if (priceNoVat == null || vatRate == null) return null;

    // 5. Calculate
    // (PriceNoVAT - (PriceNoVAT * Rate)) * (1 + VAT)
    const discounted = (priceNoVat - (priceNoVat * rate)) * (1 + vatRate);

    return Math.round(discounted);
};


export const generatePagesFromData = (products: CRMProduct[], filter: string = 'all', selectedCustomer: CRMCustomer | null = null) => {
    // --- 1. PREPARE DATA GROUPS ---
    const groupedProducts: Record<string, { products: CRMProduct[], desc: string, groupImage?: string }> = {};

    // Single pass loop
    for (const p of products) {
        const groupName = p["_cr1bb_nhomsanpham_value@OData.Community.Display.V1.FormattedValue"] || p["cr1bb_nhomsanpham"] || "Sản phẩm khác";
        if (!groupedProducts[groupName]) {
            groupedProducts[groupName] = {
                products: [],
                desc: p.enriched_description || "Sản phẩm chất lượng cao từ Wecare.",
                groupImage: p.enriched_group_image
            };
        }
        groupedProducts[groupName].products.push(p);
    }

    const sortedGroups = Object.keys(groupedProducts).sort((a, b) => a.localeCompare(b, 'vi'));

    // --- 2. GENERATE CONTENT PAGES (Intermediate Step) ---
    const contentPages: Omit<CatalogPage, 'id'>[] = [];
    let currentPageItems: CatalogItem[] = [];
    let currentLoad = 0;

    const flushPage = () => {
        if (currentPageItems.length === 0) return;
        contentPages.push({
            title: "Danh mục sản phẩm",
            section: "Danh mục",
            type: 'table',
            columnLayout: 'double',
            items: [...currentPageItems]
        });
        currentPageItems = [];
        currentLoad = 0;
    };

    // Define flag to check if we should apply discount logic (Only for Metal)
    const shouldApplyDiscount = filter === 'metal';

    for (const groupName of sortedGroups) {
        const groupData = groupedProducts[groupName];

        const groupProducts = groupData.products.sort((a, b) => {
            const nameA = a["_crdfd_sanpham_value@OData.Community.Display.V1.FormattedValue"] || "";
            const nameB = b["_crdfd_sanpham_value@OData.Community.Display.V1.FormattedValue"] || "";

            // Custom sort for 'Pát ke Góc' using hoisted Regex
            if (groupName.toLowerCase().includes('pát ke góc') || groupName.toLowerCase().includes('pat ke goc')) {
                const getNum = (s: string) => {
                    const match = s.match(NUMBER_REGEX);
                    return match ? parseInt(match[1], 10) : 0;
                };
                const numA = getNum(nameA);
                const numB = getNum(nameB);

                if (numA !== 0 || numB !== 0) {
                    if (numA !== numB) return numA - numB;
                }
            }
            return nameA.localeCompare(nameB, 'vi', { numeric: true });
        });

        const groupImage = groupData.groupImage || getFallbackGroupImage(groupName);

        const groupHasSpecs = groupProducts.some(p =>
            (p.enriched_specification && p.enriched_specification.trim() !== '') ||
            (p.enriched_moq && p.enriched_moq > 0)
        );

        // Check if this group generates any discount prices
        const groupHasDiscount = shouldApplyDiscount && selectedCustomer && groupProducts.some(p => {
            // Add condition: Group Type must be 'Margin builder product'
            if (!p.enriched_group_type || !p.enriched_group_type.toLowerCase().includes('margin builder product')) return false;

            // Fail fast optimization: if calculateDiscountedPrice returns non-null, we stop
            const dPrice = calculateDiscountedPrice(p, selectedCustomer);
            return dPrice !== null;
        });

        const MIN_REQUIRED_ROWS = 1;
        const spaceRequiredForHeader = WEIGHTS.GROUP_HEADER + WEIGHTS.TABLE_HEADER + (MIN_REQUIRED_ROWS * WEIGHTS.PRODUCT_ROW);

        if (currentLoad + spaceRequiredForHeader > MAX_WEIGHT_PER_PAGE) {
            flushPage();
        }

        // Add Group Header
        currentPageItems.push({
            type: 'group_header',
            title: groupName,
            count: groupProducts.length,
            image: groupImage,
            desc: groupData.desc,
            weight: WEIGHTS.GROUP_HEADER
        });

        // Add Table Header
        currentPageItems.push({
            type: 'table_header',
            weight: WEIGHTS.TABLE_HEADER,
            hasSpecs: groupHasSpecs,
            hasDiscount: !!groupHasDiscount
        });

        currentLoad += (WEIGHTS.GROUP_HEADER + WEIGHTS.TABLE_HEADER);

        // Add Products
        for (const p of groupProducts) {
            const name = p["_crdfd_sanpham_value@OData.Community.Display.V1.FormattedValue"] || "Sản phẩm không tên";
            const unit = p["crdfd_onvichuan"] || p.enriched_spec_unit || "-";

            let price = "Liên hệ";
            if (p["crdfd_gia"] !== undefined && p["crdfd_gia"] !== null) {
                // Use Cached Formatter
                price = currencyFormatter.format(p["crdfd_gia"]);
            } else if (p["crdfd_gia@OData.Community.Display.V1.FormattedValue"]) {
                price = p["crdfd_gia@OData.Community.Display.V1.FormattedValue"].replace(/\.00$/, '').replace(/\.00\s?₫?$/, '');
            }

            // CALC DISCOUNT PRICE
            let discountPriceStr: string | undefined = undefined;

            // Apply Discount logic only if Metal AND Margin builder product
            if (shouldApplyDiscount && p.enriched_group_type && p.enriched_group_type.toLowerCase().includes('margin builder product')) {
                const discountVal = calculateDiscountedPrice(p, selectedCustomer);
                if (discountVal !== null) {
                    discountPriceStr = currencyFormatter.format(discountVal);
                }
            }

            let rowWeight = WEIGHTS.PRODUCT_ROW;
            const nameLen = name.length;
            const specLen = p.enriched_specification ? p.enriched_specification.length : 0;

            if (nameLen > 50) rowWeight += 0.4;
            if (nameLen > 90) rowWeight += 0.4;

            if (groupHasSpecs && p.enriched_specification) {
                if (specLen > 50) rowWeight += 0.3;
                if (specLen > 90) rowWeight += 0.3;
            }

            const item: CatalogItem = {
                type: 'product',
                model: name,
                size: unit,
                price: price,
                discountedPrice: discountPriceStr,
                weight: rowWeight,
                specification: p.enriched_specification,
                moq: p.enriched_moq ? p.enriched_moq.toString() : undefined,
                hasSpecs: groupHasSpecs,
                hasDiscount: !!groupHasDiscount
            };

            if (currentLoad + item.weight! > MAX_WEIGHT_PER_PAGE) {
                flushPage();
                currentPageItems.push({
                    type: 'table_header',
                    weight: WEIGHTS.TABLE_HEADER,
                    hasSpecs: groupHasSpecs,
                    hasDiscount: !!groupHasDiscount
                });
                currentLoad += WEIGHTS.TABLE_HEADER;
            }

            currentPageItems.push(item);
            currentLoad += item.weight!;
        }
    }
    flushPage();

    // --- 3. ASSEMBLE FINAL PAGES WITH POST-CALCULATED IDs ---
    const finalPages: CatalogPage[] = [];

    // 3a. Cover (ID 1)
    let coverImage = COVER_IMAGES.default;
    if (filter === 'electric') coverImage = COVER_IMAGES.electric;
    else if (filter === 'water') coverImage = COVER_IMAGES.water;
    else if (filter === 'metal') coverImage = COVER_IMAGES.metal;

    finalPages.push({
        id: 0,
        title: "Bảng Giá Vật Tư Wecare 2026",
        section: "Trang bìa",
        type: 'cover',
        image: coverImage,
        content: ""
    });

    // 3b. Intro (ID 2)
    finalPages.push({
        id: 0,
        title: "Giới thiệu chung",
        section: "Giới thiệu",
        type: 'standard',
        image: STATIC_IMAGES.intro,
        content: `Cung cấp giải pháp cung ứng vật tư, nguyên vật liệu, phụ kiện cho nhà máy, ngành công nghiệp.

Trụ sở 1:
14-16-18-20, Đường 36, P. Bình Phú, Q6, HCM
📞 0983 161 162

Trụ sở 2:
Lô B39, Khu Công nghiệp Phú Tài, Phường Quy Nhơn Bắc, Tỉnh Gia Lai
📞 +84 378 339 009

Email: support@wecare.com.vn`
    });

    // 3c. Reserve TOC Pages
    const numTocPages = Math.ceil(sortedGroups.length / ITEMS_PER_TOC_PAGE) || 1;
    const tocPageIndices: number[] = [];

    for (let i = 0; i < numTocPages; i++) {
        tocPageIndices.push(finalPages.length);
        finalPages.push({
            id: 0,
            title: i === 0 ? "Mục Lục" : "Mục Lục (tiếp)",
            section: "Mục lục",
            type: 'table',
            columnLayout: 'double',
            items: []
        });
    }

    // 3d. Add Content Pages
    contentPages.forEach(p => finalPages.push({ ...p, id: 0 }));

    // 3e. Appendix
    finalPages.push({
        id: 0,
        title: "Phụ lục",
        section: "Kết thúc",
        type: 'standard',
        image: STATIC_IMAGES.appendix,
        content: "Cảm ơn quý khách đã xem bảng giá Wecare."
    });

    // --- PASS 2: ASSIGN IDs & MAP CONTENT ---
    const groupPageMap: Record<string, number> = {};

    finalPages.forEach((page, index) => {
        page.id = index + 1;

        if (page.items) {
            page.items.forEach(item => {
                if (item.type === 'group_header' && item.title) {
                    if (!groupPageMap[item.title]) {
                        groupPageMap[item.title] = page.id;
                    }
                }
            });
        }
    });

    // --- PASS 3: POPULATE TOC PAGES & SIDEBAR ---
    const sidebarToc: TableOfContentsItem[] = [
        { id: 'cover', title: 'Trang bìa', pageNumber: 1 },
        { id: 'intro', title: 'Giới thiệu', pageNumber: 2 },
    ];
    if (tocPageIndices.length > 0) {
        sidebarToc.push({ id: 'toc', title: 'Mục lục', pageNumber: tocPageIndices[0] + 1 });
    }

    // Update TOC Pages content
    tocPageIndices.forEach((pageIndex, i) => {
        const startIdx = i * ITEMS_PER_TOC_PAGE;
        const endIdx = startIdx + ITEMS_PER_TOC_PAGE;
        const entries = sortedGroups.slice(startIdx, endIdx);

        const items: CatalogItem[] = entries.map((name, idxInPage) => ({
            type: 'toc_entry',
            title: `${startIdx + idxInPage + 1}. ${name}`,
            pageReference: groupPageMap[name] || finalPages[finalPages.length - 1].id
        }));

        finalPages[pageIndex].items = items;
    });

    // Populate Sidebar
    sortedGroups.forEach((name, idx) => {
        sidebarToc.push({
            id: `group_${idx}`,
            title: `${idx + 1}. ${name}`,
            pageNumber: groupPageMap[name] || finalPages[finalPages.length - 1].id
        });
    });

    sidebarToc.push({ id: 'end', title: 'Kết thúc', pageNumber: finalPages[finalPages.length - 1].id });

    return { pages: finalPages, toc: sidebarToc };
};
