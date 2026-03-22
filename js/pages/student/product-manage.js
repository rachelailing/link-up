// js/pages/student/product-manage.js
import { $, $$ } from "../../utils/dom.js";
import { setActiveNav, wireLogout } from "../../components/navbar.js";
import { marketplaceService } from "../../services/marketplace.service.js";
import { authService } from "../../services/auth.service.js";

class ProductManage {
  constructor() {
    this.form = $("#listingForm");
    this.imageUpload = $("#imageUpload");
    this.fileInput = $("#fileInput");
    this.tagsContainer = $("#productTags");
    this.toggleEditBtn = $("#toggleEditBtn");
    this.submitBtn = $("button[type='submit']");
    this.selectedFile = null;
    this.selectedImageData = null;
    this.selectedTags = new Set();
    this.editId = null;
    this.isEditMode = false;
  }

  async init() {
    setActiveNav();
    wireLogout();
    await this.checkEditMode();
    this.wireEvents();
    if (!this.editId) {
      this.setDefaultDate();
      this.isEditMode = true;
    }
  }

  async checkEditMode() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      this.editId = id;
      this.isEditMode = false;
      $("#pageTitle").textContent = "Product Details";
      this.toggleEditBtn.style.display = "block";
      this.submitBtn.style.display = "none";
      
      await this.loadExistingData(id);
      this.setFormDisabled(true);
    }
  }

  setFormDisabled(disabled) {
    const inputs = this.form.querySelectorAll("input, textarea, select");
    inputs.forEach(input => {
      if (input.id !== "toggleEditBtn") input.disabled = disabled;
    });
    
    const chips = this.tagsContainer.querySelectorAll(".chip");
    chips.forEach(chip => {
      chip.style.pointerEvents = disabled ? "none" : "auto";
      chip.style.opacity = disabled ? "0.7" : "1";
    });

    this.imageUpload.style.pointerEvents = disabled ? "none" : "auto";
    this.imageUpload.style.opacity = disabled ? "0.8" : "1";
  }

  async loadExistingData(id) {
    try {
      const item = await marketplaceService.getItemById(id);
      if (item) {
        $("#title").value = item.title;
        $("#price").value = item.price;
        $("#quantity").value = item.quantity || 1;
        $("#status").value = item.status;
        $("#location").value = item.location;
        $("#description").value = item.description || "";
        $("#date").value = item.date;
        
        if (item.image) {
          this.selectedImageData = item.image;
          this.imageUpload.innerHTML = `<img src="${item.image}" style="width:100%; height:100%; object-fit:cover; border-radius:10px;">`;
        }

        if (item.tags) {
          item.tags.forEach(tag => {
            this.selectedTags.add(tag);
            const chip = this.tagsContainer.querySelector(`[data-value="${tag}"]`);
            if (chip) chip.classList.add("active");
          });
        }
        
        $("#terms").checked = true;
      }
    } catch (err) {
      console.error("Error loading data:", err);
    }
  }

  setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    $("#date").value = today;
  }

  wireEvents() {
    this.toggleEditBtn.addEventListener("click", () => {
      this.isEditMode = true;
      this.setFormDisabled(false);
      this.toggleEditBtn.style.display = "none";
      this.submitBtn.style.display = "block";
      this.submitBtn.textContent = "Update Product";
      $("#pageTitle").textContent = "Edit Product";
    });

    this.imageUpload.addEventListener("click", () => this.fileInput.click());

    this.fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        this.selectedFile = file;
        const reader = new FileReader();
        reader.onload = (event) => {
          this.selectedImageData = event.target.result;
          this.imageUpload.innerHTML = `<img src="${this.selectedImageData}" style="width:100%; height:100%; object-fit:cover; border-radius:10px;">`;
        };
        reader.readAsDataURL(file);
      }
    });

    if (this.tagsContainer) {
      this.tagsContainer.addEventListener("click", (e) => {
        if (!this.isEditMode) return;
        const chip = e.target.closest(".chip");
        if (!chip) return;
        const val = chip.dataset.value;
        if (this.selectedTags.has(val)) {
          this.selectedTags.delete(val);
          chip.classList.remove("active");
        } else {
          this.selectedTags.add(val);
          chip.classList.add("active");
        }
      });
    }

    this.form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.handlePost();
    });
  }

  async handlePost() {
    const user = await authService.getCurrentUser();
    if (!user) {
      alert("Please log in to post items.");
      return;
    }

    if (this.selectedTags.size === 0) {
      alert("Please select at least one category tag.");
      return;
    }

    this.submitBtn.disabled = true;
    this.submitBtn.textContent = "Processing...";

    try {
      let imageUrl = this.selectedImageData;

      if (this.selectedFile) {
        imageUrl = await marketplaceService.uploadImage(this.selectedFile);
      }

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
        //user_id: user.id
      };

      if (this.editId) {
        await marketplaceService.updateItem(this.editId, listingData);
        alert("Product updated successfully!");
      } else {
        await marketplaceService.createItem(listingData);
        alert("Success! Your product has been posted.");
      }

      window.location.href = "marketplace-listings.html";

    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      this.submitBtn.disabled = false;
      this.submitBtn.textContent = this.editId ? "Update Product" : "Post Product";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const page = new ProductManage();
  page.init();
});
