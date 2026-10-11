/**
 * Campus Lost & Found System - User Dashboard Controller (dashboard.html)
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Guard page: Require Authentication
  const user = await Auth.requireAuth('login.html');
  if (!user) return;

  const profile = await Auth.getProfile();

  // Elements
  const welcomeNameEl = document.getElementById('dashboard-welcome-name');
  const statTotalEl = document.getElementById('stat-total');
  const statOpenEl = document.getElementById('stat-open');
  const statResolvedEl = document.getElementById('stat-resolved');
  const itemsContainer = document.getElementById('my-items-container');
  const filterTabs = document.querySelectorAll('.dashboard-filter-tab');

  if (welcomeNameEl) {
    welcomeNameEl.textContent = profile?.full_name || user.email?.split('@')[0] || 'Student';
  }

  let myItemsList = [];
  let activeTab = 'all';

  async function loadDashboardData() {
    itemsContainer.innerHTML = `
      <div style="text-align:center; padding:3rem 1rem;">
        <i data-lucide="loader-2" class="spin" style="font-size:2rem; color:var(--primary-color);"></i>
        <p style="margin-top:0.75rem;">Loading your reports...</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();

    try {
      const response = await API.getMyItems();
      const stats = response.stats || { total: 0, open: 0, resolved: 0 };
      myItemsList = response.data || [];

      // Update stats
      if (statTotalEl) statTotalEl.textContent = stats.total;
      if (statOpenEl) statOpenEl.textContent = stats.open;
      if (statResolvedEl) statResolvedEl.textContent = stats.resolved;

      renderItems();
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      itemsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon" style="background:var(--lost-soft); color:var(--lost-color);">
            <i data-lucide="alert-circle"></i>
          </div>
          <h3 class="empty-state-title">Error Loading Reports</h3>
          <p class="empty-state-desc">${err.message || 'Could not fetch your reports from the server.'}</p>
          <button class="btn btn-primary btn-sm" onclick="location.reload()">Retry</button>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
    }
  }

  function renderItems() {
    let filtered = myItemsList;
    if (activeTab === 'open') {
      filtered = myItemsList.filter((i) => i.status === 'open');
    } else if (activeTab === 'resolved') {
      filtered = myItemsList.filter((i) => i.status === 'resolved' || i.status === 'claimed');
    }

    if (filtered.length === 0) {
      itemsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <i data-lucide="folder-open"></i>
          </div>
          <h3 class="empty-state-title">No reports found</h3>
          <p class="empty-state-desc">${
            activeTab === 'all'
              ? "You haven't reported any lost or found items yet."
              : `No items matching the '${activeTab}' filter.`
          }</p>
          <a href="report.html" class="btn btn-primary btn-sm">
            <i data-lucide="plus-circle"></i> Report an Item
          </a>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    itemsContainer.innerHTML = `
      <div class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Type</th>
              <th>Category</th>
              <th>Location</th>
              <th>Date</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${filtered
              .map((item) => {
                const isLost = item.type === 'lost';
                const isResolved = item.status === 'resolved' || item.status === 'claimed';
                const iconName = UI.getCategoryIcon(item.category);

                return `
                <tr data-id="${item.id}">
                  <td>
                    <div style="display:flex; align-items:center; gap:0.75rem;">
                      ${
                        item.image_url
                          ? `<img src="${item.image_url}" alt="" style="width:44px; height:44px; border-radius:var(--radius-md); object-fit:cover;" />`
                          : `<div style="width:44px; height:44px; border-radius:var(--radius-md); background:var(--primary-soft); color:var(--primary-color); display:flex; align-items:center; justify-content:center;">
                              <i data-lucide="${iconName}"></i>
                             </div>`
                      }
                      <div>
                        <div style="font-weight:700; color:var(--text-primary); font-size:0.95rem;">${escapeHtml(item.title)}</div>
                        <div style="font-size:0.8rem; color:var(--text-muted); max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                          ${escapeHtml(item.description)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="badge ${isLost ? 'badge-lost' : 'badge-found'}">${item.type}</span>
                  </td>
                  <td>
                    <span style="display:flex; align-items:center; gap:0.35rem; font-weight:500;">
                      <i data-lucide="${iconName}" style="font-size:0.85rem;"></i>
                      ${item.category}
                    </span>
                  </td>
                  <td>${escapeHtml(item.location)}</td>
                  <td>${UI.formatDate(item.event_date)}</td>
                  <td>
                    <span class="badge badge-${item.status}">${item.status}</span>
                  </td>
                  <td style="text-align: right;">
                    <div style="display:inline-flex; align-items:center; gap:0.4rem;">
                      <button class="btn btn-outline btn-sm action-resolve-btn" data-id="${item.id}" data-current="${item.status}" title="${isResolved ? 'Re-open item' : 'Mark resolved'}">
                        <i data-lucide="${isResolved ? 'rotate-ccw' : 'check'}"></i>
                        <span>${isResolved ? 'Reopen' : 'Resolve'}</span>
                      </button>

                      <button class="btn btn-secondary btn-sm action-edit-btn" data-id="${item.id}" title="Edit details">
                        <i data-lucide="edit-2"></i>
                      </button>

                      <button class="btn btn-outline btn-sm action-delete-btn" data-id="${item.id}" style="color:var(--lost-color);" title="Delete report">
                        <i data-lucide="trash-2"></i>
                      </button>
                    </div>
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
    attachRowEventListeners();
  }

  function attachRowEventListeners() {
    // Quick resolve/reopen
    document.querySelectorAll('.action-resolve-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const current = btn.getAttribute('data-current');
        const nextStatus = (current === 'resolved' || current === 'claimed') ? 'open' : 'resolved';

        btn.disabled = true;
        try {
          await API.updateItem(id, { status: nextStatus });
          UI.showToast('Updated', `Item marked as ${nextStatus}.`, 'success');
          loadDashboardData();
        } catch (e) {
          UI.showToast('Error', e.message || 'Could not update status.', 'error');
          btn.disabled = false;
        }
      });
    });

    // Delete item
    document.querySelectorAll('.action-delete-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
          return;
        }

        btn.disabled = true;
        try {
          await API.deleteItem(id);
          UI.showToast('Deleted', 'Report deleted successfully.', 'success');
          loadDashboardData();
        } catch (e) {
          UI.showToast('Error', e.message || 'Failed to delete report.', 'error');
          btn.disabled = false;
        }
      });
    });

    // Edit item
    document.querySelectorAll('.action-edit-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = myItemsList.find((i) => i.id === id);
        if (item) openEditModal(item);
      });
    });
  }

  // Edit Modal Setup
  function openEditModal(item) {
    let modal = document.getElementById('edit-item-modal');
    if (!modal) {
      modal = createEditModal();
    }

    document.getElementById('edit-item-id').value = item.id;
    document.getElementById('edit-item-title').value = item.title;
    document.getElementById('edit-item-category').value = item.category;
    document.getElementById('edit-item-location').value = item.location;
    document.getElementById('edit-item-date').value = item.event_date;
    document.getElementById('edit-item-phone').value = item.contact_phone;
    document.getElementById('edit-item-status').value = item.status;
    document.getElementById('edit-item-desc').value = item.description;

    UI.openModal('edit-item-modal');
  }

  function createEditModal() {
    const modalHtml = `
      <div class="modal-backdrop" id="edit-item-modal">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3 class="modal-title">Edit Report</h3>
            <button class="modal-close-btn" id="edit-modal-close-x" aria-label="Close">
              <i data-lucide="x"></i>
            </button>
          </div>
          <form id="edit-item-form">
            <input type="hidden" id="edit-item-id" />
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Title</label>
                <input type="text" id="edit-item-title" class="form-control" required />
              </div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                <div class="form-group">
                  <label class="form-label">Category</label>
                  <select id="edit-item-category" class="form-control" required>
                    ${(window.CONFIG?.CATEGORIES || []).map((c) => `<option value="${c}">${c}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Status</label>
                  <select id="edit-item-status" class="form-control" required>
                    <option value="open">Open</option>
                    <option value="claimed">Claimed</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                <div class="form-group">
                  <label class="form-label">Location</label>
                  <input type="text" id="edit-item-location" class="form-control" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Date</label>
                  <input type="date" id="edit-item-date" class="form-control" required />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Contact Phone</label>
                <input type="tel" id="edit-item-phone" class="form-control" required />
              </div>
              <div class="form-group">
                <label class="form-label">Description</label>
                <textarea id="edit-item-desc" class="form-control" rows="3" required></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary btn-sm" id="edit-modal-cancel">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm" id="edit-modal-save">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('edit-modal-close-x')?.addEventListener('click', () => UI.closeModal('edit-item-modal'));
    document.getElementById('edit-modal-cancel')?.addEventListener('click', () => UI.closeModal('edit-item-modal'));

    document.getElementById('edit-item-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-item-id').value;
      const saveBtn = document.getElementById('edit-modal-save');
      saveBtn.disabled = true;

      try {
        await API.updateItem(id, {
          title: document.getElementById('edit-item-title').value.trim(),
          category: document.getElementById('edit-item-category').value,
          status: document.getElementById('edit-item-status').value,
          location: document.getElementById('edit-item-location').value.trim(),
          event_date: document.getElementById('edit-item-date').value,
          contact_phone: document.getElementById('edit-item-phone').value.trim(),
          description: document.getElementById('edit-item-desc').value.trim(),
        });

        UI.closeModal('edit-item-modal');
        UI.showToast('Updated', 'Report details updated successfully.', 'success');
        loadDashboardData();
      } catch (err) {
        UI.showToast('Error', err.message || 'Failed to update report.', 'error');
      } finally {
        saveBtn.disabled = false;
      }
    });

    if (window.lucide) lucide.createIcons();
    return document.getElementById('edit-item-modal');
  }

  // Filter Tabs click
  filterTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      filterTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      activeTab = tab.getAttribute('data-status');
      renderItems();
    });
  });

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Initial load
  loadDashboardData();
});
