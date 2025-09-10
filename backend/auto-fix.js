#!/usr/bin/env node

/**
 * 🚀 CRM System Auto-Fix Script
 * Diagnoses and fixes common issues automatically
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

console.log('🔧 CRM System Auto-Fix Starting...\n');

// Color codes for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = (color, message) => console.log(`${colors[color]}${message}${colors.reset}`);

// Step 1: Check environment
log('blue', '📋 Step 1: Environment Check');
console.log('Node.js:', process.version);
console.log('Platform:', process.platform);
console.log('Directory:', process.cwd());

// Check if we're in the backend directory
if (!fs.existsSync('package.json')) {
  log('red', '❌ Error: Not in backend directory');
  log('yellow', '💡 Please run this script from the backend directory');
  process.exit(1);
}

// Step 2: Load environment
log('blue', '\n📋 Step 2: Loading Environment Configuration');
try {
  require('dotenv').config();
  log('green', '✅ Environment loaded');
  
  const requiredVars = ['MONGODB_URI', 'JWT_SECRET'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    log('yellow', `⚠️ Missing environment variables: ${missingVars.join(', ')}`);
  } else {
    log('green', '✅ All required environment variables set');
  }
} catch (error) {
  log('red', '❌ Error loading environment:', error.message);
}

// Step 3: Test MongoDB Connection
log('blue', '\n📋 Step 3: Testing Database Connection');
const testMongoDB = async () => {
  try {
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      bufferCommands: false
    });
    log('green', '✅ MongoDB connection successful');
    await mongoose.disconnect();
    return true;
  } catch (error) {
    log('red', '❌ MongoDB connection failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      log('yellow', '💡 Solution: Start MongoDB service');
      log('yellow', '   Windows: Start MongoDB service in Services');
      log('yellow', '   Or run: net start MongoDB');
    }
    return false;
  }
};

// Step 4: Check for port conflicts
log('blue', '\n📋 Step 4: Checking Port Availability');
const checkPort = (port) => {
  return new Promise((resolve) => {
    const server = require('net').createServer();
    server.listen(port, () => {
      server.close();
      resolve(true);
    });
    server.on('error', () => {
      resolve(false);
    });
  });
};

// Step 5: Fix common issues
const fixIssues = async () => {
  log('blue', '\n🔧 Step 5: Applying Fixes');
  
  // Fix 1: Update controllers to use EnhancedUser
  const controllersToFix = [
    'controllers/authController.js',
    'middleware/auth.js'
  ];
  
  controllersToFix.forEach(file => {
    if (fs.existsSync(file)) {
      try {
        let content = fs.readFileSync(file, 'utf8');
        if (content.includes("require('../models/User')")) {
          content = content.replace(
            "require('../models/User')",
            "require('../models/EnhancedUser')"
          );
          fs.writeFileSync(file, content);
          log('green', `✅ Fixed: ${file}`);
        }
      } catch (error) {
        log('yellow', `⚠️ Could not fix ${file}:`, error.message);
      }
    }
  });
  
  // Fix 2: Create simplified server starter
  const simpleServerContent = `
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Simple MongoDB test
app.get('/api/test-db', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      res.json({ success: true, message: 'Database connected' });
    } else {
      res.status(500).json({ success: false, message: 'Database not connected' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Start server
const server = app.listen(PORT, () => {
  console.log(\`🚀 Simple server running on port \${PORT}\`);
  console.log(\`📊 Health check: http://localhost:\${PORT}/api/health\`);
  console.log(\`🗄️ Database test: http://localhost:\${PORT}/api/test-db\`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
`;
  
  fs.writeFileSync('server-simple.js', simpleServerContent);
  log('green', '✅ Created simplified server (server-simple.js)');
};

// Main execution
const main = async () => {
  // Test database
  const dbConnected = await testMongoDB();
  
  // Check port
  const portFree = await checkPort(5000);
  if (!portFree) {
    log('yellow', '⚠️ Port 5000 is in use');
    log('blue', '💡 Try using port 5001 instead');
  } else {
    log('green', '✅ Port 5000 is available');
  }
  
  // Apply fixes
  await fixIssues();
  
  // Final recommendations
  log('blue', '\n🎯 Recommendations:');
  
  if (!dbConnected) {
    log('yellow', '1. Start MongoDB service first');
  }
  
  log('green', '2. To start the simple server: node server-simple.js');
  log('green', '3. To start the full server: npm run dev');
  log('green', '4. Test health: http://localhost:5000/api/health');
  
  log('blue', '\n✨ Auto-fix complete!');
};

main().catch(error => {
  log('red', '❌ Auto-fix failed:', error.message);
  process.exit(1);
});
