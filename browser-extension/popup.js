// PayAid Agent Browser Extension - Popup Script

async function getApiKey() {
  const result = await chrome.storage.sync.get(['payaidApiKey', 'payaidTenantId'])
  return { apiKey: result.payaidApiKey, tenantId: result.payaidTenantId }
}

async function getCurrentPageContext() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  const url = tab.url || ''
  
  // Detect if we're on a PayAid page
  if (url.includes('payaid.com') || url.includes('localhost')) {
    const contactMatch = url.match(/\/contacts\/([^\/]+)/)
    const dealMatch = url.match(/\/deals\/([^\/]+)/)
    
    if (contactMatch) {
      return { type: 'contact', id: contactMatch[1] }
    }
    if (dealMatch) {
      return { type: 'deal', id: dealMatch[1] }
    }
  }
  
  return null
}

async function getSuggestions(context, apiKey, tenantId) {
  if (!context || !apiKey) return []
  
  try {
    // Call PayAid API to get suggestions
    const response = await fetch(`https://api.payaid.com/api/ai/suggestions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tenantId,
        context: {
          type: context.type,
          id: context.id,
        },
      }),
    })
    
    if (!response.ok) return []
    
    const data = await response.json()
    return data.suggestions || []
  } catch (error) {
    console.error('Failed to get suggestions:', error)
    return []
  }
}

async function executeAction(actionId, apiKey, tenantId) {
  try {
    const response = await fetch(`https://api.payaid.com/api/ai/actions/${actionId}/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tenantId }),
    })
    
    return response.ok
  } catch (error) {
    console.error('Failed to execute action:', error)
    return false
  }
}

async function renderSuggestions() {
  const container = document.getElementById('suggestions')
  const { apiKey, tenantId } = await getApiKey()
  
  if (!apiKey) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Please configure your API key in settings</p>
      </div>
    `
    return
  }
  
  const context = await getCurrentPageContext()
  if (!context) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Open a contact or deal page in PayAid to see suggestions</p>
      </div>
    `
    return
  }
  
  const suggestions = await getSuggestions(context, apiKey, tenantId)
  
  if (suggestions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No suggestions available</p>
      </div>
    `
    return
  }
  
  container.innerHTML = suggestions.map((suggestion, index) => `
    <div class="suggestion">
      <div class="suggestion-title">${suggestion.title}</div>
      <div class="suggestion-desc">${suggestion.description}</div>
      <button class="action-button" onclick="executeAction('${suggestion.id}')">
        ${suggestion.actionLabel || 'Execute'}
      </button>
    </div>
  `).join('')
  
  // Attach event handlers
  window.executeAction = async (actionId) => {
    const success = await executeAction(actionId, apiKey, tenantId)
    if (success) {
      alert('Action executed successfully!')
      renderSuggestions() // Refresh
    } else {
      alert('Failed to execute action')
    }
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', renderSuggestions)
