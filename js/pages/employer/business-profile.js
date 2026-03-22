// js/pages/employer/business-profile.js
import { $ } from '../../utils/dom.js';
import { setActiveNav } from '../../components/navbar.js';
import { authService } from '../../services/auth.service.js';

/**
 * Business Profile Controller
 */
class BusinessProfile {
  constructor() {
    this.form = $('#profileForm');
    this.saveBtn = $('#saveProfileBtn');
    this.currentUser = null;
  }

  async init() {
    setActiveNav();

    // Load current user from Supabase
    this.currentUser = await authService.getCurrentUser();

    if (!this.currentUser) {
      window.location.href = '../auth/employer-login.html';
      return;
    }

    this.fillForm();
    this.wireEvents();
  }

  fillForm() {
    const meta = this.currentUser.user_metadata || {};

    $('#businessName').value = meta.businessName || '';
    $('#businessType').value = meta.businessType || 'SME';
    $('#businessEmail').value = this.currentUser.email || '';
    $('#businessPhone').value = meta.businessPhone || '';
    $('#businessAddress').value = meta.businessAddress || '';
    $('#picName').value = meta.picName || '';
    $('#picRole').value = meta.picRole || '';
  }

  async saveProfile() {
    this.saveBtn.disabled = true;
    this.saveBtn.textContent = 'Saving...';

    const updatedMetadata = {
      businessName: $('#businessName').value.trim(),
      businessType: $('#businessType').value,
      businessPhone: $('#businessPhone').value.trim(),
      businessAddress: $('#businessAddress').value.trim(),
      picName: $('#picName').value.trim(),
      picRole: $('#picRole').value.trim(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await authService.updateUserMetadata(updatedMetadata);
      alert('Profile updated successfully! ✅');
    } catch (err) {
      alert('Error updating profile: ' + err.message);
    } finally {
      this.saveBtn.disabled = false;
      this.saveBtn.textContent = 'Save Changes';
    }
  }

  wireEvents() {
    this.saveBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.saveProfile();
    });
  }
}

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
  const page = new BusinessProfile();
  page.init();
});
