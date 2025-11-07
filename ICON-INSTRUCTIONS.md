# Creating Extension Icons

The Chrome extension requires three icon sizes. Here are several options to create them:

## Option 1: Using Emoji (Quickest)

Use an online emoji-to-png converter like [Emoji to PNG](https://emojiisland.com/pages/download-new-emoji-icons-and-images):

1. Search for shopping cart emoji: 🛒
2. Download in the following sizes:
   - 16x16px → save as `icons/cart-16.png`
   - 48x48px → save as `icons/cart-48.png`
   - 128x128px → save as `icons/cart-128.png`

## Option 2: Using Online Tools

### Canva
1. Go to [Canva.com](https://canva.com)
2. Create custom dimensions (16x16, 48x48, 128x128)
3. Add a shopping cart icon from their library
4. Export as PNG
5. Save to `icons/` directory

### Figma
1. Create artboards: 16x16, 48x48, 128x128
2. Design your icon (shopping cart symbol)
3. Export as PNG
4. Save to `icons/` directory

## Option 3: Using Icon Libraries

Download from free icon websites:
- [Flaticon](https://www.flaticon.com) - Search "shopping cart"
- [Icons8](https://icons8.com) - Download in multiple sizes
- [Font Awesome](https://fontawesome.com) - Export SVG and convert to PNG

## Option 4: Convert SVG to PNG (Command Line)

If you have an SVG file:

```bash
# Install ImageMagick
brew install imagemagick  # macOS
# or
sudo apt-get install imagemagick  # Linux

# Convert to different sizes
convert -background none cart-icon.svg -resize 16x16 icons/cart-16.png
convert -background none cart-icon.svg -resize 48x48 icons/cart-48.png
convert -background none cart-icon.svg -resize 128x128 icons/cart-128.png
```

## Quick SVG Example

Create `cart-icon.svg` with this content:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#4CAF50">
  <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
</svg>
```

Then use ImageMagick to convert it to PNG sizes (see above).

## Temporary Solution

Until you create proper icons, you can:

1. Create a blank `icons/` directory:
```bash
mkdir icons
```

2. Download placeholder images:
```bash
cd icons
curl "https://via.placeholder.com/16x16/4CAF50/ffffff?text=C" -o cart-16.png
curl "https://via.placeholder.com/48x48/4CAF50/ffffff?text=Cart" -o cart-48.png
curl "https://via.placeholder.com/128x128/4CAF50/ffffff?text=Cart" -o cart-128.png
```

This will create simple placeholder icons with "C" or "Cart" text that will work for testing.

## After Creating Icons

1. Place all three PNG files in the `icons/` directory
2. Reload the extension in Chrome (`chrome://extensions/` → Reload button)
3. The new icons should appear in your toolbar and extension management page

## Icon Design Tips

- **Keep it simple**: The 16x16 icon is very small
- **Use contrasting colors**: Make sure it's visible in both light and dark toolbars
- **Test both themes**: Check how it looks in light and dark Chrome themes
- **Maintain aspect ratio**: Square icons work best
- **Use transparency**: PNG with transparent background recommended

