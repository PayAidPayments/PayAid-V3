#!/bin/bash
# Free Stack Voice Agents - Startup Script
# Automates starting all required services

set -e

echo "🚀 Starting Free Stack Voice Agents..."
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check Docker
echo "📦 Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running${NC}"
    echo "Please start Docker Desktop and try again"
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Step 2: Start Docker services
echo "🐳 Starting Docker services (Whisper, Coqui TTS, AI Gateway)..."
docker-compose -f docker-compose.ai-services.yml up -d

echo ""
echo "⏳ Waiting 30 seconds for services to initialize..."
sleep 30
echo ""

# Step 3: Check Ollama
echo "🤖 Checking Ollama..."
if curl -s http://localhost:11434/api/tags > /dev/null; then
    echo -e "${GREEN}✅ Ollama is running${NC}"
else
    echo -e "${YELLOW}⚠️ Ollama is not running${NC}"
    echo "Starting Ollama in Docker..."
    docker run -d -p 11434:11434 --name ollama ollama/ollama 2>/dev/null || echo "Ollama container may already exist"
    echo "Waiting 10 seconds for Ollama to start..."
    sleep 10
fi
echo ""

# Step 4: Verify services
echo "🔍 Verifying services..."
echo ""

# Check Whisper
if curl -s http://localhost:7862/health > /dev/null; then
    echo -e "${GREEN}✅ Whisper (STT) - Running${NC}"
else
    echo -e "${YELLOW}⚠️ Whisper (STT) - Starting... (may take a few minutes)${NC}"
fi

# Check Coqui TTS
if curl -s http://localhost:7861/health > /dev/null; then
    echo -e "${GREEN}✅ Coqui TTS - Running${NC}"
else
    echo -e "${YELLOW}⚠️ Coqui TTS - Starting... (may take a few minutes)${NC}"
fi

# Check AI Gateway
if curl -s http://localhost:8000/health > /dev/null; then
    echo -e "${GREEN}✅ AI Gateway - Running${NC}"
else
    echo -e "${YELLOW}⚠️ AI Gateway - Starting...${NC}"
fi

# Check Ollama
if curl -s http://localhost:11434/api/tags > /dev/null; then
    echo -e "${GREEN}✅ Ollama (LLM) - Running${NC}"
else
    echo -e "${RED}❌ Ollama (LLM) - Not running${NC}"
fi

echo ""
echo "========================================"
echo -e "${GREEN}🎉 Free Stack startup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Run: npm run dev"
echo "2. Run: npm run dev:telephony"
echo "3. Test voice agent in the UI"
echo ""
echo "To check service status: npm run setup:free-stack"
echo ""
