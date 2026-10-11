/**
 * Campus Lost & Found System - UI Components & Utility Functions
 */

const UI = {
  /**
   * Display a floating Toast notification
   * @param {string} title
   * @param {string} message
   * @param {'success'|'error'|'warning'|'info'} type
   * @param {number} duration
   */
  showToast(title, message, type = 'info', duration = 4000) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const iconName = {
      success: 'check-circle',
      error: 'alert-triangle',
      warning: 'alert-circle',
      info: 'info',
    }[type] || 'info';

    toast.innerHTML = `
      <div class="toast-icon"><i data-lucide="${iconName}"></i></div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
    `;

    container.appendChild(toast);
    if (window.lucide) lucide.createIcons({ root: toast });

    setTimeout(() => {
      toast.classList.add('toast-hiding');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, duration);
  },

  /**
   * Initialize Dark/Light theme mode
   */
  initTheme() {
    const savedTheme = localStorage.getItem('campus_lfs_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

    document.documentElement.setAttribute('data-theme', initialTheme);

    const themeToggleBtns = document.querySelectorAll('.theme-toggle-btn');
    themeToggleBtns.forEach((btn) => {
      btn.innerHTML = `<i data-lucide="${initialTheme === 'dark' ? 'sun' : 'moon'}"></i>`;
      btn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nextTheme);
        localStorage.setItem('campus_lfs_theme', nextTheme);
        btn.innerHTML = `<i data-lucide="${nextTheme === 'dark' ? 'sun' : 'moon'}"></i>`;
        if (window.lucide) lucide.createIcons({ root: btn });
      });
    });

    if (window.lucide) lucide.createIcons();
  },

  /**
   * Initialize Global Navbar state and user menu
   */
  async initNavbar() {
    const navActions = document.getElementById('nav-actions');
    if (!navActions) return;

    const user = window.Auth ? await window.Auth.getUser() : null;
    const profile = user ? await window.Auth.getProfile() : null;

    if (user) {
      const initials = (profile?.full_name || user.email || 'U')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

      const isAdmin = profile?.role === 'admin';

      navActions.innerHTML = `
        <button class="theme-toggle-btn" title="Toggle theme" aria-label="Toggle theme">
          <i data-lucide="moon"></i>
        </button>

        <a href="report.html" class="btn btn-primary btn-sm">
          <i data-lucide="plus-circle"></i>
          <span>Report Item</span>
        </a>

        <div class="user-menu-wrapper">
          <button class="user-avatar-btn" id="user-avatar-btn" aria-label="User menu">
            <div class="user-avatar-img">${initials}</div>
            <span style="font-size:0.85rem; font-weight:600; color:var(--text-primary); max-width:110px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
              ${profile?.full_name || 'My Account'}
            </span>
            <i data-lucide="chevron-down" style="font-size:0.8rem; color:var(--text-muted);"></i>
          </button>

          <div class="user-dropdown-menu" id="user-dropdown-menu">
            <div class="dropdown-header">
              <div class="dropdown-user-name">${profile?.full_name || user.email}</div>
              <div class="dropdown-user-role">${isAdmin ? 'Administrator' : 'Student / Staff'}</div>
            </div>

            <a href="dashboard.html" class="dropdown-item">
              <i data-lucide="layout-dashboard"></i>
              <span>My Dashboard</span>
            </a>

            <a href="report.html" class="dropdown-item">
              <i data-lucide="plus-circle"></i>
              <span>Report Item</span>
            </a>

            ${
              isAdmin
                ? `
            <a href="admin.html" class="dropdown-item" style="color:var(--primary-color);">
              <i data-lucide="shield-check"></i>
              <span>Admin Panel</span>
            </a>`
                : ''
            }

            <div style="border-top:1px solid var(--border-color); margin:4px 0;"></div>

            <button class="dropdown-item danger" id="logout-btn">
              <i data-lucide="log-out"></i>
              <span>Log Out</span>
            </button>
          </div>
        </div>
      `;

      // Setup dropdown toggle
      const avatarBtn = document.getElementById('user-avatar-btn');
      const dropdown = document.getElementById('user-dropdown-menu');
      if (avatarBtn && dropdown) {
        avatarBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          dropdown.classList.toggle('active');
        });

        document.addEventListener('click', () => {
          dropdown.classList.remove('active');
        });
      }

      // Logout handler
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          window.Auth.signOut();
        });
      }
    } else {
      // Unauthenticated state
      navActions.innerHTML = `
        <button class="theme-toggle-btn" title="Toggle theme" aria-label="Toggle theme">
          <i data-lucide="moon"></i>
        </button>
        <a href="login.html" class="btn btn-outline btn-sm">Log In</a>
        <a href="signup.html" class="btn btn-primary btn-sm">Sign Up</a>
      `;
    }

    this.initTheme();
    if (window.lucide) lucide.createIcons();
  },

  /**
   * Modal dialog open/close helpers
   */
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  /**
   * Render loading skeleton cards
   */
  renderSkeletons(container, count = 6) {
    if (!container) return;
    let html = '';
    for (let i = 0; i < count; i++) {
      html += `
        <div class="item-card" style="pointer-events: none;">
          <div class="skeleton" style="height: 190px; width: 100%;"></div>
          <div style="padding: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem;">
            <div class="skeleton" style="height: 16px; width: 40%;"></div>
            <div class="skeleton" style="height: 24px; width: 85%;"></div>
            <div class="skeleton" style="height: 16px; width: 100%;"></div>
            <div class="skeleton" style="height: 16px; width: 70%;"></div>
            <div class="skeleton" style="height: 38px; width: 100%; margin-top: 0.5rem;"></div>
          </div>
        </div>
      `;
    }
    container.innerHTML = html;
  },

  /**
   * Format ISO date string into human friendly format
   */
  formatDate(dateStr) {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  },

  /**
   * Format relative time (e.g. 2 hours ago)
   */
  timeAgo(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);

    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    if (diffSeconds < 2592000) return `${Math.floor(diffSeconds / 86400)}d ago`;
    return this.formatDate(dateStr);
  },

  /**
   * Get Lucide icon identifier for category
   */
  getCategoryIcon(category) {
    return window.CONFIG?.CATEGORY_ICONS[category] || 'box';
  },
};

window.UI = UI;

// Run initial navbar and theme initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  UI.initNavbar();
});
