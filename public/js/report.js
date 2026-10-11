/**
 * Campus Lost & Found System - Report Item Controller (report.html)
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Guard page: Require Authentication
  const user = await Auth.requireAuth('login.html');
  if (!user) return;

  const profile = await Auth.getProfile();

  const reportForm = document.getElementById('report-form');
  const typeRadioCards = document.querySelectorAll('.type-radio-card');
  const categorySelect = document.getElementById('item-category');
  const contactPhoneInput = document.getElementById('contact-phone');
  const eventDateInput = document.getElementById('event-date');
  const dropzone = document.getElementById('image-dropzone');
  const fileInput = document.getElementById('image-file-input');
  const previewWrap = document.getElementById('image-preview-wrap');
  const previewImg = document.getElementById('image-preview');
  const removeImgBtn = document.getElementById('remove-image-btn');
  const submitBtn = document.getElementById('submit-btn');

  let selectedFile = null;

  // Set default event date to today
  if (eventDateInput) {
    eventDateInput.value = new Date().toISOString().split('T')[0];
  }

  // Pre-fill phone if available in profile
  if (contactPhoneInput && profile?.phone) {
    contactPhoneInput.value = profile.phone;
  }

  // Populate categories
  if (categorySelect && window.CONFIG?.CATEGORIES) {
    categorySelect.innerHTML = `
      <option value="" disabled selected>Select category...</option>
      ${window.CONFIG.CATEGORIES.map((cat) => `<option value="${cat}">${cat}</option>`).join('')}
    `;
  }

  // Handle URL pre-selection: report.html?type=lost or report.html?type=found
  const urlParams = new URLSearchParams(window.location.search);
  const typeParam = urlParams.get('type') || 'lost';

  selectType(typeParam.toLowerCase() === 'found' ? 'found' : 'lost');

  // Radio cards click handler
  typeRadioCards.forEach((card) => {
    card.addEventListener('click', () => {
      const type = card.getAttribute('data-type');
      selectType(type);
    });
  });

  function selectType(type) {
    typeRadioCards.forEach((card) => {
      const cardType = card.getAttribute('data-type');
      const radio = card.querySelector('input[type="radio"]');
      if (cardType === type) {
        radio.checked = true;
        card.className = `type-radio-card active-${type}`;
      } else {
        radio.checked = false;
        card.className = 'type-radio-card';
      }
    });

    const pageHeading = document.getElementById('report-title-heading');
    if (pageHeading) {
      pageHeading.innerHTML = type === 'lost'
        ? `Report a <span class="gradient-text">Lost</span> Item`
        : `Report a <span style="color:var(--found-color);">Found</span> Item`;
    }
  }

  // Drag and drop image upload handlers
  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-over');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('drag-over');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelection(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFileSelection(e.target.files[0]);
      }
    });
  }

  function handleFileSelection(file) {
    if (!file.type.startsWith('image/')) {
      UI.showToast('Invalid File', 'Please upload an image file (JPG, PNG, WEBP).', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      UI.showToast('File Too Large', 'Image size must be less than 5MB.', 'error');
      return;
    }

    selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      previewWrap.style.display = 'block';
      dropzone.querySelector('.dropzone-prompt').style.display = 'none';
    };
    reader.readAsDataURL(file);
  }

  removeImgBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    selectedFile = null;
    fileInput.value = '';
    previewImg.src = '';
    previewWrap.style.display = 'none';
    dropzone.querySelector('.dropzone-prompt').style.display = 'block';
  });

  // Form submission handler
  reportForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Clear previous errors
    document.querySelectorAll('.form-group').forEach((g) => g.classList.remove('has-error'));

    const selectedRadio = document.querySelector('input[name="item_type"]:checked');
    const type = selectedRadio ? selectedRadio.value : 'lost';
    const title = document.getElementById('item-title').value.trim();
    const category = categorySelect.value;
    const location = document.getElementById('item-location').value.trim();
    const event_date = eventDateInput.value;
    const contact_phone = contactPhoneInput.value.trim();
    const description = document.getElementById('item-description').value.trim();

    // Validations
    let hasError = false;
    if (!title || title.length < 3) {
      setError('item-title', 'Please provide a title with at least 3 characters.');
      hasError = true;
    }
    if (!category) {
      setError('item-category', 'Please select a valid category.');
      hasError = true;
    }
    if (!location || location.length < 2) {
      setError('item-location', 'Please specify where this item was lost or found.');
      hasError = true;
    }
    if (!contact_phone || contact_phone.length < 5) {
      setError('contact-phone', 'Please provide a valid phone number so you can be contacted.');
      hasError = true;
    }
    if (!description || description.length < 5) {
      setError('item-description', 'Please add a descriptive summary (color, marks, room number, etc.).');
      hasError = true;
    }

    if (hasError) return;

    // Start submission state
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Publishing Report...`;
    if (window.lucide) lucide.createIcons();

    try {
      let image_url = null;
      if (selectedFile) {
        submitBtn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Uploading Image...`;
        if (window.lucide) lucide.createIcons();
        image_url = await API.uploadImage(selectedFile);
      }

      submitBtn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Saving Report...`;
      if (window.lucide) lucide.createIcons();

      const response = await API.createItem({
        type,
        title,
        category,
        location,
        event_date,
        contact_phone,
        description,
        image_url,
      });

      UI.showToast('Success!', 'Your report has been successfully published.', 'success');

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1200);
    } catch (err) {
      console.error('Report submission error:', err);
      UI.showToast('Error', err.message || 'Failed to submit report. Please try again.', 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i data-lucide="send"></i> Submit Report`;
      if (window.lucide) lucide.createIcons();
    }
  });

  function setError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    const group = field.closest('.form-group');
    if (group) {
      group.classList.add('has-error');
      const errEl = group.querySelector('.form-error-msg');
      if (errEl) errEl.textContent = message;
    }
  }
});
