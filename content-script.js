/**
 * Content Script
 * Runs on all e-commerce pages to detect cart additions
 */

console.log('🛒 Universal Cart Tracker: Content script loaded');

// Initialize detector
const detector = new CartDetector();
let cartObserver = null;
let isProcessing = false; // Prevent multiple simultaneous detections

/**
 * Inject CSS dynamically to ensure styles are loaded
 */
function injectStyles() {
  if (document.getElementById('universal-cart-styles')) {
    return; // Already injected
  }

  const styleLink = document.createElement('link');
  styleLink.id = 'universal-cart-styles';
  styleLink.rel = 'stylesheet';
  styleLink.href = chrome.runtime.getURL('styles/content.css');
  document.head.appendChild(styleLink);

  console.log('🛒 Styles injected');
}

/**
 * Show confirmation modal
 */
function showConfirmationModal(product) {
  return new Promise((resolve) => {
    try {
      // Remove any existing modal
      const existingModal = document.getElementById('universal-cart-modal');
      if (existingModal) {
        existingModal.remove();
      }

      // Ensure styles are injected
      injectStyles();

      // Escape HTML to prevent XSS
      const escapeHtml = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      };

      // Create modal
      const modal = document.createElement('div');
      modal.id = 'universal-cart-modal';
      modal.className = 'universal-cart-modal';

      const imageHtml = product.image
        ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}" class="universal-cart-product-image" onerror="this.style.display='none'">`
        : '<div class="universal-cart-product-image" style="display:flex;align-items:center;justify-content:center;font-size:48px;background:#f5f5f5;">📦</div>';

      modal.innerHTML = `
        <div class="universal-cart-modal-content">
          <div class="universal-cart-modal-header">
            <h3>🛒 Add to Universal Cart?</h3>
            <button class="universal-cart-close" aria-label="Close">&times;</button>
          </div>
          <div class="universal-cart-modal-body">
            ${imageHtml}
            <div class="universal-cart-product-info">
              <h4 class="universal-cart-product-title">${escapeHtml(product.title)}</h4>
              <p class="universal-cart-product-price">${escapeHtml(product.price)}</p>
              <p class="universal-cart-product-store">From: ${escapeHtml(product.store)}</p>
              ${product.quantity ? `<p class="universal-cart-product-quantity">Quantity: ${escapeHtml(String(product.quantity))}</p>` : ''}
            </div>
          </div>
          <div class="universal-cart-modal-footer">
            <button class="universal-cart-button universal-cart-button-cancel">Cancel</button>
            <button class="universal-cart-button universal-cart-button-confirm">Add to Cart</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Animate in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          modal.classList.add('show');
        });
      });

      // Handle actions
      const closeModal = (confirmed) => {
        modal.classList.remove('show');
        setTimeout(() => {
          if (modal.parentNode) {
            modal.remove();
          }
          resolve(confirmed);
        }, 300);
      };

      // Event listeners
      const closeBtn = modal.querySelector('.universal-cart-close');
      const cancelBtn = modal.querySelector('.universal-cart-button-cancel');
      const confirmBtn = modal.querySelector('.universal-cart-button-confirm');

      if (closeBtn) closeBtn.addEventListener('click', () => closeModal(false));
      if (cancelBtn) cancelBtn.addEventListener('click', () => closeModal(false));
      if (confirmBtn) confirmBtn.addEventListener('click', () => closeModal(true));

      // Close on outside click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal(false);
        }
      });

      // Close on Escape key
      const escapeHandler = (e) => {
        if (e.key === 'Escape') {
          closeModal(false);
          document.removeEventListener('keydown', escapeHandler);
        }
      };
      document.addEventListener('keydown', escapeHandler);

      // Auto-close after 15 seconds
      setTimeout(() => {
        if (document.getElementById('universal-cart-modal')) {
          closeModal(false);
        }
        document.removeEventListener('keydown', escapeHandler);
      }, 15000);

    } catch (error) {
      console.error('🛒 Error showing modal:', error);
      resolve(false);
    }
  });
}

/**
 * Show notification (success or error)
 */
function showNotification(message, type = 'success') {
  try {
    // Ensure styles are injected
    injectStyles();

    // Remove any existing notifications
    const existing = document.querySelectorAll('.universal-cart-notification');
    existing.forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `universal-cart-notification universal-cart-${type}`;

    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';

    notification.innerHTML = `
      <span style="font-size: 20px; font-weight: bold;">${icon}</span>
      <span style="font-size: 15px; font-weight: 500;">${message}</span>
    `;

    document.body.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        notification.classList.add('show');
      });
    });

    // Auto-remove
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }, 3000);
  } catch (error) {
    console.error('🛒 Error showing notification:', error);
  }
}

/**
 * Show success notification
 */
function showSuccessNotification(productTitle) {
  const message = productTitle
    ? `Added "${productTitle.substring(0, 30)}${productTitle.length > 30 ? '...' : ''}" to cart!`
    : 'Added to Universal Cart!';
  showNotification(message, 'success');
}

/**
 * Show error notification
 */
function showErrorNotification(message = 'Failed to add item') {
  showNotification(message, 'error');
}

/**
 * Handle detected cart addition
 */
async function handleCartAddition(clickedElement) {
  // Prevent multiple simultaneous operations
  if (isProcessing) {
    console.log('🛒 Already processing, skipping...');
    return;
  }

  isProcessing = true;

  try {
    console.log('🛒 Cart addition detected!');

    // Extract product info
    const product = detector.extractProductInfo(clickedElement);

    // Validate product data
    if (!product || !product.title || product.title === 'Unknown Product') {
      console.warn('🛒 Invalid product data, skipping...');
      isProcessing = false;
      return;
    }

    // Check for duplicates (using URL + title for better detection)
    const isDupe = await checkIfDuplicate(product);
    if (isDupe) {
      console.log('🛒 Duplicate product (recently added), skipping...');
      showNotification('This item was recently added!', 'info');
      isProcessing = false;
      return;
    }

    console.log('🛒 Product extracted:', product);

    // Get settings to check if confirmation is needed
    const settings = await StorageHelper.getSettings();

    if (settings.showConfirmation) {
      // Show confirmation modal
      const confirmed = await showConfirmationModal(product);

      if (!confirmed) {
        console.log('🛒 User cancelled addition');
        isProcessing = false;
        return;
      }
    }

    // Add to global cart
    const sanitizedProduct = detector.sanitizeProduct(product);
    await StorageHelper.addToCart(sanitizedProduct);

    console.log('🛒 Added to global cart!');

    // Show success notification
    showSuccessNotification(product.title);

    // Update badge
    chrome.runtime.sendMessage({
      type: 'CART_UPDATED',
      timestamp: Date.now()
    });

    // Send to background for sync (if enabled)
    if (settings.syncEnabled && settings.apiEndpoint) {
      chrome.runtime.sendMessage({
        type: 'SYNC_PRODUCT',
        product: sanitizedProduct
      });
    }

  } catch (error) {
    console.error('🛒 Error handling cart addition:', error);
    showErrorNotification('Failed to add item to cart');
  } finally {
    // Reset processing flag after a short delay
    setTimeout(() => {
      isProcessing = false;
    }, 1000);
  }
}

/**
 * Check if product is a duplicate (recently added)
 */
async function checkIfDuplicate(product) {
  try {
    const cart = await StorageHelper.getCart();
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    // Check if same product was added in last 5 minutes
    return cart.some(item => {
      const sameUrl = item.url === product.url;
      const sameTitle = item.title === product.title;
      const recentlyAdded = (now - (item.addedAt || item.timestamp)) < fiveMinutes;

      return (sameUrl || sameTitle) && recentlyAdded;
    });
  } catch (error) {
    console.error('🛒 Error checking duplicates:', error);
    return false;
  }
}

/**
 * Set up click listeners
 */
function setupClickListeners() {
  document.addEventListener('click', (event) => {
    const target = event.target;
    
    // Check if clicked element or any parent is an add-to-cart button
    let element = target;
    for (let i = 0; i < 5; i++) {
      if (detector.isAddToCartButton(element)) {
        handleCartAddition(element);
        break;
      }
      if (!element.parentElement) break;
      element = element.parentElement;
    }
  }, true); // Use capture phase

  console.log('🛒 Click listeners set up');
}

/**
 * Set up cart count observer
 */
function setupCartObserver() {
  cartObserver = detector.observeCartCount((newCount) => {
    console.log('🛒 Cart count changed:', newCount);
    // Could trigger a re-scan or notification here
  });

  if (cartObserver) {
    console.log('🛒 Cart count observer set up');
  }
}

/**
 * Initialize content script
 */
async function initialize() {
  try {
    // Inject styles early
    injectStyles();

    const settings = await StorageHelper.getSettings();

    if (!settings.autoDetect) {
      console.log('🛒 Auto-detect disabled');
      return;
    }

    setupClickListeners();
    setupCartObserver();

    console.log('🛒 Universal Cart Tracker initialized successfully');
  } catch (error) {
    console.error('🛒 Error initializing:', error);
  }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Clean up on unload
window.addEventListener('unload', () => {
  if (cartObserver) {
    cartObserver.disconnect();
  }
});

