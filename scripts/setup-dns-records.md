# DNS Configuration Guide

**Date:** December 2025  
**Purpose:** Configure DNS records for module subdomains

---

## 🌐 **DNS Records Required**

### **Main Domain**
```
Type: A
Name: @
Value: <Core Server IP>
TTL: 3600
```

### **Module Subdomains**
```
Type: CNAME
Name: crm
Value: payaid.io
TTL: 3600

Type: CNAME
Name: finance
Value: payaid.io
TTL: 3600

Type: CNAME
Name: hr
Value: payaid.io
TTL: 3600

Type: CNAME
Name: marketing
Value: payaid.io
TTL: 3600

Type: CNAME
Name: whatsapp
Value: payaid.io
TTL: 3600

Type: CNAME
Name: analytics
Value: payaid.io
TTL: 3600

Type: CNAME
Name: ai
Value: payaid.io
TTL: 3600

Type: CNAME
Name: communication
Value: payaid.io
TTL: 3600
```

---

## 🔧 **Provider-Specific Instructions**

### **Cloudflare**

1. Log in to Cloudflare Dashboard
2. Select your domain (payaid.io)
3. Go to DNS → Records
4. Add CNAME records for each subdomain:
   - Name: `crm`
   - Target: `payaid.io`
   - Proxy status: Proxied (for SSL)
   - TTL: Auto

### **AWS Route 53**

1. Log in to AWS Console
2. Go to Route 53 → Hosted Zones
3. Select your domain
4. Create Record Set:
   - Name: `crm`
   - Type: CNAME
   - Value: `payaid.io`
   - TTL: 300

### **Google Domains**

1. Log in to Google Domains
2. Go to DNS → Custom resource records
3. Add CNAME record:
   - Name: `crm`
   - Data: `payaid.io`
   - TTL: 3600

---

## 🔐 **SSL Certificates**

### **Automatic SSL (Recommended)**

If using Cloudflare or Vercel:
- SSL certificates are automatically provisioned
- No manual configuration needed

### **Manual SSL (Let's Encrypt)**

1. Install certbot:
   ```bash
   sudo apt-get install certbot
   ```

2. Generate certificate:
   ```bash
   sudo certbot certonly --dns-cloudflare \
     -d crm.payaid.io \
     -d finance.payaid.io \
     -d hr.payaid.io \
     # ... other subdomains
   ```

3. Configure web server (Nginx/Apache) to use certificates

---

## ✅ **Verification**

After configuring DNS, verify records:

```bash
# Check DNS resolution
dig crm.payaid.io
nslookup crm.payaid.io

# Check SSL certificate
openssl s_client -connect crm.payaid.io:443 -servername crm.payaid.io
```

---

## 📋 **Checklist**

- [ ] Configure A record for main domain
- [ ] Configure CNAME records for all subdomains
- [ ] Verify DNS propagation (can take up to 48 hours)
- [ ] Set up SSL certificates
- [ ] Test subdomain access
- [ ] Verify SSL certificates
- [ ] Test OAuth2 SSO across subdomains

---

**Status:** ⏳ **READY FOR CONFIGURATION**  
**Next:** Configure DNS records in your DNS provider

