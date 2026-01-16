// PayAid V3 Browser Extension - Popup Script

// Get base URL from storage or use default
async function getBaseUrl() {
  const result = await chrome.storage.sync.get(['payaidBaseUrl'])
  return result.payaidBaseUrl || 'http://localhost:3000'
}

// Get auth token from storage
async function getAuthToken() {
  const result = await chrome.storage.sync.get(['payaidAuthToken'])
  return result.payaidAuthToken
}

// Load stats
async function loadStats() {
  try {
    const baseUrl = await getBaseUrl()
    const token = await getAuthToken()
    
    if (!token) {
      document.getElementById('deals-count').textContent = 'Login required'
      document.getElementById('tasks-count').textContent = 'Login required'
      document.getElementById('leads-count').textContent = 'Login required'
      return
    }

    // Fetch stats from API
    const [dealsRes, tasksRes, leadsRes] = await Promise.all([
      fetch(`${baseUrl}/api/crm/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${token}` },
      }).catch(() => null),
      fetch(`${baseUrl}/api/tasks?status=pending&limit=1`, {
        headers: { 'Authorization': `Bearer ${token}` },
      }).catch(() => null),
      fetch(`${baseUrl}/api/crm/leads?limit=1`, {
        headers: { 'Authorization': `Bearer ${token}` },
      }).catch(() => null),
    ])

    if (dealsRes && dealsRes.ok) {
      const data = await dealsRes.json()
      document.getElementById('deals-count').textContent = data.activeDeals || '0'
    }

    if (tasksRes && tasksRes.ok) {
      const data = await tasksRes.json()
      document.getElementById('tasks-count').textContent = data.total || '0'
    }

    if (leadsRes && leadsRes.ok) {
      const data = await leadsRes.json()
      document.getElementById('leads-count').textContent = data.total || '0'
    }
  } catch (error) {
    console.error('Error loading stats:', error)
  }
}

// Handle action clicks
document.addEventListener('DOMContentLoaded', () => {
  // Load stats on popup open
  loadStats()

  // Action items
  document.querySelectorAll('.action-item').forEach(item => {
    item.addEventListener('click', async () => {
      const action = item.getAttribute('data-action')
      const baseUrl = await getBaseUrl()
      
      let url = baseUrl
      switch (action) {
        case 'dashboard':
          url = `${baseUrl}/dashboard`
          break
        case 'deals':
          // Get tenant ID from storage
          const tenant = await chrome.storage.sync.get(['payaidTenantId'])
          url = `${baseUrl}/crm/${tenant.payaidTenantId || 'default'}/Deals`
          break
        case 'contacts':
          const tenant2 = await chrome.storage.sync.get(['payaidTenantId'])
          url = `${baseUrl}/crm/${tenant2.payaidTenantId || 'default'}/Contacts`
          break
        case 'tasks':
          url = `${baseUrl}/dashboard/tasks`
          break
        case 'ai-cofounder':
          const tenant3 = await chrome.storage.sync.get(['payaidTenantId'])
          url = `${baseUrl}/ai-studio/${tenant3.payaidTenantId || 'default'}/Cofounder`
          break
      }
      
      chrome.tabs.create({ url })
      window.close()
    })
  })

  // Open full app
  document.getElementById('open-full').addEventListener('click', async () => {
    const baseUrl = await getBaseUrl()
    chrome.tabs.create({ url: baseUrl })
    window.close()
  })
})
