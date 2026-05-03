'use client'

import React, { useState, useEffect } from 'react'
import { apiRequest } from '@/lib/api/client'
import './WhatsAppOneClickSetup.css'

interface QRCodeData {
  accountId: string
  businessName: string
  qrCodeUrl: string
  qrCodeText: string
  instruction: string
  status: string
}

/**
 * WhatsApp One-Click Setup Component
 *
 * 3-Step Flow:
 * 1. Form (Business Name + Phone)
 * 2. QR Code (Scan with WhatsApp)
 * 3. Success (Connected, ready to use)
 *
 * User experience: Simple, non-technical, ~2 minutes
 */
export function WhatsAppOneClickSetup() {
  // State management
  const [step, setStep] = useState<1 | 2 | 3>(1) // 1=form, 2=qr, 3=success
  const [businessName, setBusinessName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [qrData, setQrData] = useState<QRCodeData | null>(null)
  const [accountId, setAccountId] = useState('')
  const [statusCheckInterval, setStatusCheckInterval] = useState<NodeJS.Timeout | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval)
      }
    }
  }, [statusCheckInterval])

  // ========================================
  // STEP 1: Form submission
  // ========================================
  const handleConnect = async () => {
    // Clear previous errors
    setError('')

    // Validate inputs
    if (!businessName.trim()) {
      setError('Please enter your business name')
      return
    }
    if (!phoneNumber.trim()) {
      setError('Please enter your phone number')
      return
    }

    // Basic phone validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    const cleanPhone = phoneNumber.trim().startsWith('+')
      ? phoneNumber.trim()
      : '+' + phoneNumber.trim()

    if (!phoneRegex.test(cleanPhone.replace(/\s/g, ''))) {
      setError('Phone must be in format: +919876543210 or 919876543210')
      return
    }

    setLoading(true)

    try {
      // Call backend API
      const response = await apiRequest('/api/whatsapp/onboarding/quick-connect', {
        method: 'POST',
        body: JSON.stringify({
          businessName: businessName.trim(),
          primaryPhone: cleanPhone,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to connect WhatsApp. Please try again.')
      }

      // Success - move to QR step
      const data = (await response.json()) as QRCodeData
      setQrData(data)
      setAccountId(data.accountId)
      setStep(2)

      // Start polling for connection status
      pollConnectionStatus(data.accountId)
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to connect WhatsApp. Please try again.'
      setError(errorMsg)
      console.error('Setup error:', err)
    } finally {
      setLoading(false)
    }
  }

  // ========================================
  // STEP 2: Poll for QR scan
  // ========================================
  const pollConnectionStatus = (acctId: string) => {
    let pollCount = 0
    const maxPolls = 120 // 2 minutes (120 * 1 second)

    const interval = setInterval(async () => {
      pollCount++

      try {
        const response = await apiRequest(`/api/whatsapp/onboarding/${acctId}/status`)

        if (!response.ok) {
          console.warn('Status check failed (will retry)')
          return
        }

        const statusData = await response.json()

        if (statusData.status === 'active') {
          // QR scanned, WhatsApp connected!
          clearInterval(interval)
          setStatusCheckInterval(null)
          setStep(3) // Move to success
        }
      } catch (error) {
        console.warn('Status check failed (will retry):', error)
      }

      // Stop polling after max retries
      if (pollCount >= maxPolls) {
        clearInterval(interval)
        setStatusCheckInterval(null)
        setError('Connection timeout. The QR code may have expired. Please try again.')
      }
    }, 1000) // Poll every second

    setStatusCheckInterval(interval)
  }

  // ========================================
  // STEP 3: Success handler
  // ========================================
  const handleGoToInbox = () => {
    // Redirect to WhatsApp inbox page
    window.location.href = '/dashboard/whatsapp/inbox'
  }

  // ========================================
  // RENDER: STEP 1 (Form)
  // ========================================
  if (step === 1) {
    return (
      <div className="whatsapp-setup-container">
        <div className="whatsapp-setup-card">
          <div className="setup-header">
            <h2>Connect WhatsApp to PayAid</h2>
            <p className="subtitle">
              Connect your WhatsApp to start sending messages to customers directly from PayAid.
              Your setup will be automatic.
            </p>
          </div>

          {error && (
            <div className="error-banner">
              <span className="error-icon">⚠️</span>
              <span className="error-message">{error}</span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleConnect()
            }}
            className="setup-form"
          >
            {/* Business Name Input */}
            <div className="form-group">
              <label htmlFor="businessName" className="form-label">
                Business Name <span className="required">*</span>
              </label>
              <input
                id="businessName"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g., My Restaurant, XYZ Cafe, Tech Services"
                className="form-input"
                disabled={loading}
              />
            </div>

            {/* Phone Number Input */}
            <div className="form-group">
              <label htmlFor="phoneNumber" className="form-label">
                Primary Phone Number <span className="required">*</span>
              </label>
              <input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+919876543210"
                className="form-input"
                disabled={loading}
              />
              <small className="form-hint">
                Enter the WhatsApp number your customers will message
              </small>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={loading} className="btn-connect">
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Setting up...
                </>
              ) : (
                <>
                  <span className="btn-icon">→</span>
                  Connect WhatsApp
                </>
              )}
            </button>
          </form>

          {/* Trust Signals */}
          <div className="trust-signals">
            <div className="signal">
              <span className="signal-icon">✅</span>
              <span className="signal-text">Secure setup</span>
            </div>
            <div className="signal">
              <span className="signal-icon">✅</span>
              <span className="signal-text">No downloads needed</span>
            </div>
            <div className="signal">
              <span className="signal-icon">✅</span>
              <span className="signal-text">Takes 2 minutes</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ========================================
  // RENDER: STEP 2 (QR Code)
  // ========================================
  if (step === 2 && qrData) {
    return (
      <div className="whatsapp-setup-container">
        <div className="whatsapp-setup-card">
          <div className="setup-header">
            <h2>Scan QR Code with WhatsApp</h2>
            <p className="subtitle">
              Open <strong>WhatsApp</strong> on your phone and scan the code below
            </p>
          </div>

          {/* QR Code Display */}
          <div className="qr-container">
            <div className="qr-box">
              <img
                src={qrData.qrCodeUrl}
                alt="WhatsApp QR Code"
                className="qr-image"
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="instruction-banner">
            <span className="instruction-icon">ℹ️</span>
            <p className="instruction-text">
              Keep this page open while you scan the QR code on your phone
            </p>
          </div>

          {/* Status Message */}
          <div className="status-message">
            <span className="status-spinner"></span>
            <p>Waiting for you to scan the QR code...</p>
          </div>

          {/* Fallback: Manual Entry */}
          <div className="fallback-section">
            <p className="fallback-label">Can&apos;t scan? Manual code:</p>
            <code className="fallback-code">{qrData.qrCodeText}</code>
          </div>

          {/* Business Name Display */}
          <div className="business-info">
            <p>
              <strong>Business:</strong> {qrData.businessName}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ========================================
  // RENDER: STEP 3 (Success)
  // ========================================
  if (step === 3) {
    return (
      <div className="whatsapp-setup-container">
        <div className="whatsapp-setup-card">
          <div className="success-icon">✅</div>

          <div className="success-content">
            <h2>WhatsApp Connected!</h2>
            <p className="success-message">
              Your WhatsApp is now connected to PayAid. Customers can message you directly.
            </p>
          </div>

          {/* What Happens Next */}
          <div className="next-steps">
            <p className="next-steps-label">What happens next:</p>
            <ul className="next-steps-list">
              <li>
                <span className="step-icon">📬</span>
                <span className="step-text">Messages appear in your PayAid inbox</span>
              </li>
              <li>
                <span className="step-icon">💬</span>
                <span className="step-text">You can reply from PayAid directly</span>
              </li>
              <li>
                <span className="step-icon">👤</span>
                <span className="step-text">Conversations link to customer records</span>
              </li>
              <li>
                <span className="step-icon">📊</span>
                <span className="step-text">Track messages and response time</span>
              </li>
            </ul>
          </div>

          {/* CTA Button */}
          <button onClick={handleGoToInbox} className="btn-primary">
            <span className="btn-icon">→</span>
            Go to WhatsApp Inbox
          </button>

          {/* Celebrate */}
          <p className="celebrate">
            🎉 You&apos;re all set! Start messaging your customers now.
          </p>
        </div>
      </div>
    )
  }

  return null
}
