/**
 * Campus Lost & Found System - Admin Panel Controller (admin.html)
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Guard page: Require Admin Role
  const authData = await Auth.requireAdmin('index.html');
  if (!authData) return;

  const statUsersEl = document.getElementById('admin-stat-users');
  const statReportsEl = document.getElementById('admin-stat-reports');
  const statLostEl = document.getElementById('admin-stat-lost');
  const statFoundEl = document.getElementById('admin-stat-found');
  const statResolvedEl = document.getElementById('admin-stat-resolved');
  const tableContainer = document.getElementById('admin-items-table-container');

  const searchInput = document.getElementById('admin-search');
  const statusFilter = document.getElementById('admin-status-filter');
  const typeFilter = document.getElementById('admin-type-filter');

  let adminItemsList = [];

  async function loadAdminData() {
    try {
      // 1. Fetch system statistics
      const statsRes = await API.getAdminStats();
      if (statsRes.success && statsRes.data) {
        const s = statsRes.data;
        if (statUsersEl) statUsersEl.textContent = s.totalUsers;
        if (statReportsEl) statReportsEl.textContent = s.totalReports;
        if (statLostEl) statLostEl.textContent = s.totalLost;
        if (statFoundEl) statFoundEl.textContent = s.totalFound;
        if (statResolvedEl) statResolvedEl.textContent = s.totalResolved;
      }

      // 2. Fetch all items for moderation
      await loadAdminItems();
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
      UI.showToast('Admin Error', err.message || 'Failed to fetch admin stats.', 'error');
    }
  }

  async function loadAdminItems() {
    tableContainer.innerHTML = `
      <div style="text-align:center; padding:3rem 1rem;">
        <i data-lucide="loader-2" class="spin" style="font-size:2rem; color:var(--primary-color);"></i>
        <p style="margin-top:0.75rem;">Loading system records...</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();

    try {
      const params = {
        search: searchInput?.value || '',
        status: statusFilter?.value || 'All',
        type: typeFilter?.value || 'all',
      };

      const res = await API.getAdminItems(params);
      adminItemsList = res.data || [];
      renderAdminTable(adminItemsList);
    } catch (err) {
      tableContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon" style="background:var(--lost-soft); color:var(--lost-color);">
            <i data-lucide="alert-triangle"></i>
          </div>
          <h3 class="empty-state-title">Failed to Load Records</h3>
          <p class="empty-state-desc">${err.message || 'Unable to retrieve moderation items.'}</p>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
    }
  }

  function renderAdminTable(items) {
    if (items.length === 0) {
      tableContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon"><i data-lucide="inbox"></i></div>
          <h3 class="empty-state-title">No reports match</h3>
          <p class="empty-state-desc">Try clearing your search keyword or moderation filters.</p>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    tableContainer.innerHTML = `
      <div class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Item & Category</th>
              <th>Type</th>
              <th>Reported By (Roll No / Phone)</th>
              <th>Location & Date</th>
              <th>Status Moderation</th>
              <th style="text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map((item) => {
                const isLost = item.type === 'lost';
                const reporter = item.profiles || {};

                return `
                <tr data-id="${item.id}">
                  <td>
                    <div style="font-weight:700; color:var(--text-primary); font-size:0.95rem;">
                      ${escapeHtml(item.title)}
                    </div>
                    <div style="font-size:0.8rem; color:var(--text-muted); display:flex; align-items:center; gap:0.4rem; margin-top:2px;">
                      <span>${item.category}</span> &bull; 
                      <span>ID: ${item.id.substring(0, 8)}</span>
                    </div>
                  </td>
                  <td>
                    <span class="badge ${isLost ? 'badge-lost' : 'badge-found'}">${item.type}</span>
                  </td>
                  <td>
                    <div style="font-weight:600;">${escapeHtml(reporter.full_name || 'N/A')}</div>
                    <div style="font-size:0.8rem; color:var(--text-secondary);">
                      Roll: ${escapeHtml(reporter.roll_no || 'N/A')} | Tel: ${escapeHtml(item.contact_phone || 'N/A')}
                    </div>
                  </td>
                  <td>
                    <div>${escapeHtml(item.location)}</div>
                    <div style="font-size:0.8rem; color:var(--text-muted);">${UI.formatDate(item.event_date)}</div>
                  </td>
                  <td>
                    <select class="custom-select admin-status-select" data-id="${item.id}" style="padding:0.35rem 0.6rem; font-size:0.85rem;">
                      <option value="open" ${item.status === 'open' ? 'selected' : ''}>Open</option>
                      <option value="claimed" ${item.status === 'claimed' ? 'selected' : ''}>Claimed</option>
                      <option value="resolved" ${item.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                    </select>
                  </td>
                  <td style="text-align:right;">
                    <button class="btn btn-danger btn-sm admin-delete-btn" data-id="${item.id}" title="Delete Spam">
                      <i data-lucide="trash-2"></i>
                      <span>Delete</span>
                    </button>
                  </td>
                </tr>
              `;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
    attachAdminActions();
  }

  function attachAdminActions() {
    // Quick status select change
    document.querySelectorAll('.admin-status-select').forEach((sel) => {
      sel.addEventListener('change', async (e) => {
        const id = sel.getAttribute('data-id');
        const newStatus = sel.value;
        try {
          await API.updateAdminItemStatus(id, newStatus);
          UI.showToast('Updated', `Report status changed to ${newStatus}.`, 'success');
        } catch (err) {
          UI.showToast('Error', err.message || 'Failed to update status.', 'error');
        }
      });
    });

    // Delete spam
    document.querySelectorAll('.admin-delete-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (!confirm('ADMIN ACTION: Permanently delete this report as spam or policy violation?')) {
          return;
        }

        btn.disabled = true;
        try {
          await API.deleteItem(id);
          UI.showToast('Removed', 'Spam report deleted from system.', 'success');
          loadAdminData();
        } catch (err) {
          UI.showToast('Error', err.message || 'Failed to delete report.', 'error');
          btn.disabled = false;
        }
      });
    });
  }

  // Filter events
  let filterTimer;
  searchInput?.addEventListener('input', () => {
    clearTimeout(filterTimer);
    filterTimer = setTimeout(loadAdminItems, 300);
  });

  statusFilter?.addEventListener('change', loadAdminItems);
  typeFilter?.addEventListener('change', loadAdminItems);

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Initial call
  loadAdminData();
});
