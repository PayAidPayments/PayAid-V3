# PayAid V3 - Setup Guide for New Features

**Date:** December 29, 2025  
**Features:** Retail Loyalty, Manufacturing Suppliers/Scheduling, Email Bounce Handling, SMS Integration

---

## 📋 **Step 1: Database Migration**

Run the Prisma migration to add all new database models:

**Quick Setup (Automated):**
```bash
# Linux/Mac
./scripts/setup-new-features.sh

# Windows (PowerShell)
.\scripts\setup-new-features.ps1
```

**Manual Setup:**
```bash
# Generate migration
npx prisma migrate dev --name add_loyalty_supplier_email_sms_models

# Generate Prisma client
npx prisma generate
```

**What this adds:**
- LoyaltyProgram, LoyaltyPoints, LoyaltyTransaction tables
- Supplier, ProductionSchedule tables
- EmailBounce table
- SMSTemplate, SMSDeliveryReport, SMSOptOut tables

---

## 🔧 **Step 2: Environment Variables**

Add these to your `.env` file (see `.env.example` for template):

### **Required for Email Bounce Handling:**
```env
SENDGRID_API_KEY="SG.your-sendgrid-api-key"
SENDGRID_FROM_EMAIL="noreply@yourdomain.com"
```

### **Required for SMS Integration (choose one):**
```env
# Option 1: Twilio
TWILIO_ACCOUNT_SID="your_twilio_account_sid"
TWILIO_AUTH_TOKEN="your_twilio_auth_token"
TWILIO_PHONE_NUMBER="+1234567890"

# Option 2: Exotel
EXOTEL_API_KEY="your_exotel_api_key"
EXOTEL_API_TOKEN="your_exotel_api_token"
EXOTEL_SID="your_exotel_sid"
```

### **Optional - Gmail API:**
```env
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

---

## 📧 **Step 3: SendGrid Webhook Setup**

### **3.1 Create Webhook in SendGrid**

1. Log in to [SendGrid Dashboard](https://app.sendgrid.com)
2. Go to **Settings** → **Mail Settings** → **Event Webhook**
3. Click **Create Webhook**
4. Configure:
   - **HTTP POST URL:** `https://your-domain.com/api/email/bounces/webhook`
   - **HTTP POST URL Test:** (optional) Test endpoint
   - **Events to Track:**
     - ✅ **Bounce** - Hard and soft bounces
     - ✅ **Dropped** - Messages dropped by SendGrid
     - ✅ **Blocked** - Messages blocked by SendGrid
     - ✅ **Spam Report** - Recipient marked as spam
     - ✅ **Unsubscribe** - Recipient unsubscribed

5. Click **Save**

### **3.2 Verify Webhook**

SendGrid will send a test event. Check your logs to verify it's received.

**Note:** The webhook endpoint doesn't require authentication (SendGrid uses IP whitelisting). For production, consider adding:
- IP whitelist verification
- Signature verification (if SendGrid provides it)

---

## 📱 **Step 4: SMS Provider Webhook Setup**

### **4.1 Twilio Webhook Setup**

1. Log in to [Twilio Console](https://console.twilio.com)
2. Go to **Phone Numbers** → **Manage** → **Active Numbers**
3. Click on your phone number
4. Scroll to **Messaging Configuration**
5. Set **A MESSAGE COMES IN** webhook:
   - URL: `https://your-domain.com/api/sms/delivery-reports/webhook?provider=twilio`
   - Method: `POST`
6. Scroll to **Status Callback URL**:
   - URL: `https://your-domain.com/api/sms/delivery-reports/webhook?provider=twilio`
   - Method: `POST`
7. Click **Save**

**Alternative:** Configure via API:
```bash
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/IncomingPhoneNumbers/{PhoneNumberSid}.json" \
  -d "SmsUrl=https://your-domain.com/api/sms/delivery-reports/webhook?provider=twilio" \
  -d "StatusCallback=https://your-domain.com/api/sms/delivery-reports/webhook?provider=twilio" \
  -u "{AccountSid}:{AuthToken}"
```

### **4.2 Exotel Webhook Setup**

1. Log in to [Exotel Dashboard](https://my.exotel.com)
2. Go to **Settings** → **Webhooks**
3. Click **Add Webhook**
4. Configure:
   - **Webhook URL:** `https://your-domain.com/api/sms/delivery-reports/webhook?provider=exotel`
   - **Events:**
     - ✅ SMS Sent
     - ✅ SMS Delivered
     - ✅ SMS Failed
5. Click **Save**

**Note:** Exotel may require webhook authentication. Check Exotel documentation for signature verification.

---

## ✅ **Step 5: Verify Setup**

### **5.1 Test Email Bounce Handling**

1. Send a test email to an invalid address (e.g., `invalid@example.com`)
2. Check SendGrid dashboard for bounce event
3. Verify bounce appears in: `GET /api/email/bounces`

### **5.2 Test SMS Sending**

```bash
curl -X POST https://your-domain.com/api/sms/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "to": "+1234567890",
    "message": "Test SMS from PayAid",
    "provider": "twilio"
  }'
```

### **5.3 Test SMS Delivery Reports**

1. Send an SMS via the API
2. Check webhook logs for delivery status updates
3. Verify report in: `GET /api/sms/delivery-reports`

### **5.4 Test Opt-Out**

```bash
# Add to opt-out
curl -X POST https://your-domain.com/api/sms/opt-out \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "phoneNumber": "+1234567890",
    "reason": "user_request"
  }'

# Try sending SMS - should fail with "Phone number is opted out"
```

---

## 🔍 **Troubleshooting**

### **Webhook Not Receiving Events**

1. **Check URL is accessible:**
   ```bash
   curl https://your-domain.com/api/email/bounces/webhook
   # Should return: {"message":"Email bounce webhook endpoint"}
   ```

2. **Check logs:**
   - SendGrid: Check webhook delivery logs in dashboard
   - Twilio: Check webhook logs in console
   - Exotel: Check webhook logs in dashboard

3. **Verify HTTPS:** Webhooks require HTTPS (not HTTP)

4. **Check firewall:** Ensure your server accepts POST requests from provider IPs

### **SMS Not Sending**

1. **Check credentials:**
   ```bash
   # Verify environment variables are set
   echo $TWILIO_ACCOUNT_SID
   echo $EXOTEL_API_KEY
   ```

2. **Check provider status:**
   - Twilio: Verify account is active and has credits
   - Exotel: Verify account is active

3. **Check opt-out list:**
   - Phone number might be in opt-out list
   - Remove via: `POST /api/sms/opt-out/[id]/remove`

### **Email Bounces Not Tracking**

1. **Verify SendGrid webhook is active:**
   - Check SendGrid dashboard → Settings → Event Webhook

2. **Check webhook URL:**
   - Must be publicly accessible
   - Must use HTTPS

3. **Check database:**
   ```sql
   SELECT * FROM "EmailBounce" ORDER BY "createdAt" DESC LIMIT 10;
   ```

---

## 📚 **Additional Resources**

- **SendGrid Webhook Docs:** https://docs.sendgrid.com/for-developers/tracking-events/event
- **Twilio Webhook Docs:** https://www.twilio.com/docs/usage/webhooks
- **Exotel Webhook Docs:** https://developer.exotel.com/api-docs/webhooks

---

## 🎯 **Next Steps After Setup**

1. **Create Loyalty Programs:**
   - `POST /api/industries/retail/loyalty/programs`

2. **Add Suppliers:**
   - `POST /api/industries/manufacturing/suppliers`

3. **Create SMS Templates:**
   - `POST /api/sms/templates`

4. **Create Email Templates:**
   - `POST /api/email/templates`

---

**Last Updated:** December 29, 2025
