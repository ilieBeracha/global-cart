# Icons Directory

This directory should contain three PNG icon files for the Chrome extension:

- `cart-16.png` (16x16 pixels)
- `cart-48.png` (48x48 pixels)
- `cart-128.png` (128x128 pixels)

## Quick Setup

See `ICON-INSTRUCTIONS.md` in the root directory for detailed instructions on creating these icons.

### Quickest Method

Use placeholder images temporarily:

```bash
cd icons
curl "https://via.placeholder.com/16x16/4CAF50/ffffff?text=C" -o cart-16.png
curl "https://via.placeholder.com/48x48/4CAF50/ffffff?text=Cart" -o cart-48.png
curl "https://via.placeholder.com/128x128/4CAF50/ffffff?text=Cart" -o cart-128.png
```

Or simply use an emoji-to-png converter online with the 🛒 emoji.

The extension will still work without proper icons, but Chrome will show a default placeholder.

