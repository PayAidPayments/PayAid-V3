// PayAid V3 Browser Extension - Background Service Worker

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('PayAid V3 extension installed')
  
  // Set default values
  chrome.storage.sync.set({
    payaidBaseUrl: 'http://localhost:3000',
  })
})

// Context menu for quick actions
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'payaid-create-contact',
    title: 'Create Contact in PayAid',
    contexts: ['selection'],
  })
  
  chrome.contextMenus.create({
    id: 'payaid-create-deal',
    title: 'Create Deal in PayAid',
    contexts: ['selection'],
  })
})

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'payaid-create-contact') {
    const baseUrl = await chrome.storage.sync.get(['payaidBaseUrl']).then(r => r.payaidBaseUrl || 'http://localhost:3000')
    const tenantId = await chrome.storage.sync.get(['payaidTenantId']).then(r => r.payaidTenantId || 'default')
    
    chrome.tabs.create({
      url: `${baseUrl}/crm/${tenantId}/Contacts/New?name=${encodeURIComponent(info.selectionText || '')}`,
    })
  } else if (info.menuItemId === 'payaid-create-deal') {
    const baseUrl = await chrome.storage.sync.get(['payaidBaseUrl']).then(r => r.payaidBaseUrl || 'http://localhost:3000')
    const tenantId = await chrome.storage.sync.get(['payaidTenantId']).then(r => r.payaidTenantId || 'default')
    
    chrome.tabs.create({
      url: `${baseUrl}/crm/${tenantId}/Deals/New?name=${encodeURIComponent(info.selectionText || '')}`,
    })
  }
})

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getAuthToken') {
    chrome.storage.sync.get(['payaidAuthToken'], (result) => {
      sendResponse({ token: result.payaidAuthToken })
    })
    return true // Keep channel open for async response
  }
})
