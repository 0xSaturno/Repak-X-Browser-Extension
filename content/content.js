/**
 * Repak X - Nexus Mods Content Script
 * Injects "To Repak X" buttons on Marvel Rivals mod download pages
 */

(function () {
    'use strict';

    // Browser API polyfill for Chrome/Firefox compatibility
    const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

    const BUTTON_CLASS = 'repakx-button';
    const PROCESSED_ATTR = 'data-repakx-processed';
    const ICON_URL = browserAPI.runtime.getURL('icons/icon128.png');
    const DEFAULT_ICON_HTML = `<img src="${browserAPI.runtime.getURL('icons/icon128.png')}" class="repakx-icon" width="32" height="32" />`;

    console.log('[Repak X] Content script loaded on:', window.location.href);

    // Skip edit/admin pages
    if (window.location.pathname.includes('/edit/') || window.location.pathname.includes('/edit?')) {
        console.log('[Repak X] Skipping edit page');
        return;
    }

    /**
     * Recursively find all buttons including inside Shadow DOMs
     */
    function getAllButtons(root = document) {
        let buttons = [...root.querySelectorAll('button')];

        // Also search inside shadow roots
        const allElements = root.querySelectorAll('*');
        for (const el of allElements) {
            if (el.shadowRoot) {
                buttons = buttons.concat(getAllButtons(el.shadowRoot));
            }
        }

        return buttons;
    }

    /**
     * Wait for the "Slow download" button to appear and click it
     * This handles free user flow where a new page opens
     */
    function waitForSlowDownloadAndClick() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 100; // 10 seconds max wait

            const checkForButton = () => {
                attempts++;

                if (attempts === 1 || attempts % 20 === 0) {
                    console.log('[Repak X] Looking for Slow download button... attempt', attempts);
                }

                const pageText = document.body?.textContent?.toLowerCase() || '';

                // Premium auto-download — already started, nothing to click
                if (pageText.includes('download should automatically begin') || pageText.includes('being prepared for download')) {
                    console.log('[Repak X] ✓ Premium auto-download detected, skipping');
                    resolve(true);
                    return;
                }

                // Premium manual-start — click the #dl_button if present
                const dlButton = document.querySelector('a#dl_button, button#dl_button');
                if (dlButton) {
                    console.log('[Repak X] ✓ Found premium Download button');
                    setTimeout(() => {
                        dlButton.click();
                        console.log('[Repak X] ✓ Clicked!');
                    }, 500);
                    resolve(true);
                    return;
                }

                // Free user flow — look for "Slow download" button
                const allButtons = getAllButtons();

                for (const btn of allButtons) {
                    const text = btn.textContent?.toLowerCase().trim() || '';

                    if (text.includes('slow download') || (text.includes('slow') && text.includes('download'))) {
                        console.log('[Repak X] ✓ Found Slow download button');
                        setTimeout(() => {
                            btn.click();
                            console.log('[Repak X] ✓ Clicked!');
                        }, 500);
                        resolve(true);
                        return;
                    }
                }

                if (attempts < maxAttempts) {
                    setTimeout(checkForButton, 100);
                } else {
                    console.log('[Repak X] ✗ Button not found after 10 seconds');
                    resolve(false);
                }
            };

            // Start checking
            setTimeout(checkForButton, 100);
        });
    }


    /**
     * Creates the "To Repak X" button element
     */
    function createRepakXButton(downloadButton, fileName) {
        const button = document.createElement('button');
        button.className = BUTTON_CLASS;
        button.classList.add('alt');
        button.setAttribute('type', 'button');
        button.innerHTML = DEFAULT_ICON_HTML;

        button._downloadButton = downloadButton;
        button._fileName = fileName;

        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            console.log('[Repak X] Button clicked for:', fileName);

            // Show loading state
            button.classList.add('loading');
            button.disabled = true;
            button.innerHTML = `<img src="${ICON_URL}" class="repakx-icon spin" width="32" height="32" />`;

            try {
                // Read all file sizes from the page, use the largest for dynamic timeout
                let fileSizeMB = null;
                const statItems = document.querySelectorAll('.statitem, .stat-item');
                for (const item of statItems) {
                    const title = item.querySelector('.titlestat, .stat-title');
                    if (title && title.textContent.toLowerCase().includes('file size')) {
                        const stat = item.querySelector('.stat');
                        if (stat) {
                            const sizeText = stat.textContent.trim();
                            const match = sizeText.match(/([\d.]+)\s*(GB|MB|KB)/i);
                            if (match) {
                                const value = parseFloat(match[1]);
                                const unit = match[2].toUpperCase();
                                let sizeMB = 0;
                                if (unit === 'GB') sizeMB = value * 1024;
                                else if (unit === 'MB') sizeMB = value;
                                else if (unit === 'KB') sizeMB = value / 1024;
                                if (!fileSizeMB || sizeMB > fileSizeMB) fileSizeMB = sizeMB;
                            }
                        }
                    }
                }
                if (fileSizeMB) {
                    console.log('[Repak X] Largest file size on page:', `${fileSizeMB.toFixed(1)} MB`);
                }

                // Notify background to watch for downloads
                const response = await browserAPI.runtime.sendMessage({
                    action: 'startDownloadWatch',
                    expectedFileName: fileName,
                    modPageUrl: window.location.href,
                    fileSizeMB: fileSizeMB
                });

                if (response?.success) {
                    console.log('[Repak X] Watch started, clicking download button');

                    // Click the original download button (Manual download)
                    if (downloadButton) {
                        downloadButton.click();
                    }

                    // Wait for "Slow download" button to appear and auto-click it
                    await waitForSlowDownloadAndClick();
                }
            } catch (error) {
                console.error('[Repak X] Error:', error);
                button.classList.remove('loading');
                button.disabled = false;
                button.innerHTML = DEFAULT_ICON_HTML;
            }
        });

        return button;
    }

    /**
     * Find and inject buttons next to download buttons
     */
    function injectButtons() {
        console.log('[Repak X] Scanning for download buttons...');

        // Target the specific Nexus Mods structure: .flex-label containing "Manual download"
        const flexLabels = document.querySelectorAll('.flex-label');
        let foundCount = 0;

        flexLabels.forEach(label => {
            const text = (label.textContent || '').toLowerCase().trim();

            // Only target Manual download buttons
            if (!text.includes('manual')) return;

            // Find the parent button/link
            const downloadBtn = label.closest('a, button');
            if (!downloadBtn) return;

            // Skip if already processed
            if (downloadBtn.hasAttribute(PROCESSED_ATTR)) return;
            downloadBtn.setAttribute(PROCESSED_ATTR, 'true');

            foundCount++;
            console.log('[Repak X] Found Manual download button:', downloadBtn.href || downloadBtn.className);

            // Try to find file name from context
            let fileName = 'mod';
            const container = downloadBtn.closest('.accordion, .file, section, [class*="file"], li, div');
            if (container) {
                const nameEl = container.querySelector('h3, h4, strong, .name, dt, [class*="title"]:not(.flex-label)');
                if (nameEl && !nameEl.classList.contains('flex-label')) {
                    fileName = nameEl.textContent.trim();
                }
            }

            // Fallback: try to get mod name from page
            if (fileName === 'mod') {
                const pageTitle = document.querySelector('h1');
                if (pageTitle) {
                    fileName = pageTitle.textContent.trim();
                }
            }

            // Create and inject our button
            const repakButton = createRepakXButton(downloadBtn, fileName);

            // Insert after the download button
            if (downloadBtn.parentNode) {
                downloadBtn.parentNode.insertBefore(repakButton, downloadBtn.nextSibling);
                console.log('[Repak X] ✓ Injected button for:', fileName);
            }
        });

        // Fallback: also check for any links with file_id
        const downloadLinks = document.querySelectorAll('a[href*="file_id"]:not([data-repakx-processed])');
        downloadLinks.forEach(link => {
            const text = (link.textContent || '').toLowerCase();
            if (text.includes('mod manager') || text.includes('vortex')) return;
            if (link.hasAttribute(PROCESSED_ATTR)) return;

            link.setAttribute(PROCESSED_ATTR, 'true');

            let fileName = document.querySelector('h1')?.textContent?.trim() || 'mod';

            const repakButton = createRepakXButton(link, fileName);
            if (link.parentNode) {
                link.parentNode.insertBefore(repakButton, link.nextSibling);
                foundCount++;
            }
        });

        console.log('[Repak X] Total buttons injected:', foundCount);
    }

    /**
     * Listen for messages from background script
     */
    browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('[Repak X] Received message:', message);

        if (message.action === 'downloadComplete') {
            const activeButtons = document.querySelectorAll(`.${BUTTON_CLASS}.loading, .${BUTTON_CLASS}.waiting`);
            activeButtons.forEach(button => {
                button.classList.remove('loading', 'waiting');
                button.disabled = false;
                button.innerHTML = DEFAULT_ICON_HTML;
            });
            sendResponse({ received: true });
        }

        if (message.action === 'resetButtons' || message.action === 'downloadFailed') {
            const activeButtons = document.querySelectorAll(`.${BUTTON_CLASS}.loading, .${BUTTON_CLASS}.waiting`);
            activeButtons.forEach(button => {
                button.classList.remove('loading', 'waiting');
                button.disabled = false;
                button.innerHTML = DEFAULT_ICON_HTML;
            });
            sendResponse({ received: true });
        }

        return true;
    });

    /**
     * Check if we're on a file download page and auto-click Slow download
     */
    async function handleFileDownloadPage() {
        const url = new URL(window.location.href);
        const fileId = url.searchParams.get('file_id');

        if (!fileId) return false;

        console.log('[Repak X] Detected file download page, file_id:', fileId);

        // Wait for the page to fully render (React apps can be slow)
        await new Promise(resolve => setTimeout(resolve, 500));

        const pageText = document.body?.textContent?.toLowerCase() || '';

        // Premium auto-download page — download already started, do nothing
        if (pageText.includes('download should automatically begin') || pageText.includes('being prepared for download')) {
            console.log('[Repak X] Premium auto-download detected, skipping button click');
            return true;
        }

        // Premium manual-start page — need to click the Download button once
        if (pageText.includes('file will be served via')) {
            console.log('[Repak X] Premium manual download page detected');
            const dlButton = document.querySelector('a#dl_button, button#dl_button');
            if (dlButton) {
                setTimeout(() => {
                    dlButton.click();
                    console.log('[Repak X] ✓ Clicked premium Download button');
                }, 500);
            }
            return true;
        }

        // Free user flow: look for the Slow download button
        const found = await waitForSlowDownloadAndClick();

        if (found) {
            console.log('[Repak X] ✓ Auto-clicked Slow download button');
        }

        return found;
    }

    /**
     * Initialize
     */
    async function init() {
        console.log('[Repak X] Initializing...');

        // First check if we're on a file download page (with file_id in URL)
        // If so, auto-click the Slow download button
        const isDownloadPage = await handleFileDownloadPage();

        if (!isDownloadPage) {
            // Not a download page, inject our buttons on the regular mod page
            injectButtons();

            // Watch for dynamic content
            const observer = new MutationObserver(() => {
                clearTimeout(window.repakxDebounce);
                window.repakxDebounce = setTimeout(injectButtons, 200);
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            console.log('[Repak X] Mutation observer active');
        }
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // Small delay to let page finish rendering
        setTimeout(init, 100);
    }
})();
