/**
 * Background Service Worker
 * Manages global state and syncs with backend
 */

console.log("🛒 Universal Cart Tracker: Background service worker started");

// In-memory cache of cart state
let cartCache = [];
let syncQueue = [];
let isSyncing = false;

/**
 * Initialize background worker
 */
async function initialize() {
  try {
    // Load cart from storage
    const result = await chrome.storage.local.get(["globalCart"]);
    cartCache = result.globalCart || [];

    console.log(`🛒 Cart loaded: ${cartCache.length} items`);

    // Set up periodic sync (every 5 minutes)
    chrome.alarms.create("periodicSync", { periodInMinutes: 5 });

    // Update badge
    updateBadge();
  } catch (error) {
    console.error("🛒 Error initializing:", error);
  }
}

/**
 * Update extension badge with cart count
 */
function updateBadge() {
  const count = cartCache.length;

  if (count > 0) {
    chrome.action.setBadgeText({ text: count.toString() });
    chrome.action.setBadgeBackgroundColor({ color: "#4CAF50" });
  } else {
    chrome.action.setBadgeText({ text: "" });
  }
}

/**
 * Sync cart with backend
 */
async function syncWithBackend(products) {
  const settings = await getSettings();

  if (!settings.syncEnabled || !settings.apiEndpoint) {
    console.log("🛒 Sync disabled or no endpoint configured");
    return;
  }

  try {
    console.log(`🛒 Syncing ${products.length} products to backend...`);

    const response = await fetch(`${settings.apiEndpoint}/api/cart/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        products,
        timestamp: Date.now(),
        source: "chrome-extension",
      }),
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("🛒 Sync successful:", result);

    return result;
  } catch (error) {
    console.error("🛒 Sync error:", error);

    // Add to queue for retry
    syncQueue.push(...products);
    scheduleRetrySync();

    throw error;
  }
}

/**
 * Process sync queue
 */
async function processSyncQueue() {
  if (isSyncing || syncQueue.length === 0) return;

  isSyncing = true;

  try {
    const batch = syncQueue.splice(0, 10); // Process 10 at a time
    await syncWithBackend(batch);
  } catch (error) {
    console.error("🛒 Error processing sync queue:", error);
  } finally {
    isSyncing = false;
  }
}

/**
 * Schedule retry sync
 */
function scheduleRetrySync() {
  chrome.alarms.create("retrySync", { delayInMinutes: 1 });
}

/**
 * Get settings
 */
async function getSettings() {
  const result = await chrome.storage.local.get(["settings"]);
  return (
    result.settings || {
      autoDetect: true,
      showConfirmation: true,
      syncEnabled: false,
      apiEndpoint: "",
    }
  );
}

/**
 * Handle messages from content scripts and popup
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("🛒 Message received:", message.type);

  switch (message.type) {
    case "CART_UPDATED":
      // Reload cart from storage to ensure sync
      chrome.storage.local.get(["globalCart"], (result) => {
        cartCache = result.globalCart || [];
        updateBadge();
        sendResponse({ success: true });
      });
      return true; // Keep channel open for async response

    case "SYNC_PRODUCT":
      syncQueue.push(message.product);
      processSyncQueue();
      sendResponse({ success: true });
      break;

    case "GET_CART":
      sendResponse({ cart: cartCache });
      break;

    case "CLEAR_CART":
      cartCache = [];
      chrome.storage.local.set({ globalCart: [] });
      updateBadge();
      sendResponse({ success: true });
      break;

    case "EXPORT_CART":
      chrome.storage.local.get(["globalCart"], (result) => {
        const cart = result.globalCart || [];
        const dataStr = JSON.stringify(cart, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        chrome.downloads.download({
          url: url,
          filename: `universal-cart-${Date.now()}.json`,
          saveAs: true,
        });

        sendResponse({ success: true });
      });
      return true; // Keep channel open for async response

    default:
      sendResponse({ error: "Unknown message type" });
  }

  return true; // Keep message channel open
});

/**
 * Handle alarms
 */
chrome.alarms.onAlarm.addListener((alarm) => {
  console.log("🛒 Alarm triggered:", alarm.name);

  switch (alarm.name) {
    case "periodicSync":
      if (cartCache.length > 0) {
        syncWithBackend(cartCache).catch(console.error);
      }
      break;

    case "retrySync":
      processSyncQueue();
      break;
  }
});

/**
 * Handle extension installation/update
 */
chrome.runtime.onInstalled.addListener((details) => {
  console.log("🛒 Extension installed/updated:", details.reason);

  if (details.reason === "install") {
    // First install - set default settings
    chrome.storage.local.set({
      settings: {
        autoDetect: true,
        showConfirmation: true,
        syncEnabled: false,
        apiEndpoint: "",
      },
      globalCart: [],
    });

    // Open welcome page
    chrome.tabs.create({
      url: "popup.html",
    });
  }
});

/**
 * Handle browser startup
 */
chrome.runtime.onStartup.addListener(() => {
  console.log("🛒 Browser started, initializing...");
  initialize();
});

// Initialize on load
initialize();
