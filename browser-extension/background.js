// PayAid Agent Browser Extension - Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
  console.log('PayAid Agent extension installed')
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openPopup') {
    chrome.action.openPopup()
  }
})
