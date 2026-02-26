<p align="center">
  <img src="icons/icon128.png" alt="Repak X Logo" width="128" height="128">
</p>

<h1 align="center">Repak X Browser Extension</h1>

<p align="center">
  <strong>One-click mod downloads from Nexus Mods to Repak X</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue" alt="Version">
  <img src="https://img.shields.io/badge/chrome-supported-green" alt="Chrome">
  <img src="https://img.shields.io/badge/firefox-supported-orange" alt="Firefox">
  <img src="https://img.shields.io/badge/edge-supported-blue" alt="Edge">
</p>

---

## ✨ Features

| Feature                     | Description                                                          |
| --------------------------- | -------------------------------------------------------------------- |
| 🎮 **Marvel Rivals Support** | Automatically activates on Nexus Mods Marvel Rivals pages            |
| ⚡ **One-Click Install**     | Click "Repak X" logo button to download and send directly to your mod manager |
| 🔄 **Auto-Download**         | Automatically handles downloads for free and premium users      |
| 🌐 **Cross-Browser**         | Works on Chrome, Edge, and Firefox                                   |
| 🎨 **Native UI**             | Button seamlessly integrates with Nexus Mods design                  |

---

## 📦 Installation

### Chrome / Edge

1. Download the latest `Repak-X-Chrome.crx` from [Releases](../../releases)
2. Open `chrome://extensions/` (or `edge://extensions/`)
3. Enable **Developer mode** (toggle in top right)
4. Drag & drop the `.crx` file onto the page

**Alternative (unpacked):**
1. Download and extract `Repak-X-Chrome.zip`
2. Click **Load unpacked** and select the extracted folder

### Firefox

1. Download the latest `Repak-X-Firefox.xpi` from [Releases](../../releases)
2. Open `about:addons`
3. Click the ⚙️ gear icon → **Install Add-on From File**
4. Select the `.xpi` file

---

## 🚀 Usage

1. Navigate to any [Marvel Rivals mod on Nexus Mods](https://www.nexusmods.com/marvelrivals)
2. Go to the **Files** tab
3. Click the **Repak X logo** button that appears next to any download option
4. The mod will automatically download and open in Repak X!

```
[Click "To Repak X"] → [Auto-downloads mod] → [Opens in Repak X] → [Install!]
```

---

## ⚙️ Requirements

- **[Repak X](https://github.com/XzantGaming/Repak-X)** desktop application installed with `repakx://` protocol handler registered
- Chrome 88+, Edge 88+, or Firefox 109+

---

## 📁 Project Structure

```
Repak-X-extension/
├── background/
│   └── background.js       # Service worker - download monitoring
├── content/
│   ├── content.js          # Injects "To Repak X" buttons
│   ├── content.css         # Button styling
│   └── alt-button.css      # Alternative button styles
├── popup/
│   ├── popup.html          # Extension popup UI
│   ├── popup.css           # Popup styling
│   └── popup.js            # Popup logic
├── icons/                  # Extension icons (16, 32, 48, 128px)
├── manifest.json           # Firefox manifest
├── manifest.chrome.json    # Chrome/Edge manifest
├── manifest.firefox.json   # Firefox manifest (source)
└── browser-polyfill.js     # Cross-browser API compatibility
```

---

## 🔒 Privacy

This extension:
- ✅ Only activates on `nexusmods.com/marvelrivals/*`
- ✅ Does not collect any personal data
- ✅ Does not make external network requests (except to Nexus Mods)
- ✅ All processing happens locally in your browser

For full details, see our [Privacy Policy](PRIVACY.md).

---

## ⚠️ Disclaimer

This project is **not affiliated with, endorsed by, or associated with Marvel, NetEase, or any of their subsidiaries**. All Marvel Rivals assets, trademarks, and intellectual property belong to their respective owners. This project is a **community-made tool** and is **not used for any type of profit**. It is provided free of charge for personal, non-commercial use only.

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

<p align="center">
  Made with ❤️ for the Marvel Rivals modding community
</p>
