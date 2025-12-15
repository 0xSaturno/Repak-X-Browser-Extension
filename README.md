# Repak X - Nexus Mods Browser Extension

A browser extension that adds a "To Repak X" button on Nexus Mods Marvel Rivals mod pages, allowing you to quickly download mods and send them directly to your Repak X application.

## Features

- 🎮 **Marvel Rivals specific** - Only activates on Marvel Rivals mod pages
- ⬇️ **One-click download** - Click "To Repak X" to download and automatically open in Repak X
- 🔄 **Download monitoring** - Watches for completed downloads and redirects to Repak X
- 🎨 **Clean UI** - Button blends with Nexus Mods design while being clearly visible

## Installation (Chrome/Edge)

### For Development/Testing

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select this folder (`Repak-X-extension`)
5. The extension should now appear in your extensions list

### Extension Icon

You'll need to add icon files to the `icons/` folder:
- `icon16.png` (16x16 pixels)
- `icon32.png` (32x32 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

You can use your Repak X app icon for these.

## Usage

1. Navigate to any [Marvel Rivals mod page on Nexus Mods](https://www.nexusmods.com/marvelrivals)
2. Go to the **Files** tab of the mod
3. Look for the blue **To Repak X** button next to download buttons
4. Click it!
5. The extension will:
   - Start watching for downloads
   - Trigger the normal Nexus Mods download flow
   - When the download completes, open Repak X with the file

## Requirements

⚠️ **Important**: For the extension to fully work, Repak X needs to register a custom protocol handler (`repakx://`). This allows the extension to tell Repak X which file to install.

## How It Works

```
[Click "To Repak X"]
       ↓
[Extension starts watching downloads]
       ↓
[Nexus Mods slow download page opens]
       ↓
[You complete the download manually]
       ↓
[Extension detects completed download]
       ↓
[Opens: repakx://install?file=C:/Users/.../Downloads/mod.zip]
       ↓
[Repak X receives the file and shows Install panel]
```

## Development

### File Structure

```
Repak-X-extension/
├── manifest.json          # Extension manifest (Chrome MV3)
├── background/
│   └── background.js      # Service worker - download monitoring
├── content/
│   ├── content.js         # Injects buttons on Nexus pages
│   └── content.css        # Button styling
├── popup/
│   ├── popup.html         # Extension popup UI
│   ├── popup.css          # Popup styling
│   └── popup.js           # Popup logic
└── icons/
    └── (icon files)       # Extension icons
```

### Building for Production

For Chrome Web Store:
```bash
# Zip the extension folder (excluding .git, etc.)
zip -r repak-x-extension.zip . -x "*.git*"
```

## Firefox Support

To support Firefox, you'll need to:
1. Copy `manifest.json` to `manifest-firefox.json`
2. Add Firefox-specific configuration:
   ```json
   "browser_specific_settings": {
     "gecko": {
       "id": "repak-x@xzantgaming.com",
       "strict_min_version": "109.0"
     }
   }
   ```
3. Change `background.service_worker` to `background.scripts`

## License

MIT - Same as Repak X
