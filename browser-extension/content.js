// PayAid Agent Browser Extension - Content Script
// Adds quick action buttons to PayAid pages

(function() {
  'use strict'
  
  // Detect PayAid pages
  if (!window.location.hostname.includes('payaid.com') && !window.location.hostname.includes('localhost')) {
    return
  }
  
  // Add floating action button
  function addFloatingButton() {
    const button = document.createElement('div')
    button.id = 'payaid-agent-float'
    button.innerHTML = '⚡'
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      background: #53328a;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-size: 24px;
    `
    
    button.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'openPopup' })
    })
    
    document.body.appendChild(button)
  }
  
  // Wait for page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addFloatingButton)
  } else {
    addFloatingButton()
  }
})()
