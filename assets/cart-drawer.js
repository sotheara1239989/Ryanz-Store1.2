/* ============================================================
   RYANZ STORE — cart-drawer.js
   Slide-out Cart Drawer with AJAX
   ============================================================ */

"use strict";

class CartDrawer {
  constructor() {
    this.drawer = document.querySelector(".cart-drawer");
    this.overlay = document.querySelector(".overlay");
    this.countEls = document.querySelectorAll(".cart-count");
    this.itemsContainer = document.querySelector(".cart-drawer__items");
    this.totalEl = document.querySelector(".cart-total-price");
    this.subtotalEl = document.querySelector(".cart-subtotal");
    this.progressFill = document.querySelector(".cart-shipping-bar__fill");
    this.progressText = document.querySelector(".cart-shipping-progress-text");
    this.freeShippingThreshold = parseInt(
      this.drawer?.dataset.freeShipping || "5000",
      10,
    );

    if (!this.drawer) return;
    this.bindEvents();
    this.initCoupon();
  }

  bindEvents() {
    // Open triggers
    document.querySelectorAll("[data-open-cart]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        this.open();
      });
    });

    // Close triggers
    const closeBtn = this.drawer.querySelector(".cart-drawer__close");
    closeBtn?.addEventListener("click", () => this.close());
    this.overlay?.addEventListener("click", () => this.close());

    // Keyboard
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.drawer.classList.contains("is-open"))
        this.close();
    });

    // Add to Cart buttons (delegated)
    document.addEventListener("click", (e) => {
      const atcBtn = e.target.closest("[data-add-to-cart]");
      if (atcBtn) {
        e.preventDefault();
        this.addItem(atcBtn);
      }

      const removeBtn = e.target.closest("[data-cart-remove]");
      if (removeBtn)
        this.removeItem(
          removeBtn.dataset.cartRemove,
          removeBtn.dataset.lineIndex,
        );

      const qtyUp = e.target.closest("[data-qty-up]");
      if (qtyUp)
        this.updateQty(qtyUp.dataset.qtyUp, 1, qtyUp.dataset.lineIndex);

      const qtyDown = e.target.closest("[data-qty-down]");
      if (qtyDown)
        this.updateQty(qtyDown.dataset.qtyDown, -1, qtyDown.dataset.lineIndex);
    });
  }

  open() {
    this.drawer.classList.add("is-open");
    this.overlay?.classList.add("is-active");
    document.body.style.overflow = "hidden";
    this.drawer.setAttribute("aria-hidden", "false");
    this.refreshCart();
  }

  close() {
    this.drawer.classList.remove("is-open");
    this.overlay?.classList.remove("is-active");
    document.body.style.overflow = "";
    this.drawer.setAttribute("aria-hidden", "true");
  }

  async addItem(btn) {
    const variantId =
      btn.dataset.addToCart ||
      btn.closest("form")?.querySelector('[name="id"]')?.value;
    if (!variantId) return;

    const qty = parseInt(
      btn.closest("form")?.querySelector('[name="quantity"]')?.value || "1",
      10,
    );

    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span>';

    try {
      const data = await RyanzStore.fetchJSON("/cart/add.js", {
        method: "POST",
        body: JSON.stringify({ id: variantId, quantity: qty }),
      });

      await this.refreshCart();
      this.open();
      RyanzStore.showToast("Added to cart!", "success");
    } catch (err) {
      console.error("Add to cart error:", err);
      RyanzStore.showToast("Could not add to cart. Please try again.", "error");
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }

  async removeItem(variantId, lineIndex) {
    const line = parseInt(lineIndex, 10);
    await this.changeItem(line, 0);
  }

  async updateQty(variantId, delta, lineIndex) {
    const line = parseInt(lineIndex, 10);
    const qtyEl = document.querySelector(`[data-qty-line="${lineIndex}"]`);
    const current = parseInt(qtyEl?.textContent || "1", 10);
    const newQty = Math.max(0, current + delta);
    await this.changeItem(line, newQty);
  }

  async changeItem(line, quantity) {
    try {
      await RyanzStore.fetchJSON("/cart/change.js", {
        method: "POST",
        body: JSON.stringify({ line, quantity }),
      });
      await this.refreshCart();
    } catch (err) {
      console.error("Cart change error:", err);
    }
  }

  async refreshCart() {
    try {
      const cart = await RyanzStore.fetchJSON("/cart.js");
      this.updateCount(cart.item_count);
      this.renderItems(cart);
      this.updateTotals(cart);
      this.updateShippingBar(cart.total_price);
    } catch (err) {
      console.error("Cart refresh error:", err);
    }
  }

  updateCount(count) {
    this.countEls.forEach((el) => {
      el.textContent = count;
      el.classList.toggle("is-empty", count === 0);
      if (count > 0) el.classList.add("badge-bounce");
      setTimeout(() => el.classList.remove("badge-bounce"), 400);
    });

    const drawerCount = this.drawer.querySelector(".cart-drawer__count");
    if (drawerCount) drawerCount.textContent = count;
  }

  renderItems(cart) {
    if (!this.itemsContainer) return;

    if (!cart.items.length) {
      this.itemsContainer.innerHTML = `
        <div class="cart-drawer__empty">
          <div class="cart-drawer__empty-icon">🛒</div>
          <h3 style="font-family:var(--font-heading);font-size:1.25rem">Your cart is empty</h3>
          <p>Add some epic gear to get started!</p>
          <a href="/collections/all" class="btn btn--primary btn--sm">Shop Now</a>
        </div>
      `;
      return;
    }

    this.itemsContainer.innerHTML = cart.items
      .map(
        (item, idx) => `
      <div class="cart-item" data-variant-id="${item.variant_id}">
        <a href="${item.url}">
          <img
            class="cart-item__img"
            src="${item.image}"
            alt="${item.title}"
            loading="lazy"
            width="72"
            height="72"
          >
        </a>
        <div class="cart-item__info">
          <a href="${item.url}" class="cart-item__title">${item.product_title}</a>
          ${
            item.variant_title && item.variant_title !== "Default Title"
              ? `<div class="cart-item__variant">${item.variant_title}</div>`
              : ""
          }
          <div class="cart-item__row">
            <div class="cart-item__qty">
              <button data-qty-down="${item.variant_id}" data-line-index="${idx + 1}" aria-label="Decrease quantity">−</button>
              <span data-qty-line="${idx + 1}">${item.quantity}</span>
              <button data-qty-up="${item.variant_id}" data-line-index="${idx + 1}" aria-label="Increase quantity">+</button>
            </div>
            <div class="cart-item__price">${this.formatMoney(item.final_line_price)}</div>
            <button
              class="cart-item__remove"
              data-cart-remove="${item.variant_id}"
              data-line-index="${idx + 1}"
              aria-label="Remove ${item.title}"
            >Remove</button>
          </div>
        </div>
      </div>
    `,
      )
      .join("");
  }

  updateTotals(cart) {
    if (this.subtotalEl) {
      this.subtotalEl.textContent = this.formatMoney(cart.total_price);
    }
    if (this.totalEl) {
      this.totalEl.textContent = this.formatMoney(cart.total_price);
    }
  }

  updateShippingBar(totalPrice) {
    if (!this.progressFill || !this.freeShippingThreshold) return;

    const progress = Math.min(
      100,
      (totalPrice / this.freeShippingThreshold) * 100,
    );
    this.progressFill.style.width = `${progress}%`;

    if (this.progressText) {
      if (totalPrice >= this.freeShippingThreshold) {
        this.progressText.innerHTML = `<span style="color:var(--color-accent)">🎉 You qualify for FREE shipping!</span>`;
      } else {
        const remaining = this.formatMoney(
          this.freeShippingThreshold - totalPrice,
        );
        this.progressText.textContent = `Add ${remaining} more for FREE shipping`;
      }
    }
  }

  initCoupon() {
    const form = this.drawer?.querySelector(".cart-drawer__coupon");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = form.querySelector("input");
      const code = input?.value.trim();
      if (!code) return;

      RyanzStore.showToast("Coupon applied at checkout!", "success");
    });
  }

  formatMoney(cents) {
    return "$" + (cents / 100).toFixed(2);
  }
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  window.cartDrawer = new CartDrawer();
});
