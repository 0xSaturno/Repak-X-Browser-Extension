# Privacy Policy for Repak X Browser Extension

**Last Updated:** December 18, 2025

## Overview

Repak X ("the Extension") is a browser extension that integrates Nexus Mods with the Repak X desktop application for Marvel Rivals mod management. This privacy policy explains how the Extension handles your data.

## Data We Collect

### Data Collected Automatically
- **None.** The Extension does not automatically collect any personal information.

### Data Processed Locally
When you use the Extension, the following information is processed **locally on your device**:
- **Download file paths:** When you click "To Repak X", the path of the downloaded mod file is temporarily used to open the file in the Repak X desktop application.
- **Extension state:** Basic settings (installed version, install status) stored in your browser's local storage.

## Data We Do NOT Collect
- Personal information (name, email, etc.)
- Browsing history
- Search queries
- Cookies or tracking identifiers
- Analytics or telemetry data
- Any data from pages other than Nexus Mods Marvel Rivals pages
- **Nexus Mods account data** — the Extension does not access, read, or store any information from your Nexus Mods user account

## Data Transmission

### To External Servers
- **None.** The Extension does not transmit any data to external servers or third parties.

### To Local Applications
- The Extension transmits **only the downloaded file path** to the locally installed Repak X desktop application via the `repakx://` protocol handler. This occurs only when you explicitly click the "To Repak X" button.

## Network Requests

The Extension makes the following network requests:
- **Nexus Mods only:** The Extension operates exclusively on `nexusmods.com/marvelrivals/*` pages to inject download buttons and monitor downloads you initiate.

The Extension does **not** make requests to:
- Analytics services
- Advertising networks
- Any servers owned or operated by the Extension developers

## Permissions Explained

| Permission                         | Purpose                                                               |
| ---------------------------------- | --------------------------------------------------------------------- |
| `downloads`                        | Monitor when your mod download completes so it can be sent to Repak X |
| `storage`                          | Save extension preferences locally in your browser                    |
| `activeTab`                        | Communicate between the extension popup and the current page          |
| `scripting`                        | Inject the "To Repak X" button on Nexus Mods pages                    |
| `host_permissions (nexusmods.com)` | Only activate on Nexus Mods Marvel Rivals pages                       |

## Data Security

All data processing occurs locally within your browser. No data is transmitted to or stored on external servers. The Extension uses only standard browser APIs and does not have access to data beyond the permissions explicitly granted during installation.

## Third-Party Services

The Extension does not use any third-party services, analytics, or tracking tools.

## Children's Privacy

The Extension does not knowingly collect any information from children under 13 years of age.

## Changes to This Policy

We may update this privacy policy from time to time. Any changes will be reflected in the "Last Updated" date at the top of this document.

## Contact

For questions about this privacy policy or the Extension, please:
- Open an issue on GitHub: [Repak X Extension Repository](https://github.com/0xSaturno/Repak-X-Browser-Extension)

## Your Rights

Since we do not collect personal data, there is no personal data to access, modify, or delete. All extension data (local storage) can be cleared by uninstalling the Extension or clearing your browser's extension data.

---

*This privacy policy applies to the Repak X browser extension for Chrome, Firefox, Edge, and other compatible browsers.*
