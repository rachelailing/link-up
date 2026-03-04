// js/pages/student/service-manage.js
import { $, $$ } from "../../utils/dom.js";
import { setActiveNav } from "../../components/navbar.js";

class ServiceManage {
  constructor() {
    this.form = $("#serviceForm");
    this.imageUpload = $("#imageUpload");
    this.fileInput = $("#fileInput");
    this.tagsContainer = $("#serviceTags");
    this.selectedImageData = null;
    this.selectedTags = new Set();
  }

  init() {
    setActiveNav();
    this.wireEvents();
    this.setDefaultDate();
  }

  setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    $("#date").value = today;
  }

  wireEvents() {
    // Image Upload
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

    // Tag Selection (Chips)
    if (this.tagsContainer) {
      this.tagsContainer.addEventListener("click", (e) => {
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

    // Form submission
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

    const newService = {
      id: Date.now(),
      title,
      price: `RM ${priceValue}`,
      location,
      description,
      date,
      tags: Array.from(this.selectedTags),
      image: this.selectedImageData,
      type: "Service"
    };

    const existingListings = JSON.parse(localStorage.getItem("linkup_my_market_listings") || "[]");
    existingListings.unshift(newService);
    localStorage.setItem("linkup_my_market_listings", JSON.stringify(existingListings));

    alert("Success! Your service has been posted.");
    window.location.href = "marketplace-listings.html";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const page = new ServiceManage();
  page.init();
});
