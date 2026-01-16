/**
 * Free Stack Setup Script
 * Configures and verifies all free services for voice agents
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const ENV_FILE = path.join(process.cwd(), '.env');
const ENV_EXAMPLE = path.join(process.cwd(), '.env.example');

interface ServiceStatus {
  name: string;
  url: string;
  status: 'running' | 'stopped' | 'error';
  message?: string;
}

/**
 * Check if a service is running
 */
async function checkService(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { 
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Check Docker service status
 */
function checkDockerService(serviceName: string): boolean {
  try {
    const result = execSync(`docker ps --filter "name=${serviceName}" --format "{{.Names}}"`, {
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    return result.trim() === serviceName;
  } catch (error) {
    return false;
  }
}

/**
 * Verify all free stack services
 */
async function verifyServices(): Promise<ServiceStatus[]> {
  const services: ServiceStatus[] = [];

  console.log('\n🔍 Verifying Free Stack Services...\n');

  // 1. Check Whisper (STT)
  console.log('Checking Whisper (STT)...');
  const whisperRunning = checkDockerService('payaid-speech-to-text');
  const whisperHealthy = whisperRunning 
    ? await checkService('http://localhost:7862/health')
    : false;
  
  services.push({
    name: 'Whisper (STT)',
    url: 'http://localhost:7862',
    status: whisperHealthy ? 'running' : (whisperRunning ? 'error' : 'stopped'),
    message: whisperHealthy 
      ? '✅ Running and healthy'
      : whisperRunning 
        ? '⚠️ Container running but health check failed'
        : '❌ Not running'
  });

  // 2. Check Coqui TTS
  console.log('Checking Coqui TTS...');
  const coquiRunning = checkDockerService('payaid-text-to-speech');
  const coquiHealthy = coquiRunning
    ? await checkService('http://localhost:7861/health')
    : false;
  
  services.push({
    name: 'Coqui TTS',
    url: 'http://localhost:7861',
    status: coquiHealthy ? 'running' : (coquiRunning ? 'error' : 'stopped'),
    message: coquiHealthy
      ? '✅ Running and healthy'
      : coquiRunning
        ? '⚠️ Container running but health check failed'
        : '❌ Not running'
  });

  // 3. Check Ollama
  console.log('Checking Ollama (LLM)...');
  const ollamaHealthy = await checkService('http://localhost:11434/api/tags');
  
  services.push({
    name: 'Ollama (LLM)',
    url: 'http://localhost:11434',
    status: ollamaHealthy ? 'running' : 'stopped',
    message: ollamaHealthy ? '✅ Running' : '❌ Not running'
  });

  // 4. Check AI Gateway
  console.log('Checking AI Gateway...');
  const gatewayRunning = checkDockerService('payaid-ai-gateway');
  const gatewayHealthy = gatewayRunning
    ? await checkService('http://localhost:8000/health')
    : false;
  
  services.push({
    name: 'AI Gateway',
    url: 'http://localhost:8000',
    status: gatewayHealthy ? 'running' : (gatewayRunning ? 'error' : 'stopped'),
    message: gatewayHealthy
      ? '✅ Running and healthy'
      : gatewayRunning
        ? '⚠️ Container running but health check failed'
        : '❌ Not running'
  });

  return services;
}

/**
 * Update .env file with free stack configuration
 */
function updateEnvFile() {
  console.log('\n📝 Updating .env file...\n');

  let envContent = '';
  
  // Read existing .env if it exists
  if (fs.existsSync(ENV_FILE)) {
    envContent = fs.readFileSync(ENV_FILE, 'utf-8');
  } else if (fs.existsSync(ENV_EXAMPLE)) {
    envContent = fs.readFileSync(ENV_EXAMPLE, 'utf-8');
  }

  // Add or update free stack configuration
  const freeStackConfig = `
# ============================================
# FREE STACK VOICE AGENTS CONFIGURATION
# ============================================
# Enable free stack (uses Whisper, Coqui TTS, Ollama)
USE_FREE_STACK=true

# AI Gateway Configuration
USE_AI_GATEWAY=true
AI_GATEWAY_URL=http://localhost:8000

# Ollama Configuration (Free LLM)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral:7b

# Direct Service URLs (if not using gateway)
SPEECH_TO_TEXT_URL=http://localhost:7862
TEXT_TO_SPEECH_URL=http://localhost:7861
`;

  // Check if free stack config already exists
  if (envContent.includes('USE_FREE_STACK')) {
    // Update existing config
    envContent = envContent.replace(
      /# ============================================\s*# FREE STACK.*?(?=\n# =|$)/s,
      freeStackConfig.trim()
    );
  } else {
    // Append new config
    envContent += freeStackConfig;
  }

  // Write back to .env
  fs.writeFileSync(ENV_FILE, envContent, 'utf-8');
  console.log('✅ .env file updated with free stack configuration');
}

/**
 * Start Docker services
 */
function startDockerServices() {
  console.log('\n🐳 Starting Docker services...\n');

  try {
    const composeFile = path.join(process.cwd(), 'docker-compose.ai-services.yml');
    
    if (!fs.existsSync(composeFile)) {
      console.log('⚠️ docker-compose.ai-services.yml not found');
      return false;
    }

    console.log('Starting AI services (Whisper, Coqui TTS, AI Gateway)...');
    execSync(`docker-compose -f ${composeFile} up -d`, {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    console.log('\n✅ Docker services started');
    return true;
  } catch (error) {
    console.error('❌ Failed to start Docker services:', error);
    return false;
  }
}

/**
 * Check if Ollama model is available
 */
async function checkOllamaModel(model: string = 'mistral:7b'): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (!response.ok) return false;
    
    const data = await response.json();
    const models = data.models || [];
    return models.some((m: any) => m.name.includes(model.split(':')[0]));
  } catch (error) {
    return false;
  }
}

/**
 * Main setup function
 */
async function main() {
  console.log('🚀 Free Stack Voice Agents Setup\n');
  console.log('================================\n');

  // Step 1: Update .env file
  updateEnvFile();

  // Step 2: Check if Docker services need to be started
  console.log('\n📦 Checking Docker services...');
  const whisperRunning = checkDockerService('payaid-speech-to-text');
  const coquiRunning = checkDockerService('payaid-text-to-speech');
  const gatewayRunning = checkDockerService('payaid-ai-gateway');

  if (!whisperRunning || !coquiRunning || !gatewayRunning) {
    console.log('\n⚠️ Some Docker services are not running');
    const shouldStart = process.argv.includes('--start-docker');
    
    if (shouldStart) {
      startDockerServices();
      console.log('\n⏳ Waiting 10 seconds for services to start...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    } else {
      console.log('\n💡 To start Docker services, run:');
      console.log('   docker-compose -f docker-compose.ai-services.yml up -d');
      console.log('   Or run this script with --start-docker flag');
    }
  }

  // Step 3: Check Ollama
  console.log('\n🤖 Checking Ollama...');
  const ollamaRunning = await checkService('http://localhost:11434/api/tags');
  
  if (!ollamaRunning) {
    console.log('⚠️ Ollama is not running');
    console.log('\n💡 To start Ollama:');
    console.log('   Option 1 (Docker): docker run -d -p 11434:11434 ollama/ollama');
    console.log('   Option 2 (Native): ollama serve');
    console.log('\n   Then pull a model:');
    console.log('   ollama pull mistral:7b');
  } else {
    const modelAvailable = await checkOllamaModel();
    if (!modelAvailable) {
      console.log('⚠️ Recommended model (mistral:7b) not found');
      console.log('💡 Pull it with: ollama pull mistral:7b');
    } else {
      console.log('✅ Ollama is running with model');
    }
  }

  // Step 4: Verify all services
  const services = await verifyServices();

  // Step 5: Print summary
  console.log('\n📊 Service Status Summary\n');
  console.log('================================\n');
  
  services.forEach(service => {
    const icon = service.status === 'running' ? '✅' : service.status === 'error' ? '⚠️' : '❌';
    console.log(`${icon} ${service.name}`);
    console.log(`   URL: ${service.url}`);
    console.log(`   Status: ${service.message}\n`);
  });

  const allRunning = services.every(s => s.status === 'running');
  
  if (allRunning) {
    console.log('🎉 All services are running! Free stack is ready to use.\n');
    console.log('Next steps:');
    console.log('1. Start Next.js: npm run dev');
    console.log('2. Start Telephony WebSocket: npm run dev:telephony');
    console.log('3. Test voice agent in the UI\n');
  } else {
    console.log('⚠️ Some services need attention. Please fix the issues above.\n');
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { verifyServices, updateEnvFile, startDockerServices };
