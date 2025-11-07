# Quick Start Guide

Get the Universal Cart Tracker extension running in 5 minutes!

## 🚀 Installation Steps

### 1. Load Extension in Chrome

1. Open Chrome browser
2. Navigate to `chrome://extensions/`
3. Toggle **"Developer mode"** ON (top right corner)
4. Click **"Load unpacked"** button
5. Select this `cursor` directory
6. Extension should now appear in your toolbar! 🛒

### 2. Create Icons (Optional but Recommended)

**Quickest method** - Use emoji-to-PNG converter:

1. Go to https://www.google.com/search?q=shopping+cart+emoji+png
2. Download 🛒 emoji as PNG
3. Resize to 16x16, 48x48, and 128x128 pixels
4. Save as `icons/cart-16.png`, `icons/cart-48.png`, `icons/cart-128.png`
5. Reload extension in Chrome

**OR** use placeholder icons:
```bash
cd icons
curl "https://via.placeholder.com/16x16/4CAF50/ffffff?text=C" -o cart-16.png
curl "https://via.placeholder.com/48x48/4CAF50/ffffff?text=Cart" -o cart-48.png
curl "https://via.placeholder.com/128x128/4CAF50/ffffff?text=Cart" -o cart-128.png
```

See `ICON-INSTRUCTIONS.md` for more options.

### 3. Test the Extension

**Option A: Use Test Page**

1. Open `test-store.html` in Chrome (or drag it into browser)
2. Open DevTools (F12) to see console logs
3. Click any "Add to Cart" button
4. Confirmation modal should appear!
5. Click extension icon to view your cart

**Option B: Test on Real Sites**

1. Visit Amazon, eBay, or any online store
2. Browse a product page
3. Click "Add to Cart" button
4. Watch for the confirmation modal
5. Check your universal cart in the extension popup

## 🎯 Usage

### Adding Items to Your Cart

1. **Shop normally** on any e-commerce site
2. **Click "Add to Cart"** on any product
3. **Confirmation modal appears** - Review the item
4. **Click "Add to Cart"** in modal to confirm
5. **Success notification** appears - Item added to universal cart!

### Viewing Your Cart

1. **Click extension icon** 🛒 in Chrome toolbar
2. **Cart tab** shows all your items from all stores
3. **Visit product pages** by clicking the 🔗 icon
4. **Remove items** by clicking the 🗑️ icon

### Settings

Click extension icon → **Settings tab**:

- **Auto-detect**: Toggle automatic cart detection
- **Show confirmation**: Toggle confirmation modal
- **Backend sync**: Enable syncing to external API (optional)
- **API endpoint**: Configure your backend URL

### Statistics

Click extension icon → **Stats tab**:

- View total items in cart
- See breakdown by store
- Track your shopping activity

## ⚙️ Configuration

### Default Settings (Works Out of the Box)

- ✅ Auto-detection: ON
- ✅ Confirmation modal: ON
- ❌ Backend sync: OFF (requires setup)

### Optional: Backend Sync Setup

If you want to sync across devices or integrate with a backend:

1. Set up a backend API with `/api/cart/sync` endpoint
2. Open extension popup → Settings
3. Enable "Backend sync"
4. Enter your API endpoint URL
5. Click "Save Settings"

See `README.md` for backend API specifications.

## 🐛 Troubleshooting

### Extension Not Detecting Cart Additions?

1. **Check console** - Open DevTools (F12), look for 🛒 messages
2. **Verify auto-detect** - Settings tab → Auto-detect is ON
3. **Try test page** - Open `test-store.html` to verify extension works
4. **Some sites use non-standard buttons** - Detection may need tuning

### Modal Not Appearing?

1. **Check settings** - Make sure "Show confirmation" is ON
2. **Refresh page** - After changing settings, reload the page
3. **Check for conflicts** - Some sites may have CSS conflicts

### Items Not Saving?

1. **Check storage permissions** - Go to `chrome://extensions/`
2. **View extension details** - Make sure storage permission is granted
3. **Clear and retry** - Settings → Clear Cart, then try again

### Console Errors?

1. **Open extension console** - Go to `chrome://extensions/` → Extension details → "Inspect views: service worker"
2. **Look for errors** - All logs prefixed with 🛒
3. **Reload extension** - Click reload button on extension card

## 📊 Testing Checklist

- [ ] Extension loads without errors
- [ ] Test page (`test-store.html`) works
- [ ] Confirmation modal appears on button click
- [ ] Items appear in extension popup
- [ ] Can remove items from cart
- [ ] Can clear entire cart
- [ ] Statistics show correct counts
- [ ] Settings save properly
- [ ] Export cart works
- [ ] Works on real e-commerce sites

## 🎉 You're All Set!

Your Universal Cart Tracker is ready to use. Start shopping on any e-commerce site and track everything in one place!

### What's Next?

1. **Test on multiple stores** - Amazon, eBay, Etsy, etc.
2. **Customize detection** - Edit `utils/detector.js` for specific stores
3. **Set up backend sync** - Build your own sync API
4. **Share feedback** - Report issues or suggest improvements

---

**Need Help?**
- Read full documentation in `README.md`
- Check icon setup guide in `ICON-INSTRUCTIONS.md`
- Review code comments for implementation details

