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

    console.log('[Repak X] Content script loaded on:', window.location.href);

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

                // Look for any button containing "slow download" text
                // Including inside Shadow DOMs
                const allButtons = getAllButtons();

                for (const btn of allButtons) {
                    const text = btn.textContent?.toLowerCase().trim() || '';

                    if (text.includes('slow download') || (text.includes('slow') && text.includes('download'))) {
                        console.log('[Repak X] ✓ Found Slow download button!');
                        console.log('[Repak X] Button classes:', btn.className);
                        console.log('[Repak X] Button text:', btn.textContent?.trim());

                        // Delay before clicking
                        setTimeout(() => {
                            btn.click();
                            console.log('[Repak X] ✓ Clicked!');
                        }, 500);

                        resolve(true);
                        return;
                    }
                }

                // Also try looking for spans with "slow download"
                const spans = document.querySelectorAll('span');
                for (const span of spans) {
                    const text = span.textContent?.toLowerCase().trim() || '';
                    if (text === 'slow download') {
                        const parentBtn = span.closest('button');
                        if (parentBtn) {
                            console.log('[Repak X] ✓ Found via span!');
                            setTimeout(() => parentBtn.click(), 500);
                            resolve(true);
                            return;
                        }
                    }
                }

                if (attempts < maxAttempts) {
                    setTimeout(checkForButton, 100);
                } else {
                    console.log('[Repak X] ✗ Button not found after 10 seconds');
                    console.log('[Repak X] Total buttons found:', allButtons.length);
                    // Log all buttons for debugging
                    allButtons.forEach((btn, i) => {
                        const text = btn.textContent?.trim().substring(0, 40);
                        if (text) console.log(`  [${i}] "${text}"`);
                    });
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
        button.innerHTML = `
            <img src="${browserAPI.runtime.getURL('icons/icon128.png')}" class="repakx-icon" width="32" height="32" />
        `;

        button._downloadButton = downloadButton;
        button._fileName = fileName;

        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            console.log('[Repak X] Button clicked for:', fileName);

            // Show loading state
            button.classList.add('loading');
            button.disabled = true;
            button.innerHTML = `
                <svg class="repakx-icon spin" viewBox="0 0 24 24" width="16" height="16">
                    <path fill="currentColor" d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                </svg>
                <span>Starting...</span>
            `;

            try {
                // Notify background to watch for downloads
                const response = await browserAPI.runtime.sendMessage({
                    action: 'startDownloadWatch',
                    expectedFileName: fileName,
                    modPageUrl: window.location.href
                });

                if (response?.success) {
                    console.log('[Repak X] Watch started, clicking download button');

                    // Click the original download button (Manual download)
                    if (downloadButton) {
                        downloadButton.click();
                    }

                    button.innerHTML = `
                        <svg class="repakx-icon spin" viewBox="0 0 24 24" width="16" height="16">
                            <path fill="currentColor" d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                        </svg>
                        <span>Waiting for popup...</span>
                    `;

                    // Wait for "Slow download" button to appear and auto-click it
                    await waitForSlowDownloadAndClick();

                    button.innerHTML = `
                        <svg class="repakx-icon spin" viewBox="0 0 24 24" width="16" height="16">
                            <path fill="currentColor" d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                        </svg>
                        <span>Downloading...</span>
                    `;
                    button.classList.remove('loading');
                    button.classList.add('waiting');
                }
            } catch (error) {
                console.error('[Repak X] Error:', error);
                button.classList.remove('loading');
                button.disabled = false;
                button.innerHTML = `
                    <svg class="repakx-icon" viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                    </svg>
                    <span>To Repak X</span>
                `;
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
            const waitingButtons = document.querySelectorAll(`.${BUTTON_CLASS}.waiting`);
            waitingButtons.forEach(button => {
                button.classList.remove('waiting');
                button.classList.add('success');
                button.innerHTML = `
                    <svg class="repakx-icon" viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    <span>Sent to Repak X!</span>
                `;
                button.disabled = false;
            });
            sendResponse({ received: true });
        }

        if (message.action === 'downloadFailed') {
            const waitingButtons = document.querySelectorAll(`.${BUTTON_CLASS}.waiting`);
            waitingButtons.forEach(button => {
                button.classList.remove('waiting');
                button.disabled = false;
                button.innerHTML = `
                    <svg class="repakx-icon" viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                    </svg>
                    <span>To Repak X</span>
                `;
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

        // Look for the Slow download button
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
