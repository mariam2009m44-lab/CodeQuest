/* Shared Cody visual companion for CodeQuest public and learning pages. */
(() => {
  "use strict";
  if (document.querySelector(".cody-global-companion") || document.querySelector(".cody-character--image")) return;
  const image = "a4845a93-494a-4896-9601-6127e452b9ef%20(1).jpg";
  const homeMascot = document.querySelector(".character-area .cody");
  if (homeMascot) {
    homeMascot.classList.add("cody-home-mascot");
    homeMascot.replaceChildren();
    const heroImage = document.createElement("img");
    heroImage.className = "cody-home-image";
    heroImage.src = image;
    heroImage.alt = "كودي، مساعدك في رحلة تعلم البرمجة";
    heroImage.fetchPriority = "high";
    heroImage.decoding = "async";
    homeMascot.append(heroImage);
    return;
  }
  const companion = document.createElement("div");
  companion.className = "cody-global-companion";
  companion.setAttribute("role", "img");
  companion.setAttribute("aria-label", "كودي، مساعد CodeQuest");
  const mascot = document.createElement("img");
  mascot.src = image;
  mascot.alt = "";
  mascot.loading = "lazy";
  mascot.decoding = "async";
  mascot.addEventListener("error", () => companion.remove(), { once: true });
  companion.append(mascot);
  document.body.append(companion);
})();
