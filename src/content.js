import React from 'react';
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
  React.useEffect(() => {
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
          const imageData = request.imageUrl.startsWith('data:') ? 
            request.imageUrl : 
            URL.createObjectURL(request.file);
          
          window.dispatchEvent(new CustomEvent('oasisMessage', {
            detail: {
              action: 'showPopup',
              imageUrl: imageData,
              tabUrl: request.tabUrl || window.location.href,
              type: request.type || 'image'
            }
          }));
          sendResponse({ success: true });
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
  } else {
    const onReady = () => {
      document.removeEventListener('DOMContentLoaded', onReady);
      window.removeEventListener('load', onReady);
      injectionSystem.inject();
    };
    document.addEventListener('DOMContentLoaded', onReady);
    window.addEventListener('load', onReady);
  }

  // SPA navigation handling
  const observer = new MutationObserver(() => {
    if (!document.getElementById(injectionSystem.containerId) && injectionSystem.isInjected) {
      injectionSystem.inject();
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

// Start the extension
initializeExtension();