/**
 * Popup UI Script
 * Handles the extension popup interface
 */

console.log("🛒 Popup script loaded");

// State
let currentCart = [];
let currentSettings = {};

/**
 * Initialize popup
 */
async function initialize() {
  try {
    // Load cart and settings
    await Promise.all([loadCart(), loadSettings(), loadStats()]);

    // Set up event listeners
    setupTabNavigation();
    setupCartActions();
    setupSettingsActions();

    console.log("🛒 Popup initialized");
  } catch (error) {
    console.error("🛒 Error initializing popup:", error);
  }
}

/**
 * Load cart from storage
 */
async function loadCart() {
  try {
    const result = await chrome.storage.local.get(["globalCart"]);
    currentCart = result.globalCart || [];

    updateCartCount();
    renderCartItems();
  } catch (error) {
    console.error("Error loading cart:", error);
  }
}

/**
 * Load settings from storage
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get(["settings"]);
    currentSettings = result.settings || {
      autoDetect: true,
      showConfirmation: true,
      syncEnabled: false,
      apiEndpoint: "",
    };

    // Update UI
    document.getElementById("auto-detect").checked = currentSettings.autoDetect;
    document.getElementById("show-confirmation").checked =
      currentSettings.showConfirmation;
    document.getElementById("sync-enabled").checked =
      currentSettings.syncEnabled;
    document.getElementById("api-endpoint").value =
      currentSettings.apiEndpoint || "";
  } catch (error) {
    console.error("Error loading settings:", error);
  }
}

/**
 * Load and display stats
 */
async function loadStats() {
  try {
    const result = await chrome.storage.local.get(["globalCart"]);
    const cart = result.globalCart || [];

    // Calculate stats
    const totalItems = cart.length;

    // Group by store
    const storeGroups = {};
    cart.forEach((item) => {
      if (!storeGroups[item.store]) {
        storeGroups[item.store] = 0;
      }
      storeGroups[item.store]++;
    });

    const totalStores = Object.keys(storeGroups).length;

    // Update UI
    document.getElementById("total-items").textContent = totalItems;
    document.getElementById("total-stores").textContent = totalStores;

    // Render store breakdown
    const storeList = document.getElementById("store-list");
    if (totalStores > 0) {
      storeList.innerHTML = Object.entries(storeGroups)
        .sort((a, b) => b[1] - a[1]) // Sort by count
        .map(
          ([store, count]) => `
          <div class="store-item">
            <span class="store-name">${store}</span>
            <span class="store-count">${count} item${
            count !== 1 ? "s" : ""
          }</span>
          </div>
        `
        )
        .join("");
    } else {
      storeList.innerHTML = '<p class="no-data">No data yet</p>';
    }
  } catch (error) {
    console.error("Error loading stats:", error);
  }
}

/**
 * Update cart count in header
 */
function updateCartCount() {
  const countElement = document.getElementById("cart-count");
  const count = currentCart.length;
  countElement.textContent = `${count} item${count !== 1 ? "s" : ""}`;
}

/**
 * Render cart items
 */
function renderCartItems() {
  const emptyState = document.getElementById("empty-state");
  const cartItems = document.getElementById("cart-items");
  const cartActions = document.getElementById("cart-actions");

  if (currentCart.length === 0) {
    emptyState.style.display = "block";
    cartItems.innerHTML = "";
    cartActions.style.display = "none";
    return;
  }

  emptyState.style.display = "none";
  cartActions.style.display = "flex";

  cartItems.innerHTML = currentCart
    .map(
      (item) => `
    <div class="cart-item" data-id="${item.id}">
      ${
        item.image
          ? `<img src="${item.image}" alt="${item.title}" class="cart-item-image">`
          : '<div class="cart-item-image-placeholder">📦</div>'
      }
      <div class="cart-item-info">
        <h4 class="cart-item-title">${item.title}</h4>
        <p class="cart-item-price">${item.price}</p>
        <p class="cart-item-store">${item.store}</p>
        <p class="cart-item-date">${formatDate(
          item.addedAt || item.timestamp
        )}</p>
      </div>
      <div class="cart-item-actions">
        <button class="btn-icon" data-action="visit" title="Visit product page">🔗</button>
        <button class="btn-icon" data-action="remove" title="Remove from cart">🗑️</button>
      </div>
    </div>
  `
    )
    .join("");

  // Add event listeners to cart items
  cartItems.querySelectorAll(".cart-item").forEach((itemElement) => {
    const itemId = itemElement.dataset.id;
    const item = currentCart.find((i) => i.id === itemId);

    itemElement
      .querySelector('[data-action="visit"]')
      .addEventListener("click", () => {
        chrome.tabs.create({ url: item.url });
      });

    itemElement
      .querySelector('[data-action="remove"]')
      .addEventListener("click", async () => {
        await removeFromCart(itemId);
      });
  });
}

/**
 * Format date for display
 */
function formatDate(timestamp) {
  if (!timestamp) return "Unknown date";

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;

  return date.toLocaleDateString();
}

/**
 * Remove item from cart
 */
async function removeFromCart(itemId) {
  try {
    currentCart = currentCart.filter((item) => item.id !== itemId);
    await chrome.storage.local.set({ globalCart: currentCart });

    // Notify background
    chrome.runtime.sendMessage({ type: "CART_UPDATED", cart: currentCart });

    updateCartCount();
    renderCartItems();
    await loadStats();
  } catch (error) {
    console.error("Error removing item:", error);
    alert("Failed to remove item");
  }
}

/**
 * Clear entire cart
 */
async function clearCart() {
  if (!confirm("Are you sure you want to clear all items from your cart?")) {
    return;
  }

  try {
    currentCart = [];
    await chrome.storage.local.set({ globalCart: [] });

    chrome.runtime.sendMessage({ type: "CART_UPDATED", cart: [] });

    updateCartCount();
    renderCartItems();
    await loadStats();
  } catch (error) {
    console.error("Error clearing cart:", error);
    alert("Failed to clear cart");
  }
}

/**
 * Export cart to JSON
 */
async function exportCart() {
  try {
    const dataStr = JSON.stringify(currentCart, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `universal-cart-${Date.now()}.json`;
    a.click();

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting cart:", error);
    alert("Failed to export cart");
  }
}

/**
 * Save settings
 */
async function saveSettings() {
  try {
    const settings = {
      autoDetect: document.getElementById("auto-detect").checked,
      showConfirmation: document.getElementById("show-confirmation").checked,
      syncEnabled: document.getElementById("sync-enabled").checked,
      apiEndpoint: document.getElementById("api-endpoint").value.trim(),
    };

    await chrome.storage.local.set({ settings });
    currentSettings = settings;

    // Show success message
    const saveButton = document.getElementById("save-settings");
    const originalText = saveButton.textContent;
    saveButton.textContent = "✓ Saved!";
    saveButton.classList.add("success");

    setTimeout(() => {
      saveButton.textContent = originalText;
      saveButton.classList.remove("success");
    }, 2000);
  } catch (error) {
    console.error("Error saving settings:", error);
    alert("Failed to save settings");
  }
}

/**
 * Set up tab navigation
 */
function setupTabNavigation() {
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabName = button.dataset.tab;

      // Update active states
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      button.classList.add("active");
      document.getElementById(`${tabName}-tab`).classList.add("active");

      // Reload data when switching to stats tab
      if (tabName === "stats") {
        loadStats();
      }
    });
  });
}

/**
 * Set up cart action buttons
 */
function setupCartActions() {
  document.getElementById("export-cart").addEventListener("click", exportCart);
  document.getElementById("clear-cart").addEventListener("click", clearCart);
}

/**
 * Set up settings actions
 */
function setupSettingsActions() {
  document
    .getElementById("save-settings")
    .addEventListener("click", saveSettings);
}

/**
 * Listen for storage changes
 */
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.globalCart) {
    currentCart = changes.globalCart.newValue || [];
    updateCartCount();
    renderCartItems();
    loadStats();
  }
});

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize);
} else {
  initialize();
}
