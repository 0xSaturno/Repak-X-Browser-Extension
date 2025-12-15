/**
 * Repak X - Popup Script
 * Handles popup UI and status display
 */

// Browser API polyfill for Chrome/Firefox compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

document.addEventListener('DOMContentLoaded', async () => {
    // Set version from manifest
    const manifest = browserAPI.runtime.getManifest();
    document.getElementById('version').textContent = `v${manifest.version}`;

    // Check watch status
    await updateWatchStatus();

    // Cancel button handler
    document.getElementById('cancelWatch').addEventListener('click', async () => {
        await browserAPI.runtime.sendMessage({ action: 'cancelWatch' });
        await updateWatchStatus();
    });

    // Poll for status updates
    setInterval(updateWatchStatus, 1000);
});

/**
 * Update the UI based on current watch status
 */
async function updateWatchStatus() {
    try {
        const response = await browserAPI.runtime.sendMessage({ action: 'getWatchStatus' });

        const statusIndicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        const statusDot = statusIndicator.querySelector('.status-dot');
        const watchSection = document.getElementById('watchSection');
        const watchFileName = document.getElementById('watchFileName');

        if (response?.isWatching) {
            statusDot.className = 'status-dot watching';
            statusText.textContent = 'Watching for download...';
            watchSection.style.display = 'block';

            if (response.watchInfo) {
                const elapsed = Math.floor(response.watchInfo.elapsedMs / 1000);
                watchFileName.textContent = `Waiting (${elapsed}s)...`;
            }
        } else {
            statusDot.className = 'status-dot';
            statusText.textContent = 'Ready';
            watchSection.style.display = 'none';
        }
    } catch (error) {
        console.error('Failed to get watch status:', error);
    }
}
