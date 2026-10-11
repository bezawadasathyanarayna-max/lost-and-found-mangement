/**
 * Campus Lost & Found System - Authentication Module
 * Supports both Supabase Auth and Instant Local Session Fallback
 */

// Initialize Supabase client
let supabaseClient = null;
let currentSbUrl = '';

function isSupabaseConfigured() {
  const cfgUrl = window.CONFIG?.SUPABASE_URL || '';
  return cfgUrl && 
    !cfgUrl.includes('your-project') && 
    !cfgUrl.includes('xyzcompany') && 
    cfgUrl.startsWith('https://');
}

function getSupabase() {
  const cfgUrl = window.CONFIG?.SUPABASE_URL;
  const cfgKey = window.CONFIG?.SUPABASE_ANON_KEY;

  if (!supabaseClient || currentSbUrl !== cfgUrl) {
    if (typeof supabase === 'undefined' || !supabase.createClient) {
      console.warn('Supabase CDN library is not available, using local session mode.');
      return null;
    }
    try {
      supabaseClient = supabase.createClient(cfgUrl, cfgKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      currentSbUrl = cfgUrl;
    } catch (e) {
      console.warn('Could not initialize Supabase client:', e);
      return null;
    }
  }
  return supabaseClient;
}

const Auth = {
  /**
   * Sign up a new user with email, password, and campus metadata
   */
  async signUp({ email, password, fullName, rollNo, phone }) {
    if (window.CONFIG?.syncServerConfig) {
      await window.CONFIG.syncServerConfig();
    }

    // Use local registration only when Supabase is not configured.
    if (isSupabaseConfigured()) {
      const sb = getSupabase();
      if (!sb) {
        throw new Error('Unable to initialize the account service. Please refresh and try again.');
      }

      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            roll_no: rollNo,
            phone,
            role: 'user',
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }
      if (!data?.user) {
        throw new Error('The account service did not return a new user. Please try again.');
      }
      return data;
    }

    // Local fallback for development without Supabase.
    const response = await fetch(`${window.CONFIG.API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName, rollNo, phone }),
    });

    const resData = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(resData.message || 'Registration failed.');
    }

    if (resData.token) {
      localStorage.setItem('local_session_token', resData.token);
    }
    if (resData.user) {
      localStorage.setItem('cached_user_profile', JSON.stringify(resData.user));
    }

    return resData;
  },

  /**
   * Sign in existing user with email and password
   */
  async signIn({ email, password }) {
    // 1. If real Supabase is configured, attempt Supabase Auth
    if (isSupabaseConfigured()) {
      try {
        const sb = getSupabase();
        if (sb) {
          const { data, error } = await sb.auth.signInWithPassword({
            email,
            password,
          });

          if (!error && data?.session) {
            localStorage.removeItem('local_session_token');
            return data;
          }
          if (error && !error.message?.includes('fetch')) {
            throw error;
          }
        }
      } catch (sbErr) {
        console.warn('Supabase sign-in attempt failed, falling back to local auth:', sbErr);
      }
    }

    // 2. Local Fallback via Express API
    const response = await fetch(`${window.CONFIG.API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const resData = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(resData.message || 'Invalid email or password.');
    }

    if (resData.token) {
      localStorage.setItem('local_session_token', resData.token);
    }
    if (resData.user) {
      localStorage.setItem('cached_user_profile', JSON.stringify(resData.user));
    }

    return resData;
  },

  /**
   * Sign out current user and redirect
   */
  async signOut() {
    try {
      const sb = getSupabase();
      if (sb) {
        await sb.auth.signOut();
      }
    } catch (e) {}

    localStorage.removeItem('local_session_token');
    localStorage.removeItem('cached_user_profile');
    window.location.href = 'login.html';
  },

  /**
   * Get active session
   */
  async getSession() {
    if (isSupabaseConfigured()) {
      try {
        const sb = getSupabase();
        if (sb) {
          const { data: { session } } = await sb.auth.getSession();
          if (session) return session;
        }
      } catch (e) {}
    }

    const localToken = localStorage.getItem('local_session_token');
    if (localToken) {
      return { access_token: localToken };
    }
    return null;
  },

  /**
   * Get JWT Access Token for API requests
   */
  async getToken() {
    const session = await this.getSession();
    return session?.access_token || localStorage.getItem('local_session_token') || null;
  },

  /**
   * Get current authenticated user
   */
  async getUser() {
    if (isSupabaseConfigured()) {
      try {
        const sb = getSupabase();
        if (sb) {
          const { data: { user } } = await sb.auth.getUser();
          if (user) return user;
        }
      } catch (e) {}
    }

    const localToken = localStorage.getItem('local_session_token');
    const cached = localStorage.getItem('cached_user_profile');
    if (localToken && cached) {
      try {
        const user = JSON.parse(cached);
        return {
          id: user.id,
          email: user.email,
          user_metadata: {
            full_name: user.full_name,
            roll_no: user.roll_no,
            phone: user.phone,
            role: user.role,
          },
        };
      } catch (e) {}
    }

    return null;
  },

  /**
   * Fetch current user's profile from database
   */
  async getProfile() {
    try {
      const user = await this.getUser();
      if (!user) return null;

      const token = await this.getToken();
      if (token) {
        const response = await fetch(`${window.CONFIG.API_BASE}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const json = await response.json();
          if (json.success && json.user) {
            localStorage.setItem('cached_user_profile', JSON.stringify(json.user));
            return json.user;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to fetch full profile from API:', e);
    }

    // Fallback to cached profile
    const cached = localStorage.getItem('cached_user_profile');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }

    const user = await this.getUser();
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
      roll_no: user.user_metadata?.roll_no || 'N/A',
      phone: user.user_metadata?.phone || '',
      role: user.user_metadata?.role || 'user',
    };
  },

  /**
   * Protect page: redirect to login if unauthenticated
   */
  async requireAuth(redirectUrl = 'login.html') {
    const user = await this.getUser();
    if (!user) {
      const current = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `${redirectUrl}?next=${current}`;
      return null;
    }
    return user;
  },

  /**
   * Protect admin page: redirect if not admin
   */
  async requireAdmin(redirectUrl = 'index.html') {
    const user = await this.requireAuth();
    if (!user) return null;

    const profile = await this.getProfile();
    if (!profile || profile.role !== 'admin') {
      alert('Access Denied. You do not have administrator permissions.');
      window.location.href = redirectUrl;
      return null;
    }
    return { user, profile };
  },

  /**
   * Listen to auth state transitions
   */
  onAuthStateChange(callback) {
    const sb = getSupabase();
    if (!sb) return { data: { subscription: { unsubscribe: () => {} } } };
    return sb.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  },
};

window.Auth = Auth;
