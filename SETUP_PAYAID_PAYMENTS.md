# PayAid Payments Setup Guide

## Quick Setup Checklist

- [ ] Get PayAid Payments API credentials
- [ ] Add credentials to `.env` file
- [ ] Configure webhook URL in PayAid Payments dashboard
- [ ] Run database migration
- [ ] Test payment link generation
- [ ] Test sending invoice with payment link

---

## Step 1: Get PayAid Payments Credentials

1. **Log in to PayAid Payments Dashboard**
   - Visit: https://payaidpayments.com (or your PayAid Payments portal)
   - Log in with your merchant account

2. **Navigate to API Settings**
   - Go to Settings > API Configuration
   - Or contact your PayAid Payments relationship manager

3. **Copy Required Credentials**
   - **API Key**: 36-digit merchant key (e.g., `f14e50fd-82f0-4ce0-bd4e-de924908d4ff`)
   - **SALT**: Secret key for hash calculation (KEEP SECRET!)
   - **Base URL**: Payment gateway API URL (e.g., `https://api.payaidpayments.com`)

4. **Optional: Encryption Keys** (for encrypted payment requests)
   - **Encryption Key**: For encrypting payment requests
   - **Decryption Key**: For decrypting payment responses

---

## Step 2: Configure Environment Variables

Add these to your `.env` file:

```env
# PayAid Payments - Required
PAYAID_PAYMENTS_API_KEY="f14e50fd-82f0-4ce0-bd4e-de924908d4ff"
PAYAID_PAYMENTS_SALT="your-salt-key-here"
PAYAID_PAYMENTS_BASE_URL="https://api.payaidpayments.com"
# Alternative name (both work):
PAYAID_PAYMENTS_PG_API_URL="https://api.payaidpayments.com"

# Application URL (for payment return URLs)
NEXT_PUBLIC_APP_URL="https://your-domain.com"
# In development:
# NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional: For encrypted payment requests
PAYAID_PAYMENTS_ENCRYPTION_KEY="your-encryption-key"
PAYAID_PAYMENTS_DECRYPTION_KEY="your-decryption-key"
```

**Important**: 
- Never commit `.env` file to git
- Keep SALT secret - never expose it in client-side code
- Use HTTPS URLs in production

---

## Step 3: Configure Webhook URL

1. **Log in to PayAid Payments Dashboard**
2. **Go to Settings > Webhooks** (or contact support)
3. **Set Payment Callback URL**:
   ```
   https://your-domain.com/api/payments/webhook
   ```
4. **Save Settings**

**Note**: Webhook URL must be publicly accessible (not localhost). Use ngrok for local testing:
```bash
ngrok http 3000
# Use the ngrok URL: https://xxxx.ngrok.io/api/payments/webhook
```

---

## Step 4: Run Database Migration

The Invoice model has been updated with payment tracking fields. Run:

```bash
# Generate Prisma client
npx prisma generate

# Push schema changes to database
npx prisma db push
```

**Note**: If you get a file lock error, stop the dev server first, then run the commands.

---

## Step 5: Restart Development Server

After updating `.env` file:

```bash
# Stop server (Ctrl+C)
# Then restart:
npm run dev
```

**Important**: Next.js does NOT auto-reload `.env` changes. Always restart after updating environment variables.

---

## Step 6: Test Integration

### Test 1: Generate Payment Link

1. **Create an Invoice**
   - Go to `/dashboard/invoices/new`
   - Create an invoice with a customer
   - Save the invoice

2. **Generate Payment Link**
   ```bash
   curl -X POST http://localhost:3000/api/invoices/[invoice-id]/generate-payment-link \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json"
   ```

3. **Verify Response**
   - Should return `paymentLinkUrl`
   - Check invoice in database has `paymentLinkUrl` field populated

### Test 2: Send Invoice with Payment Link

1. **Send Invoice**
   ```bash
   curl -X POST http://localhost:3000/api/invoices/[invoice-id]/send-with-payment \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"email": "customer@example.com"}'
   ```

2. **Check Email**
   - Customer should receive email with payment link
   - Payment button should be visible

### Test 3: Complete Payment

1. **Click Payment Link** in email
2. **Complete Test Payment** (use test mode)
3. **Verify Invoice Status**
   - Invoice status should update to "paid"
   - `paymentStatus` should be "paid"
   - `paymentTransactionId` should be populated

### Test 4: Webhook (Optional)

1. **Use PayAid Payments Test Tool** (if available)
2. **Send Test Webhook** to your webhook URL
3. **Check Server Logs** for webhook processing
4. **Verify Invoice Updated** in database

---

## Troubleshooting

### Error: "PayAid Payments API key and SALT must be configured"

**Solution**: 
- Check `.env` file has `PAYAID_PAYMENTS_API_KEY` and `PAYAID_PAYMENTS_SALT`
- Restart dev server after adding variables

### Error: "Invalid hash" or "Hash mismatch"

**Solution**:
- Verify SALT is correct (copy-paste from dashboard)
- Check for extra spaces or quotes in `.env` file
- Ensure SALT is not exposed in client-side code

### Payment Link Not Generated

**Solution**:
- Check invoice has a customer assigned
- Verify invoice total > 0
- Check API credentials are correct
- Review server logs for detailed error

### Webhook Not Working

**Solution**:
- Verify webhook URL is publicly accessible
- Check webhook URL is configured in PayAid Payments dashboard
- Use ngrok for local testing
- Check server logs for webhook errors
- Verify hash verification is working

### Email Not Sending

**Solution**:
- Check `SENDGRID_API_KEY` is configured
- Verify customer email is valid
- Check background job queue is running
- Review job logs for errors

---

## Production Checklist

Before going live:

- [ ] Use production PayAid Payments API credentials (not test)
- [ ] Set `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Configure webhook URL with production domain
- [ ] Enable HTTPS (required for payment return URLs)
- [ ] Test payment flow end-to-end
- [ ] Monitor webhook logs
- [ ] Set up error alerts
- [ ] Document payment process for support team

---

## Security Best Practices

1. **Never expose SALT**:
   - ❌ Don't include in client-side code
   - ❌ Don't commit to git
   - ❌ Don't log in console
   - ✅ Only use in server-side code

2. **Verify Webhook Signatures**:
   - Always verify hash in webhook handler
   - Reject requests with invalid signatures

3. **Use HTTPS**:
   - Required for payment return URLs
   - Required for webhook endpoints

4. **Monitor Transactions**:
   - Log all payment attempts
   - Alert on suspicious activity
   - Review failed payments regularly

---

## Support

For PayAid Payments API issues:
- Check: `PAYAID_PAYMENTS_INTEGRATION.md` for detailed API docs
- Contact: PayAid Payments support team
- Reference: Payment Gateway Integration Guide PDF

For integration issues:
- Check server logs
- Review `PAYAID_PAYMENTS_INTEGRATION.md`
- Check `HANDOVER.md` for development quirks

---

**Last Updated:** December 20, 2025
