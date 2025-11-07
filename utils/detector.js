/**
 * Cart Detection Utility
 * Detects add-to-cart actions across different e-commerce platforms
 */

class CartDetector {
  constructor() {
    // Common patterns for add-to-cart buttons (extensive list)
    this.buttonSelectors = [
      // Class-based selectors
      'button[class*="add-to-cart" i]',
      'button[class*="add-cart" i]',
      'button[class*="addtocart" i]',
      'button[class*="add-to-bag" i]',
      'button[class*="addtobag" i]',
      'button[class*="add-to-basket" i]',
      'button[class*="buy-now" i]',
      'button[class*="buynow" i]',
      'button[class*="purchase" i]',
      'button[class*="add-item" i]',

      // ID-based selectors
      'button[id*="add-to-cart" i]',
      'button[id*="addtocart" i]',
      'button[id*="add-cart" i]',
      'button[id*="buy-now" i]',

      // Data attribute selectors
      'button[data-action*="cart" i]',
      'button[data-action*="add" i]',
      'button[data-testid*="add-to-cart" i]',
      'button[data-testid*="add-cart" i]',
      '[data-add-to-cart]',
      '[data-cart-add]',

      // Input and link elements
      'input[type="submit"][value*="add to cart" i]',
      'input[type="button"][value*="add to cart" i]',
      'a[class*="add-to-cart" i]',
      'a[class*="add-cart" i]',

      // Role-based
      '[role="button"][class*="cart" i]',
      '[role="button"][class*="add" i]',

      // Amazon specific
      '#add-to-cart-button',
      '[name="submit.add-to-cart"]',

      // Shopify specific
      '[name="add"]',
      'button[type="submit"][name="add"]',
      '.product-form__submit',

      // WooCommerce specific
      '.single_add_to_cart_button',
      '.add_to_cart_button',

      // Magento specific
      '#product-addtocart-button',
      '.tocart'
    ];

    // Cart count indicators
    this.cartCountSelectors = [
      '[class*="cart-count" i]',
      '[class*="cart-quantity" i]',
      '[id*="cart-count" i]',
      "[data-cart-count]",
      ".minicart-quantity",
      ".cart-badge",
    ];

    // Keywords in button text (multi-language support)
    this.cartKeywords = [
      // English
      "add to cart",
      "add to bag",
      "add to basket",
      "add item",
      "buy now",
      "purchase",
      "add now",
      "quick buy",

      // Hebrew (עברית)
      "הוסף לסל",
      "הוספה לסל",
      "קנה עכשיו",
      "הוסף לעגלה",
      "רכישה",
      "הוסף",

      // Spanish (Español)
      "añadir al carrito",
      "añadir al carro",
      "agregar al carrito",
      "comprar ahora",

      // French (Français)
      "ajouter au panier",
      "acheter maintenant",
      "ajouter",

      // German (Deutsch)
      "in den warenkorb",
      "zum warenkorb",
      "jetzt kaufen",

      // Italian (Italiano)
      "aggiungi al carrello",
      "compra ora",

      // Portuguese (Português)
      "adicionar ao carrinho",
      "adicionar à sacola",
      "comprar agora",

      // Russian (Русский)
      "добавить в корзину",
      "купить сейчас",
      "в корзину",

      // Arabic (العربية)
      "أضف إلى السلة",
      "اشتر الآن",
      "إضافة للسلة",

      // Chinese (中文)
      "加入购物车",
      "添加到购物车",
      "立即购买",
      "加入",

      // Japanese (日本語)
      "カートに入れる",
      "カートに追加",
      "今すぐ購入",

      // Korean (한국어)
      "장바구니에 추가",
      "장바구니",
      "구매하기",

      // Dutch (Nederlands)
      "toevoegen aan winkelwagen",
      "in winkelwagen",

      // Polish (Polski)
      "dodaj do koszyka",
      "do koszyka",

      // Turkish (Türkçe)
      "sepete ekle",
      "hemen al",
    ];

    // Track last detected items to avoid duplicates
    this.recentDetections = new Set();
    this.detectionTimeout = 3000; // 3 seconds cooldown
  }

  /**
   * Check if an element is an add-to-cart button
   */
  isAddToCartButton(element) {
    if (!element) return false;

    // Check by selector match
    for (const selector of this.buttonSelectors) {
      try {
        // Remove pseudo-selectors that querySelector doesn't support
        const cleanSelector = selector.replace(":has-text", "");
        if (element.matches(cleanSelector)) {
          return true;
        }
      } catch (e) {
        // Invalid selector, skip
      }
    }

    // Check by text content
    const text = element.textContent?.toLowerCase() || "";
    const ariaLabel = element.getAttribute("aria-label")?.toLowerCase() || "";
    const title = element.getAttribute("title")?.toLowerCase() || "";

    const combinedText = `${text} ${ariaLabel} ${title}`;

    return this.cartKeywords.some((keyword) => combinedText.includes(keyword));
  }

  /**
   * Extract product information from the page
   */
  extractProductInfo(clickedElement) {
    const product = {
      title: "",
      price: "",
      image: "",
      url: window.location.href,
      store: window.location.hostname,
      timestamp: Date.now(),
      id: this.generateProductId(),
      quantity: 1, // Default quantity
    };

    // Find product container (walk up the DOM)
    let container = clickedElement;
    for (let i = 0; i < 10; i++) {
      if (!container.parentElement) break;
      container = container.parentElement;

      // Stop if we hit a likely product container
      if (this.isProductContainer(container)) break;
    }

    // Extract title
    product.title = this.extractTitle(container);

    // Extract price
    product.price = this.extractPrice(container);

    // Extract image
    product.image = this.extractImage(container);

    // Extract quantity if available
    product.quantity = this.extractQuantity(container);

    return product;
  }

  /**
   * Check if element is likely a product container
   */
  isProductContainer(element) {
    const classList = element.className?.toLowerCase() || "";
    const id = element.id?.toLowerCase() || "";

    const containerKeywords = ["product", "item", "card", "listing", "detail"];

    return containerKeywords.some(
      (keyword) => classList.includes(keyword) || id.includes(keyword)
    );
  }

  /**
   * Extract product title
   */
  extractTitle(container) {
    // Try common title selectors
    const titleSelectors = [
      '[itemprop="name"]',
      '[class*="product-title" i]',
      '[class*="product-name" i]',
      '[class*="product_title" i]',
      '[id*="product-title" i]',
      '[data-testid*="product-title" i]',
      '[data-testid*="product-name" i]',
      'h1[class*="product" i]',
      'h1[class*="title" i]',
      "h1",
      "h2",
      '.product-name',
      '#product-name',
      '.title',
    ];

    for (const selector of titleSelectors) {
      try {
        const element = container.querySelector(selector);
        if (element?.textContent?.trim()) {
          let title = element.textContent.trim();
          // Clean up title - remove extra whitespace and newlines
          title = title.replace(/\s+/g, ' ').trim();
          if (title.length > 5 && title.length < 300) {
            return title;
          }
        }
      } catch (e) {
        // Skip invalid selectors
        continue;
      }
    }

    // Try meta tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle?.content?.trim()) {
      return ogTitle.content.trim();
    }

    // Fallback to page title
    const pageTitle = document.title.split("|")[0].split("-")[0].trim();
    return pageTitle.length > 0 ? pageTitle : 'Unknown Product';
  }

  /**
   * Extract price from JSON-LD structured data
   */
  extractPriceFromStructuredData() {
    try {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent);
          if (data['@type'] === 'Product' && data.offers) {
            const offers = Array.isArray(data.offers) ? data.offers[0] : data.offers;
            if (offers.price && offers.priceCurrency) {
              return `${offers.priceCurrency} ${offers.price}`;
            }
            if (offers.price) {
              return String(offers.price);
            }
          }
        } catch (e) {
          continue;
        }
      }
    } catch (e) {
      // Ignore errors
    }
    return null;
  }

  /**
   * Extract product price
   */
  extractPrice(container) {
    // First, try to get price from JSON-LD structured data
    const structuredPrice = this.extractPriceFromStructuredData();
    if (structuredPrice) {
      return structuredPrice;
    }

    // Try common price selectors - expanded and prioritized list
    const priceSelectors = [
      // Data attributes (most reliable)
      "[data-price]",
      '[data-product-price]',
      '[data-price-amount]',

      // Schema.org
      '[itemprop="price"]',
      '[itemprop="priceCurrency"]',

      // Specific price classes (current/sale)
      '[class*="current-price" i]',
      '[class*="sale-price" i]',
      '[class*="final-price" i]',
      '[class*="special-price" i]',
      '[class*="offer-price" i]',

      // General price classes
      '[class*="price" i]:not([class*="old" i]):not([class*="was" i]):not([class*="original" i]):not([class*="regular" i])',
      'span[class*="price" i]',
      'div[class*="price" i]',
      'p[class*="price" i]',
      'strong[class*="price" i]',

      // ID-based
      '#price',
      '[id*="price" i]',

      // Cost/Amount
      '[class*="cost" i]',
      '[class*="amount" i]',
      '[class*="value" i]',

      // Platform-specific
      '.product-price',
      '.price-box',
      '.price-container',
      '.price__amount',
      '.product__price',
      '.gl-price',

      // Fallback - any element with price-related attributes
      '[aria-label*="price" i]',
      '[title*="price" i]',
    ];

    // Extended currency patterns
    const currencyPatterns = [
      // Symbol before number: $99.99, €99,99, £99.99, ₪99.99
      /[\$£€¥₪₹₽¢]\s*[\d,]+\.?\d*/,
      // Number before symbol: 99.99$, 99€, 99₪
      /[\d,]+\.?\d*\s*[\$£€¥₪₹₽]/,
      // Currency code: 99.99 USD, 99 ILS, 99.99 EUR
      /[\d,]+\.?\d*\s*(USD|EUR|GBP|ILS|JPY|CNY|INR|RUB|BRL|CAD|AUD|CHF|NZD|ZAR)/i,
      // Just numbers with currency code prefix: USD 99.99, ILS 99
      /(USD|EUR|GBP|ILS|JPY|CNY|INR|RUB|BRL|CAD|AUD|CHF|NZD|ZAR)\s*[\d,]+\.?\d*/i,
      // Numbers with decimal/comma: 99.99, 99,99, 1,299.99, 1.299,99
      /[\d,]+[.,]\d{2}(?!\d)/,
      // Whole numbers that look like prices: 99, 199, 1299 (2-5 digits)
      /\b\d{2,5}\b/,
    ];

    let bestPrice = null;
    let bestScore = 0;

    for (const selector of priceSelectors) {
      const elements = container.querySelectorAll(selector);

      for (const element of elements) {
        // Skip hidden elements
        if (element.offsetParent === null) continue;

        const text = element.textContent?.trim() || "";
        const dataPrice =
          element.getAttribute("data-price") || element.getAttribute("content");

        // Check data attributes first (most reliable)
        if (dataPrice) {
          const cleaned = this.cleanPriceText(dataPrice);
          if (cleaned) return cleaned;
        }

        // Try each currency pattern
        for (let i = 0; i < currencyPatterns.length; i++) {
          const match = text.match(currencyPatterns[i]);
          if (match) {
            const priceText = match[0];
            const score = this.scorePriceCandidate(element, priceText, i);

            if (score > bestScore) {
              bestScore = score;
              bestPrice = priceText;
            }
          }
        }
      }
    }

    if (bestPrice) {
      return this.cleanPriceText(bestPrice);
    }

    // Fallback 1: Search entire container for currency patterns
    const containerText = container.textContent || "";
    for (const pattern of currencyPatterns.slice(0, 4)) {
      // Only check strong patterns
      const match = containerText.match(pattern);
      if (match) {
        return this.cleanPriceText(match[0]);
      }
    }

    // Fallback 2: Search entire document body (last resort)
    const bodyText = document.body.textContent || "";
    for (const pattern of currencyPatterns.slice(0, 3)) {
      // Only the strongest patterns
      const matches = bodyText.match(new RegExp(pattern.source, 'g'));
      if (matches && matches.length > 0) {
        // Find the most prominently displayed price
        for (const match of matches) {
          const cleaned = this.cleanPriceText(match);
          // Basic validation - should have digits and currency symbol
          if (cleaned && /[\d.,]/.test(cleaned) && (cleaned.includes('$') || cleaned.includes('€') || cleaned.includes('£') || cleaned.includes('₪') || cleaned.includes('₹'))) {
            return cleaned;
          }
        }
      }
    }

    // Fallback 3: Look for meta tags with price
    const metaPrice = document.querySelector('meta[property="product:price:amount"]');
    if (metaPrice?.content) {
      const metaCurrency = document.querySelector('meta[property="product:price:currency"]');
      const currency = metaCurrency?.content || '';
      return `${currency} ${metaPrice.content}`.trim();
    }

    return "Price not found";
  }

  /**
   * Score a price candidate (higher = more likely to be correct)
   */
  scorePriceCandidate(element, priceText, patternIndex) {
    let score = 10 - patternIndex; // Earlier patterns are better

    // Boost score for elements with price-related classes
    const className = element.className?.toLowerCase() || "";
    if (className.includes("current") || className.includes("sale")) score += 5;
    if (className.includes("final")) score += 5;
    if (className.includes("regular")) score -= 2;
    if (className.includes("old") || className.includes("was")) score -= 10;

    // Boost for visible font size (larger = more likely main price)
    const fontSize = parseFloat(window.getComputedStyle(element).fontSize);
    if (fontSize > 20) score += 3;
    if (fontSize > 30) score += 5;

    // Boost for bold text
    const fontWeight = window.getComputedStyle(element).fontWeight;
    if (parseInt(fontWeight) >= 600 || fontWeight === "bold") score += 2;

    // Penalize if text contains extra words
    const wordCount = priceText.split(/\s+/).length;
    if (wordCount > 3) score -= 2;

    return score;
  }

  /**
   * Clean and format price text
   */
  cleanPriceText(priceText) {
    if (!priceText) return "Price not found";

    // Remove extra whitespace
    let cleaned = priceText.trim().replace(/\s+/g, " ");

    // Ensure there's a space between numbers and currency codes
    cleaned = cleaned.replace(/([\d.,]+)([A-Z]{3})/g, "$1 $2");
    cleaned = cleaned.replace(/([A-Z]{3})([\d.,]+)/g, "$1 $2");

    return cleaned;
  }

  /**
   * Extract product image
   */
  extractImage(container) {
    // Try common image selectors
    const imageSelectors = [
      'img[itemprop="image"]',
      'img[class*="product" i]',
      'img[class*="main" i]',
      'img[alt*="product" i]',
      '[class*="product-image" i] img',
      '[class*="product_image" i] img',
      '[data-testid*="product-image" i] img',
      '.product-image img',
      '#product-image img',
      "img",
    ];

    for (const selector of imageSelectors) {
      try {
        const img = container.querySelector(selector);
        if (img?.src && img.src.startsWith('http')) {
          // Skip placeholder images
          const src = img.src.toLowerCase();
          if (!src.includes("placeholder") && !src.includes("loading") && !src.includes("spinner")) {
            return img.src;
          }
        }
      } catch (e) {
        // Skip invalid selectors
        continue;
      }
    }

    // Try meta tags
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage?.content?.trim()) {
      return ogImage.content;
    }

    return "";
  }

  /**
   * Extract quantity from quantity selector
   */
  extractQuantity(container) {
    const quantitySelectors = [
      'input[name="quantity"]',
      'input[id="quantity"]',
      'input[class*="quantity" i]',
      'input[data-quantity]',
      'select[name="quantity"]',
      'select[class*="quantity" i]',
      '[class*="qty" i] input',
      'input[type="number"]',
    ];

    for (const selector of quantitySelectors) {
      try {
        const element = container.querySelector(selector);
        if (element) {
          const value = element.value || element.textContent;
          const quantity = parseInt(value, 10);
          if (!isNaN(quantity) && quantity > 0 && quantity < 1000) {
            return quantity;
          }
        }
      } catch (e) {
        // Skip invalid selectors
        continue;
      }
    }

    // Default quantity is 1
    return 1;
  }

  /**
   * Generate unique product ID based on page and timestamp
   */
  generateProductId() {
    const baseId = `${window.location.hostname}-${Date.now()}`;
    return btoa(baseId).substring(0, 16);
  }

  /**
   * Check if this detection is a duplicate (within cooldown period)
   */
  isDuplicate(productId) {
    if (this.recentDetections.has(productId)) {
      return true;
    }

    // Add to recent detections
    this.recentDetections.add(productId);

    // Remove after cooldown
    setTimeout(() => {
      this.recentDetections.delete(productId);
    }, this.detectionTimeout);

    return false;
  }

  /**
   * Watch for cart count changes using MutationObserver
   */
  observeCartCount(callback) {
    const cartCountElements = document.querySelectorAll(
      this.cartCountSelectors.join(",")
    );

    if (cartCountElements.length === 0) return null;

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === "characterData" ||
          mutation.type === "childList"
        ) {
          const newCount = mutation.target.textContent?.trim();
          if (newCount && !isNaN(newCount)) {
            callback(parseInt(newCount));
          }
        }
      }
    });

    // Observe each cart count element
    cartCountElements.forEach((element) => {
      observer.observe(element, {
        characterData: true,
        childList: true,
        subtree: true,
      });
    });

    return observer;
  }

  /**
   * Clean up product data
   */
  sanitizeProduct(product) {
    return {
      ...product,
      title: product.title.substring(0, 200), // Limit length
      price: product.price.substring(0, 50),
      image: product.image.substring(0, 500),
      url: product.url.substring(0, 500),
      store: product.store.substring(0, 100),
      quantity: Math.max(1, Math.min(999, product.quantity || 1)), // Ensure valid quantity
    };
  }
}

// Export for use in content script
if (typeof module !== "undefined" && module.exports) {
  module.exports = CartDetector;
}
