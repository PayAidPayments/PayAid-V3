/**
 * PayAid Chatbot Embed Script
 * Add this script to your website to embed the chatbot widget
 * 
 * Usage:
 * <script src="https://your-domain.com/chatbot-embed.js" data-chatbot-id="your-chatbot-id"></script>
 */

(function() {
  'use strict';

  // Get chatbot ID from script tag
  const script = document.currentScript || document.querySelector('script[data-chatbot-id]');
  const chatbotId = script?.getAttribute('data-chatbot-id');
  const apiBaseUrl = script?.getAttribute('data-api-url') || window.location.origin;
  const position = script?.getAttribute('data-position') || 'bottom-right';
  const primaryColor = script?.getAttribute('data-color') || '#53328A';
  const greetingMessage = script?.getAttribute('data-greeting') || 'Hello! How can I help you today?';
  const autoGreet = script?.getAttribute('data-auto-greet') !== 'false';
  const autoGreetDelay = parseInt(script?.getAttribute('data-auto-greet-delay') || '3000');

  if (!chatbotId) {
    console.error('PayAid Chatbot: chatbot-id is required');
    return;
  }

  // Create widget container
  const widgetContainer = document.createElement('div');
  widgetContainer.id = 'payaid-chatbot-widget';
  document.body.appendChild(widgetContainer);

  // Load React and widget component
  // For production, you'd bundle this properly
  // For now, this is a placeholder that shows how to embed
  
  // Simple vanilla JS implementation
  let isOpen = false;
  let messages = [];
  let sessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  let visitorId = `visitor_${Math.random().toString(36).substr(2, 16)}`;

  function createChatButton() {
    const button = document.createElement('button');
    button.id = 'payaid-chatbot-button';
    button.style.cssText = `
      position: fixed;
      ${position === 'bottom-right' ? 'right: 16px;' : 'left: 16px;'}
      bottom: 16px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background-color: ${primaryColor};
      color: white;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s;
    `;
    button.innerHTML = `
      <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
      </svg>
    `;
    button.addEventListener('click', toggleChat);
    button.addEventListener('mouseenter', () => button.style.transform = 'scale(1.1)');
    button.addEventListener('mouseleave', () => button.style.transform = 'scale(1)');
    return button;
  }

  function createChatWindow() {
    const window = document.createElement('div');
    window.id = 'payaid-chatbot-window';
    window.style.cssText = `
      position: fixed;
      ${position === 'bottom-right' ? 'right: 16px;' : 'left: 16px;'}
      bottom: 16px;
      width: 384px;
      height: 600px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      z-index: 10000;
      display: none;
      flex-direction: column;
    `;
    window.innerHTML = `
      <div style="background-color: ${primaryColor}; color: white; padding: 16px; border-radius: 8px 8px 0 0; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h3 style="margin: 0; font-size: 16px; font-weight: 600;">Chat with us</h3>
          <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">We're here to help</p>
        </div>
        <button id="payaid-chatbot-close" style="background: none; border: none; color: white; cursor: pointer; padding: 4px;">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div id="payaid-chatbot-messages" style="flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px;"></div>
      <div style="padding: 16px; border-top: 1px solid #e5e7eb;">
        <form id="payaid-chatbot-form" style="display: flex; gap: 8px;">
          <input 
            id="payaid-chatbot-input" 
            type="text" 
            placeholder="Type your message..." 
            style="flex: 1; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; outline: none;"
          />
          <button 
            type="submit" 
            style="padding: 8px 16px; background-color: ${primaryColor}; color: white; border: none; border-radius: 6px; cursor: pointer;"
          >
            Send
          </button>
        </form>
      </div>
    `;
    return window;
  }

  function toggleChat() {
    isOpen = !isOpen;
    const button = document.getElementById('payaid-chatbot-button');
    const window = document.getElementById('payaid-chatbot-window');
    
    if (button) button.style.display = isOpen ? 'none' : 'flex';
    if (window) window.style.display = isOpen ? 'flex' : 'none';
    
    if (isOpen && messages.length === 0 && autoGreet) {
      addMessage('assistant', greetingMessage);
    }
  }

  function addMessage(role, content) {
    messages.push({ role, content, timestamp: new Date().toISOString() });
    renderMessages();
  }

  function renderMessages() {
    const container = document.getElementById('payaid-chatbot-messages');
    if (!container) return;
    
    container.innerHTML = messages.map(msg => `
      <div style="display: flex; justify-content: ${msg.role === 'user' ? 'flex-end' : 'flex-start'};">
        <div style="max-width: 80%; padding: 8px 12px; border-radius: 8px; background-color: ${msg.role === 'user' ? '#f3f4f6' : primaryColor}; color: ${msg.role === 'user' ? '#111827' : 'white'};">
          ${msg.content}
        </div>
      </div>
    `).join('');
    container.scrollTop = container.scrollHeight;
  }

  async function sendMessage(message) {
    addMessage('user', message);
    
    try {
      const response = await fetch(`${apiBaseUrl}/api/chatbots/${chatbotId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, sessionId, visitorId }),
      });
      
      const data = await response.json();
      addMessage('assistant', data.response || 'Sorry, I encountered an error.');
    } catch (error) {
      console.error('Chatbot error:', error);
      addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
    }
  }

  // Initialize
  const button = createChatButton();
  const window = createChatWindow();
  widgetContainer.appendChild(button);
  widgetContainer.appendChild(window);

  // Event listeners
  document.getElementById('payaid-chatbot-close')?.addEventListener('click', toggleChat);
  document.getElementById('payaid-chatbot-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('payaid-chatbot-input');
    if (input && input.value.trim()) {
      sendMessage(input.value);
      input.value = '';
    }
  });

  // Auto-greet
  if (autoGreet && autoGreetDelay > 0) {
    setTimeout(() => {
      if (!isOpen) toggleChat();
    }, autoGreetDelay);
  }
})();

