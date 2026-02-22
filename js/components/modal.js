import { $$ } from "../utils/dom.js";

export function openModal(id){
  document.getElementById(id)?.classList.add("show");
}

export function closeModal(id){
  document.getElementById(id)?.classList.remove("show");
}

export function wireModalClose(){
  $$("[data-modal-close]").forEach(btn => {
    btn.addEventListener("click", () => closeModal(btn.dataset.modalClose));
  });

  $$(".modal-backdrop").forEach(backdrop => {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) backdrop.classList.remove("show");
    });
  });
}