// PayAid V3 Browser Extension - Content Script

// Inject floating widget button
function injectWidget() {
  // Check if widget already exists
  if (document.getElementById('payaid-widget-button')) {
    return
  }

  const widget = document.createElement('div')
  widget.id = 'payaid-widget-button'
  widget.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  `
  
  widget.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, #53328A 0%, #6B4BA1 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(83, 50, 138, 0.4);
    z-index: 999999;
    transition: all 0.3s;
    color: white;
  `
  
  widget.addEventListener('mouseenter', () => {
    widget.style.transform = 'scale(1.1)'
    widget.style.boxShadow = '0 6px 16px rgba(83, 50, 138, 0.6)'
  })
  
  widget.addEventListener('mouseleave', () => {
    widget.style.transform = 'scale(1)'
    widget.style.boxShadow = '0 4px 12px rgba(83, 50, 138, 0.4)'
  })
  
  widget.addEventListener('click', async () => {
    // Get base URL and open PayAid
    chrome.storage.sync.get(['payaidBaseUrl'], (result) => {
      const baseUrl = result.payaidBaseUrl || 'http://localhost:3000'
      window.open(baseUrl, '_blank')
    })
  })
  
  document.body.appendChild(widget)
}

// Auto-detect email addresses and phone numbers on page
function detectContactInfo() {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
  const phoneRegex = /(\+91|0)?[6-9]\d{9}/g
  
  const text = document.body.innerText
  const emails = text.match(emailRegex) || []
  const phones = text.match(phoneRegex) || []
  
  // Store detected info (can be used for quick contact creation)
  if (emails.length > 0 || phones.length > 0) {
    chrome.runtime.sendMessage({
      action: 'detectedContacts',
      emails: [...new Set(emails)],
      phones: [...new Set(phones)],
    })
  }
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    injectWidget()
    detectContactInfo()
  })
} else {
  injectWidget()
  detectContactInfo()
}
