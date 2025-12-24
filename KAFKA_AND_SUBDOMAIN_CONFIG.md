# Kafka Usage & Subdomain Configuration

## 🔍 Kafka Usage

### **Kafka is NOT used in PayAid V3**

The project uses **Redis + Bull.js** for background job processing and message queuing, not Kafka.

### Current Queue System

**Technology Stack:**
- **Redis** - In-memory data store for caching and queues
- **Bull.js** - Job queue library built on Redis
- **Three Priority Levels:**
  - `highPriorityQueue` - Critical jobs (payment processing, etc.)
  - `mediumPriorityQueue` - Standard jobs (emails, notifications)
  - `lowPriorityQueue` - Background tasks (reports, analytics)

**Location:** `lib/queue/bull.ts`

### Why Bull.js Instead of Kafka?

1. **Simplicity** - Easier to set up and maintain for most use cases
2. **Redis Integration** - Already using Redis for caching
3. **Built-in Features** - Retry logic, job priorities, rate limiting
4. **Lower Overhead** - No need for separate Kafka infrastructure
5. **Sufficient Scale** - Handles 100-500 concurrent users effectively

### When Would You Need Kafka?

Kafka would be beneficial if you need:
- **Event Streaming** - Real-time event processing
- **High Throughput** - Millions of messages per second
- **Event Sourcing** - Complete event history
- **Multiple Consumers** - Many services consuming same events
- **Distributed Systems** - Microservices architecture

**Current Scale:** Bull.js + Redis is sufficient for PayAid V3's needs.

---

## 🌐 Subdomain Domain Configuration

### Making the Domain Configurable

The subdomain domain (currently `.payaid.com`) is now **configurable via environment variable**.

### Configuration

**Environment Variable:**
```env
NEXT_PUBLIC_SUBDOMAIN_DOMAIN="payaid.com"
```

**Default:** If not set, defaults to `payaid.com`

### How to Change the Domain

1. **Update `.env` file:**
   ```env
   NEXT_PUBLIC_SUBDOMAIN_DOMAIN="yourdomain.com"
   ```

2. **Restart the development server:**
   ```bash
   npm run dev
   ```

3. **For production:**
   - Update the environment variable in your hosting platform
   - Redeploy the application

### Where It's Used

- **Registration Form** (`app/register/page.tsx`)
  - Displays: `subdomain.yourdomain.com`
  - Example: `mycompany.yourdomain.com`

### Important Notes

⚠️ **DNS Configuration Required:**
- You'll need to configure DNS wildcard records for subdomains
- Example: `*.yourdomain.com` → Your server IP
- This allows any subdomain to route to your application

⚠️ **Multi-Tenant Routing:**
- The application needs to handle subdomain-based routing
- Currently, subdomains are stored in the database but routing logic may need updates

### Future Enhancements

If you need to support multiple domains or white-labeling:
1. Store domain per tenant in database
2. Update routing middleware to handle custom domains
3. Add domain validation during registration

---

## 📋 Summary

| Question | Answer |
|----------|--------|
| **Is Kafka used?** | ❌ No - Uses Redis + Bull.js instead |
| **Can domain be changed?** | ✅ Yes - Via `NEXT_PUBLIC_SUBDOMAIN_DOMAIN` env variable |
| **Where is it configured?** | `.env` file |
| **Default domain?** | `payaid.com` |
| **Requires restart?** | Yes, after changing env variable |

---

**Status:** ✅ Subdomain domain is now configurable!
