// js/pages/student/service-manage.js
import { $, $$ } from "../../utils/dom.js";
import { setActiveNav, wireLogout } from "../../components/navbar.js";

class ServiceManage {
  constructor() {
    this.form = $("#serviceForm");
    this.imageUpload = $("#imageUpload");
    this.fileInput = $("#fileInput");
    this.tagsContainer = $("#serviceTags");
    this.toggleEditBtn = $("#toggleEditBtn");
    this.submitBtn = $("button[type='submit']");
    this.selectedImageData = null;
    this.selectedTags = new Set();
    this.editId = null;
    this.isEditMode = false;
  }

  init() {
    setActiveNav();
    wireLogout();
    this.checkEditMode();
    this.wireEvents();
    if (!this.editId) {
      this.setDefaultDate();
      this.isEditMode = true; // New listing is always in edit mode
    }
  }

  checkEditMode() {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get("id"));
    if (id) {
      this.editId = id;
      this.isEditMode = false; // Start in View mode
      $("#pageTitle").textContent = "Service Details";
      this.toggleEditBtn.style.display = "block";
      this.submitBtn.style.display = "none";
      
      this.loadExistingData(id);
      this.setFormDisabled(true);
    }
  }

  setFormDisabled(disabled) {
    const inputs = this.form.querySelectorAll("input, textarea, select");
    inputs.forEach(input => {
      if (input.id !== "toggleEditBtn") input.disabled = disabled;
    });
    
    // Disable chips
    const chips = this.tagsContainer.querySelectorAll(".chip");
    chips.forEach(chip => {
      chip.style.pointerEvents = disabled ? "none" : "auto";
      chip.style.opacity = disabled ? "0.7" : "1";
    });

    // Disable image upload
    this.imageUpload.style.pointerEvents = disabled ? "none" : "auto";
    this.imageUpload.style.opacity = disabled ? "0.8" : "1";
  }

  loadExistingData(id) {
    const myListings = JSON.parse(localStorage.getItem("linkup_my_market_listings") || "[]");
    const item = myListings.find(i => i.id === id);
    
    if (item) {
      $("#title").value = item.title;
      $("#price").value = (item.price || "").replace("RM ", "");
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
  }

  setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    $("#date").value = today;
  }

  wireEvents() {
    // Toggle Edit Mode
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

    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handlePost();
    });
  }

  handlePost() {
    const title = $("#title").value;
    const priceValue = $("#price").value;
    const location = $("#location").value;
    const description = $("#description").value;
    const date = $("#date").value;

    if (this.selectedTags.size === 0) {
      alert("Please select at least one category tag.");
      return;
    }

    const listingData = {
      id: this.editId || Date.now(),
      title,
      price: `RM ${priceValue}`,
      location,
      description,
      date,
      tags: Array.from(this.selectedTags),
      image: this.selectedImageData,
      type: "Service"
    };

    let existingListings = JSON.parse(localStorage.getItem("linkup_my_market_listings") || "[]");
    
    if (this.editId) {
      existingListings = existingListings.map(i => i.id === this.editId ? listingData : i);
    } else {
      existingListings.unshift(listingData);
    }

    localStorage.setItem("linkup_my_market_listings", JSON.stringify(existingListings));
    alert(this.editId ? "Service updated successfully!" : "Success! Your service has been posted.");
    window.location.href = "marketplace-listings.html";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const page = new ServiceManage();
  page.init();
});
