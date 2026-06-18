/* ============================================================
   RYANZ STORE — collection-filters.js
   AJAX Collection Filtering & Sorting
   ============================================================ */

"use strict";

class CollectionFilters {
  constructor() {
    this.grid = document.querySelector("[data-products-grid]");
    this.countEl = document.querySelector("[data-products-count]");
    this.sortSelect = document.querySelector("[data-sort-by]");
    this.filterForm = document.querySelector("[data-filter-form]");
    this.priceMin = document.querySelector("[data-price-min]");
    this.priceMax = document.querySelector("[data-price-max]");
    this.priceMinDisplay = document.querySelector("[data-price-min-display]");
    this.priceMaxDisplay = document.querySelector("[data-price-max-display]");
    this.mobileToggle = document.querySelector("[data-filter-toggle]");
    this.filterDrawer = document.querySelector(".filter-drawer");
    this.activeFiltersEl = document.querySelector("[data-active-filters]");
    this.clearBtn = document.querySelector("[data-clear-filters]");

    if (!this.grid) return;

    this.isLoading = false;
    this.init();
  }

  init() {
    this.bindSortChange();
    this.bindFilterChange();
    this.bindPriceRange();
    this.bindMobileToggle();
    this.bindClearFilters();
    this.renderActiveFilters();
    this.initViewToggle();
  }

  // ── Sort ───────────────────────────────────────────────────
  bindSortChange() {
    this.sortSelect?.addEventListener("change", () => {
      const url = new URL(window.location.href);
      url.searchParams.set("sort_by", this.sortSelect.value);
      this.navigate(url.toString());
    });
  }

  // ── Checkbox Filters ──────────────────────────────────────
  bindFilterChange() {
    this.filterForm?.addEventListener(
      "change",
      RyanzStore.debounce(() => {
        this.submitFilters();
      }, 400),
    );
  }

  submitFilters() {
    if (!this.filterForm) return;
    const formData = new FormData(this.filterForm);
    const url = new URL(window.location.href);

    // Clear existing filter params
    for (const key of [...url.searchParams.keys()]) {
      if (key.startsWith("filter.") || key === "page")
        url.searchParams.delete(key);
    }

    // Add new filter params
    for (const [key, val] of formData.entries()) {
      if (val) url.searchParams.append(key, val);
    }

    this.navigate(url.toString());
  }

  // ── Price Range ────────────────────────────────────────────
  bindPriceRange() {
    if (!this.priceMin || !this.priceMax) return;

    const updateDisplays = () => {
      const min = parseFloat(this.priceMin.value);
      const max = parseFloat(this.priceMax.value);
      if (this.priceMinDisplay)
        this.priceMinDisplay.textContent = "$" + min.toFixed(0);
      if (this.priceMaxDisplay)
        this.priceMaxDisplay.textContent = "$" + max.toFixed(0);

      // Prevent inversion
      if (min > max) {
        if (document.activeElement === this.priceMin) {
          this.priceMax.value = min;
        } else {
          this.priceMin.value = max;
        }
      }
    };

    const submitPrice = RyanzStore.debounce(() => {
      const url = new URL(window.location.href);
      url.searchParams.set("filter.v.price.gte", this.priceMin.value);
      url.searchParams.set("filter.v.price.lte", this.priceMax.value);
      this.navigate(url.toString());
    }, 600);

    this.priceMin.addEventListener("input", () => {
      updateDisplays();
      submitPrice();
    });
    this.priceMax.addEventListener("input", () => {
      updateDisplays();
      submitPrice();
    });
    updateDisplays();
  }

  // ── Mobile Filter Toggle ───────────────────────────────────
  bindMobileToggle() {
    this.mobileToggle?.addEventListener("click", () => {
      this.filterDrawer?.classList.toggle("is-open");
      document.querySelector(".overlay")?.classList.toggle("is-active");
    });

    document
      .querySelector("[data-filter-close]")
      ?.addEventListener("click", () => {
        this.filterDrawer?.classList.remove("is-open");
        document.querySelector(".overlay")?.classList.remove("is-active");
      });
  }

  // ── Clear Filters ──────────────────────────────────────────
  bindClearFilters() {
    this.clearBtn?.addEventListener("click", () => {
      const url = new URL(window.location.href);
      for (const key of [...url.searchParams.keys()]) {
        if (key.startsWith("filter.")) url.searchParams.delete(key);
      }
      this.navigate(url.toString());
    });
  }

  // ── Active Filter Chips ────────────────────────────────────
  renderActiveFilters() {
    if (!this.activeFiltersEl) return;
    const params = new URLSearchParams(window.location.search);
    const chips = [];

    params.forEach((value, key) => {
      if (!key.startsWith("filter.")) return;
      const label = key
        .replace("filter.", "")
        .replace(/\./g, " › ")
        .replace(/_/g, " ");
      chips.push(`
        <button
          class="filter-chip"
          data-remove-filter="${key}"
          data-remove-value="${value}"
          title="Remove ${label}: ${value}"
        >
          ${this.toTitleCase(label)}: ${value} ×
        </button>
      `);
    });

    this.activeFiltersEl.innerHTML = chips.join("");
    this.activeFiltersEl.style.display = chips.length ? "flex" : "none";

    // Bind chip removal
    this.activeFiltersEl
      .querySelectorAll("[data-remove-filter]")
      .forEach((chip) => {
        chip.addEventListener("click", () => {
          const url = new URL(window.location.href);
          const key = chip.dataset.removeFilter;
          const val = chip.dataset.removeValue;
          const values = url.searchParams.getAll(key).filter((v) => v !== val);
          url.searchParams.delete(key);
          values.forEach((v) => url.searchParams.append(key, v));
          this.navigate(url.toString());
        });
      });
  }

  // ── View Toggle (Grid / List) ──────────────────────────────
  initViewToggle() {
    document.querySelectorAll("[data-view-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const view = btn.dataset.viewToggle;
        document
          .querySelectorAll("[data-view-toggle]")
          .forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");

        if (this.grid) {
          this.grid.className = this.grid.className.replace(/view-\w+/g, "");
          this.grid.classList.add(`view-${view}`);
          localStorage.setItem("collection-view", view);
        }
      });

      // Restore saved view
      const saved = localStorage.getItem("collection-view");
      if (saved && btn.dataset.viewToggle === saved) btn.click();
    });
  }

  // ── AJAX Navigation ───────────────────────────────────────
  async navigate(url) {
    if (this.isLoading) return;
    this.isLoading = true;

    window.history.pushState({}, "", url);
    this.showLoading();

    try {
      const res = await fetch(url, {
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, "text/html");

      // Update grid
      const newGrid = doc.querySelector("[data-products-grid]");
      if (this.grid && newGrid) {
        this.grid.innerHTML = newGrid.innerHTML;
        // Re-init wishlist buttons
        window.Wishlist?.initButtons();
      }

      // Update count
      const newCount = doc.querySelector("[data-products-count]");
      if (this.countEl && newCount) {
        this.countEl.textContent = newCount.textContent;
      }

      this.renderActiveFilters();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Filter navigation error:", err);
      window.location.href = url;
    } finally {
      this.isLoading = false;
      this.hideLoading();
    }
  }

  showLoading() {
    if (this.grid) {
      this.grid.style.opacity = "0.4";
      this.grid.style.pointerEvents = "none";
    }
  }

  hideLoading() {
    if (this.grid) {
      this.grid.style.opacity = "";
      this.grid.style.pointerEvents = "";
    }
  }

  toTitleCase(str) {
    return str.replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

// ── Pagination ────────────────────────────────────────────────
class InfiniteScroll {
  constructor() {
    this.sentinel = document.querySelector("[data-infinite-scroll]");
    if (!this.sentinel) return;
    this.nextUrl = this.sentinel.dataset.nextUrl;
    if (!this.nextUrl) return;

    this.loading = false;
    this.observe();
  }

  observe() {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !this.loading) this.loadMore();
      },
      { rootMargin: "200px" },
    );
    observer.observe(this.sentinel);
  }

  async loadMore() {
    this.loading = true;
    this.sentinel.innerHTML =
      '<div class="spinner" style="margin:2rem auto"></div>';

    try {
      const res = await fetch(this.nextUrl);
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, "text/html");

      const grid = document.querySelector("[data-products-grid]");
      const newItems = doc.querySelectorAll(
        "[data-products-grid] .product-card",
      );
      const fragment = document.createDocumentFragment();
      newItems.forEach((el) => fragment.appendChild(el));
      grid?.appendChild(fragment);

      const nextPage = doc.querySelector("[data-infinite-scroll]");
      this.nextUrl = nextPage?.dataset.nextUrl;

      if (this.nextUrl) {
        this.sentinel.innerHTML = "";
        this.loading = false;
      } else {
        this.sentinel.remove();
      }

      window.Wishlist?.initButtons();
      window.RyanzStore?.initScrollReveal();
    } catch {
      this.sentinel.remove();
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new CollectionFilters();
  new InfiniteScroll();
});
