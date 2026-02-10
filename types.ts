
export type CatalogItemType = 'group_header' | 'table_header' | 'product' | 'toc_entry';

export interface CatalogItem {
  type: CatalogItemType;
  // Common fields
  id?: string;

  // Product fields
  model?: string;
  size?: string; // Unit
  price?: string;
  discountedPrice?: string; // New: Giá ưu đãi
  specification?: string; // New: Quy cách
  moq?: string;           // New: MOQ

  // Group Header fields
  title?: string;
  count?: number;
  image?: string;
  desc?: string;

  // TOC specific
  pageReference?: number;

  // Layout weighting
  weight?: number;

  // Flag to trigger detailed layout
  hasSpecs?: boolean;
  hasDiscount?: boolean; // New: Flag to trigger discount column
}

export interface CatalogPage {
  id: number;
  title: string;
  image?: string; // Optional for table pages
  content?: string;
  section: string;
  type: 'standard' | 'table' | 'cover';
  columnLayout?: 'single' | 'double';

  // Replaced tableRows with polymorphic items for flexible layout
  items?: CatalogItem[];

  // Legacy support optional if needed, but we will migrate away
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tableRows?: any[]; // Legacy support
}

export interface TableOfContentsItem {
  id: string;
  title: string;
  pageNumber: number;
  children?: TableOfContentsItem[];
}

export interface CRMProductGroup {
  "crdfd_manhomsp"?: string; // Join Key
  "cr1bb_kienthuccoban"?: string; // Basic Knowledge
  "crdfd_productgroupid"?: string; // Primary Key GUID
  "_crdfd_cap2_value"?: string; // Industry Category (Level 2) for Filtering
  "cr1bb_filehinhanh"?: string; // Filename if exists
  "cr1bb_nhomhang"?: string; // Margin builder product check
  "cr1bb_nhomhang@OData.Community.Display.V1.FormattedValue"?: string; // Formatted Value
}

export interface CRMProductSpecification {
  "crdfd_productspecificationid"?: string;
  "_crdfd_onvi_value@OData.Community.Display.V1.FormattedValue"?: string; // Formatted Unit
  "_crdfd_sanpham_value@OData.Community.Display.V1.FormattedValue"?: string; // Formatted Product Name
  "_crdfd_sanpham_value"?: string; // Product ID (Join Key)
  "crdfd_quycachacbiet"?: string; // Specification
  "crdfd_moqbanra"?: number; // MOQ
}

export interface CRMCustomer {
  "crdfd_customerid"?: string;
  "crdfd_name"?: string;
  "crdfd_trangthaikhtext"?: string;
  "crdfd_trangthaicskh@OData.Community.Display.V1.FormattedValue"?: string;
  "crdfd_wecare_rewards"?: string | number;
  "crdfd_wecare_rewards@OData.Community.Display.V1.FormattedValue"?: string;
}

export interface CRMProduct {
  // The raw field names from Dynamics 365
  "_crdfd_sanpham_value@OData.Community.Display.V1.FormattedValue"?: string; // Product Name
  "crdfd_onvichuan"?: string; // Unit
  "crdfd_gia"?: number; // Price
  "crdfd_gia@OData.Community.Display.V1.FormattedValue"?: string; // Formatted Price
  "cr1bb_nhomsanpham"?: string; // Group (Raw)
  "_cr1bb_nhomsanpham_value@OData.Community.Display.V1.FormattedValue"?: string; // Group (Formatted if lookup)
  "crdfd_nhommargin"?: string; // Added field for name suffix logic
  "crdfd_nhommargin@OData.Community.Display.V1.FormattedValue"?: string; // Formatted Value
  "cr1bb_giakhongvat"?: number; // Price without VAT used for discount calculation
  "cr1bb_gtgt"?: number; // VAT rate (e.g., 0.08, 0.1)

  // Fields joined from crdfd_products table
  "crdfd_manhomsp"?: string;
  "cr1bb_imageurl"?: string;

  // Filter fields
  "_crdfd_nhomoituong_value@OData.Community.Display.V1.FormattedValue"?: string;
  "statecode"?: number;
  "crdfd_trangthaihieuluc"?: number;
  "crdfd_pricingdeactive"?: number;

  // Enriched Data (Added via code)
  "enriched_description"?: string;
  "enriched_group_id"?: string;
  "enriched_industry_id"?: string; // ID for Water/Electric/Metal filtering
  "enriched_group_image"?: string; // Calculated image (Group File OR Random Product Image)
  "enriched_group_type"?: string; // From cr1bb_nhomhang (e.g. "Margin builder product")

  // New Specification Data
  "enriched_specification"?: string;
  "enriched_moq"?: number;
  "enriched_spec_unit"?: string; // Unit from Spec table might differ

  // Catch-all for other props
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // Dynamic OData annotation keys
}
