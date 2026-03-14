/**
 * PayAid Analytics Tracking Script
 * Add this script to your website to track visitor behavior
 */

(function() {
  'use strict';

  const TRACKING_CODE = window.PAYAID_TRACKING_CODE || '';
  if (!TRACKING_CODE) {
    console.warn('PayAid Analytics: Tracking code not found');
    return;
  }

  const API_BASE = window.PAYAID_ANALYTICS_URL || 'https://api.payaid.com/api/analytics';
  
  // Session management
  let sessionId = localStorage.getItem('payaid_session_id');
  let visitorId = localStorage.getItem('payaid_visitor_id');
  
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem('payaid_session_id', sessionId);
  }
  
  if (!visitorId) {
    visitorId = generateVisitorId();
    localStorage.setItem('payaid_visitor_id', visitorId);
  }

  // Track page visit
  function trackVisit() {
    const pagePath = window.location.pathname;
    const referrer = document.referrer;

    fetch(`${API_BASE}/visit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionId,
        'x-visitor-id': visitorId,
      },
      body: JSON.stringify({
        trackingCode: TRACKING_CODE,
        pagePath,
        referrer,
      }),
    }).catch(err => console.error('PayAid Analytics error:', err));
  }

  // Track events
  function trackEvent(eventType, eventName, element, metadata) {
    const elementId = element?.id || null;
    const elementText = element?.textContent?.trim().substring(0, 100) || null;
    const elementSelector = element ? getSelector(element) : null;

    fetch(`${API_BASE}/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionId,
        'x-visitor-id': visitorId,
      },
      body: JSON.stringify({
        trackingCode: TRACKING_CODE,
        eventType,
        eventName,
        pagePath: window.location.pathname,
        elementId,
        elementText,
        elementSelector,
        metadata: metadata || {},
      }),
    }).catch(err => console.error('PayAid Analytics error:', err));
  }

  // Track clicks
  document.addEventListener('click', function(e) {
    trackEvent('click', 'click', e.target, {
      tagName: e.target.tagName,
      className: e.target.className,
    });
  }, true);

  // Track form submissions
  document.addEventListener('submit', function(e) {
    trackEvent('form_submit', 'form_submit', e.target, {
      formId: e.target.id,
      formAction: e.target.action,
    });
  }, true);

  // Track scroll depth with throttling to reduce forced reflows
  let maxScroll = 0;
  let rafId = null;
  
  window.addEventListener('scroll', function() {
    // Cancel any pending requestAnimationFrame
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
    
    // Use requestAnimationFrame to batch layout reads and avoid forced reflows
    rafId = requestAnimationFrame(function() {
      const scrollPercent = Math.round(
        ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100
      );
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
        if (scrollPercent === 25 || scrollPercent === 50 || scrollPercent === 75 || scrollPercent === 100) {
          trackEvent('scroll', `scroll_${scrollPercent}`, null, { scrollPercent });
        }
      }
      rafId = null;
    });
  }, { passive: true }); // Mark as passive to improve scroll performance

  // Track time on page
  let startTime = Date.now();
  window.addEventListener('beforeunload', function() {
    const duration = Math.round((Date.now() - startTime) / 1000);
    trackEvent('page_exit', 'page_exit', null, { duration });
  });

  // Helper functions
  function generateSessionId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  function generateVisitorId() {
    return 'visitor_' + Math.random().toString(36).substr(2, 16);
  }

  function getSelector(element) {
    if (element.id) return '#' + element.id;
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c).join('.');
      if (classes) return element.tagName.toLowerCase() + '.' + classes;
    }
    return element.tagName.toLowerCase();
  }

  // Track initial page visit
  trackVisit();
})();
