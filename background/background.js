/**
 * Repak X - Background Service Worker
 * Handles download watching and communication with Repak X app
 */

// Browser API polyfill for Chrome/Firefox compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

const REPAK_PROTOCOL = 'repakx://';
const DEFAULT_TIMEOUT_MS = 120000; // 2 minutes fallback
const SLOW_DOWNLOAD_SPEED_MBps = 1.5; // Nexus free user speed cap

// State for tracking active download watches
let activeWatch = null;

/**
 * Calculate timeout based on file size (for free/slow download users)
 */
function calculateTimeout(fileSizeMB) {
    if (!fileSizeMB || fileSizeMB <= 0) return DEFAULT_TIMEOUT_MS;

    // Time = size / speed, plus 30s buffer for page loading and overhead
    const downloadTimeSec = fileSizeMB / SLOW_DOWNLOAD_SPEED_MBps;
    const timeoutMs = Math.max(DEFAULT_TIMEOUT_MS, (downloadTimeSec + 30) * 1000);

    console.log(`Repak X: Dynamic timeout: ${fileSizeMB.toFixed(1)} MB @ ${SLOW_DOWNLOAD_SPEED_MBps} MB/s = ${Math.round(timeoutMs / 1000)}s`);
    return timeoutMs;
}

/**
 * Start watching for a download from Nexus Mods
 */
function startDownloadWatch(expectedFileName, modPageUrl, tabId, fileSizeMB) {
    console.log('Repak X: Starting download watch for:', expectedFileName);

    // Clear any existing watch
    if (activeWatch) {
        clearTimeout(activeWatch.timeout);
    }

    const timeoutMs = calculateTimeout(fileSizeMB);

    activeWatch = {
        expectedFileName,
        modPageUrl,
        tabId,
        startTime: Date.now(),
        timeoutMs,
        timeout: setTimeout(() => {
            console.log('Repak X: Download watch timed out');
            notifyContentScript(tabId, 'downloadFailed', { reason: 'timeout' });
            activeWatch = null;
        }, timeoutMs)
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
            active: true
        });

        // Close the redirect tab after a delay (10 seconds to allow user to accept prompt)
        setTimeout(async () => {
            try {
                await browserAPI.tabs.remove(tab.id);
            } catch (e) { /* Tab might already be closed */ }
        }, 10000);

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
            sender.tab?.id,
            message.fileSizeMB
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
