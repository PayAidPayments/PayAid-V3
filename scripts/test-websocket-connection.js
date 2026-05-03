/**
 * Test WebSocket Connection Script
 * 
 * This script tests the WebSocket connection to verify it's working correctly.
 * 
 * Usage: node scripts/test-websocket-connection.js [token] [agentId]
 */

const WebSocket = require('ws')
const { config } = require('dotenv')
const { resolve } = require('path')

// Load .env file
config({ path: resolve(process.cwd(), '.env') })

const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001'
const token = process.argv[2]
const agentId = process.argv[3] || 'test-agent'

console.log('='.repeat(60))
console.log('WebSocket Connection Test')
console.log('='.repeat(60))
console.log()
console.log('WebSocket URL:', WEBSOCKET_URL)
console.log('Token provided:', token ? 'Yes' : 'No')
console.log('AgentId:', agentId)
console.log()

if (!token) {
  console.log('❌ Error: Token is required')
  console.log()
  console.log('Usage: node scripts/test-websocket-connection.js <token> [agentId]')
  console.log()
  console.log('To get a token:')
  console.log('1. Log in to your Next.js app')
  console.log('2. Open browser console')
  console.log('3. Run: localStorage.getItem("token") or check your auth store')
  console.log()
  process.exit(1)
}

const wsUrl = `${WEBSOCKET_URL}?token=${token}&agentId=${agentId}`
console.log('Connecting to:', wsUrl.substring(0, 50) + '...')
console.log()

let connectionTimeout
let receivedConnected = false

const ws = new WebSocket(wsUrl)

ws.on('open', () => {
  console.log('✅ WebSocket connection opened')
  console.log('   ReadyState:', ws.readyState, '(OPEN = 1)')
  console.log()
  
  // Set timeout to detect if we don't receive confirmation
  connectionTimeout = setTimeout(() => {
    if (!receivedConnected) {
      console.log('⚠️  Warning: Did not receive connection confirmation message')
      console.log('   This might indicate the server is not sending the confirmation')
    }
  }, 2000)
  
  // Send a ping to test the connection
  setTimeout(() => {
    if (ws.readyState === WebSocket.OPEN) {
      console.log('Sending ping...')
      ws.send(JSON.stringify({ type: 'ping' }))
    }
  }, 1000)
})

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString())
    console.log('📨 Received message:', message.type)
    
    if (message.type === 'connected') {
      receivedConnected = true
      console.log('   ✅ Connection confirmed by server')
      console.log('   Message:', message.message)
      clearTimeout(connectionTimeout)
    } else if (message.type === 'pong') {
      console.log('   ✅ Pong received - connection is working!')
    } else if (message.type === 'error') {
      console.log('   ❌ Error from server:', message.data)
    } else {
      console.log('   Data:', JSON.stringify(message, null, 2))
    }
    console.log()
  } catch (error) {
    console.log('⚠️  Received non-JSON message:', data.toString().substring(0, 100))
  }
})

ws.on('error', (error) => {
  console.log('❌ WebSocket error:', error.message || error)
  console.log()
})

ws.on('close', (code, reason) => {
  console.log('='.repeat(60))
  console.log('Connection closed')
  console.log('='.repeat(60))
  console.log('Close code:', code)
  console.log('Close reason:', reason?.toString() || '(no reason)')
  console.log('Was clean:', code === 1000)
  console.log()
  
  if (code === 1006) {
    console.log('❌ Abnormal closure (code 1006)')
    console.log('   This usually means:')
    console.log('   1. Server closed the connection immediately')
    console.log('   2. Network issue')
    console.log('   3. Server crashed during connection')
    console.log()
    console.log('Check the WebSocket server console for errors.')
  } else if (code === 1008) {
    console.log('❌ Policy violation (code 1008)')
    console.log('   This usually means authentication failed.')
    console.log('   Check:')
    console.log('   1. JWT_SECRET matches between Next.js and WebSocket server')
    console.log('   2. Token is valid and not expired')
    console.log('   3. Token contains userId and tenantId')
  } else if (code === 1000) {
    console.log('✅ Normal closure (code 1000)')
  } else {
    console.log('⚠️  Unexpected close code:', code)
  }
  console.log()
  
  process.exit(code === 1000 ? 0 : 1)
})

// Set overall timeout
setTimeout(() => {
  if (ws.readyState === WebSocket.OPEN) {
    console.log('✅ Connection test successful!')
    console.log('   Connection is open and working')
    ws.close(1000, 'Test complete')
  } else {
    console.log('❌ Connection test failed')
    console.log('   Connection never opened or closed unexpectedly')
    process.exit(1)
  }
}, 5000)
