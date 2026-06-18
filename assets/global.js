/* ============================================================
   RYANZ STORE — global.js
   Core JavaScript Utilities & Scroll Effects
   ============================================================ */

"use strict";

// ── Utility Helpers ─────────────────────────────────────────
const RyanzStore = {
  init() {
    this.initScrollReveal();
    this.initHeader();
    this.initToasts();
    this.initMobileMenu();
    this.initTabSystem();
    this.initCountdown();
    this.initLazyImages();
    document.documentElement.classList.add("js-loaded");
  },

  // ── Scroll Reveal ──────────────────────────────────────────
  initScrollReveal() {
    const targets = document.querySelectorAll(
      ".reveal, .reveal-left, .reveal-right, .reveal-stagger",
    );
    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    targets.forEach((el) => observer.observe(el));
  },

  // ── Sticky Header ──────────────────────────────────────────
  initHeader() {
    const header = document.querySelector(".site-header");
    if (!header) return;

    let lastScroll = 0;
    const handleScroll = () => {
      const current = window.scrollY;
      if (current > 60) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
      lastScroll = current;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
  },

  // ── Toast Notifications ────────────────────────────────────
  initToasts() {
    if (!document.querySelector(".toast-container")) {
      const container = document.createElement("div");
      container.className = "toast-container";
      document.body.appendChild(container);
    }
  },

  showToast(message, type = "info", duration = 3500) {
    const container = document.querySelector(".toast-container");
    if (!container) return;

    const icons = { success: "✓", error: "✕", info: "ℹ", warning: "⚠" };
    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <span style="font-size:1.1rem;font-weight:700">${icons[type] || icons.info}</span>
      <span style="font-size:0.875rem;font-weight:500">${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // ── Mobile Menu ────────────────────────────────────────────
  initMobileMenu() {
    const toggle = document.querySelector(".menu-toggle");
    const menu = document.querySelector(".mobile-menu");
    const overlay = document.querySelector(".overlay");
    if (!toggle || !menu) return;

    const open = () => {
      toggle.classList.add("is-active");
      menu.classList.add("is-open");
      overlay?.classList.add("is-active");
      document.body.style.overflow = "hidden";
      toggle.setAttribute("aria-expanded", "true");
    };

    const close = () => {
      toggle.classList.remove("is-active");
      menu.classList.remove("is-open");
      overlay?.classList.remove("is-active");
      document.body.style.overflow = "";
      toggle.setAttribute("aria-expanded", "false");
    };

    toggle.addEventListener("click", () => {
      toggle.classList.contains("is-active") ? close() : open();
    });

    overlay?.addEventListener("click", close);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  },

  // ── Tab System ─────────────────────────────────────────────
  initTabSystem() {
    document.querySelectorAll(".product-tabs").forEach((tabsEl) => {
      const buttons = tabsEl.querySelectorAll(".product-tab-btn");
      const panels = document.querySelectorAll(".product-tab-panel");

      buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const target = btn.dataset.tab;

          buttons.forEach((b) => b.classList.remove("is-active"));
          panels.forEach((p) => p.classList.remove("is-active"));

          btn.classList.add("is-active");
          const panel = document.getElementById(`tab-${target}`);
          if (panel) panel.classList.add("is-active");
        });
      });
    });
  },

  // ── Countdown Timer ────────────────────────────────────────
  initCountdown() {
    document.querySelectorAll("[data-countdown]").forEach((el) => {
      const end = new Date(el.dataset.countdown).getTime();
      const update = () => {
        const now = Date.now();
        const diff = end - now;
        if (diff <= 0) {
          el.textContent = "Offer Expired";
          return;
        }

        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);

        el.innerHTML = `
          <span>${String(h).padStart(2, "0")}</span>:
          <span>${String(m).padStart(2, "0")}</span>:
          <span>${String(s).padStart(2, "0")}</span>
        `;
      };
      update();
      setInterval(update, 1000);
    });
  },

  // ── Lazy Images ────────────────────────────────────────────
  initLazyImages() {
    if ("loading" in HTMLImageElement.prototype) return;

    const images = document.querySelectorAll('img[loading="lazy"]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ isIntersecting, target }) => {
        if (isIntersecting) {
          target.src = target.dataset.src || target.src;
          observer.unobserve(target);
        }
      });
    });
    images.forEach((img) => observer.observe(img));
  },

  // ── Format Money ───────────────────────────────────────────
  formatMoney(cents, format = "${{amount}}") {
    const amount = (cents / 100).toFixed(2);
    return format
      .replace("{{amount}}", amount)
      .replace("{{amount_no_decimals}}", Math.floor(cents / 100));
  },

  // ── Debounce ───────────────────────────────────────────────
  debounce(fn, wait = 250) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait);
    };
  },

  // ── Fetch JSON ─────────────────────────────────────────────
  async fetchJSON(url, options = {}) {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
};

// ── Wishlist ─────────────────────────────────────────────────
const Wishlist = {
  key: "ryanz_wishlist",

  get() {
    try {
      return JSON.parse(localStorage.getItem(this.key) || "[]");
    } catch {
      return [];
    }
  },

  save(items) {
    localStorage.setItem(this.key, JSON.stringify(items));
  },

  toggle(productId) {
    const items = this.get();
    const idx = items.indexOf(productId);
    if (idx === -1) {
      items.push(productId);
      RyanzStore.showToast("Added to Wishlist ♥", "success");
    } else {
      items.splice(idx, 1);
      RyanzStore.showToast("Removed from Wishlist", "info");
    }
    this.save(items);
    this.updateUI(productId, idx === -1);
    return idx === -1;
  },

  has(productId) {
    return this.get().includes(productId);
  },

  updateUI(productId, isWishlisted) {
    document
      .querySelectorAll(`[data-wishlist="${productId}"]`)
      .forEach((btn) => {
        btn.classList.toggle("is-wishlisted", isWishlisted);
        btn.setAttribute("aria-pressed", String(isWishlisted));
      });
  },

  initButtons() {
    const saved = this.get();
    document.querySelectorAll("[data-wishlist]").forEach((btn) => {
      const id = btn.dataset.wishlist;
      if (saved.includes(id)) {
        btn.classList.add("is-wishlisted");
        btn.setAttribute("aria-pressed", "true");
      }
      btn.addEventListener("click", () => this.toggle(id));
    });
  },
};

// ── Quick View Modal ─────────────────────────────────────────
const QuickView = {
  modal: null,

  init() {
    document.querySelectorAll("[data-quick-view]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        this.open(btn.dataset.quickView, btn.dataset.productUrl);
      });
    });
  },

  async open(productId, productUrl) {
    if (!productUrl) return;
    this.showModal('<div class="spinner" style="margin:auto"></div>');

    try {
      const res = await fetch(`${productUrl}?view=quick`);
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const content =
        doc.querySelector(".product-quick-view") ||
        doc.querySelector(".product-form");
      if (content) this.showModal(content.outerHTML);
    } catch {
      this.showModal(
        '<p style="text-align:center;padding:2rem">Could not load product</p>',
      );
    }
  },

  showModal(content) {
    let modal = document.querySelector(".quick-view-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.className = "quick-view-modal";
      modal.innerHTML = `
        <div class="quick-view-modal__backdrop"></div>
        <div class="quick-view-modal__dialog glass-card" role="dialog">
          <button class="quick-view-modal__close" aria-label="Close">&times;</button>
          <div class="quick-view-modal__body"></div>
        </div>
      `;
      document.body.appendChild(modal);
      modal
        .querySelector(".quick-view-modal__backdrop")
        .addEventListener("click", () => this.close());
      modal
        .querySelector(".quick-view-modal__close")
        .addEventListener("click", () => this.close());
    }
    modal.querySelector(".quick-view-modal__body").innerHTML = content;
    modal.classList.add("is-open");
    document.body.style.overflow = "hidden";
  },

  close() {
    const modal = document.querySelector(".quick-view-modal");
    if (modal) modal.classList.remove("is-open");
    document.body.style.overflow = "";
  },
};

// ── Navigation Dropdowns ─────────────────────────────────────
function initNavDropdowns() {
  document.querySelectorAll(".nav-item").forEach((item) => {
    const dropdown = item.querySelector(".nav-dropdown");
    if (!dropdown) return;

    let timer;
    item.addEventListener("mouseenter", () => {
      clearTimeout(timer);
      dropdown.style.display = "block";
    });
    item.addEventListener("mouseleave", () => {
      timer = setTimeout(() => {
        dropdown.style.display = "";
      }, 120);
    });
  });
}

// ── Announcement Bar ─────────────────────────────────────────
function initAnnouncementBar() {
  const bar = document.querySelector(".announcement-bar");
  const close = document.querySelector(".announcement-bar__close");
  if (!bar || !close) return;

  if (sessionStorage.getItem("announcement-dismissed")) {
    bar.style.display = "none";
    return;
  }

  close.addEventListener("click", () => {
    bar.style.height = bar.offsetHeight + "px";
    requestAnimationFrame(() => {
      bar.style.transition = "height 0.3s ease, opacity 0.3s ease";
      bar.style.height = "0";
      bar.style.opacity = "0";
      bar.style.overflow = "hidden";
    });
    setTimeout(() => {
      bar.style.display = "none";
    }, 350);
    sessionStorage.setItem("announcement-dismissed", "1");
  });
}

// ── Product Image Zoom ───────────────────────────────────────
function initImageZoom() {
  const mainImg = document.querySelector(".product-gallery__main");
  if (!mainImg) return;

  const img = mainImg.querySelector("img");
  if (!img) return;

  mainImg.addEventListener("mousemove", (e) => {
    const rect = mainImg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    img.style.transformOrigin = `${x}% ${y}%`;
    img.style.transform = "scale(1.5)";
  });

  mainImg.addEventListener("mouseleave", () => {
    img.style.transform = "";
    img.style.transformOrigin = "";
  });
}

// ── Gallery Thumbnails ───────────────────────────────────────
function initGalleryThumbs() {
  document
    .querySelectorAll(".product-gallery__thumb")
    .forEach((thumb, idx, all) => {
      thumb.addEventListener("click", () => {
        all.forEach((t) => t.classList.remove("is-active"));
        thumb.classList.add("is-active");

        const mainImg = document.querySelector(".product-gallery__main img");
        const src = thumb.querySelector("img")?.src;
        if (mainImg && src) {
          mainImg.style.opacity = "0";
          mainImg.style.transition = "opacity 0.2s ease";
          setTimeout(() => {
            mainImg.src = src;
            mainImg.style.opacity = "1";
          }, 200);
        }
      });
    });
}

// ── Scroll to Top ────────────────────────────────────────────
function initScrollToTop() {
  const btn = document.querySelector(".scroll-to-top");
  if (!btn) return;

  window.addEventListener(
    "scroll",
    () => {
      btn.classList.toggle("is-visible", window.scrollY > 600);
    },
    { passive: true },
  );

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  RyanzStore.init();
  Wishlist.initButtons();
  QuickView.init();
  initNavDropdowns();
  initAnnouncementBar();
  initImageZoom();
  initGalleryThumbs();
  initScrollToTop();
});

window.RyanzStore = RyanzStore;
window.Wishlist = Wishlist;
