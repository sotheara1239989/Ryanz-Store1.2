/* ============================================================
   RYANZ STORE — predictive-search.js
   Debounced Live Search with Keyboard Navigation
   ============================================================ */

"use strict";

class PredictiveSearch {
  constructor() {
    this.input = document.querySelector("[data-predictive-search-input]");
    this.results = document.querySelector("[data-predictive-search-results]");
    this.form = document.querySelector("[data-search-form]");
    if (!this.input || !this.results) return;

    this.currentIndex = -1;
    this.abortController = null;
    this.debouncedSearch = RyanzStore.debounce(this.search.bind(this), 320);

    this.bindEvents();
  }

  bindEvents() {
    this.input.addEventListener("input", () => {
      const q = this.input.value.trim();
      if (q.length < 2) {
        this.hide();
        return;
      }
      this.debouncedSearch(q);
    });

    this.input.addEventListener("keydown", (e) => this.handleKeydown(e));

    this.input.addEventListener("focus", () => {
      if (this.input.value.trim().length >= 2)
        this.results.style.display = "block";
    });

    document.addEventListener("click", (e) => {
      if (!this.input.contains(e.target) && !this.results.contains(e.target)) {
        this.hide();
      }
    });
  }

  async search(query) {
    // Cancel previous request
    if (this.abortController) this.abortController.abort();
    this.abortController = new AbortController();

    this.showLoading();

    try {
      const res = await fetch(
        `/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=6`,
        { signal: this.abortController.signal },
      );
      const data = await res.json();
      this.render(data.resources?.results?.products || [], query);
    } catch (err) {
      if (err.name !== "AbortError") {
        this.hide();
      }
    }
  }

  showLoading() {
    this.results.style.display = "block";
    this.results.innerHTML = `
      <div style="display:flex;align-items:center;gap:0.75rem;padding:1rem 1.25rem">
        <div class="spinner" style="width:16px;height:16px"></div>
        <span style="font-size:0.875rem;color:var(--color-text-muted)">Searching...</span>
      </div>
    `;
  }

  render(products, query) {
    if (!products.length) {
      this.results.innerHTML = `
        <div style="padding:1.25rem;text-align:center">
          <p style="color:var(--color-text-muted);font-size:0.875rem">No results for "<strong style="color:var(--color-text)">${this.escapeHTML(query)}</strong>"</p>
          <a href="/search?q=${encodeURIComponent(query)}" class="btn btn--secondary btn--sm" style="margin-top:0.75rem;display:inline-flex">
            View all results
          </a>
        </div>
      `;
      this.results.style.display = "block";
      return;
    }

    const html = products
      .map(
        (p, i) => `
      <a class="predictive-search-item" href="${p.url}" data-search-item="${i}" role="option">
        <img
          class="predictive-search-img"
          src="${p.featured_image?.url || ""}"
          alt="${this.escapeHTML(p.title)}"
          loading="lazy"
          width="44"
          height="44"
        >
        <div class="predictive-search-info">
          <div class="predictive-search-title">${this.highlight(p.title, query)}</div>
          <div class="predictive-search-price">${this.formatMoney(p.price)}</div>
        </div>
      </a>
    `,
      )
      .join("");

    const viewAll = `
      <a href="/search?q=${encodeURIComponent(query)}" class="predictive-search-item" style="justify-content:center;color:var(--color-primary);font-weight:600;font-size:0.875rem;gap:0.5rem">
        View all results for "${this.escapeHTML(query)}" →
      </a>
    `;

    this.results.innerHTML = html + viewAll;
    this.results.style.display = "block";
    this.currentIndex = -1;
  }

  handleKeydown(e) {
    const items = this.results.querySelectorAll("[data-search-item]");
    if (!items.length) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        this.currentIndex = Math.min(this.currentIndex + 1, items.length - 1);
        this.setActive(items);
        break;
      case "ArrowUp":
        e.preventDefault();
        this.currentIndex = Math.max(this.currentIndex - 1, -1);
        this.setActive(items);
        break;
      case "Enter":
        if (this.currentIndex >= 0 && items[this.currentIndex]) {
          e.preventDefault();
          items[this.currentIndex].click();
        }
        break;
      case "Escape":
        this.hide();
        this.input.blur();
        break;
    }
  }

  setActive(items) {
    items.forEach((item, idx) => {
      item.style.background =
        idx === this.currentIndex ? "rgba(0,212,255,0.06)" : "";
    });
    if (this.currentIndex >= 0) {
      this.input.value =
        items[this.currentIndex].querySelector(".predictive-search-title")
          ?.textContent || this.input.value;
    }
  }

  hide() {
    this.results.style.display = "none";
    this.currentIndex = -1;
  }

  highlight(text, query) {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return this.escapeHTML(text).replace(
      new RegExp(`(${escaped})`, "gi"),
      '<mark style="background:rgba(0,212,255,0.2);color:var(--color-primary);border-radius:2px">$1</mark>',
    );
  }

  escapeHTML(str) {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  formatMoney(cents) {
    return "$" + (cents / 100).toFixed(2);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new PredictiveSearch();
});
