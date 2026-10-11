/**
 * Campus Lost & Found System - Client Configuration
 */
const CONFIG = {
  // Supabase Configuration
  // Default fallback or read from window/storage
  SUPABASE_URL: window.ENV_SUPABASE_URL || localStorage.getItem('cfg_sb_url') || 'https://xyzcompany.supabase.co',
  SUPABASE_ANON_KEY: window.ENV_SUPABASE_ANON_KEY || localStorage.getItem('cfg_sb_anon') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy',

  // API Base Endpoint
  API_BASE: '/api',

  // Valid item categories
  CATEGORIES: [
    'Phone',
    'Laptop/System',
    'Wallet',
    'ID Card',
    'Keys',
    'Books',
    'Bag',
    'Earphones',
    'Watch',
    'Other',
  ],

  // Category Icon Mapping (Lucide icon names)
  CATEGORY_ICONS: {
    'Phone': 'smartphone',
    'Laptop/System': 'laptop',
    'Wallet': 'wallet',
    'ID Card': 'credit-card',
    'Keys': 'key',
    'Books': 'book-open',
    'Bag': 'briefcase',
    'Earphones': 'headphones',
    'Watch': 'watch',
    'Other': 'box',
  },

  // Category default placeholder illustrations/colors
  CATEGORY_COLORS: {
    'Phone': '#6366f1',
    'Laptop/System': '#3b82f6',
    'Wallet': '#f59e0b',
    'ID Card': '#10b981',
    'Keys': '#ec4899',
    'Books': '#8b5cf6',
    'Bag': '#14b8a6',
    'Earphones': '#06b6d4',
    'Watch': '#f97316',
    'Other': '#64748b',
  },

  // Auto-sync config from backend server
  async syncServerConfig() {
    try {
      const res = await fetch(`${this.API_BASE}/config`);
      if (res.ok) {
        const data = await res.json();
        if (data.supabaseUrl && data.supabaseAnonKey) {
          this.SUPABASE_URL = data.supabaseUrl;
          this.SUPABASE_ANON_KEY = data.supabaseAnonKey;
          localStorage.setItem('cfg_sb_url', data.supabaseUrl);
          localStorage.setItem('cfg_sb_anon', data.supabaseAnonKey);
          return true;
        }
      }
    } catch (e) {
      // Ignored if offline or serverless
    }
    return false;
  },
};

// Make accessible on window
window.CONFIG = CONFIG;

// Immediately trigger background sync if running on hosted origin
if (typeof fetch !== 'undefined') {
  CONFIG.syncServerConfig();
}
