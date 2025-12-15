/**
 * Repak X - Background Service Worker
 * Handles download watching and communication with Repak X app
 */

// Browser API polyfill for Chrome/Firefox compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

const REPAK_PROTOCOL = 'repakx://';
const WATCH_TIMEOUT_MS = 120000; // 2 minutes - Nexus slow download can take a while

// State for tracking active download watches
let activeWatch = null;

/**
 * Start watching for a download from Nexus Mods
 */
function startDownloadWatch(expectedFileName, modPageUrl, tabId) {
    console.log('Repak X: Starting download watch for:', expectedFileName);

    // Clear any existing watch
    if (activeWatch) {
        clearTimeout(activeWatch.timeout);
    }

    activeWatch = {
        expectedFileName,
        modPageUrl,
        tabId,
        startTime: Date.now(),
        timeout: setTimeout(() => {
            console.log('Repak X: Download watch timed out');
            notifyContentScript(tabId, 'downloadFailed', { reason: 'timeout' });
            activeWatch = null;
        }, WATCH_TIMEOUT_MS)
    };

    return { success: true };
}

/**
 * Send message to content script
 */
async function notifyContentScript(tabId, action, data = {}) {
    try {
        await browserAPI.tabs.sendMessage(tabId, { action, ...data });
    } catch (error) {
        console.error('Repak X: Failed to notify content script:', error);
    }
}

/**
 * Handle completed download - redirect to Repak X
 */
async function handleDownloadComplete(downloadItem) {
    if (!activeWatch) return;

    const filePath = downloadItem.filename;
    const fileName = filePath.split(/[/\\]/).pop();

    console.log('Repak X: Download completed:', fileName);
    console.log('Repak X: Full path:', filePath);

    // Check if this is likely a mod file (archives or pak files)
    const modExtensions = ['.zip', '.rar', '.7z', '.pak', '.utoc', '.ucas'];
    const isModFile = modExtensions.some(ext => fileName.toLowerCase().endsWith(ext));

    if (!isModFile) {
        console.log('Repak X: Ignoring non-mod file:', fileName);
        return;
    }

    // Check if download came from Nexus Mods
    const isFromNexus = downloadItem.url && downloadItem.url.includes('nexusmods.com');
    const referrerIsNexus = downloadItem.referrer && downloadItem.referrer.includes('nexusmods.com');

    if (!isFromNexus && !referrerIsNexus) {
        console.log('Repak X: Download not from Nexus Mods, ignoring');
        return;
    }

    // Clear the watch
    clearTimeout(activeWatch.timeout);
    const tabId = activeWatch.tabId;
    activeWatch = null;

    // Open Repak X with the file path
    console.log('Repak X: Opening Repak X with file:', filePath);

    try {
        // Use our redirect page to trigger the protocol handler
        const redirectUrl = browserAPI.runtime.getURL('redirect.html') + '?file=' + encodeURIComponent(filePath);

        const tab = await browserAPI.tabs.create({
            url: redirectUrl,
            active: false
        });

        // Close the redirect tab after a delay
        setTimeout(async () => {
            try {
                await browserAPI.tabs.remove(tab.id);
            } catch (e) { /* Tab might already be closed */ }
        }, 2000);

        // Notify content script of success
        await notifyContentScript(tabId, 'downloadComplete', { fileName, filePath });
    } catch (error) {
        console.error('Repak X: Failed to open protocol handler:', error);
        await notifyContentScript(tabId, 'downloadFailed', { reason: 'protocol_error' });
    }
}

/**
 * Listen for download events
 */
browserAPI.downloads.onChanged.addListener((delta) => {
    if (delta.state && delta.state.current === 'complete') {
        browserAPI.downloads.search({ id: delta.id }, (downloads) => {
            if (downloads && downloads[0]) {
                handleDownloadComplete(downloads[0]);
            }
        });
    }
});

/**
 * Listen for messages from content scripts
 */
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Repak X: Received message:', message.action);

    if (message.action === 'startDownloadWatch') {
        const result = startDownloadWatch(
            message.expectedFileName,
            message.modPageUrl,
            sender.tab?.id
        );
        sendResponse(result);
        return true;
    }

    if (message.action === 'getWatchStatus') {
        sendResponse({
            isWatching: !!activeWatch,
            watchInfo: activeWatch ? {
                expectedFileName: activeWatch.expectedFileName,
                elapsedMs: Date.now() - activeWatch.startTime
            } : null
        });
        return true;
    }

    if (message.action === 'cancelWatch') {
        if (activeWatch) {
            clearTimeout(activeWatch.timeout);
            activeWatch = null;
        }
        sendResponse({ success: true });
        return true;
    }

    return false;
});

/**
 * Handle extension installation
 */
browserAPI.runtime.onInstalled.addListener((details) => {
    console.log('Repak X: Extension installed/updated', details.reason);

    if (details.reason === 'install') {
        // Open a welcome page or popup on first install
        browserAPI.storage.local.set({ installed: true, version: browserAPI.runtime.getManifest().version });
    }
});

console.log('Repak X: Background service worker started');
