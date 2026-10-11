/**
 * Campus Lost & Found System - API Client Module
 */

const API = {
  /**
   * Helper to perform authenticated HTTP requests
   */
  async request(endpoint, options = {}) {
    const url = `${window.CONFIG.API_BASE}${endpoint}`;
    const headers = options.headers || {};

    // Automatically append Supabase JWT token if user is signed in
    if (window.Auth) {
      const token = await window.Auth.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    // Default JSON Content-Type if body is not FormData
    if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(data.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      console.error(`API Error [${options.method || 'GET'} ${endpoint}]:`, err);
      throw err;
    }
  },

  /**
   * Fetch public/feed items with search, category, type, and pagination
   */
  async getItems(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.type && params.type !== 'all') query.append('type', params.type);
    if (params.status && params.status !== 'All') query.append('status', params.status);
    if (params.date) query.append('date', params.date);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request(`/items${queryString}`);
  },

  /**
   * Get single item details by ID
   */
  async getItemById(id) {
    return this.request(`/items/${id}`);
  },

  /**
   * Report a new item
   */
  async createItem(itemData) {
    return this.request('/items', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  },

  /**
   * Update an existing report
   */
  async updateItem(id, itemData) {
    return this.request(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
  },

  /**
   * Delete an item
   */
  async deleteItem(id) {
    return this.request(`/items/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get current user's reported items + statistics
   */
  async getMyItems() {
    return this.request('/my-items');
  },

  /**
   * Admin: Get system-wide statistics
   */
  async getAdminStats() {
    return this.request('/admin/stats');
  },

  /**
   * Admin: Get all items for moderation
   */
  async getAdminItems(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    if (params.type) query.append('type', params.type);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request(`/admin/items${queryString}`);
  },

  /**
   * Admin: Change item status
   */
  async updateAdminItemStatus(id, status) {
    return this.request(`/admin/items/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  /**
   * Upload image file to storage via backend or direct Supabase storage
   */
  async uploadImage(file) {
    // Attempt upload via Backend API
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await this.request('/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.success && res.imageUrl) {
        return res.imageUrl;
      }
    } catch (e) {
      console.warn('Backend upload fallback to client direct storage:', e);
    }

    // Direct Supabase Storage client-side upload fallback
    const sb = window.Auth?.getUser ? (typeof getSupabase === 'function' ? getSupabase() : null) : null;
    if (sb) {
      const ext = file.name.split('.').pop() || 'png';
      const user = await window.Auth.getUser();
      const userId = user ? user.id : 'anon';
      const path = `uploads/${userId}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

      const { data, error } = await sb.storage
        .from('item-images')
        .upload(path, file, { cacheControl: '3600', upsert: false });

      if (error) throw error;

      const { data: { publicUrl } } = sb.storage
        .from('item-images')
        .getPublicUrl(path);

      return publicUrl;
    }

    throw new Error('Image upload failed. Storage client unavailable.');
  },
};

window.API = API;
