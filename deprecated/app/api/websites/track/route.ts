import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { headers } from 'next/headers'

interface TrackingData {
  trackingCode: string
  pagePath: string
  pageTitle?: string
  referrer?: string
  sessionId?: string
  visitorId?: string
  eventType?: string
  eventName?: string
  metadata?: any
}

// Helper to get client IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  if (realIP) {
    return realIP
  }
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  return 'unknown'
}

// Helper to parse user agent
function parseUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase()
  
  let device = 'desktop'
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    device = 'mobile'
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    device = 'tablet'
  }
  
  let browser = 'unknown'
  if (ua.includes('chrome') && !ua.includes('edg')) browser = 'chrome'
  else if (ua.includes('firefox')) browser = 'firefox'
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'safari'
  else if (ua.includes('edg')) browser = 'edge'
  else if (ua.includes('opera')) browser = 'opera'
  
  let os = 'unknown'
  if (ua.includes('windows')) os = 'windows'
  else if (ua.includes('mac')) os = 'macos'
  else if (ua.includes('linux')) os = 'linux'
  else if (ua.includes('android')) os = 'android'
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'ios'
  
  return { device, browser, os }
}

// Helper to get location from IP (simplified - in production use a geolocation service)
async function getLocationFromIP(ip: string): Promise<{ country?: string; city?: string }> {
  // Skip localhost/private IPs
  if (ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return {}
  }
  
  // In production, use a service like:
  // - ipapi.co
  // - ip-api.com
  // - MaxMind GeoIP2
  // For now, return empty (can be enhanced)
  return {}
}

// POST /api/websites/track - Track website visitor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { trackingCode, pagePath, pageTitle, referrer, sessionId, visitorId, eventType, eventName, metadata } = body as TrackingData

    if (!trackingCode) {
      return NextResponse.json({ error: 'Tracking code is required' }, { status: 400 })
    }

    // Find website by tracking code
    const website = await prisma.website.findUnique({
      where: { trackingCode },
      select: { id: true, tenantId: true },
    })

    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 })
    }

    // Get client information
    const ipAddress = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || ''
    const { device, browser, os } = parseUserAgent(userAgent)
    const location = await getLocationFromIP(ipAddress)

    // Get or create session
    let session = null
    if (sessionId) {
      session = await prisma.websiteSession.findUnique({
        where: { sessionId },
      })
    }

    if (!session) {
      // Create new session
      const newSessionId = sessionId || `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      session = await prisma.websiteSession.create({
        data: {
          websiteId: website.id,
          sessionId: newSessionId,
          visitorId: visitorId || `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          tenantId: website.tenantId,
          startedAt: new Date(),
          pageViews: 1,
        },
      })
    } else {
      // Update existing session
      session = await prisma.websiteSession.update({
        where: { id: session.id },
        data: {
          pageViews: { increment: 1 },
          isBounce: false, // Multiple page views = not a bounce
        },
      })
    }

    // Find or create page
    let page = await prisma.websitePage.findFirst({
      where: {
        websiteId: website.id,
        path: pagePath,
      },
    })

    if (!page) {
      // Create page record if it doesn't exist
      page = await prisma.websitePage.create({
        data: {
          websiteId: website.id,
          path: pagePath,
          title: pageTitle || pagePath,
          contentJson: {},
          isPublished: true,
        },
      })
    }

    // Create visit record
    const visit = await prisma.websiteVisit.create({
      data: {
        websiteId: website.id,
        pageId: page.id,
        sessionId: session.id,
        ipAddress,
        userAgent,
        referrer: referrer || null,
        country: location.country,
        city: location.city,
        device,
        browser,
        os,
        tenantId: website.tenantId,
        visitedAt: new Date(),
      },
    })

    // If this is an event (not just a page view), create event record
    if (eventType && eventName) {
      await prisma.websiteEvent.create({
        data: {
          websiteId: website.id,
          pageId: page.id,
          sessionId: session.id,
          eventType,
          eventName,
          metadata: metadata || {},
          tenantId: website.tenantId,
          occurredAt: new Date(),
        },
      })
    }

    return NextResponse.json({
      success: true,
      sessionId: session.sessionId,
      visitorId: session.visitorId,
      visitId: visit.id,
    })
  } catch (error: any) {
    console.error('Website tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to track visit', message: error?.message },
      { status: 500 }
    )
  }
}

// GET /api/websites/track - Get tracking script (for embedding)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const trackingCode = searchParams.get('code')

  if (!trackingCode) {
    return NextResponse.json({ error: 'Tracking code is required' }, { status: 400 })
  }

  // Return JavaScript tracking script
  const script = `
(function() {
  'use strict';
  
  const TRACKING_CODE = '${trackingCode}';
  const API_URL = '${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/websites/track';
  
  // Get or create visitor ID
  function getVisitorId() {
    let visitorId = localStorage.getItem('payaid_visitor_id');
    if (!visitorId) {
      visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('payaid_visitor_id', visitorId);
    }
    return visitorId;
  }
  
  // Get or create session ID
  function getSessionId() {
    let sessionId = sessionStorage.getItem('payaid_session_id');
    if (!sessionId) {
      sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('payaid_session_id', sessionId);
    }
    return sessionId;
  }
  
  // Track page view
  function trackPageView() {
    const data = {
      trackingCode: TRACKING_CODE,
      pagePath: window.location.pathname + window.location.search,
      pageTitle: document.title,
      referrer: document.referrer,
      sessionId: getSessionId(),
      visitorId: getVisitorId(),
    };
    
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(err => console.error('Tracking error:', err));
  }
  
  // Track custom events
  window.payaidTrack = function(eventName, metadata) {
    const data = {
      trackingCode: TRACKING_CODE,
      pagePath: window.location.pathname + window.location.search,
      pageTitle: document.title,
      referrer: document.referrer,
      sessionId: getSessionId(),
      visitorId: getVisitorId(),
      eventType: 'custom',
      eventName: eventName,
      metadata: metadata || {},
    };
    
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(err => console.error('Tracking error:', err));
  };
  
  // Track on page load
  if (document.readyState === 'complete') {
    trackPageView();
  } else {
    window.addEventListener('load', trackPageView);
  }
  
  // Track on navigation (for SPAs)
  let lastPath = window.location.pathname;
  const observer = new MutationObserver(() => {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname;
      trackPageView();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Track form submissions
  document.addEventListener('submit', function(e) {
    const form = e.target;
    if (form.tagName === 'FORM') {
      payaidTrack('form_submit', {
        formId: form.id || form.name || 'unknown',
        formAction: form.action || '',
      });
    }
  });
  
  // Track button clicks (high-intent actions)
  document.addEventListener('click', function(e) {
    const target = e.target;
    if (target.tagName === 'BUTTON' || target.tagName === 'A') {
      const text = target.textContent || target.innerText || '';
      const href = target.href || '';
      
      // High-intent keywords
      const highIntentKeywords = ['buy', 'purchase', 'order', 'sign up', 'register', 'contact', 'call', 'quote', 'demo', 'trial'];
      const isHighIntent = highIntentKeywords.some(keyword => 
        text.toLowerCase().includes(keyword) || href.toLowerCase().includes(keyword)
      );
      
      if (isHighIntent) {
        payaidTrack('high_intent_click', {
          elementText: text,
          elementHref: href,
          elementId: target.id || '',
        });
      }
    }
  });
  
  // Track time on page (after 30 seconds)
  setTimeout(function() {
    payaidTrack('time_on_page_30s', { timeOnPage: 30 });
  }, 30000);
  
  // Track scroll depth
  let maxScroll = 0;
  window.addEventListener('scroll', function() {
    const scrollPercent = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
    if (scrollPercent > maxScroll && scrollPercent >= 50) {
      maxScroll = scrollPercent;
      if (scrollPercent === 50 || scrollPercent === 75 || scrollPercent === 100) {
        payaidTrack('scroll_depth', { depth: scrollPercent });
      }
    }
  });
})();
`

  return new Response(script, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
