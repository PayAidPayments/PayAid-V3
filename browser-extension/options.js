// PayAid Agent - Options/Settings Page

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('settings-form')
  const statusDiv = document.getElementById('status')
  
  // Load saved settings
  const { payaidApiKey, payaidTenantId } = await chrome.storage.sync.get(['payaidApiKey', 'payaidTenantId'])
  if (payaidApiKey) {
    document.getElementById('apiKey').value = payaidApiKey
  }
  if (payaidTenantId) {
    document.getElementById('tenantId').value = payaidTenantId
  }
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    
    const apiKey = document.getElementById('apiKey').value
    const tenantId = document.getElementById('tenantId').value
    
    await chrome.storage.sync.set({
      payaidApiKey: apiKey,
      payaidTenantId: tenantId || undefined,
    })
    
    statusDiv.innerHTML = '<div class="status success">Settings saved successfully!</div>'
    setTimeout(() => {
      statusDiv.innerHTML = ''
    }, 3000)
  })
})
