// js/pages/student/product-manage.js
import { $ } from '../../utils/dom.js';
import { setActiveNav, wireLogout } from '../../components/navbar.js';
import { supabase } from '../../config/supabase.js'; // Import Supabase client
import { authService } from '../../services/auth.service.js';
import { marketplaceService } from '../../services/marketplace.service.js';

class ProductManage {
  constructor() {
    this.form = $('#listingForm');
    this.imageUpload = $('#imageUpload');
    this.fileInput = $('#fileInput');
    this.tagsContainer = $('#productTags');
    this.toggleEditBtn = $('#toggleEditBtn');
    this.submitBtn = $("button[type='submit']");
    this.selectedFile = null; // Store the actual file object
    this.selectedImageData = null; // For preview only
    this.selectedTags = new Set();
    this.editId = null;
    this.isEditMode = false;
  }

  async init() {
    setActiveNav();
    wireLogout();
    this.checkEditMode();
    this.wireEvents();
    if (!this.editId) {
      this.setDefaultDate();
      this.isEditMode = true;
    }
  }

  // ... (keep checkEditMode, setFormDisabled, loadExistingData, setDefaultDate as they are) ...

  wireEvents() {
    // ... (keep toggleEditBtn logic) ...

    this.imageUpload.addEventListener('click', () => this.fileInput.click());

    this.fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.selectedFile = file; // Save the file object for Supabase upload
        const reader = new FileReader();
        reader.onload = (event) => {
          this.selectedImageData = event.target.result;
          this.imageUpload.innerHTML = `<img src="${this.selectedImageData}" style="width:100%; height:100%; object-fit:cover; border-radius:10px;">`;
        };
        reader.readAsDataURL(file);
      }
    });

    // ... (keep tags logic) ...

    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handlePost();
    });
  }

  async uploadImage(file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `listings/${fileName}`;

    // Upload to 'marketplace-images' bucket
    const { data: _data, error } = await supabase.storage
      .from('marketplace-images')
      .upload(filePath, file);

    if (error) throw error;

    // Get the Public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('marketplace-images').getPublicUrl(filePath);

    return publicUrl;
  }

  async handlePost() {
    const user = await authService.getCurrentUser();
    if (!user) {
      alert('Please log in to post items.');
      return;
    }

    this.submitBtn.disabled = true;
    this.submitBtn.textContent = 'Uploading...';

    try {
      let imageUrl = this.selectedImageData;

      // 1. Upload image to Supabase Storage if a new file was selected
      if (this.selectedFile) {
        imageUrl = await this.uploadImage(this.selectedFile);
      }

      // 2. Prepare the data for Supabase
      const listingData = {
        owner_id: user.id,
        title: $('#title').value.trim(),
        price: parseFloat($('#price').value),
        type: $('#listingType')?.value || 'Product', // Assume you have a type selector
        category: $('#category')?.value || 'General',
        location: $('#location').value.trim(),
        description: $('#description').value.trim(),
        status: $('#status').value || 'Ongoing',
        tags: Array.from(this.selectedTags),
        image_url: imageUrl,
      };

      // 3. Save to Supabase Database
      console.log('[ProductManage] Saving to Supabase:', listingData);
      await marketplaceService.createItem(listingData);

      alert('Success! Your item has been listed on the marketplace.');
      window.location.href = 'marketplace-listings.html';
    } catch (err) {
      console.error('[ProductManage] Post failed:', err);
      alert('Error: ' + err.message);
    } finally {
      this.submitBtn.disabled = false;
      this.submitBtn.textContent = 'Post Item';
    }
  }
}

// Bootstrap the page
document.addEventListener('DOMContentLoaded', () => {
  const manager = new ProductManage();
  manager.init();
});
