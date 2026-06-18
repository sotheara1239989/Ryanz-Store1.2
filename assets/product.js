/* ============================================================
   RYANZ STORE — product.js
   Product Page Interactivity
   ============================================================ */

"use strict";

class ProductPage {
  constructor() {
    this.form = document.querySelector("[data-product-form]");
    if (!this.form) return;

    this.productData = JSON.parse(
      document.querySelector("[data-product-json]")?.textContent || "{}",
    );
    this.variants = this.productData.variants || [];
    this.currentVariant = this.variants[0];

    this.priceEl = document.querySelector("[data-product-price]");
    this.comparePriceEl = document.querySelector("[data-compare-price]");
    this.stockEl = document.querySelector("[data-stock-status]");
    this.skuEl = document.querySelector("[data-sku]");
    this.atcBtn = document.querySelector("[data-add-to-cart-main]");
    this.buyNowBtn = document.querySelector("[data-buy-now]");
    this.variantIdInput = this.form.querySelector('[name="id"]');

    this.initVariants();
    this.initQuantity();
    this.initBuyNow();
    this.updateState(this.currentVariant);
  }

  // ── Variant Pickers ────────────────────────────────────────
  initVariants() {
    document.querySelectorAll("[data-variant-option]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const optionIndex = parseInt(btn.dataset.optionIndex, 10);
        const value = btn.dataset.value;

        // Update active state for this option group
        document
          .querySelectorAll(`[data-option-index="${optionIndex}"]`)
          .forEach((b) => {
            b.classList.remove("is-active");
          });
        btn.classList.add("is-active");

        this.findVariant();
      });
    });
  }

  findVariant() {
    const selectedOptions = [];
    document.querySelectorAll(".variant-option-group").forEach((group) => {
      const active = group.querySelector("[data-variant-option].is-active");
      if (active) selectedOptions.push(active.dataset.value);
    });

    const found = this.variants.find((v) =>
      v.options.every((opt, i) => opt === selectedOptions[i]),
    );

    if (found) {
      this.currentVariant = found;
      this.updateState(found);
      this.updateURL(found);
    }
  }

  updateState(variant) {
    if (!variant) return;

    // Update hidden input
    if (this.variantIdInput) this.variantIdInput.value = variant.id;

    // Price
    if (this.priceEl) {
      this.priceEl.textContent = this.formatMoney(variant.price);
    }
    if (this.comparePriceEl) {
      if (
        variant.compare_at_price &&
        variant.compare_at_price > variant.price
      ) {
        this.comparePriceEl.textContent = this.formatMoney(
          variant.compare_at_price,
        );
        this.comparePriceEl.style.display = "inline";
      } else {
        this.comparePriceEl.style.display = "none";
      }
    }

    // Stock
    if (this.stockEl) {
      this.stockEl.className = "product-stock";
      if (variant.available) {
        if (variant.inventory_quantity > 0 && variant.inventory_quantity <= 5) {
          this.stockEl.textContent = `Only ${variant.inventory_quantity} left!`;
          this.stockEl.classList.add("product-stock--low");
        } else {
          this.stockEl.textContent = "In Stock";
          this.stockEl.classList.add("product-stock--in");
        }
      } else {
        this.stockEl.textContent = "Out of Stock";
        this.stockEl.classList.add("product-stock--out");
      }
    }

    // SKU
    if (this.skuEl && variant.sku) {
      this.skuEl.textContent = variant.sku;
    }

    // ATC Button
    if (this.atcBtn) {
      this.atcBtn.disabled = !variant.available;
      this.atcBtn.textContent = variant.available
        ? "Add to Cart"
        : "Out of Stock";
    }

    // Gallery update
    if (variant.featured_image) {
      this.updateGallery(variant.featured_image.src);
    }

    // Availability on option buttons
    this.updateOptionAvailability();
  }

  updateOptionAvailability() {
    document.querySelectorAll("[data-variant-option]").forEach((btn) => {
      const optionIndex = parseInt(btn.dataset.optionIndex, 10);
      const value = btn.dataset.value;

      const available = this.variants.some((v) => {
        const matches = v.options.every((opt, i) => {
          if (i === optionIndex) return opt === value;
          const activeBtn = document.querySelector(
            `[data-option-index="${i}"].is-active`,
          );
          return !activeBtn || opt === activeBtn.dataset.value;
        });
        return matches && v.available;
      });

      btn.classList.toggle("is-unavailable", !available);
    });
  }

  updateURL(variant) {
    const url = new URL(window.location.href);
    url.searchParams.set("variant", variant.id);
    window.history.replaceState({ variantId: variant.id }, "", url.toString());
  }

  updateGallery(src) {
    const mainImg = document.querySelector(".product-gallery__main img");
    if (!mainImg) return;
    mainImg.style.opacity = "0";
    setTimeout(() => {
      mainImg.src = src.replace("_{width}x", "_600x");
      mainImg.style.opacity = "1";
    }, 180);
  }

  // ── Quantity ───────────────────────────────────────────────
  initQuantity() {
    const qtyInput = document.querySelector("[data-qty-input]");
    const upBtn = document.querySelector("[data-qty-increase]");
    const downBtn = document.querySelector("[data-qty-decrease]");

    if (!qtyInput) return;

    upBtn?.addEventListener("click", () => {
      qtyInput.value = Math.min(
        parseInt(qtyInput.value, 10) + 1,
        parseInt(qtyInput.max || "99", 10),
      );
    });

    downBtn?.addEventListener("click", () => {
      qtyInput.value = Math.max(parseInt(qtyInput.value, 10) - 1, 1);
    });

    qtyInput.addEventListener("change", () => {
      const val = parseInt(qtyInput.value, 10);
      if (isNaN(val) || val < 1) qtyInput.value = 1;
    });
  }

  // ── Buy Now ────────────────────────────────────────────────
  initBuyNow() {
    this.buyNowBtn?.addEventListener("click", async (e) => {
      e.preventDefault();
      const variantId = this.currentVariant?.id;
      const qty = parseInt(
        document.querySelector("[data-qty-input]")?.value || "1",
        10,
      );
      if (!variantId) return;

      this.buyNowBtn.disabled = true;
      this.buyNowBtn.textContent = "Processing...";

      try {
        await RyanzStore.fetchJSON("/cart/add.js", {
          method: "POST",
          body: JSON.stringify({ id: variantId, quantity: qty }),
        });
        window.location.href = "/checkout";
      } catch {
        RyanzStore.showToast(
          "Something went wrong. Please try again.",
          "error",
        );
        this.buyNowBtn.disabled = false;
        this.buyNowBtn.textContent = "Buy Now";
      }
    });
  }

  formatMoney(cents) {
    return "$" + (cents / 100).toFixed(2);
  }
}

// ── Product Reviews ───────────────────────────────────────────
class ReviewsSection {
  constructor() {
    this.initStarRating();
    this.initSortFilter();
  }

  initStarRating() {
    const stars = document.querySelectorAll("[data-review-star]");
    let hoveredRating = 0;

    stars.forEach((star) => {
      star.addEventListener("mouseenter", () => {
        hoveredRating = parseInt(star.dataset.reviewStar, 10);
        this.highlightStars(stars, hoveredRating);
      });

      star.addEventListener("mouseleave", () => {
        const current = parseInt(
          document.querySelector("[data-rating-input]")?.value || "0",
          10,
        );
        this.highlightStars(stars, current);
      });

      star.addEventListener("click", () => {
        const rating = parseInt(star.dataset.reviewStar, 10);
        const input = document.querySelector("[data-rating-input]");
        if (input) input.value = rating;
        this.highlightStars(stars, rating);
      });
    });
  }

  highlightStars(stars, rating) {
    stars.forEach((s) => {
      const val = parseInt(s.dataset.reviewStar, 10);
      s.style.color =
        val <= rating ? "var(--color-warning)" : "var(--color-surface-3)";
    });
  }

  initSortFilter() {
    const sort = document.querySelector("[data-reviews-sort]");
    sort?.addEventListener("change", () => {
      // Re-sort reviews (Shopify handles via page reload in real implementation)
      const url = new URL(window.location.href);
      url.searchParams.set("sort_by", sort.value);
      window.location.href = url.toString();
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new ProductPage();
  new ReviewsSection();
});
