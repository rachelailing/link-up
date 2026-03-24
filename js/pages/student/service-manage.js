// js/pages/student/service-manage.js
import { $, $$ } from "../../utils/dom.js";
import { setActiveNav, wireLogout } from "../../components/navbar.js";
import { marketplaceService } from "../../services/marketplace.service.js";
import { authService } from "../../services/auth.service.js";

class ServiceManage {
  constructor() {
    this.form = $("#serviceForm");
    this.imageUpload = $("#imageUpload");
    this.fileInput = $("#fileInput");
    this.imagePreview = $("#imagePreview");
    this.uploadIcon = $("#uploadIcon");
    this.uploadText = $("#uploadText");
    this.tagsContainer = $("#serviceTags");
    this.customTagsContainer = $("#customTagsContainer");
    this.customTagsInput = $("#customTags");
    this.toggleEditBtn = $("#toggleEditBtn");
    this.submitBtn = $("#submitBtn");
    this.selectedFile = null;
    this.selectedImageData = null;
    this.selectedTags = new Set();
    this.editId = null;
    this.isEditMode = true; // Default to true for new items
  }

  async init() {
    const user = await authService.requireAuth("student");
    if (!user) return;

    setActiveNav();
    wireLogout();
    await this.checkEditMode();
    this.wireEvents();
    
    // Set up chip interaction
    this.setupChips();
  }

  setupChips() {
    const chips = this.tagsContainer.querySelectorAll(".chip");
    chips.forEach(chip => {
      chip.addEventListener("click", () => {
        if (!this.isEditMode) return;
        const val = chip.dataset.value;

        if (val === "others") {
          chip.classList.toggle("active");
          const isOthersActive = chip.classList.contains("active");
          this.customTagsContainer.style.display = isOthersActive ? "block" : "none";
          return;
        }

        if (this.selectedTags.has(val)) {
          this.selectedTags.delete(val);
          chip.classList.remove("active");
        } else {
          this.selectedTags.add(val);
          chip.classList.add("active");
        }
      });
    });
  }

  async checkEditMode() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      this.editId = id;
      this.isEditMode = false;
      $("#pageTitle").textContent = "Service Details";
      this.toggleEditBtn.style.display = "block";
      this.submitBtn.style.display = "none";
      
      await this.loadExistingData(id);
      this.setFormDisabled(true);
    }
  }

  setFormDisabled(disabled) {
    const inputs = this.form.querySelectorAll("input, textarea, select");
    inputs.forEach(input => {
      input.disabled = disabled;
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
        $("#status").value = item.status;
        $("#location").value = item.location;
        $("#description").value = item.description || "";
        
        if (item.image) {
          this.selectedImageData = item.image;
          this.imagePreview.src = item.image;
          this.imagePreview.style.display = "block";
          this.uploadIcon.style.display = "none";
          this.uploadText.style.display = "none";
        }

        if (item.tags) {
          const predefined = ["creative", "tech", "academic", "events", "food", "admin"];
          const manual = [];

          item.tags.forEach(tag => {
            if (predefined.includes(tag)) {
              this.selectedTags.add(tag);
              const chip = this.tagsContainer.querySelector(`[data-value="${tag}"]`);
              if (chip) chip.classList.add("active");
            } else {
              manual.push(tag);
            }
          });

          if (manual.length > 0) {
            $("#othersChip").classList.add("active");
            this.customTagsContainer.style.display = "block";
            this.customTagsInput.value = manual.join(", ");
          }
        }
        
        $("#terms").checked = true;
      }
    } catch (err) {
      console.error("Error loading data:", err);
    }
  }

  wireEvents() {
    this.toggleEditBtn.addEventListener("click", () => {
      this.isEditMode = true;
      this.setFormDisabled(false);
      this.toggleEditBtn.style.display = "none";
      this.submitBtn.style.display = "block";
      this.submitBtn.textContent = "Update Service";
      $("#pageTitle").textContent = "Edit Service";
    });

    this.imageUpload.addEventListener("click", () => this.fileInput.click());

    this.fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        this.selectedFile = file;
        const reader = new FileReader();
        reader.onload = (event) => {
          this.selectedImageData = event.target.result;
          this.imagePreview.src = this.selectedImageData;
          this.imagePreview.style.display = "block";
          this.uploadIcon.style.display = "none";
          this.uploadText.style.display = "none";
        };
        reader.readAsDataURL(file);
      }
    });

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

    const finalTags = Array.from(this.selectedTags);
    
    // Add custom tags if active
    if ($("#othersChip").classList.contains("active")) {
      const customVal = this.customTagsInput.value.trim();
      if (customVal) {
        const manualTags = customVal.split(",").map(t => t.trim().toLowerCase()).filter(t => t !== "");
        finalTags.push(...manualTags);
      }
    }

    if (finalTags.length === 0) {
      alert("Please select at least one category tag.");
      return;
    }

    this.submitBtn.disabled = true;
    this.submitBtn.textContent = "Processing...";

    try {
      let imageUrl = this.selectedImageData;

      if (this.selectedFile) {
        imageUrl = this.selectedImageData; // Using base64 for demo
      }

      const listingData = {
        title: $("#title").value,
        price: parseFloat($("#price").value),
        status: $("#status").value,
        location: $("#location").value,
        description: $("#description").value,
        tags: finalTags,
        image: imageUrl,
        type: "Service",
        user_id: user.id,
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      };

      if (this.editId) {
        await marketplaceService.updateItem(this.editId, listingData);
        alert("Service updated successfully!");
      } else {
        await marketplaceService.createItem(listingData);
        alert("Success! Your service has been posted.");
      }

      window.location.href = "marketplace-listings.html";

    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      this.submitBtn.disabled = false;
      this.submitBtn.textContent = this.editId ? "Update Service" : "Post Service Now";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const page = new ServiceManage();
  page.init();
});
