# PayAid Payments Integration - Complete ✅

## Overview

This document describes the complete PayAid Payments gateway integration for invoice payments. Customers can pay invoices directly via email payment links, and all payment statuses are tracked in real-time.

---

## Features Implemented

### ✅ Payment Link Generation
- Generate secure payment links for invoices
- Links expire after 7 days (configurable)
- Unique UUID for each payment request

### ✅ Email Integration
- Send invoices via email with payment links
- Professional email templates
- Payment button prominently displayed

### ✅ Payment Status Tracking
- Real-time payment status updates (pending, paid, failed, cancelled)
- Track when payment links are opened
- Track payment method and channel
- Automatic invoice status updates

### ✅ Webhook Support
- Server-to-server payment status callbacks
- Secure hash verification
- Automatic invoice updates on payment

### ✅ Customer Return URLs
- Success page after payment
- Failure page for failed payments
- Cancellation page for cancelled payments

---

## API Endpoints

### 1. Generate Payment Link
**POST** `/api/invoices/[id]/generate-payment-link`

Generates a PayAid Payments link for an invoice.

**Response:**
```json
{
  "paymentLinkUrl": "https://pg-api-url/v2/executepaymentrequesturl/uuid",
  "uuid": "uuid-string",
  "expiryDatetime": "2025-12-27 16:38:36",
  "invoice": {
    "id": "invoice-id",
    "invoiceNumber": "INV-XXX-00001",
    "status": "sent",
    "paymentStatus": "pending"
  }
}
```

### 2. Send Invoice with Payment Link
**POST** `/api/invoices/[id]/send-with-payment`

Generates payment link and sends invoice via email.

**Request Body:**
```json
{
  "email": "customer@example.com" // Optional, uses customer email if not provided
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invoice sent with payment link",
  "paymentLinkUrl": "https://...",
  "invoice": { ... }
}
```

### 3. Payment Webhook
**POST** `/api/payments/webhook`

Receives payment status updates from PayAid Payments.

**Note:** Configure this URL in your PayAid Payments dashboard as the "Payment Callback URL".

### 4. Payment Callback URLs
- **Success:** `/api/payments/callback/success?invoice_id=xxx`
- **Failure:** `/api/payments/callback/failure?invoice_id=xxx`
- **Cancel:** `/api/payments/callback/cancel?invoice_id=xxx`

### 5. Track Payment Link Opens
**POST** `/api/invoices/[id]/track-payment-link`

Tracks when payment link is opened (called from frontend).

---

## Database Schema Updates

The `Invoice` model now includes:

```prisma
// Payment Gateway Integration (PayAid Payments)
paymentLinkUrl      String?   // Payment link URL
paymentLinkUuid     String?   // UUID from getpaymentrequesturl API
paymentLinkExpiry   DateTime? // When payment link expires
paymentTransactionId String?  // Transaction ID from PayAid Payments
paymentStatus       String?  // pending, paid, failed, cancelled
paymentMode         String?  // credit_card, debit_card, netbanking, upi, etc.
paymentChannel      String?  // Visa, HDFC Bank, etc.
paymentDatetime     DateTime? // When payment was made
paymentLinkOpenedAt DateTime? // When customer opened payment link
paymentLinkOpenedCount Int @default(0) // How many times link was opened
```

---

## Environment Variables

Add these to your `.env` file:

```env
# PayAid Payments Configuration
PAYAID_PAYMENTS_API_KEY=your-36-digit-api-key
PAYAID_PAYMENTS_SALT=your-salt-key
PAYAID_PAYMENTS_BASE_URL=https://your-pg-api-url.com
PAYAID_PAYMENTS_PG_API_URL=https://your-pg-api-url.com  # Alternative name

# Optional: For encrypted payment requests
PAYAID_PAYMENTS_ENCRYPTION_KEY=your-encryption-key
PAYAID_PAYMENTS_DECRYPTION_KEY=your-decryption-key

# Application URL (for return URLs)
NEXT_PUBLIC_APP_URL=https://your-domain.com
# Or use VERCEL_URL in production
```

---

## Setup Instructions

### 1. Get PayAid Payments Credentials

1. Log in to your PayAid Payments dashboard
2. Navigate to API Settings
3. Copy:
   - API Key (36-digit)
   - SALT (for hash calculation)
   - Base URL (pg_api_url)

### 2. Configure Environment Variables

Add credentials to `.env` file (see above).

### 3. Configure Webhook URL

In PayAid Payments dashboard:
1. Go to Settings > Webhooks
2. Set "Payment Callback URL" to:
   ```
   https://your-domain.com/api/payments/webhook
   ```

### 4. Run Database Migration

```bash
npx prisma db push
```

This will add the new payment tracking fields to the Invoice model.

### 5. Test Integration

1. Create an invoice
2. Generate payment link: `POST /api/invoices/[id]/generate-payment-link`
3. Send invoice with payment: `POST /api/invoices/[id]/send-with-payment`
4. Check email for payment link
5. Click payment link and complete test payment
6. Verify invoice status updates to "paid"

---

## Usage Examples

### Generate Payment Link

```typescript
const response = await fetch(`/api/invoices/${invoiceId}/generate-payment-link`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
})

const { paymentLinkUrl } = await response.json()
```

### Send Invoice with Payment Link

```typescript
const response = await fetch(`/api/invoices/${invoiceId}/send-with-payment`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'customer@example.com', // Optional
  }),
})
```

### Check Payment Status

```typescript
const invoice = await fetch(`/api/invoices/${invoiceId}`, {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
}).then(r => r.json())

console.log('Payment Status:', invoice.paymentStatus)
console.log('Payment Link Opened:', invoice.paymentLinkOpenedCount, 'times')
```

---

## Payment Status Flow

```
1. Invoice Created → status: "draft"
2. Payment Link Generated → status: "sent", paymentStatus: "pending"
3. Customer Opens Link → paymentLinkOpenedCount++, paymentLinkOpenedAt updated
4. Customer Pays → Webhook received → status: "paid", paymentStatus: "paid"
5. Customer Redirected → Success page shown
```

---

## Security Features

✅ **Hash Verification**: All webhook responses verified using SHA512 hash  
✅ **Tenant Isolation**: All queries filter by tenantId  
✅ **Secure Return URLs**: HTTPS required in production  
✅ **Link Expiry**: Payment links expire after 7 days  
✅ **Transaction Tracking**: Unique transaction IDs for all payments  

---

## Troubleshooting

### Payment Link Not Generated

**Issue:** API returns error when generating payment link

**Solutions:**
- Check `PAYAID_PAYMENTS_API_KEY` and `PAYAID_PAYMENTS_SALT` are set
- Verify `PAYAID_PAYMENTS_BASE_URL` is correct
- Check invoice has a customer assigned
- Ensure invoice total > 0

### Webhook Not Receiving Updates

**Issue:** Payment completed but invoice status not updated

**Solutions:**
- Verify webhook URL is configured in PayAid Payments dashboard
- Check webhook URL is accessible (not localhost)
- Verify hash verification is working (check logs)
- Check server logs for webhook errors

### Email Not Sending

**Issue:** Invoice email not received

**Solutions:**
- Check `SENDGRID_API_KEY` is configured
- Verify customer email is valid
- Check SendGrid account status
- Review background job logs

---

## Integration Checklist

- [x] Database schema updated
- [x] Payment link generation API
- [x] Email sending with payment link
- [x] Webhook endpoint for payment status
- [x] Customer return URLs (success/failure/cancel)
- [x] Payment status tracking
- [x] Link open tracking
- [x] Hash verification
- [x] Background job processor
- [x] Email template with payment button

---

## Next Steps

1. **Add Payment Status UI**: Update invoice detail page to show payment status
2. **Payment History**: Show payment transaction history
3. **Payment Reminders**: Send reminders for unpaid invoices
4. **Refund Support**: Add refund API integration
5. **Payment Analytics**: Track payment success rates, methods, etc.

---

**Last Updated:** December 20, 2025  
**Status:** ✅ Complete and Ready for Testing
