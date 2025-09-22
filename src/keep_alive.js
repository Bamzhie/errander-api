const https = require('https');
const http = require('http');

// Replace with your actual Render service URL
const SERVICE_URL = 'https://errander-api.onrender.com';

// Health check endpoint (adjust if you have a different health check route)
const HEALTH_ENDPOINT = '/health';

// Ping interval: 14 minutes (just under Render's 15-minute timeout)
const PING_INTERVAL = 14 * 60 * 1000;

function pingService() {
  const url = new URL(SERVICE_URL + HEALTH_ENDPOINT);
  const client = url.protocol === 'https:' ? https : http;
  
  const startTime = Date.now();
  
  const req = client.get(url, (res) => {
    const duration = Date.now() - startTime;
    const timestamp = new Date().toISOString();
    
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log(`[${timestamp}] ✅ Keep-alive ping successful - Status: ${res.statusCode}, Duration: ${duration}ms`);
    } else {
      console.log(`[${timestamp}] ⚠️  Keep-alive ping returned status: ${res.statusCode}, Duration: ${duration}ms`);
    }
    
    // Consume response data to free up memory
    res.resume();
  });
  
  req.on('error', (err) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ❌ Keep-alive ping failed:`, err.message);
  });
  
  req.on('timeout', () => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ⏰ Keep-alive ping timed out`);
    req.destroy();
  });
  
  // Set a 30-second timeout
  req.setTimeout(30000);
  
  req.end();
}

// Start the keep-alive service
function startKeepAlive() {
  console.log('🚀 Keep-alive service starting...');
  console.log(`📍 Target URL: ${SERVICE_URL}${HEALTH_ENDPOINT}`);
  console.log(`⏱️  Ping interval: ${PING_INTERVAL / 1000 / 60} minutes`);
  
  // Ping immediately on startup
  pingService();
  
  // Set up recurring pings
  const interval = setInterval(pingService, PING_INTERVAL);
  
  // Graceful shutdown handling
  process.on('SIGTERM', () => {
    console.log('📴 Keep-alive service shutting down...');
    clearInterval(interval);
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    console.log('📴 Keep-alive service shutting down...');
    clearInterval(interval);
    process.exit(0);
  });
}

// Only run if this file is executed directly
if (require.main === module) {
  startKeepAlive();
}

module.exports = { startKeepAlive, pingService };