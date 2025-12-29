# Oracle Cloud + N8N Setup Guide (Zero Cost)

## 🎯 Goal

Deploy N8N on Oracle Cloud Free Tier to power PayAid Co-Founder multi-agent system at **₹0/month cost**.

---

## ✅ Oracle Cloud Free Tier Benefits

- **2 Always Free Compute VMs** (ARM-based, unlimited duration)
- **20 GB storage** per VM
- **100 GB block storage**
- **10 TB outbound data transfer**
- **100% free forever** (not a trial)

**Specs per VM:**
- 2 vCPUs (ARM)
- 12 GB RAM
- 100 GB storage

**Perfect for:** N8N + PostgreSQL + small databases

---

## 📋 Step 1: Sign Up for Oracle Cloud (5 minutes)

1. **Go to:** https://www.oracle.com/cloud/free/
2. **Click:** "Start for Free"
3. **Fill out form:**
   - Email
   - Password
   - Country: India
   - Name, Company
4. **Verify email**
5. **Add payment method** (won't be charged for free tier)
6. **Complete signup**

**Note:** Free tier is truly free - you won't be charged unless you upgrade.

---

## 📋 Step 2: Create Compute Instance (10 minutes)

1. **Login to Oracle Cloud Console:**
   - Go to: https://cloud.oracle.com/
   - Select your region (e.g., Mumbai, Hyderabad)

2. **Navigate to Compute:**
   - Menu → **Compute** → **Instances**

3. **Create Instance:**
   - Click **"Create Instance"**
   - **Name:** `n8n-server` (or any name)
   - **Image:** Select **"Canonical Ubuntu"** → **22.04** (Always Free Eligible)
   - **Shape:** Select **"VM.Standard.A1.Flex"** (Always Free Eligible)
     - **OCPUs:** 2
     - **Memory:** 12 GB
   - **Networking:** Use default VCN
   - **SSH Keys:** 
     - Option A: Generate new key pair (download private key)
     - Option B: Upload your existing public key
   - **Boot Volume:** 100 GB (free tier)

4. **Click "Create"**
5. **Wait 2-3 minutes** for instance to be ready

---

## 📋 Step 3: Configure Security (5 minutes)

1. **Get Public IP:**
   - In instance details, note the **Public IP address**

2. **Configure Ingress Rules:**
   - Go to instance → **Subnet** → **Security Lists**
   - Click **"Default Security List"**
   - Click **"Add Ingress Rules"**
   - Add rules:
     ```
     Source: 0.0.0.0/0
     IP Protocol: TCP
     Destination Port Range: 22 (SSH)
     Description: SSH access
     ```
     ```
     Source: 0.0.0.0/0
     IP Protocol: TCP
     Destination Port Range: 5678 (N8N)
     Description: N8N web interface
     ```
   - Click **"Add Ingress Rules"**

---

## 📋 Step 4: SSH into Instance (2 minutes)

**Windows (PowerShell):**
```powershell
# If you generated new key
ssh -i path/to/private-key ubuntu@YOUR_PUBLIC_IP

# If using existing key
ssh ubuntu@YOUR_PUBLIC_IP
```

**Linux/Mac:**
```bash
ssh -i ~/.ssh/your-key ubuntu@YOUR_PUBLIC_IP
```

---

## 📋 Step 5: Install Docker & Docker Compose (5 minutes)

Once SSH'd into the instance:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install docker.io docker-compose -y

# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in (or run: newgrp docker)
exit
# SSH back in

# Verify Docker
docker --version
docker-compose --version
```

---

## 📋 Step 6: Deploy N8N with PostgreSQL (10 minutes)

Create docker-compose file:

```bash
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: n8n-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: n8n
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-change-this-password}
      POSTGRES_DB: n8n
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U n8n"]
      interval: 10s
      timeout: 5s
      retries: 5

  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      DB_TYPE: postgresdb
      DB_POSTGRESDB_HOST: postgres
      DB_POSTGRESDB_PORT: 5432
      DB_POSTGRESDB_DATABASE: n8n
      DB_POSTGRESDB_USER: n8n
      DB_POSTGRESDB_PASSWORD: ${POSTGRES_PASSWORD:-change-this-password}
      N8N_HOST: ${N8N_HOST:-0.0.0.0}
      N8N_PORT: 5678
      N8N_PROTOCOL: http
      WEBHOOK_URL: http://${N8N_HOST}:5678/
      GENERIC_TIMEZONE: Asia/Kolkata
      TZ: Asia/Kolkata
    volumes:
      - n8n_data:/home/node/.n8n
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  postgres_data:
  n8n_data:
EOF

# Set a secure password
export POSTGRES_PASSWORD=$(openssl rand -base64 32)
export N8N_HOST=$(curl -s ifconfig.me)  # Your public IP

# Start N8N
docker-compose up -d

# Check logs
docker-compose logs -f n8n
```

**Note:** Replace `change-this-password` with a secure password.

---

## 📋 Step 7: Access N8N (2 minutes)

1. **Open browser:**
   - Go to: `http://YOUR_PUBLIC_IP:5678`

2. **First-time setup:**
   - Create admin account
   - Email: your-email@example.com
   - Password: (choose secure password)
   - Click "Continue"

3. **You're in!** 🎉

---

## 📋 Step 8: Configure N8N for PayAid Integration

### Get N8N Webhook URL

1. In N8N, go to **Settings** → **Webhooks**
2. Note your webhook URL: `http://YOUR_PUBLIC_IP:5678/webhook/`

### Add to PayAid V3 Environment Variables

```bash
# In your PayAid V3 project
vercel env add N8N_WEBHOOK_URL production
# Enter: http://YOUR_PUBLIC_IP:5678/webhook/
```

---

## 📋 Step 9: Create N8N Workflows for PayAid Agents

### Workflow 1: Co-Founder Orchestrator

1. **Create new workflow:** "COFOUNDER_ORCHESTRATOR"
2. **Add Webhook node:**
   - Method: POST
   - Path: `/cofounder`
   - Response Mode: "Respond to Webhook"
3. **Add Function node** (route to specialist):
   ```javascript
   const message = $json.body.message.toLowerCase();
   const agentId = $json.body.agentId;
   
   if (agentId) {
     return { agentId, message: $json.body.message };
   }
   
   // Auto-route based on keywords
   if (message.includes('invoice') || message.includes('payment') || message.includes('gst')) {
     return { agentId: 'finance', message: $json.body.message };
   }
   if (message.includes('lead') || message.includes('deal') || message.includes('sales')) {
     return { agentId: 'sales', message: $json.body.message };
   }
   if (message.includes('campaign') || message.includes('marketing') || message.includes('whatsapp')) {
     return { agentId: 'marketing', message: $json.body.message };
   }
   if (message.includes('employee') || message.includes('payroll') || message.includes('attendance')) {
     return { agentId: 'hr', message: $json.body.message };
   }
   
   return { agentId: 'cofounder', message: $json.body.message };
   ```
4. **Add HTTP Request node** (call PayAid API):
   - Method: POST
   - URL: `https://payaid-v3.vercel.app/api/ai/cofounder`
   - Headers: `Authorization: Bearer YOUR_JWT_TOKEN`
   - Body: JSON with `agentId` and `message`
5. **Add Respond to Webhook node:**
   - Response Body: `{{ $json }}`

### Workflow 2: Finance Agent

Similar structure but:
- Webhook path: `/finance`
- Always routes to `finance` agent
- Can add specific finance data fetching

### Repeat for other agents...

---

## 🔒 Security Best Practices

1. **Change default passwords**
2. **Use HTTPS** (set up reverse proxy with Let's Encrypt)
3. **Restrict SSH access** (use key-based auth only)
4. **Firewall rules** (only allow necessary ports)
5. **Regular updates:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   docker-compose pull && docker-compose up -d
   ```

---

## 🐛 Troubleshooting

### Can't access N8N?

1. **Check firewall rules** in Oracle Cloud
2. **Verify N8N is running:**
   ```bash
   docker-compose ps
   docker-compose logs n8n
   ```
3. **Check if port is open:**
   ```bash
   sudo netstat -tlnp | grep 5678
   ```

### N8N not starting?

1. **Check logs:**
   ```bash
   docker-compose logs n8n
   ```
2. **Verify PostgreSQL is healthy:**
   ```bash
   docker-compose logs postgres
   ```
3. **Check disk space:**
   ```bash
   df -h
   ```

### Connection issues?

1. **Test from local machine:**
   ```bash
   curl http://YOUR_PUBLIC_IP:5678
   ```
2. **Check Oracle Cloud security lists**
3. **Verify instance is running**

---

## 📊 Cost Breakdown

| Item | Cost |
|------|------|
| Oracle Cloud VM (Always Free) | ₹0 |
| N8N (Open Source) | ₹0 |
| PostgreSQL (Docker) | ₹0 |
| Storage (100 GB free) | ₹0 |
| Bandwidth (10 TB free) | ₹0 |
| **Total** | **₹0/month** ✅ |

---

## ✅ Verification Checklist

- [ ] Oracle Cloud account created
- [ ] Compute instance running
- [ ] Docker installed
- [ ] N8N accessible at http://YOUR_IP:5678
- [ ] N8N webhook URL configured in PayAid
- [ ] Test workflow created and working
- [ ] PayAid can call N8N webhooks

---

## 🎉 Next Steps

1. **Create agent workflows** in N8N (see workflow examples above)
2. **Test integration** with PayAid V3
3. **Monitor performance** and optimize
4. **Set up backups** (optional but recommended)

---

**Time to Setup:** ~30 minutes
**Cost:** ₹0/month
**Status:** Ready to Deploy

