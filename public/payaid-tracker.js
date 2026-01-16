/**
 * PayAid Website Analytics Tracking Pixel
 * Add this script to your website to track visitors
 */
(function() {
  'use strict';

  // Configuration
  const TRACKING_ENDPOINT = '/api/websites/track';
  const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

  // Get tracking code from script tag
  function getTrackingCode() {
    const script = document.currentScript || document.querySelector('script[data-tracking-code]');
    return script ? script.getAttribute('data-tracking-code') : null;
  }

  // Generate session ID
  function getSessionId() {
    let sessionId = sessionStorage.getItem('payaid_session_id');
    if (!sessionId) {
      sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('payaid_session_id', sessionId);
      sessionStorage.setItem('payaid_session_start', Date.now().toString());
    }
    return sessionId;
  }

  // Get visitor ID
  function getVisitorId() {
    let visitorId = localStorage.getItem('payaid_visitor_id');
    if (!visitorId) {
      visitorId = 'vis_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('payaid_visitor_id', visitorId);
    }
    return visitorId;
  }

  // Collect page data
  function collectPageData() {
    return {
      url: window.location.href,
      path: window.location.pathname,
      referrer: document.referrer,
      title: document.title,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: new Date().toISOString(),
    };
  }

  // Track page view
  function trackPageView() {
    const trackingCode = getTrackingCode();
    if (!trackingCode) {
      console.warn('PayAid: Tracking code not found');
      return;
    }

    const data = {
      trackingCode,
      sessionId: getSessionId(),
      visitorId: getVisitorId(),
      eventType: 'pageview',
      ...collectPageData(),
    };

    // Send tracking data
    fetch(TRACKING_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      keepalive: true,
    }).catch(err => {
      console.warn('PayAid: Tracking error', err);
    });
  }

  // Track custom events
  function trackEvent(eventName, eventData) {
    const trackingCode = getTrackingCode();
    if (!trackingCode) return;

    const data = {
      trackingCode,
      sessionId: getSessionId(),
      visitorId: getVisitorId(),
      eventType: 'event',
      eventName,
      eventData: eventData || {},
      ...collectPageData(),
    };

    fetch(TRACKING_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      keepalive: true,
    }).catch(err => {
      console.warn('PayAid: Event tracking error', err);
    });
  }

  // Track clicks
  function trackClicks() {
    document.addEventListener('click', function(e) {
      const target = e.target;
      if (target.tagName === 'A' || target.closest('a')) {
        const link = target.tagName === 'A' ? target : target.closest('a');
        trackEvent('click', {
          element: 'link',
          href: link.href,
          text: link.textContent.trim().substring(0, 100),
        });
      }
    });
  }

  // Track form submissions
  function trackForms() {
    document.addEventListener('submit', function(e) {
      const form = e.target;
      if (form.tagName === 'FORM') {
        trackEvent('form_submit', {
          formId: form.id || 'unnamed',
          formAction: form.action,
        });
      }
    });
  }

  // Track scroll depth
  function trackScroll() {
    let maxScroll = 0;
    let scrollTracked = false;

    window.addEventListener('scroll', function() {
      const scrollPercent = Math.round(
        ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100
      );

      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
      }

      // Track at 25%, 50%, 75%, 100%
      if (!scrollTracked && maxScroll >= 25) {
        const milestones = [25, 50, 75, 100];
        const milestone = milestones.find(m => maxScroll >= m && maxScroll < m + 5);
        if (milestone) {
          trackEvent('scroll', { depth: milestone });
          if (milestone === 100) scrollTracked = true;
        }
      }
    });
  }

  // Initialize tracking
  function init() {
    // Track initial page view
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', trackPageView);
    } else {
      trackPageView();
    }

    // Track interactions
    trackClicks();
    trackForms();
    trackScroll();

    // Track page visibility changes
    document.addEventListener('visibilitychange', function() {
      if (document.hidden) {
        trackEvent('page_hidden', {});
      } else {
        trackEvent('page_visible', {});
      }
    });

    // Expose global tracking function
    window.payaidTrack = trackEvent;
  }

  // Start tracking
  init();
})();

