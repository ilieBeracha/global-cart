# Universal Cart Tracker - Chrome Extension

A Chrome extension that detects when you add items to cart on any e-commerce site and tracks them in a universal global cart. No API integrations needed - works through intelligent DOM detection and event listening.

## 🎯 Features

- **Universal Detection**: Automatically detects cart additions across e-commerce sites
- **Confirmation Modal**: Shows a clean, non-intrusive confirmation before adding items
- **Global Cart**: Track all your cart items from different stores in one place
- **Statistics**: View insights about your shopping across different stores
- **Backend Sync**: Optional sync with backend API for cross-device support
- **Export**: Export your cart data as JSON

## 🚀 Quick Start

### Installation

1. **Clone or download this repository**

```bash
git clone <repository-url>
cd cursor
```

2. **Load the extension in Chrome**

   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `cursor` directory

3. **Create extension icons** (currently placeholders)

   Create three PNG images in the `icons/` directory:
   - `cart-16.png` (16x16px)
   - `cart-48.png` (48x48px)
   - `cart-128.png` (128x128px)

   You can use any cart icon or emoji. Quick option: Use an emoji-to-png converter with 🛒

4. **Start shopping!**

   Visit any e-commerce site (Amazon, eBay, Shopify stores, etc.) and add items to cart. The extension will detect it and show a confirmation modal.

## 📁 Project Structure

```
cursor/
├── manifest.json              # Extension configuration
├── background.js              # Service worker for state management
├── content-script.js          # Injected script that detects cart additions
├── popup.html                 # Extension popup UI
├── popup.js                   # Popup logic
├── utils/
│   ├── detector.js           # Cart detection logic
│   └── storage.js            # Chrome storage helpers
├── styles/
│   ├── content.css           # Styles for injected modal
│   └── popup.css             # Styles for popup UI
├── icons/                    # Extension icons (create these)
└── README.md
```

## 🔧 How It Works

### Detection Strategy

The extension uses multiple detection methods:

1. **Button Click Detection**
   - Listens for clicks on elements with cart-related classes/IDs
   - Checks button text for keywords ("Add to Cart", "Add to Bag", etc.)
   - Supports multiple languages

2. **DOM Observation**
   - Watches for cart count changes using MutationObserver
   - Detects modal popups that appear after cart additions

3. **Product Extraction**
   - Walks up the DOM to find product containers
   - Extracts title, price, image, and URL
   - Sanitizes and validates data

### Confirmation Flow

```
User clicks "Add to Cart" 
  → Extension detects click
  → Extracts product info
  → Shows confirmation modal
  → User approves
  → Adds to global cart
  → Shows success notification
  → (Optional) Syncs to backend
```

### Storage & Sync

- **Local Storage**: Uses Chrome Storage API for persistence
- **In-Memory Cache**: Background worker maintains cache for performance
- **Backend Sync**: Optional event-based sync to external API
- **Retry Queue**: Failed syncs are queued and retried

## 🎨 UI Components

### Confirmation Modal

- Non-intrusive overlay that appears when cart addition is detected
- Shows product image, title, price, and store
- User can approve or cancel
- Auto-closes after 10 seconds

### Extension Popup

Three tabs:

1. **Cart Tab**: View all tracked items, visit product pages, remove items
2. **Settings Tab**: Configure detection and sync settings
3. **Stats Tab**: View statistics by store

## ⚙️ Settings

### Detection Settings

- **Auto-detect cart additions**: Enable/disable automatic detection
- **Show confirmation modal**: Toggle confirmation before adding to global cart

### Sync Settings

- **Enable backend sync**: Send cart data to backend API
- **Backend API Endpoint**: Your backend server URL (e.g., `https://api.example.com`)

## 🔌 Backend Integration (Optional)

The extension can sync with a backend API. Set up your backend to accept:

### Sync Endpoint

```
POST /api/cart/sync
Content-Type: application/json

{
  "products": [
    {
      "id": "...",
      "title": "Product Name",
      "price": "$99.99",
      "image": "https://...",
      "url": "https://...",
      "store": "example.com",
      "timestamp": 1234567890
    }
  ],
  "timestamp": 1234567890,
  "source": "chrome-extension"
}
```

### Response

```json
{
  "success": true,
  "synced": 1,
  "message": "Cart synced successfully"
}
```

## 🧪 Testing

### Test the Extension

1. **Create a test e-commerce page** (or use `test-store.html` if provided)
2. **Visit a real e-commerce site** (Amazon, Target, etc.)
3. **Click "Add to Cart"** - The confirmation modal should appear
4. **Check the extension popup** - Click the extension icon to see your cart
5. **Test different sites** - Try various stores to test detection accuracy

### Supported Stores

The extension uses generic detection patterns that work across most e-commerce platforms:

- ✅ Amazon
- ✅ eBay
- ✅ Shopify stores
- ✅ WooCommerce stores
- ✅ Magento stores
- ✅ Custom e-commerce sites

**Note**: Detection accuracy varies by site. The extension learns common patterns but may need site-specific adjustments for best results.

## 🐛 Troubleshooting

### Detection Not Working

1. **Check console logs**: Open DevTools (F12) and look for `🛒` prefixed messages
2. **Verify auto-detect is enabled**: Check Settings tab in popup
3. **Check button selectors**: Some sites use non-standard buttons - may need custom rules

### Modal Not Appearing

1. **Check if confirmation is enabled**: Settings → Show confirmation modal
2. **Look for z-index conflicts**: The modal uses max z-index but some sites may override
3. **Check browser console**: Errors will appear with `🛒` prefix

### Sync Not Working

1. **Verify endpoint URL**: Must be a valid HTTPS URL
2. **Check CORS settings**: Backend must allow extension origin
3. **Look at background worker logs**: Navigate to `chrome://extensions/` → Extension details → Service worker → Console

### Items Not Saving

1. **Check storage permissions**: Make sure extension has storage permission
2. **Clear extension storage**: May be corrupted - clear and restart
3. **Check background worker**: Make sure it's running in extension details page

## 📊 Data Export

Export your cart data anytime:

1. Open extension popup
2. Go to Cart tab
3. Click "Export Cart" button
4. Save JSON file

Format:
```json
[
  {
    "id": "...",
    "title": "Product Name",
    "price": "$99.99",
    "image": "https://...",
    "url": "https://...",
    "store": "example.com",
    "addedAt": 1234567890
  }
]
```

## 🔒 Privacy

- **Local-first**: All data stored locally in your browser by default
- **No automatic tracking**: Only detects what you explicitly add to cart
- **Optional sync**: Backend sync is disabled by default
- **No analytics**: No usage tracking or analytics by default

## 🛠️ Development

### Making Changes

1. **Edit source files** in the project directory
2. **Reload extension**: Go to `chrome://extensions/` and click reload icon
3. **Test changes**: Visit a test site and verify behavior
4. **Check logs**: Monitor console for errors

### Adding Custom Store Support

Edit `utils/detector.js` to add store-specific selectors:

```javascript
// Add to buttonSelectors array
'button[data-custom-cart-button]',

// Add to cartKeywords array
'custom add text',
```

### Improving Detection

The detector can be enhanced by:

1. Adding more button selectors for specific stores
2. Improving product info extraction logic
3. Adding store-specific extraction rules
4. Implementing machine learning for pattern recognition

## 📝 TODO / Roadmap

- [ ] Create proper extension icons
- [ ] Add support for price tracking
- [ ] Implement store-specific detection rules
- [ ] Add cart comparison features
- [ ] Build web dashboard for cart management
- [ ] Add price alert notifications
- [ ] Support for wishlist tracking
- [ ] Browser sync across devices
- [ ] Mobile app integration

## 🤝 Contributing

Contributions welcome! Areas for improvement:

1. **Detection accuracy**: Add support for more e-commerce platforms
2. **UI/UX**: Improve design and user experience
3. **Features**: Price tracking, alerts, recommendations
4. **Backend**: Event-driven sync system
5. **Testing**: Automated tests for detection logic

## 📄 License

MIT License - feel free to use and modify

## 🙋 Support

For issues or questions:

1. Check the troubleshooting section above
2. Look at browser console logs (prefix: 🛒)
3. Create an issue with details about the store and error

---

**Built with ❤️ for universal shopping tracking**

# global-cart
