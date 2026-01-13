/**
 * Port and Host Detection Module
 * Automatically finds available ports and detects the best host
 */

const net = require('net');
const os = require('os');

/**
 * Find an available port starting from a preferred port
 * @param {number} preferredPort - Port to try first (default: 3001)
 * @param {string} host - Host to bind to (default: 'localhost')
 * @returns {Promise<number>} - First available port
 */
async function findAvailablePort(preferredPort = 3001, host = 'localhost') {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.listen(preferredPort, host, () => {
      const port = server.address().port;
      server.close(() => {
        console.log(`✅ Port ${port} is available`);
        resolve(port);
      });
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`⚠️  Port ${preferredPort} in use, trying next...`);
        // Try next port recursively
        findAvailablePort(preferredPort + 1, host)
          .then(resolve)
          .catch(reject);
      } else if (err.code === 'EADDRNOTAVAIL') {
        console.error(`❌ Host ${host} not available`);
        // Fall back to localhost
        findAvailablePort(preferredPort, 'localhost')
          .then(resolve)
          .catch(reject);
      } else {
        reject(err);
      }
    });
  });
}

/**
 * Detect the best host based on environment
 * - Docker: 0.0.0.0 (listen on all interfaces)
 * - WSL/VM: 127.0.0.1 (explicit localhost)
 * - Local Dev: localhost (hostname)
 */
function getBestHost() {
  // Check if running in Docker
  if (process.env.DOCKER === 'true' || process.env.NODE_ENV === 'docker') {
    return '0.0.0.0';
  }

  // For VM access from physical machine: listen on all interfaces
  if (process.env.LISTEN_ALL === 'true') {
    return '0.0.0.0';
  }

  // Default for local development
  return 'localhost';
}

/**
 * Get external IP address for network access
 * Useful for accessing from other machines on the network
 */
function getExternalIP() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  return 'localhost';
}

/**
 * Get hostname for user-friendly display
 */
function getDisplayHost(host) {
  if (host === '0.0.0.0') {
    return 'all interfaces (0.0.0.0)';
  }
  if (host === '127.0.0.1') {
    return 'localhost (127.0.0.1)';
  }
  return host;
}

module.exports = {
  findAvailablePort,
  getBestHost,
  getExternalIP,
  getDisplayHost
};