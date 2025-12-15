/**
 * Browser API Polyfill
 * Provides cross-browser compatibility between Chrome and Firefox
 * Chrome uses `chrome.*` namespace, Firefox uses `browser.*` namespace
 */

// Create a unified API that works in both browsers
if (typeof globalThis.browserAPI === 'undefined') {
    globalThis.browserAPI = typeof browser !== 'undefined' ? browser : chrome;
}

// For convenience, also expose as window.browserAPI in content scripts
if (typeof window !== 'undefined' && typeof window.browserAPI === 'undefined') {
    window.browserAPI = typeof browser !== 'undefined' ? browser : chrome;
}
