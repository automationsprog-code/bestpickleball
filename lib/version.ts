/**
 * APP_DATA_VERSION - bump this string every time you make a breaking change
 * to courts, bookings, or settings data so that ALL devices (incognito, mobile,
 * other browsers) immediately discard their stale localStorage on next load.
 */
export const APP_DATA_VERSION = 'v2026-09-21-06';

const VERSION_KEY = 'balamban_app_data_version';

const CACHE_KEYS = [
  'balamban_pickleball_courts',
  'balamban_custom_created_courts',
  'balamban_deleted_court_ids',
  'balamban_pickleball_admin_settings',
  'balamban_pickleball_bookings',
];

/**
 * Call this ONCE at app startup (before any data is read).
 * If the stored version does not match APP_DATA_VERSION, ALL local caches
 * are wiped so every device fetches fresh data from Supabase.
 */
export function purgeStaleLocalCaches(): void {
  if (typeof window === 'undefined') return;

  try {
    const stored = localStorage.getItem(VERSION_KEY);
    if (stored !== APP_DATA_VERSION) {
      console.info('[Cache] Version mismatch. Purging stale local caches...');
      CACHE_KEYS.forEach((key) => localStorage.removeItem(key));
      localStorage.setItem(VERSION_KEY, APP_DATA_VERSION);
      console.info('[Cache] Purge complete. Fresh data will be fetched from Supabase.');
    }
  } catch (e) {
    console.error('[Cache] Failed to check/purge version:', e);
  }
}