/**
 * Storage Utility
 * Manages Chrome storage for global cart state
 */

const StorageHelper = {
  /**
   * Get global cart items
   */
  async getCart() {
    try {
      const result = await chrome.storage.local.get(['globalCart']);
      return result.globalCart || [];
    } catch (error) {
      console.error('Error getting cart:', error);
      return [];
    }
  },

  /**
   * Add item to global cart
   */
  async addToCart(product) {
    try {
      const cart = await this.getCart();
      
      // Check if item already exists
      const existingIndex = cart.findIndex(item => 
        item.url === product.url && 
        item.title === product.title
      );

      if (existingIndex >= 0) {
        // Update existing item
        cart[existingIndex] = {
          ...cart[existingIndex],
          ...product,
          updatedAt: Date.now()
        };
      } else {
        // Add new item
        cart.unshift({
          ...product,
          addedAt: Date.now()
        });
      }

      await chrome.storage.local.set({ globalCart: cart });
      
      // Notify background script
      this.notifyCartUpdate(cart);
      
      return cart;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  },

  /**
   * Remove item from cart
   */
  async removeFromCart(productId) {
    try {
      const cart = await this.getCart();
      const updatedCart = cart.filter(item => item.id !== productId);
      await chrome.storage.local.set({ globalCart: updatedCart });
      this.notifyCartUpdate(updatedCart);
      return updatedCart;
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  },

  /**
   * Clear entire cart
   */
  async clearCart() {
    try {
      await chrome.storage.local.set({ globalCart: [] });
      this.notifyCartUpdate([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  },

  /**
   * Get cart statistics
   */
  async getCartStats() {
    const cart = await this.getCart();
    
    // Group by store
    const storeGroups = {};
    cart.forEach(item => {
      if (!storeGroups[item.store]) {
        storeGroups[item.store] = [];
      }
      storeGroups[item.store].push(item);
    });

    return {
      totalItems: cart.length,
      stores: Object.keys(storeGroups).length,
      storeBreakdown: Object.entries(storeGroups).map(([store, items]) => ({
        store,
        count: items.length
      }))
    };
  },

  /**
   * Get settings
   */
  async getSettings() {
    try {
      const result = await chrome.storage.local.get(['settings']);
      return result.settings || {
        autoDetect: true,
        showConfirmation: true,
        syncEnabled: false,
        apiEndpoint: ''
      };
    } catch (error) {
      console.error('Error getting settings:', error);
      return {};
    }
  },

  /**
   * Update settings
   */
  async updateSettings(settings) {
    try {
      const currentSettings = await this.getSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      await chrome.storage.local.set({ settings: updatedSettings });
      return updatedSettings;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  },

  /**
   * Notify background script of cart update
   */
  notifyCartUpdate(cart) {
    try {
      chrome.runtime.sendMessage({
        type: 'CART_UPDATED',
        cart: cart,
        timestamp: Date.now()
      });
    } catch (error) {
      // Ignore errors if background script isn't ready
      console.debug('Could not notify background script:', error);
    }
  },

  /**
   * Export cart data
   */
  async exportCart() {
    const cart = await this.getCart();
    const stats = await this.getCartStats();
    
    return {
      cart,
      stats,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };
  }
};

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageHelper;
}

