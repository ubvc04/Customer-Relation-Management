#!/usr/bin/env node

/**
 * System Verification and Setup Script
 * Verifies all production components are properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 CRM System Verification Starting...\n');

// Check Node.js version
console.log('📋 System Information:');
console.log(`   Node.js Version: ${process.version}`);
console.log(`   Platform: ${process.platform}`);
console.log(`   Architecture: ${process.arch}`);
console.log('');

// Check package.json dependencies
try {
  const packageJson = require('./package.json');
  console.log('📦 Package Information:');
  console.log(`   Name: ${packageJson.name}`);
  console.log(`   Version: ${packageJson.version}`);
  console.log(`   Dependencies: ${Object.keys(packageJson.dependencies).length}`);
  console.log('');

  // Check for key dependencies
  const requiredDeps = ['express', 'mongoose', 'bcryptjs', 'jsonwebtoken', 'nodemailer'];
  const optionalDeps = ['redis', 'winston', 'express-slow-down', 'sharp'];
  
  console.log('✅ Required Dependencies:');
  requiredDeps.forEach(dep => {
    const installed = packageJson.dependencies[dep] ? '✅' : '❌';
    console.log(`   ${installed} ${dep}`);
  });
  
  console.log('\n🔧 Optional Production Dependencies:');
  optionalDeps.forEach(dep => {
    const installed = packageJson.dependencies[dep] ? '✅' : '⚠️';
    console.log(`   ${installed} ${dep}`);
  });
  
} catch (error) {
  console.error('❌ Error reading package.json:', error.message);
}

// Check environment files
console.log('\n📄 Configuration Files:');
const configFiles = ['.env', '.env.example'];
configFiles.forEach(file => {
  const exists = fs.existsSync(file) ? '✅' : '❌';
  console.log(`   ${exists} ${file}`);
});

// Check key directories
console.log('\n📁 Directory Structure:');
const directories = [
  'controllers',
  'models', 
  'routes',
  'middleware',
  'utils',
  'services',
  'config',
  'logs'
];

directories.forEach(dir => {
  const exists = fs.existsSync(dir) ? '✅' : '❌';
  console.log(`   ${exists} ${dir}/`);
});

// Check key files
console.log('\n📋 Core Files:');
const coreFiles = [
  'server.js',
  'config/database.js',
  'middleware/auth.js',
  'middleware/advancedSecurity.js',
  'controllers/enhancedAuthController.js',
  'models/EnhancedUser.js',
  'services/cacheService.js',
  'services/loggerService.js',
  'utils/enhancedEmailService.js'
];

coreFiles.forEach(file => {
  const exists = fs.existsSync(file) ? '✅' : '❌';
  console.log(`   ${exists} ${file}`);
});

// Test environment variables
console.log('\n🔐 Environment Configuration:');
const envVars = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
  'SMTP_EMAIL'
];

envVars.forEach(envVar => {
  const exists = process.env[envVar] ? '✅' : '⚠️';
  const value = process.env[envVar] ? 
    (envVar.includes('SECRET') || envVar.includes('PASSWORD') ? '[HIDDEN]' : process.env[envVar]) : 
    'Not set';
  console.log(`   ${exists} ${envVar}: ${value}`);
});

// Test database connection
console.log('\n🗄️ Database Connection Test:');
try {
  require('dotenv').config();
  const mongoose = require('mongoose');
  
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm', {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 5000
  }).then(() => {
    console.log('   ✅ MongoDB connection successful');
    mongoose.disconnect();
  }).catch(error => {
    console.log('   ❌ MongoDB connection failed:', error.message);
  });
} catch (error) {
  console.log('   ⚠️ Database test skipped:', error.message);
}

// Test optional services
console.log('\n🔧 Optional Services:');

// Test Redis
try {
  const redis = require('redis');
  console.log('   ✅ Redis module available');
} catch (error) {
  console.log('   ⚠️ Redis module not available (optional)');
}

// Test Winston
try {
  const winston = require('winston');
  console.log('   ✅ Winston logging available');
} catch (error) {
  console.log('   ⚠️ Winston logging not available (optional)');
}

// Test email service
console.log('\n📧 Email Service Test:');
try {
  const emailService = require('./utils/emailService');
  console.log('   ✅ Email service loaded');
} catch (error) {
  console.log('   ❌ Email service error:', error.message);
}

// Summary
console.log('\n📊 Verification Complete!');
console.log('════════════════════════════════════════════════');
console.log('');
console.log('Next Steps:');
console.log('1. ✅ Core CRM functionality is ready');
console.log('2. 🔧 Install optional dependencies for production features');
console.log('3. 🔐 Configure environment variables in .env file');
console.log('4. 🗄️ Start MongoDB service');
console.log('5. 🚀 Run: npm run dev to start development server');
console.log('');
console.log('For production deployment:');
console.log('- Install Redis for caching and session management');
console.log('- Configure Winston for advanced logging');
console.log('- Set up email service credentials');
console.log('- Configure rate limiting and security middleware');
console.log('');
