/**
 * Centralized Configuration — Wecare Digital Catalogue
 * All hardcoded values consolidated here for easy maintenance.
 */

// --- Branding ---
export const WECARE_LOGO = 'https://i.imgur.com/tD07Yrv.png';

// --- Industry Filter IDs (Dynamics 365 GUIDs) ---
export const INDUSTRY_IDS = {
    WATER: '7c9f66a1-af65-ef11-a670-000d3aa290f1',
    ELECTRIC: '0c6ebf33-11c9-4fc6-b236-49f46f9d0b4c',
} as const;

// --- Auth ---
export const AUTH_API_URL =
    'https://de210e4bcd22e60591ca8e841aad4b.8e.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/0b067a6d21a641deb6e1450e16428cd5/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=HMG_Cm5e3SlSGkF5gfcjdFF_qIx0aYGwyFh8cAuNA3w';

// --- Layout (A4 Standard at ~72 PPI) ---
export const BASE_PAGE_WIDTH = 595;
export const BASE_PAGE_HEIGHT = 842;

// --- Zoom Limits ---
export const MIN_ZOOM = 0.4;
export const MAX_ZOOM = 2.5;

// --- App ---
export const APP_VERSION = 'v1.2.0';
