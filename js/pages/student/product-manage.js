// js/pages/student/product-manage.js
import { $, $$ } from "../../utils/dom.js";
import { setActiveNav, wireLogout } from "../../components/navbar.js";
import { supabase } from "../../config/supabase.js"; // Import Supabase client
import { authService } from "../../services/auth.service.js";

class ProductManage {
  constructor() {
    this.form = $("#listingForm");
    this.imageUpload = $("#imageUpload");
    this.fileInput = $("#fileInput");
    this.tagsContainer = $("#productTags");
    this.toggleEditBtn = $("#toggleEditBtn");
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

    this.imageUpload.addEventListener("click", () => this.fileInput.click());

    this.fileInput.addEventListener("change", (e) => {
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

    this.form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.handlePost();
    });
  }

  async uploadImage(file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `listings/${fileName}`;

    // Upload to 'marketplace-images' bucket
    const { data, error } = await supabase.storage
      .from('marketplace-images')
      .upload(filePath, file);

    if (error) throw error;

    // Get the Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('marketplace-images')
      .getPublicUrl(filePath);

    return publicUrl;
  }

  async handlePost() {
    const user = await authService.getCurrentUser();
    if (!user) {
      alert("Please log in to post items.");
      return;
    }

    this.submitBtn.disabled = true;
    this.submitBtn.textContent = "Uploading...";

    try {
      let imageUrl = this.selectedImageData;

      // 1. If a NEW file was picked, upload it to Supabase
      if (this.selectedFile) {
        imageUrl = await this.uploadImage(this.selectedFile);
      }

      // 2. Prepare the data for the database
      const listingData = {
        title: $("#title").value,
        price: parseFloat($("#price").value),
        quantity: parseInt($("#quantity").value),
        status: $("#status").value,
        location: $("#location").value,
        description: $("#description").value,
        date: $("#date").value,
        tags: Array.from(this.selectedTags),
        image: imageUrl,
        type: "Product",
        user_id: user.id // Tie it to the logged-in student
      };

      // 3. Save to Supabase Database (or fallback to localStorage for now)
      // This is where you would call: await supabase.from('marketplace_items').insert([listingData])
      
      console.log("[ProductManage] Ready to save:", listingData);
      
      // Temporary: keep saving to localStorage so the app still works for testing
      let existingListings = JSON.parse(localStorage.getItem("linkup_my_market_listings") || "[]");
      existingListings.unshift({ ...listingData, id: Date.now() });
      localStorage.setItem("linkup_my_market_listings", JSON.stringify(existingListings));

      alert("Success! Your item has been uploaded.");
      window.location.href = "marketplace-listings.html";

    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      this.submitBtn.disabled = false;
      this.submitBtn.textContent = "Post Item";
    }
  }
}
