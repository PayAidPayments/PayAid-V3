#!/bin/bash

# PayAid V3 - Setup Script for New Features
# This script helps set up the new features: Loyalty, Suppliers, Email Bounce, SMS

set -e

echo "🚀 PayAid V3 - New Features Setup"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Database Migration
echo -e "${YELLOW}Step 1: Running database migration...${NC}"
if npx prisma migrate dev --name add_loyalty_supplier_email_sms_models; then
    echo -e "${GREEN}✅ Database migration completed${NC}"
else
    echo -e "${RED}❌ Database migration failed${NC}"
    exit 1
fi

echo ""

# Step 2: Generate Prisma Client
echo -e "${YELLOW}Step 2: Generating Prisma client...${NC}"
if npx prisma generate; then
    echo -e "${GREEN}✅ Prisma client generated${NC}"
else
    echo -e "${RED}❌ Prisma client generation failed${NC}"
    exit 1
fi

echo ""

# Step 3: Check Environment Variables
echo -e "${YELLOW}Step 3: Checking environment variables...${NC}"

REQUIRED_VARS=("DATABASE_URL")
OPTIONAL_VARS=("SENDGRID_API_KEY" "TWILIO_ACCOUNT_SID" "EXOTEL_API_KEY")

MISSING_REQUIRED=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_REQUIRED+=("$var")
    fi
done

if [ ${#MISSING_REQUIRED[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ Required environment variables are set${NC}"
else
    echo -e "${RED}❌ Missing required environment variables:${NC}"
    for var in "${MISSING_REQUIRED[@]}"; do
        echo -e "  - $var"
    done
    echo ""
    echo "Please set these in your .env file"
fi

MISSING_OPTIONAL=()
for var in "${OPTIONAL_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_OPTIONAL+=("$var")
    fi
done

if [ ${#MISSING_OPTIONAL[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Optional environment variables not set (features may not work):${NC}"
    for var in "${MISSING_OPTIONAL[@]}"; do
        echo -e "  - $var"
    done
    echo ""
    echo "See SETUP_GUIDE.md for configuration instructions"
fi

echo ""

# Step 4: Summary
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Configure webhooks (see SETUP_GUIDE.md):"
echo "   - SendGrid webhook for email bounces"
echo "   - Twilio/Exotel webhooks for SMS delivery reports"
echo ""
echo "2. Test the features:"
echo "   - Create a loyalty program"
echo "   - Add a supplier"
echo "   - Send a test SMS"
echo ""
echo "3. Review API documentation in COMPLETE_IMPLEMENTATION_SUMMARY.md"

