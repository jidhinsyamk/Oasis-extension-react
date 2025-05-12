import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';

// 1. Initialize global state with robust tags system
(function initGlobalState() {
  window.OasisExtension = window.OasisExtension || {};
  
  window.OasisExtension.tags = {
    _tags: [],
    getTags() {
      return [...this._tags];
    },
    setTags(newTags = []) {
      this._tags = Array.isArray(newTags) ? [...newTags] : [];
    },
    addTag(tag) {
      if (tag && !this._tags.includes(tag)) {
        this._tags = [...this._tags, tag];
      }
    },
    removeTag(tag) {
      this._tags = this._tags.filter(t => t !== tag);
    }
  };

  // Initialize drag state
  window.OasisExtension.dragState = {
    isDragging: false,
    currentFile: null
  };

  if (process.env.NODE_ENV === 'development') {
    console.log('Oasis global state initialized', window.OasisExtension);
  }
})();

// 2. Enhanced Error Boundary
class OasisErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Oasis Error Boundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '10px 20px',
          background: '#ff6b6b',
          color: 'white',
          borderRadius: '4px',
          zIndex: 2147483647
        }}>
          Extension UI Error - Please Refresh
        </div>
      );
    }
    return this.props.children;
  }
}

// 3. Main App Wrapper with drag handling
const OasisAppWrapper = () => {
  // Ensure tags system exists
  if (!window.OasisExtension?.tags) {
    window.OasisExtension.tags = {
      getTags: () => [],
      setTags: () => {},
      addTag: () => {},
      removeTag: () => {}
    };
  }

  // Set up global drag events
  useEffect(() => {
    const handleDragOver = (e) => {
      e.preventDefault();
      if (!window.OasisExtension.dragState.isDragging) {
        window.OasisExtension.dragState.isDragging = true;
        window.dispatchEvent(new CustomEvent('oasisDragStateChange', {
          detail: { isDragging: true }
        }));
      }
    };

    const handleDragEnd = () => {
      window.OasisExtension.dragState.isDragging = false;
      window.dispatchEvent(new CustomEvent('oasisDragStateChange', {
        detail: { isDragging: false }
      }));
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragend', handleDragEnd);
    window.addEventListener('drop', handleDragEnd);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragend', handleDragEnd);
      window.removeEventListener('drop', handleDragEnd);
    };
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('oasisUIReady'));
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 2147483647,
      pointerEvents: 'none'
    }}>
      <div style={{ pointerEvents: 'auto' }}>
        <OasisErrorBoundary>
          <App tagsManager={window.OasisExtension.tags} />
        </OasisErrorBoundary>
      </div>
    </div>
  );
};

// 4. Enhanced Message Handling System
const messageHandler = {
  queue: [],
  isReady: false,

  handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'showPopup':
          const popupDetail = {
            action: 'showPopup',
            imageUrl: (typeof request.imageUrl === 'string' && (request.imageUrl.startsWith('data:') || request.imageUrl.startsWith('http')))
              ? request.imageUrl
              : (request.file ? URL.createObjectURL(request.file) : ''),
            tabUrl: request.tabUrl || window.location.href,
            type: request.type || 'image',
            pageTitle: request.pageTitle || '',
            author: request.author || '',
            description: request.description || ''
          };

          const dispatchPopup = () => {
            window.dispatchEvent(new CustomEvent('oasisMessage', { detail: popupDetail }));
            sendResponse({ success: true });
          };

          if (!document.getElementById('oasis-extension-root')) {
            pendingOasisPopup = popupDetail;
            // This will trigger the injection system
            setTimeout(() => {
              // If still not injected, try again
              if (!document.getElementById('oasis-extension-root')) {
                // force injection
                if (typeof injectionSystem !== 'undefined') injectionSystem.inject();
              }
            }, 50);
          } else {
            dispatchPopup();
          }
          return true;

        case 'getTags':
          sendResponse({ 
            tags: window.OasisExtension?.tags?.getTags() || [] 
          });
          return true;

        case 'handleDrop':
          this.processDroppedFiles(request.files, sendResponse);
          return true;

        default:
          sendResponse({ error: 'Unknown action' });
          return false;
      }
    } catch (error) {
      console.error('Message handling error:', error);
      sendResponse({ error: error.message });
      return false;
    }
  },

  async processDroppedFiles(files, sendResponse) {
    try {
      const imageFile = Array.from(files).find(file => 
        file.type.startsWith('image/')
      );
      
      if (!imageFile) {
        throw new Error('No valid image file found');
      }

      const fileData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      window.dispatchEvent(new CustomEvent('oasisMessage', {
        detail: {
          action: 'showPopup',
          imageUrl: fileData,
          tabUrl: window.location.href,
          type: 'image',
          file: imageFile
        }
      }));

      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ 
        error: error.message || 'Failed to process dropped file' 
      });
    }
  },

  init() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (!this.isReady) {
        this.queue.push({ request, sender, sendResponse });
        return true;
      }
      return this.handleMessage(request, sender, sendResponse);
    });
  },

  flushQueue() {
    this.isReady = true;
    while (this.queue.length > 0) {
      const { request, sender, sendResponse } = this.queue.shift();
      this.handleMessage(request, sender, sendResponse);
    }
  }
};

// 5. Injection System with Shadow DOM for Style Isolation
const injectionSystem = {
  containerId: 'oasis-extension-root',
  styleId: 'oasis-extension-styles',
  reactRootId: 'oasis-react-root',
  isInjected: false,

  inject() {
    if (this.isInjected) return;

    // Create container with Shadow DOM
    let container = document.getElementById(this.containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = this.containerId;
      const shadowRoot = container.attachShadow({ mode: 'open' });
      
      // Create style element
      const styleElement = document.createElement('style');
      styleElement.id = this.styleId;
      
      // Create React root container
      const reactRoot = document.createElement('div');
      reactRoot.id = this.reactRootId;
      
      // Append elements to shadow DOM
      shadowRoot.appendChild(styleElement);
      shadowRoot.appendChild(reactRoot);
      
      document.documentElement.appendChild(container);
      
      // Load styles into shadow DOM
      this.loadStyles(styleElement);
    }

    try {
      const root = createRoot(container.shadowRoot.getElementById(this.reactRootId));
      root.render(<OasisAppWrapper />);
      this.isInjected = true;
      messageHandler.flushQueue();
      
      document.addEventListener('drop', this.handleGlobalDrop);
    } catch (error) {
      console.error('React injection failed:', error);
      this.showFallbackUI();
    }
  },

  async loadStyles(styleElement) {
    try {
      const styleUrl = chrome.runtime.getURL('styles/tailwind.css');
      const response = await fetch(styleUrl);
      const cssText = await response.text();
      
      // More targeted CSS reset that won't affect host page
      const resetStyles = `
        :host {
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif !important;
          color: white !important;
        }
        
        * {
          box-sizing: border-box;
        }
        
        input, button, textarea, select {
          font: inherit;
        }
      `;
      
      // Filter out Tailwind's preflight/reset styles
      const filteredCss = cssText.replace(/\/\*\! tailwindcss base .*?\*\/.*?\/\*\! tailwindcss base end \*\/\s*/gs, '');
      
      styleElement.textContent = resetStyles + filteredCss;
    } catch (error) {
      console.error('Failed to load styles:', error);
    }
  },

  handleGlobalDrop(e) {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      chrome.runtime.sendMessage({
        action: 'handleDrop',
        files: Array.from(e.dataTransfer.files)
      });
    }
  },

  showFallbackUI() {
    const container = document.getElementById(this.containerId) || 
      document.createElement('div');
    container.id = this.containerId;
    container.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 10px 20px;
        background: #ff6b6b;
        color: white;
        border-radius: 4px;
        z-index: 2147483647;
      ">
        Oasis failed to load. Refresh the page.
      </div>
    `;
    document.documentElement.appendChild(container);
  }
};

// 6. Initialization with Drag Support
function initializeExtension() {
  // Set up message handling first
  messageHandler.init();

  // Handle page ready state
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    injectionSystem.inject();
    // Ensure drag and drop handlers are set up
    document.addEventListener('drop', injectionSystem.handleGlobalDrop);
  } else {
    const onReady = () => {
      document.removeEventListener('DOMContentLoaded', onReady);
      window.removeEventListener('load', onReady);
      injectionSystem.inject();
      // Ensure drag and drop handlers are set up
      document.addEventListener('drop', injectionSystem.handleGlobalDrop);
    };
    document.addEventListener('DOMContentLoaded', onReady);
    window.addEventListener('load', onReady);
  }

  // SPA navigation handling
  const observer = new MutationObserver(() => {
    if (!document.getElementById(injectionSystem.containerId) && injectionSystem.isInjected) {
      injectionSystem.inject();
      // Re-attach drop handler when re-injecting
      document.addEventListener('drop', injectionSystem.handleGlobalDrop);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Cleanup
  window.addEventListener('unload', () => {
    observer.disconnect();
    document.removeEventListener('drop', injectionSystem.handleGlobalDrop);
    chrome.runtime.onMessage.removeListener(messageHandler.handleMessage);
  });
}

// 7. Auto-detect copy event for URLs when toggle is enabled
let autoDetectLinksEnabled = false;
let lastProcessedUrl = '';
let processingTimeout = null;

// Load initial state and set up initial event listener
function initializeAutoDetect() {
  chrome.storage.local.get(['oasisAutoDetectLinks'], (result) => {
    console.log('Loading auto-detect state:', result);
    autoDetectLinksEnabled = !!result.oasisAutoDetectLinks;
  });
}

// Call initialization
initializeAutoDetect();

// Listen for toggle changes
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'autoDetectLinksToggled') {
    console.log('Toggle state changed:', request.enabled);
    autoDetectLinksEnabled = !!request.enabled;
    sendResponse && sendResponse({ success: true });
    return true;
  }
  return false;
});

// Enhanced URL detection function
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Function to handle URL detection and popup triggering
async function handleUrlDetection(url) {
  if (!url || url === lastProcessedUrl) return;
  
  console.log('Processing URL:', url);
  lastProcessedUrl = url;
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'autoDetectCopyUrl',
      url: url,
      pageTitle: document.title || 'Untitled Page'
    });
    console.log('Message sent to background:', response);
  } catch (error) {
    console.error('Error sending message:', error);
    lastProcessedUrl = ''; // Reset on error
  }
}

// Debounced URL processing
function processUrlWithDebounce(url) {
  if (processingTimeout) {
    clearTimeout(processingTimeout);
  }
  
  processingTimeout = setTimeout(() => {
    handleUrlDetection(url);
  }, 300); // 300ms debounce
}

// Helper: Try to get clipboard text using the async Clipboard API
async function getClipboardText() {
  if (navigator.clipboard && navigator.clipboard.readText) {
    try {
      const text = await navigator.clipboard.readText();
      return text.trim();
    } catch (e) {
      // Clipboard API not available or permission denied
      return '';
    }
  }
  return '';
}

document.addEventListener('copy', async (e) => {
  chrome.storage.local.get(['oasisAutoDetectLinks'], async (result) => {
    const enabled = !!result.oasisAutoDetectLinks;
    console.log('Copy event detected, auto-detect enabled:', enabled);
    if (!enabled) return;
    let copiedText = '';
    copiedText = await getClipboardText();
    if (!copiedText) {
      if (e.clipboardData && e.clipboardData.getData) {
        copiedText = e.clipboardData.getData('text/plain');
      } else if (window.getSelection) {
        copiedText = window.getSelection().toString();
      }
      copiedText = copiedText.trim();
    }
    console.log('Copied text:', copiedText);
    if (copiedText && isValidUrl(copiedText)) {
      console.log('Copied text is a valid URL, triggering popup.');
      processUrlWithDebounce(copiedText);
    } else {
      console.log('Copied text is not a URL, not triggering popup.');
    }
  });
});

document.addEventListener('keydown', async (e) => {
  if (e.ctrlKey && e.key === 'c') {
    chrome.storage.local.get(['oasisAutoDetectLinks'], async (result) => {
      const enabled = !!result.oasisAutoDetectLinks;
      if (!enabled) return;
      console.log('Ctrl+C detected');
      setTimeout(async () => {
        let clipboardText = await getClipboardText();
        clipboardText = clipboardText.trim();
        if (clipboardText && isValidUrl(clipboardText)) {
          console.log('Clipboard text is a valid URL, triggering popup.');
          processUrlWithDebounce(clipboardText);
        }
      }, 100);
    });
  }
});

// Start the extension
initializeExtension();

// At the top of content.js
let pendingOasisPopup = null;

// Listen for UI ready event
window.addEventListener('oasisUIReady', () => {
  if (pendingOasisPopup) {
    window.dispatchEvent(new CustomEvent('oasisMessage', { detail: pendingOasisPopup }));
    pendingOasisPopup = null;
  }
});