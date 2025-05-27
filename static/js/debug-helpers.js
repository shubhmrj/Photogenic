/**
 * Debug helpers for PhotoGeni application
 */

// Enable debug mode
const DEBUG_MODE = true;

/**
 * Enhanced console logging with timestamps and categories
 * @param {string} category - The category of the log (e.g., 'Image Viewer', 'API')
 * @param {string} message - The message to log
 * @param {any} data - Optional data to log
 */
function debugLog(category, message, data = null) {
    if (!DEBUG_MODE) return;
    
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const prefix = `[${timestamp}][${category}]`;
    
    if (data) {
        console.log(`${prefix} ${message}`, data);
    } else {
        console.log(`${prefix} ${message}`);
    }
}

/**
 * Log errors with additional context
 * @param {string} category - The category of the error
 * @param {string} message - The error message
 * @param {Error} error - The error object
 */
function debugError(category, message, error = null) {
    if (!DEBUG_MODE) return;
    
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const prefix = `[${timestamp}][${category}][ERROR]`;
    
    console.error(`${prefix} ${message}`);
    if (error) {
        console.error(error);
    }
}

/**
 * Add event listeners with debug logging
 * @param {Element} element - The element to add the listener to
 * @param {string} eventType - The event type (e.g., 'click')
 * @param {Function} callback - The callback function
 * @param {string} debugName - Name for debugging purposes
 */
function addDebugEventListener(element, eventType, callback, debugName) {
    if (!element) {
        debugError('EventListener', `Cannot add ${eventType} listener to null element: ${debugName}`);
        return;
    }
    
    const wrappedCallback = function(event) {
        debugLog('EventListener', `Event ${eventType} triggered on ${debugName}`);
        try {
            callback.call(this, event);
        } catch (error) {
            debugError('EventListener', `Error in ${debugName} ${eventType} handler`, error);
        }
    };
    
    element.addEventListener(eventType, wrappedCallback);
    debugLog('EventListener', `Added ${eventType} listener to ${debugName}`);
}

/**
 * Check if an element exists and log if it doesn't
 * @param {string} selector - CSS selector for the element
 * @param {string} name - Name for debugging purposes
 * @returns {Element|null} - The element or null if not found
 */
function checkElement(selector, name) {
    const element = document.querySelector(selector);
    if (!element) {
        debugError('DOM', `Element not found: ${name} (${selector})`);
        return null;
    }
    return element;
}

// Export debug functions to global scope
window.debugLog = debugLog;
window.debugError = debugError;
window.addDebugEventListener = addDebugEventListener;
window.checkElement = checkElement;
