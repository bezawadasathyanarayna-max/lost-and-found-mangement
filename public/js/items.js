/**
 * Campus Lost & Found System - Browse & Search Controller (items.html)
 */

document.addEventListener('DOMContentLoaded', () => {
  const itemsGrid = document.getElementById('items-grid');
  const searchInput = document.getElementById('search-input');
  const categorySelect = document.getElementById('category-filter');
  const statusSelect = document.getElementById('status-filter');
  const dateInput = document.getElementById('date-filter');
  const typeTabBtns = document.querySelectorAll('.type-tab-btn');
  const resultsCountEl = document.getElementById('results-count');

  let currentFilters = {
    search: '',
    category: 'All',
    type: 'all',
    status: 'All',
    date: '',
    page: 1,
    limit: 24,
  };

  // Read URL query params on load (e.g. items.html?type=lost or items.html?category=Phone)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('type')) currentFilters.type = urlParams.get('type');
  if (urlParams.get('category')) currentFilters.category = urlParams.get('category');
  if (urlParams.get('search')) currentFilters.search = urlParams.get('search');

  // Sync initial UI with filters
  if (categorySelect && currentFilters.category !== 'All') {
    categorySelect.value = currentFilters.category;
  }
  if (searchInput && currentFilters.search) {
    searchInput.value = currentFilters.search;
  }
  typeTabBtns.forEach((btn) => {
    if (btn.getAttribute('data-type') === currentFilters.type) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Fetch and display items
  async function loadItems() {
    UI.renderSkeletons(itemsGrid, 6);

    try {
      const response = await API.getItems(currentFilters);
      const items = response.data || [];

      if (resultsCountEl) {
        resultsCountEl.textContent = `Showing ${items.length} ${items.length === 1 ? 'item' : 'items'}`;
      }

      if (items.length === 0) {
        itemsGrid.innerHTML = `
          <div class="empty-state" style="grid-column: 1 / -1;">
            <div class="empty-state-icon">
              <i data-lucide="search-x"></i>
            </div>
            <h3 class="empty-state-title">No items found</h3>
            <p class="empty-state-desc">We couldn't find any items matching your active search or filters. Try adjusting your search query or reset the filters.</p>
            <button class="btn btn-secondary btn-sm" id="reset-filters-btn">
              <i data-lucide="rotate-ccw"></i> Reset Filters
            </button>
          </div>
        `;
        if (window.lucide) lucide.createIcons();

        document.getElementById('reset-filters-btn')?.addEventListener('click', () => {
          currentFilters = { search: '', category: 'All', type: 'all', status: 'All', date: '', page: 1, limit: 24 };
          if (searchInput) searchInput.value = '';
          if (categorySelect) categorySelect.value = 'All';
          if (statusSelect) statusSelect.value = 'All';
          if (dateInput) dateInput.value = '';
          typeTabBtns.forEach((b) => b.classList.toggle('active', b.getAttribute('data-type') === 'all'));
          loadItems();
        });

        return;
      }

      itemsGrid.innerHTML = items.map((item) => renderItemCard(item)).join('');
      if (window.lucide) lucide.createIcons();

      // Attach card click handlers for details modal
      itemsGrid.querySelectorAll('.item-card').forEach((card) => {
        card.addEventListener('click', () => {
          const itemId = card.getAttribute('data-id');
          const selectedItem = items.find((i) => i.id === itemId);
          if (selectedItem) openItemModal(selectedItem);
        });
      });
    } catch (err) {
      console.error('Failed to load items:', err);
      itemsGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon" style="background:var(--lost-soft); color:var(--lost-color);">
            <i data-lucide="alert-octagon"></i>
          </div>
          <h3 class="empty-state-title">Unable to load feed</h3>
          <p class="empty-state-desc">${err.message || 'Please check your connection or database setup.'}</p>
          <button class="btn btn-primary btn-sm" onclick="location.reload()">Retry</button>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
    }
  }

  function renderItemCard(item) {
    const isLost = item.type === 'lost';
    const badgeTypeClass = isLost ? 'badge-lost' : 'badge-found';
    const statusBadgeClass = `badge-${item.status}`;
    const iconName = UI.getCategoryIcon(item.category);

    const imageHtml = item.image_url
      ? `<img src="${item.image_url}" alt="${item.title}" class="item-card-image" loading="lazy" onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'item-card-image-placeholder\\'><i data-lucide=\\'${iconName}\\'></i><span>${item.category}</span></div>'; if(window.lucide) lucide.createIcons();" />`
      : `<div class="item-card-image-placeholder">
           <i data-lucide="${iconName}" style="font-size:2rem; margin-bottom:0.25rem;"></i>
           <span style="font-size:0.85rem; font-weight:600;">${item.category}</span>
         </div>`;

    return `
      <div class="item-card" data-id="${item.id}">
        <div class="item-card-image-wrap">
          ${imageHtml}
          <div class="item-card-badges">
            <span class="badge ${badgeTypeClass}">
              <i data-lucide="${isLost ? 'help-circle' : 'check-circle-2'}"></i>
              ${item.type}
            </span>
            <span class="badge ${statusBadgeClass}">
              ${item.status}
            </span>
          </div>
        </div>

        <div class="item-card-body">
          <div class="item-category-tag">
            <i data-lucide="${iconName}"></i>
            <span>${item.category}</span>
          </div>

          <h3 class="item-title">${escapeHtml(item.title)}</h3>
          <p class="item-desc">${escapeHtml(item.description)}</p>

          <div class="item-meta-list">
            <div class="item-meta-item">
              <i data-lucide="map-pin"></i>
              <span>${escapeHtml(item.location)}</span>
            </div>
            <div class="item-meta-item">
              <i data-lucide="calendar"></i>
              <span>${UI.formatDate(item.event_date)}</span>
            </div>
          </div>

          <div class="item-reporter-info">
            <span>By ${escapeHtml(item.profiles?.full_name || 'Campus Student')}</span>
            <span>${UI.timeAgo(item.created_at)}</span>
          </div>
        </div>
      </div>
    `;
  }

  // Open Item Detail Modal
  function openItemModal(item) {
    let modal = document.getElementById('item-detail-modal');
    if (!modal) {
      modal = createDetailModal();
    }

    const isLost = item.type === 'lost';
    const categoryIcon = UI.getCategoryIcon(item.category);

    document.getElementById('modal-item-title').textContent = item.title;
    document.getElementById('modal-item-type').className = `badge ${isLost ? 'badge-lost' : 'badge-found'}`;
    document.getElementById('modal-item-type').innerHTML = `<i data-lucide="${isLost ? 'help-circle' : 'check-circle-2'}"></i> ${item.type.toUpperCase()}`;
    document.getElementById('modal-item-status').className = `badge badge-${item.status}`;
    document.getElementById('modal-item-status').textContent = item.status.toUpperCase();

    const imgEl = document.getElementById('modal-item-image');
    if (item.image_url) {
      imgEl.src = item.image_url;
      imgEl.style.display = 'block';
    } else {
      imgEl.style.display = 'none';
    }

    document.getElementById('modal-item-category').innerHTML = `<i data-lucide="${categoryIcon}"></i> ${item.category}`;
    document.getElementById('modal-item-location').textContent = item.location;
    document.getElementById('modal-item-date').textContent = UI.formatDate(item.event_date);
    document.getElementById('modal-item-desc').textContent = item.description;

    // Contact Privacy Section
    const contactSection = document.getElementById('modal-contact-section');
    if (item.isContactLocked) {
      contactSection.innerHTML = `
        <div style="background:var(--primary-soft); border:1px solid rgba(79,70,229,0.2); border-radius:var(--radius-lg); padding:1.25rem; text-align:center;">
          <div style="font-size:1.5rem; margin-bottom:0.25rem;">🔒</div>
          <div style="font-weight:600; font-size:0.95rem; margin-bottom:0.25rem; color:var(--text-primary);">
            Reporter contact information is locked
          </div>
          <p style="font-size:0.85rem; margin-bottom:1rem; color:var(--text-secondary);">
            Log in with your campus account to view the reporter's phone number and connect directly.
          </p>
          <a href="login.html?next=${encodeURIComponent(window.location.pathname + window.location.search)}" class="btn btn-primary btn-sm">
            <i data-lucide="log-in"></i> Log In to View Contact
          </a>
        </div>
      `;
    } else {
      contactSection.innerHTML = `
        <div style="background:var(--bg-primary); border:1px solid var(--border-color); border-radius:var(--radius-lg); padding:1.25rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
            <div>
              <div style="font-size:0.8rem; text-transform:uppercase; font-weight:700; color:var(--text-muted); letter-spacing:0.04em;">Reported By</div>
              <div style="font-size:1.05rem; font-weight:700; color:var(--text-primary);">${escapeHtml(item.profiles?.full_name || 'Campus Student')}</div>
              ${item.profiles?.roll_no ? `<div style="font-size:0.85rem; color:var(--text-secondary);">ID: ${escapeHtml(item.profiles.roll_no)}</div>` : ''}
            </div>
            <a href="tel:${item.contact_phone}" class="btn btn-primary btn-sm" title="Call directly">
              <i data-lucide="phone-call"></i> Call
            </a>
          </div>
          <div style="display:flex; align-items:center; gap:0.5rem; background:var(--bg-secondary); padding:0.6rem 0.85rem; border-radius:var(--radius-md); border:1px solid var(--border-color);">
            <i data-lucide="phone" style="font-size:0.9rem; color:var(--primary-color);"></i>
            <span style="font-family:monospace; font-weight:600; font-size:0.95rem;">${escapeHtml(item.contact_phone)}</span>
            <button class="btn btn-outline btn-sm" style="margin-left:auto; padding:0.25rem 0.5rem; font-size:0.75rem;" id="copy-phone-btn" data-phone="${escapeHtml(item.contact_phone)}">
              <i data-lucide="copy"></i> Copy
            </button>
          </div>
        </div>
      `;

      document.getElementById('copy-phone-btn')?.addEventListener('click', (e) => {
        const phone = e.currentTarget.getAttribute('data-phone');
        navigator.clipboard.writeText(phone).then(() => {
          UI.showToast('Copied', 'Phone number copied to clipboard.', 'success');
        });
      });
    }

    if (window.lucide) lucide.createIcons();
    UI.openModal('item-detail-modal');
  }

  function createDetailModal() {
    const modalHtml = `
      <div class="modal-backdrop" id="item-detail-modal">
        <div class="modal-dialog">
          <div class="modal-header">
            <div style="display:flex; align-items:center; gap:0.6rem;">
              <span id="modal-item-type" class="badge"></span>
              <span id="modal-item-status" class="badge"></span>
            </div>
            <button class="modal-close-btn" id="modal-close-x" aria-label="Close modal">
              <i data-lucide="x"></i>
            </button>
          </div>

          <div class="modal-body">
            <img id="modal-item-image" src="" alt="Item Image" style="width:100%; max-height:280px; object-fit:cover; border-radius:var(--radius-lg); margin-bottom:1.5rem; display:none;" />
            
            <h2 id="modal-item-title" style="font-size:1.5rem; margin-bottom:1rem;"></h2>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1.5rem; background:var(--bg-primary); padding:1rem; border-radius:var(--radius-lg); border:1px solid var(--border-color);">
              <div>
                <span style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--text-muted);">Category</span>
                <div id="modal-item-category" style="font-weight:600; display:flex; align-items:center; gap:0.4rem; margin-top:2px;"></div>
              </div>
              <div>
                <span style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--text-muted);">Date</span>
                <div id="modal-item-date" style="font-weight:600; margin-top:2px;"></div>
              </div>
              <div style="grid-column: 1 / -1;">
                <span style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--text-muted);">Location</span>
                <div id="modal-item-location" style="font-weight:600; display:flex; align-items:center; gap:0.4rem; margin-top:2px;"></div>
              </div>
            </div>

            <div style="margin-bottom:1.5rem;">
              <span style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--text-muted);">Description</span>
              <p id="modal-item-desc" style="margin-top:0.35rem; font-size:0.95rem; line-height:1.6; white-space:pre-wrap;"></p>
            </div>

            <div id="modal-contact-section"></div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" id="modal-close-footer">Close</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('modal-close-x')?.addEventListener('click', () => UI.closeModal('item-detail-modal'));
    document.getElementById('modal-close-footer')?.addEventListener('click', () => UI.closeModal('item-detail-modal'));
    document.getElementById('item-detail-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'item-detail-modal') UI.closeModal('item-detail-modal');
    });

    return document.getElementById('item-detail-modal');
  }

  // Event Listeners for Filters
  let debounceTimer;
  searchInput?.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      currentFilters.search = e.target.value.trim();
      currentFilters.page = 1;
      loadItems();
    }, 300);
  });

  categorySelect?.addEventListener('change', (e) => {
    currentFilters.category = e.target.value;
    currentFilters.page = 1;
    loadItems();
  });

  statusSelect?.addEventListener('change', (e) => {
    currentFilters.status = e.target.value;
    currentFilters.page = 1;
    loadItems();
  });

  dateInput?.addEventListener('change', (e) => {
    currentFilters.date = e.target.value;
    currentFilters.page = 1;
    loadItems();
  });

  typeTabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      typeTabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilters.type = btn.getAttribute('data-type');
      currentFilters.page = 1;
      loadItems();
    });
  });

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Initial load
  loadItems();
});
