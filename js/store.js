// AURA Living — LocalStorage State Management Store

const STORAGE_KEYS = {
  CART: "aura_living_cart",
  WISHLIST: "aura_living_wishlist",
  PROMO: "aura_living_promo",
  PROTECTION: "aura_living_protection",
  SHIPPING: "aura_living_shipping"
};

// Initial default cart matching the Stitch checkout screen
const DEFAULT_CART = [
  {
    id: "sora-lounge-chair",
    title: "Sora Sculptural Lounge Chair",
    categoryLabel: "Seating · Bespoke",
    provenance: "Handcrafted in Portugal",
    price: 890,
    qty: 1,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBlUQtWYlRV-TbI_FgDD_xiXkZPgRxy45poL05r_3xvXtfguvcTnkzkUttVSHJnCurJHYW-CAgY9qqHUQ4RnWkUvAFWSWy9bKeA35FGdUe6-eTsKHOTkUumqRLTLUa78uLoY30o8QNftOnVF_68U2fdoRT_sLLL77jrEKuvm6g2fuwvSskrOOvTclx4AyHcdewWknelvSDMwnL_yH8-ajiVAxRH33x0rPiJISnhxNrmWoziXGtwegDX",
    fabric: "Oatmeal Bouclé",
    wood: "Natural European White Oak"
  },
  {
    id: "kyoto-vase",
    title: "Kyoto Hand-Pinched Ceramic Vase",
    categoryLabel: "Tableware · Kiln Crafted",
    provenance: "Made in Shigaraki",
    price: 115,
    qty: 1,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuADdmSnHbWFzeZMghzv4WgndvNy2J2FULM4qGcAz1Uhb1ph78DHL4beBn1sPYg1WR8P5fXzSnndCu7m0zEB6gKiVqgEqyTJ4ZOkCromV9FUVNAE7If-6DOE3UwXCIykyPWXQo41JA6XdsLZg8hIjIoOngMzMQYVhSM-_sOIRicTV9XsbuCVVEYH5gD9iSRO7QwzZh3lh1IEaIwwdDLqtvRBNMsdQxWVeS9_ihPTthy_IluXiLuobHT-",
    fabric: "Raw Terracotta",
    wood: ""
  },
  {
    id: "lune-lamp",
    title: "Lune Opal Glow Table Lamp",
    categoryLabel: "Lighting · Luminaire",
    provenance: "Integrated touch dimming",
    price: 240,
    qty: 1,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCtC2gi1FbX_R5zDYqJh_gM_VW_0gkbl92CNyfoPgLidecH8d0-Ja_G7x4Byuv6d9I2GI1yp8zHHnLAd4xvb5f7ISXnMtOChkv4_Hs4RPCjRAFUZwsRecwHdUGVXWanIVuLK3pManfu-S4rJ3dAVIDuLJWFiI3uUsBCVoia33__scq_pmyeUokxe6dOG1rnLmv2RWFMwkDjRyNXqCKh2-8_veg3ebULzVBh5mQ27p3M9l1gPnN7N20N",
    fabric: "Brushed Brass",
    wood: ""
  }
];

const DEFAULT_WISHLIST = ["solstice-table", "arc-stool"];

const AURAStore = {
  getCart() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CART);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(DEFAULT_CART));
        return DEFAULT_CART;
      }
      return JSON.parse(data);
    } catch (e) {
      return DEFAULT_CART;
    }
  },

  setCart(cart) {
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
      this.dispatchCartUpdate();
    } catch (e) {
      console.error("Cart save error", e);
    }
  },

  addItem(product, qty = 1, options = {}) {
    const cart = this.getCart();
    const existingIndex = cart.findIndex(item => 
      item.id === product.id &&
      (!options.fabric || item.fabric === options.fabric) &&
      (!options.wood || item.wood === options.wood)
    );

    const price = product.price + (options.priceDelta || 0);

    if (existingIndex > -1) {
      cart[existingIndex].qty += qty;
    } else {
      cart.push({
        id: product.id,
        title: product.title,
        categoryLabel: product.categoryLabel || product.designer || "Artisan Made",
        provenance: product.provenance || "Direct from Atelier",
        price: price,
        qty: qty,
        image: product.images?.primary || product.images?.catalog || product.image,
        fabric: options.fabric || (product.fabrics && product.fabrics[0]?.name) || "",
        wood: options.wood || (product.woods && product.woods[0]?.name) || ""
      });
    }

    this.setCart(cart);
    this.showToast(`Added "${product.title}" to bag`);
  },

  updateQty(index, newQty) {
    const cart = this.getCart();
    if (index >= 0 && index < cart.length) {
      if (newQty <= 0) {
        cart.splice(index, 1);
      } else {
        cart[index].qty = newQty;
      }
      this.setCart(cart);
    }
  },

  removeItem(index) {
    const cart = this.getCart();
    if (index >= 0 && index < cart.length) {
      const removed = cart.splice(index, 1)[0];
      this.setCart(cart);
      this.showToast(`Removed "${removed.title}" from bag`);
    }
  },

  clearCart() {
    this.setCart([]);
  },

  getTotals() {
    const cart = this.getCart();
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const count = cart.reduce((sum, item) => sum + item.qty, 0);

    const promo = this.getPromoCode();
    let discount = 0;
    if (promo && promo.code === "AURAHOME") {
      discount = subtotal * 0.15;
    } else if (promo && promo.code === "WELCOME10") {
      discount = subtotal * 0.10;
    }

    const protection = this.getProtectionPlan();
    const protectionCost = protection ? 65 : 0;

    // White glove complimentary on orders over $150 or $890
    const qualifiesForFreeShipping = subtotal >= 150;
    const shippingMethod = this.getShippingMethod();
    let shippingCost = 0;
    if (!qualifiesForFreeShipping && shippingMethod === "express") {
      shippingCost = 45;
    }

    const taxableAmount = Math.max(0, subtotal - discount + protectionCost);
    const tax = taxableAmount * 0.065; // ~6.5% average tax
    const total = Math.max(0, subtotal - discount + protectionCost + shippingCost + tax);

    return {
      subtotal,
      count,
      discount,
      promo,
      protection,
      protectionCost,
      qualifiesForFreeShipping,
      shippingMethod,
      shippingCost,
      tax,
      total,
      freeShippingThreshold: 890,
      freeShippingProgress: Math.min(100, Math.round((subtotal / 890) * 100))
    };
  },

  // Promo Code
  getPromoCode() {
    try {
      const p = localStorage.getItem(STORAGE_KEYS.PROMO);
      if (!p) {
        // default AURAHOME
        const defaultPromo = { code: "AURAHOME", rate: 0.15, label: "AURAHOME (15% Off Applied)" };
        localStorage.setItem(STORAGE_KEYS.PROMO, JSON.stringify(defaultPromo));
        return defaultPromo;
      }
      return JSON.parse(p);
    } catch (e) {
      return null;
    }
  },

  applyPromoCode(code) {
    const clean = (code || "").trim().toUpperCase();
    if (clean === "AURAHOME") {
      const promo = { code: "AURAHOME", rate: 0.15, label: "AURAHOME (15% Off Applied)" };
      localStorage.setItem(STORAGE_KEYS.PROMO, JSON.stringify(promo));
      this.dispatchCartUpdate();
      return { success: true, message: "15% Promotional discount applied!" };
    } else if (clean === "WELCOME10") {
      const promo = { code: "WELCOME10", rate: 0.10, label: "WELCOME10 (10% Off Applied)" };
      localStorage.setItem(STORAGE_KEYS.PROMO, JSON.stringify(promo));
      this.dispatchCartUpdate();
      return { success: true, message: "10% Welcome discount applied!" };
    }
    return { success: false, message: "Invalid or expired promo code" };
  },

  removePromoCode() {
    localStorage.removeItem(STORAGE_KEYS.PROMO);
    this.dispatchCartUpdate();
  },

  // Protection Plan
  getProtectionPlan() {
    return localStorage.getItem(STORAGE_KEYS.PROTECTION) !== "false";
  },

  setProtectionPlan(enabled) {
    localStorage.setItem(STORAGE_KEYS.PROTECTION, enabled ? "true" : "false");
    this.dispatchCartUpdate();
  },

  // Shipping Method
  getShippingMethod() {
    return localStorage.getItem(STORAGE_KEYS.SHIPPING) || "white-glove";
  },

  setShippingMethod(method) {
    localStorage.setItem(STORAGE_KEYS.SHIPPING, method);
    this.dispatchCartUpdate();
  },

  // Wishlist
  getWishlist() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WISHLIST);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(DEFAULT_WISHLIST));
        return DEFAULT_WISHLIST;
      }
      return JSON.parse(data);
    } catch (e) {
      return DEFAULT_WISHLIST;
    }
  },

  toggleWishlist(productId) {
    const list = this.getWishlist();
    const index = list.indexOf(productId);
    let added = false;
    if (index > -1) {
      list.splice(index, 1);
      this.showToast("Removed from wishlist");
    } else {
      list.push(productId);
      added = true;
      this.showToast("Saved to your wishlist");
    }
    localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("wishlistUpdated", { detail: { list, productId, added } }));
    return added;
  },

  isInWishlist(productId) {
    return this.getWishlist().includes(productId);
  },

  // Event Broadcasting
  dispatchCartUpdate() {
    const totals = this.getTotals();
    const cart = this.getCart();
    window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { cart, totals } }));
  },

  showToast(message) {
    window.dispatchEvent(new CustomEvent("showToast", { detail: { message } }));
  }
};

window.AURAStore = AURAStore;
