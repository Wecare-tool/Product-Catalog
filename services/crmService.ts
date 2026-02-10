
import { CRMProduct, CRMProductGroup, CRMProductSpecification, CRMCustomer } from '../types';

// Helper function to fetch all pages of a specific entity
const fetchAllPages = async <T>(url: string, accessToken: string): Promise<T[]> => {
  let allRecords: T[] = [];
  let currentUrl: string | null = url;

  while (currentUrl) {
    const response: Response = await fetch(currentUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Prefer': 'odata.include-annotations="*"'
      }
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`CRM Fetch Error for URL ${currentUrl}`);
      console.error(`Status: ${response.status} ${response.statusText}`);
      console.error(`Details: ${errorBody}`);
      // Break loop on error but return what we have
      break;
    }

    const data = await response.json();
    if (data.value && Array.isArray(data.value)) {
      allRecords = [...allRecords, ...data.value];
    }
    currentUrl = data['@odata.nextLink'] || null;
  }
  return allRecords;
};

export const fetchCustomers = async (accessToken: string): Promise<CRMCustomer[]> => {
  const BASE_URL = "https://wecare-ii.crm5.dynamics.com/api/data/v9.2";

  try {
    console.log("Fetching Customers...");

    // Updated filter based on user request:
    // 1. statecode eq 0 (Active)
    // 2. crdfd_trangthaikhtext eq 'Khách Hàng Chính Thức'
    // 3. crdfd_trangthaicskh ne 283640002 (Loại trừ trạng thái chăm sóc cụ thể)
    // 4. Region: 'Miền Nam' (Filtered via Expand + Client Side check to be robust)

    const select = "?$select=crdfd_name,crdfd_customerid,crdfd_trangthaikhtext,crdfd_trangthaicskh,crdfd_wecare_rewards";
    // Expand TinhThanh to access VungMien label
    const expand = "&$expand=crdfd_Tinhthanh($select=cr1bb_vungmien)";

    // Server-side filter (Removed the hardcoded ID filter for region)
    const filter = "&$filter=statecode eq 0 and crdfd_trangthaikhtext eq 'Khách Hàng Chính Thức' and crdfd_trangthaicskh ne 283640002";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawCustomers = await fetchAllPages<any>(
      `${BASE_URL}/crdfd_customers${select}${expand}${filter}`,
      accessToken
    );

    // Client-side Filter for "Miền Nam"
    const customers = rawCustomers.filter(c => {
      const regionObj = c.crdfd_Tinhthanh;
      const regionName = regionObj ? regionObj["cr1bb_vungmien@OData.Community.Display.V1.FormattedValue"] : "";
      return regionName && regionName.toLowerCase().includes("miền nam");
    });

    console.log(`Fetched ${customers.length} valid customers (Miền Nam).`);
    return customers;

  } catch (error) {
    console.error("Failed to fetch customers:", error);
    return [];
  }
};

export const fetchCatalogData = async (accessToken: string): Promise<CRMProduct[]> => {
  const BASE_URL = "https://wecare-ii.crm5.dynamics.com/api/data/v9.2";

  try {
    // 1. Fetch Price List Items (crdfd_baogiachitiets)
    console.log("Fetching Price List Items...");
    // ADDED: cr1bb_giakhongvat, cr1bb_gtgt
    const itemListSelect = "?$select=_crdfd_sanpham_value,crdfd_onvichuan,crdfd_gia,cr1bb_nhomsanpham,_crdfd_nhomoituong_value,statecode,crdfd_trangthaihieuluc,crdfd_pricingdeactive,crdfd_nhommargin,cr1bb_giakhongvat,cr1bb_gtgt";
    const itemListFilter = "&$filter=statecode eq 0 and crdfd_trangthaihieuluc ne 191920001 and crdfd_pricingdeactive eq 191920001";

    const priceListItems = await fetchAllPages<CRMProduct>(
      `${BASE_URL}/crdfd_baogiachitiets${itemListSelect}${itemListFilter}`,
      accessToken
    );

    if (priceListItems.length === 0) {
      console.warn("CRM returned no price list items.");
      return [];
    }

    // 2. Fetch Products
    console.log("Fetching Products Details (crdfd_productses)...");
    const productSelect = "?$select=crdfd_productsid,crdfd_manhomsp,cr1bb_imageurl"; // Removed crdfd_gtgt from here as we use cr1bb_gtgt from item
    const productFilter = "&$filter=statecode eq 0";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const products = await fetchAllPages<any>(
      `${BASE_URL}/crdfd_productses${productSelect}${productFilter}`,
      accessToken
    );

    // 3. Create Map (crdfd_productsid -> Details)
    const productDetailMap = new Map<string, { groupCode: string, imageUrl: string }>();
    products.forEach(p => {
      if (p.crdfd_productsid) {
        productDetailMap.set(p.crdfd_productsid, {
          groupCode: p.crdfd_manhomsp,
          imageUrl: p.cr1bb_imageurl
        });
      }
    });

    // --- NEW: Fetch Product Specifications ---
    console.log("Fetching Product Specifications...");
    const specSelect = "?$select=_crdfd_onvi_value,crdfd_quycachacbiet,crdfd_moqbanra,_crdfd_sanpham_value";
    // Filter added: statecode eq 0
    const specFilter = "&$filter=statecode eq 0";

    const specifications = await fetchAllPages<CRMProductSpecification>(
      `${BASE_URL}/crdfd_productspecifications${specSelect}${specFilter}`,
      accessToken
    );

    // Map: ProductID -> Specification Data
    const specMap = new Map<string, { spec: string, moq: number, unit: string }>();
    specifications.forEach(s => {
      if (s._crdfd_sanpham_value) {
        specMap.set(s._crdfd_sanpham_value, {
          spec: s.crdfd_quycachacbiet || "",
          moq: s.crdfd_moqbanra || 0,
          unit: s["_crdfd_onvi_value@OData.Community.Display.V1.FormattedValue"] || ""
        });
      }
    });


    // 4. Filter Price List Items (Region Logic: Miền Nam)
    const lookupFormattedKey = "_crdfd_nhomoituong_value@OData.Community.Display.V1.FormattedValue";
    const optionSetFormattedKey = "crdfd_nhomoituong@OData.Community.Display.V1.FormattedValue";

    // Step 4a: Filter by Region Group (Miền Nam)
    const regionFilteredItems = priceListItems.filter((item: CRMProduct) => {
      // Basic check for region group
      const targetGroup = item[lookupFormattedKey] || item[optionSetFormattedKey] || item["_crdfd_nhomoituong_value"] || "";
      return targetGroup && targetGroup.toLowerCase().includes('miền nam');
    });

    // Fallback: Use all items if region filter returns empty
    const itemsToProcess = regionFilteredItems.length > 0 ? regionFilteredItems : priceListItems;

    console.log(`Filtered items count: ${itemsToProcess.length}`);

    // 5. Merge Product Details & Specifications into Price List Items
    const mergedProducts = itemsToProcess.map(item => {
      // The lookup field on Quote Detail is still named _crdfd_sanpham_value (Legacy naming likely)
      const productId = item["_crdfd_sanpham_value"];
      const details = productId ? productDetailMap.get(productId) : undefined;
      const specs = productId ? specMap.get(productId) : undefined;

      // --- NAME MODIFICATION LOGIC ---
      // Get original name
      let finalName = item["_crdfd_sanpham_value@OData.Community.Display.V1.FormattedValue"] || "";

      // Resolve Margin Group Text (OptionSet vs String)
      const marginRaw = item["crdfd_nhommargin"];
      const marginText = item["crdfd_nhommargin@OData.Community.Display.V1.FormattedValue"] || (typeof marginRaw === 'string' ? marginRaw : undefined);

      // Check crdfd_nhommargin using the resolved text
      if (marginText) {
        // Split by space
        const parts = marginText.trim().split(' ');
        // If there is a part after the first space, append it
        if (parts.length > 1) {
          const suffix = parts.slice(1).join(' '); // Join back the rest just in case multiple words exist
          finalName = `${finalName} - ${suffix}`;
        }
      }

      return {
        ...item,
        // OVERRIDE the formatted name with the new one
        "_crdfd_sanpham_value@OData.Community.Display.V1.FormattedValue": finalName,

        // Normalize crdfd_nhommargin to the text value for discount calculation usage
        "crdfd_nhommargin": marginText || undefined,

        crdfd_manhomsp: details?.groupCode,
        cr1bb_imageurl: details?.imageUrl,

        // Note: cr1bb_giakhongvat and cr1bb_gtgt are already on 'item' from step 1

        enriched_specification: specs?.spec,
        enriched_moq: specs?.moq,
        enriched_spec_unit: specs?.unit
      };
    });

    // 6. Group Image Logic (Existing Logic)
    // 6.1 Prepare Product Image Backup Map (Group Code -> Product Image URL)
    const groupBackupImageMap = new Map<string, string>();
    mergedProducts.forEach(p => {
      if (p.crdfd_manhomsp && p.cr1bb_imageurl && !groupBackupImageMap.has(p.crdfd_manhomsp)) {
        groupBackupImageMap.set(p.crdfd_manhomsp, p.cr1bb_imageurl);
      }
    });

    // 7. Fetch Product Groups (crdfd_productgroups)
    console.log("Fetching Product Groups...");
    // UPDATED: Added cr1bb_nhomhang to selection
    const groupSelect = "?$select=crdfd_manhomsp,cr1bb_kienthuccoban,crdfd_productgroupid,_crdfd_cap2_value,cr1bb_filehinhanh,cr1bb_nhomhang";
    const groupFilter = "&$filter=statecode eq 0";

    const allGroups = await fetchAllPages<CRMProductGroup>(
      `${BASE_URL}/crdfd_productgroups${groupSelect}${groupFilter}`,
      accessToken
    );

    // 8. Join Groups
    const groupMap = new Map<string, { desc: string, id: string, industryId: string, imageUrl: string | undefined, groupType: string | undefined }>();

    allGroups.forEach(g => {
      if (g.crdfd_manhomsp) {
        let finalImageUrl: string | undefined = undefined;

        // Logic: 
        // 1. Group Image
        // 2. Fallback to Product Image (using map created from merged product data)
        if (g.cr1bb_filehinhanh) {
          finalImageUrl = `https://wecare-ii.crm5.dynamics.com/api/data/v9.0/crdfd_productgroups(${g.crdfd_productgroupid})/cr1bb_filehinhanh/$value`;
        } else if (groupBackupImageMap.has(g.crdfd_manhomsp)) {
          finalImageUrl = groupBackupImageMap.get(g.crdfd_manhomsp);
        }

        // Resolve Group Type (OptionSet vs String)
        const groupType = g["cr1bb_nhomhang@OData.Community.Display.V1.FormattedValue"] || g["cr1bb_nhomhang"];

        groupMap.set(g.crdfd_manhomsp, {
          desc: g.cr1bb_kienthuccoban || "",
          id: g.crdfd_productgroupid || "",
          industryId: g._crdfd_cap2_value || "",
          imageUrl: finalImageUrl,
          groupType: groupType // Store resolved string Margin builder product
        });
      }
    });

    // 9. Final Enrichment
    const enrichedProducts = mergedProducts.map(p => {
      const groupCode = p.crdfd_manhomsp;
      let enrichment = {};
      if (groupCode && groupMap.has(groupCode)) {
        const groupData = groupMap.get(groupCode);
        enrichment = {
          enriched_description: groupData?.desc,
          enriched_group_id: groupData?.id,
          enriched_industry_id: groupData?.industryId,
          enriched_group_image: groupData?.imageUrl,
          enriched_group_type: groupData?.groupType // Add to product
        };
      }
      return { ...p, ...enrichment };
    });

    console.log(`Final processed products: ${enrichedProducts.length}`);
    return enrichedProducts;

  } catch (error) {
    console.error("Failed to fetch CRM data:", error);
    return [];
  }
};
