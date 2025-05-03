// Initialize context menus on install
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "saveImageToOasis",
      title: "Save Image to Oasis",
      contexts: ["image"]
    });
  
    chrome.contextMenus.create({
      id: "savePageToOasis",
      title: "Save Page to Oasis",
      contexts: ["page"]
    });
  
    monitorAuthState();
  });
  
  // Get authentication token
  async function getAuthToken() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['oasisToken', 'oasisUserId'], (result) => {
        if (result.oasisToken) {
          resolve({ 
            token: result.oasisToken,
            userId: result.oasisUserId 
          });
          return;
        }
        
        chrome.cookies.get({
          url: 'http://localhost:5000',
          name: 'token'
        }, (cookie) => {
          if (cookie) {
            chrome.storage.local.set({
              oasisToken: cookie.value,
              oasisUserId: cookie.userId || ''
            });
            resolve({ token: cookie.value });
            return;
          }
          
          chrome.tabs.query({ url: "http://localhost:5173/*" }, (tabs) => {
            if (tabs.length === 0) {
              resolve({ error: "Please log in to Oasis" });
              return;
            }
  
            chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              func: () => ({
                token: localStorage.getItem('token'),
                userId: localStorage.getItem('userId')
              })
            }, (results) => {
              if (results?.[0]?.result) {
                const { token, userId } = results[0].result;
                if (token) {
                  chrome.storage.local.set({
                    oasisToken: token,
                    oasisUserId: userId || ''
                  });
                  resolve({ token, userId });
                } else {
                  resolve({ error: "Not authenticated" });
                }
              } else {
                resolve({ error: "Not authenticated" });
              }
            });
          });
        });
      });
    });
  }
  
  // Monitor authentication state
  function monitorAuthState() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "updateAuthToken") {
        chrome.storage.local.set({
          oasisToken: request.token,
          oasisUserId: request.userId || ''
        }, () => sendResponse({ success: true }));
        return true;
      }
      return false;
    });
    
    setInterval(async () => {
      const { token } = await getAuthToken();
      if (token) {
        try {
          const res = await fetch("http://localhost:5000/auth/validate", {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (!res.ok) {
            chrome.storage.local.remove(['oasisToken', 'oasisUserId']);
          }
        } catch (error) {
          console.error("Token validation error:", error);
        }
      }
    }, 3600000);
  }
  
  // Handle context menu clicks
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "saveImageToOasis" && info.srcUrl) {
      await handleImageSave(tab, info.srcUrl);
    } else if (info.menuItemId === "savePageToOasis") {
      await handlePageSave(tab);
    }
  });
  
  async function handleImageSave(tab, imageUrl) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
  
      await chrome.tabs.sendMessage(tab.id, {
        action: "showPopup",
        imageUrl: imageUrl,
        tabUrl: tab.url,
        type: "image"
      });
    } catch (err) {
      console.error('Error handling image save:', err);
      showErrorPopup(tab.id, "Failed to save image. Please try again.");
    }
  }
  
  async function handlePageSave(tab) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
  
      const dataUrl = await chrome.tabs.captureVisibleTab({
        format: 'jpeg',
        quality: 90
      });
  
      await chrome.tabs.sendMessage(tab.id, {
        action: "showPopup",
        imageUrl: dataUrl,
        tabUrl: tab.url,
        type: "screenshot"
      });
    } catch (err) {
      console.error('Error capturing page:', err);
      showErrorPopup(tab.id, "Failed to capture page. Please try again.");
    }
  }
  
  function showErrorPopup(tabId, message) {
    chrome.tabs.sendMessage(tabId, {
      action: "showError",
      message: message
    });
  }
  
  // Message handler
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getProjects") {
      handleGetProjects(sendResponse);
      return true;
    }
    
    if (request.action === "getToken") {
      getAuthToken().then(sendResponse);
      return true;
    }
  
    if (request.action === "saveImage") {
      saveImageToBackend(request.data)
        .then(sendResponse)
        .catch(error => {
          console.error("Save image error:", error);
          sendResponse({ error: error.message || "Failed to save image" });
        });
      return true;
    }
    if (request.action === "getTags") {
        chrome.scripting.executeScript({
          target: { tabId: sender.tab.id },
          func: () => {
            return window.OasisExtension?.tags?.getTags() || [];
          }
        }, (results) => {
          sendResponse({ tags: results?.[0]?.result || [] });
        });
        return true;
      }
    
  
    if (request.action === "goToApp") {
      chrome.tabs.create({ url: "http://localhost:5173" });
      sendResponse({ success: true });
      return true;
    }
  });
  
  async function handleGetProjects(sendResponse) {
    const { token, error } = await getAuthToken();
    
    if (error || !token) {
      sendResponse({ error: error || "Please log in to Oasis" });
      return;
    }
  
    try {
      const res = await fetch("http://localhost:5000/projects", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
  
      const data = await res.json();
      if (res.ok) {
        sendResponse({ data });
      } else {
        if (res.status === 401) {
          chrome.storage.local.remove(['oasisToken', 'oasisUserId']);
        }
        sendResponse({ error: data.message || "Failed to load projects" });
      }
    } catch (err) {
      sendResponse({ error: err.message });
    }
  }
  
  async function saveImageToBackend(data) {
    const { token, imageUrl, name, notes, tags, tabUrl, projectId, userId } = data;
  
    try {
      let blob;
      if (imageUrl.startsWith('data:')) {
        blob = await (await fetch(imageUrl)).blob();
      } else {
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error(`Image fetch failed: ${response.status}`);
        blob = await response.blob();
      }
  
      const formData = new FormData();
      formData.append("name", name);
      formData.append("notes", notes);
      formData.append("tags", JSON.stringify(tags));
      formData.append("link", tabUrl);
      formData.append("projectId", projectId);
      formData.append("userId", userId || '');
      formData.append("file", new File([blob], `${name}.jpg`, { type: blob.type }));
  
      const apiResponse = await fetch("http://localhost:5000/files", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
  
      if (!apiResponse.ok) {
        const error = await apiResponse.json().catch(() => ({}));
        if (apiResponse.status === 401) {
          chrome.storage.local.remove(['oasisToken', 'oasisUserId']);
        }
        throw new Error(error.message || `Server error: ${apiResponse.status}`);
      }
  
      return await apiResponse.json();
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  }