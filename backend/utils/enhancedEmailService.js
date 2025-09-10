const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;

// Email templates cache
const templateCache = new Map();

// Create reusable transporter object using SMTP transport
const createEnhancedTransporter = () => {
  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_EMAIL || process.env.EMAIL_FROM,
      pass: process.env.SMTP_PASSWORD || process.env.EMAIL_APP_PASSWORD
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateLimit: 10 // messages per second
  };

  return nodemailer.createTransporter(config);
};

// Enhanced error handling and logging
const logEmailActivity = (activity, details) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] EMAIL ${activity}:`, details);
};

// Load and cache email template
const loadTemplate = async (templateName) => {
  if (templateCache.has(templateName)) {
    return templateCache.get(templateName);
  }

  try {
    const templatePath = path.join(__dirname, '..', 'templates', 'email', `${templateName}.html`);
    const template = await fs.readFile(templatePath, 'utf8');
    templateCache.set(templateName, template);
    return template;
  } catch (error) {
    console.error(`Template ${templateName} not found, using fallback`);
    return getFallbackTemplate(templateName);
  }
};

// Fallback templates for when template files don't exist
const getFallbackTemplate = (templateName) => {
  const templates = {
    otpAdvanced: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0; padding: 20px; min-height: 100vh;
          }
          .container { 
            max-width: 600px; margin: 0 auto; 
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; padding: 40px 30px; text-align: center;
          }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .content { padding: 40px 30px; text-align: center; }
          .otp-container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; padding: 20px; border-radius: 15px;
            margin: 30px 0; display: inline-block;
          }
          .otp-code {
            font-size: 32px; font-weight: bold; letter-spacing: 8px;
            margin: 0; font-family: 'Courier New', monospace;
          }
          .message { color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0; }
          .warning {
            background: #fff3cd; border: 1px solid #ffeaa7; color: #856404;
            padding: 15px; border-radius: 10px; margin: 20px 0; font-size: 14px;
          }
          .footer {
            background: #f8f9fa; padding: 30px; text-align: center;
            color: #666; font-size: 14px;
          }
          .security-tips {
            text-align: left; background: #e8f4fd; padding: 15px;
            border-radius: 8px; margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 {{appName}}</h1>
            <p>Email Verification Required</p>
          </div>
          <div class="content">
            <p class="message">Hello <strong>{{userName}}</strong>!</p>
            <p class="message">
              Thank you for registering with {{appName}}. To complete your registration, please verify your email address using the OTP code below:
            </p>
            
            <div class="otp-container">
              <p class="otp-code">{{otpCode}}</p>
            </div>
            
            <div class="warning">
              <strong>⏰ Time Sensitive:</strong> This OTP will expire in {{expiryMinutes}} minutes for your security.
            </div>
            
            <div class="security-tips">
              <h4>🛡️ Security Guidelines:</h4>
              <ul>
                <li>Never share this OTP with anyone</li>
                <li>Our team will never ask for your OTP</li>
                <li>If you didn't request this, please ignore this email</li>
                <li>Report suspicious activity to security@{{domain}}</li>
              </ul>
            </div>
            
            <p class="message">
              If you have any questions, our support team is available 24/7 to assist you.
            </p>
          </div>
          <div class="footer">
            <p>Best regards,<br><strong>The {{appName}} Security Team</strong></p>
            <p>This is an automated message, please do not reply to this email.</p>
            <p>&copy; {{currentYear}} {{appName}}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    welcomeAdvanced: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to {{appName}}</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0; padding: 20px; min-height: 100vh;
          }
          .container { 
            max-width: 600px; margin: 0 auto; 
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; padding: 40px 30px; text-align: center;
          }
          .content { padding: 40px 30px; }
          .cta-button {
            display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; padding: 15px 30px; text-decoration: none;
            border-radius: 10px; font-weight: 600; margin: 20px 0;
          }
          .features { margin: 20px 0; }
          .feature {
            margin: 15px 0; padding: 15px; background: white;
            border-radius: 8px; border-left: 4px solid #667eea;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .stats {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white; padding: 20px; border-radius: 10px; margin: 20px 0;
            text-align: center;
          }
          .quick-start {
            background: #e8f5e8; padding: 20px; border-radius: 10px;
            border: 2px solid #4caf50; margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to {{appName}}!</h1>
            <p>Your journey to better customer management starts here</p>
          </div>
          <div class="content">
            <h2>Hello {{userName}}! 👋</h2>
            <p>Congratulations! Your email has been verified and your account is now active. You're all set to transform your customer relationships!</p>
            
            <div class="stats">
              <h3>🚀 Join 50,000+ Successful Businesses</h3>
              <p>Average 40% increase in sales conversion • 60% faster lead processing</p>
            </div>
            
            <div class="quick-start">
              <h3>🎯 Quick Start Guide (5 minutes)</h3>
              <ol>
                <li><strong>Complete your profile</strong> - Add your business details</li>
                <li><strong>Import contacts</strong> - Upload your existing customer data</li>
                <li><strong>Create your first lead</strong> - Start tracking opportunities</li>
                <li><strong>Set up automation</strong> - Save time with smart workflows</li>
              </ol>
            </div>
            
            <center>
              <a href="{{loginUrl}}" class="cta-button">🚀 Start Managing Customers</a>
            </center>
            
            <div class="features">
              <h3>✨ What you can do now:</h3>
              <div class="feature">
                <strong>📊 Smart Dashboard:</strong> Get real-time insights into your sales pipeline and customer behavior
              </div>
              <div class="feature">
                <strong>👥 Contact Management:</strong> Organize customers with advanced filtering and segmentation
              </div>
              <div class="feature">
                <strong>📈 Lead Tracking:</strong> Monitor opportunities from first contact to closing deals
              </div>
              <div class="feature">
                <strong>🤖 AI Insights:</strong> Get intelligent recommendations to boost your sales performance
              </div>
              <div class="feature">
                <strong>📱 Mobile Access:</strong> Manage your CRM on-the-go with our responsive design
              </div>
            </div>
            
            <div style="background: #f0f9ff; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h4>💡 Pro Tip:</h4>
              <p>Complete your profile setup within the next 7 days to unlock <strong>premium features for free</strong> for your first month!</p>
            </div>
            
            <p>Need help getting started? Our support team is standing by:</p>
            <ul>
              <li>📧 Email: support@{{domain}}</li>
              <li>💬 Live Chat: Available in your dashboard</li>
              <li>📚 Help Center: {{helpUrl}}</li>
              <li>🎥 Video Tutorials: {{tutorialsUrl}}</li>
            </ul>
            
            <p>Welcome aboard! We're excited to help you grow your business.</p>
            
            <p>Best regards,<br><strong>The {{appName}} Team</strong></p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  return templates[templateName] || templates.otpAdvanced;
};

// Replace template variables
const replaceTemplateVariables = (template, variables) => {
  let processedTemplate = template;
  
  // Default variables
  const defaultVars = {
    appName: process.env.APP_NAME || 'CRM Application',
    currentYear: new Date().getFullYear(),
    domain: process.env.DOMAIN || 'example.com',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
    appUrl: process.env.APP_URL || 'http://localhost:3000',
    loginUrl: `${process.env.APP_URL || 'http://localhost:3000'}/login`,
    helpUrl: `${process.env.APP_URL || 'http://localhost:3000'}/help`,
    tutorialsUrl: `${process.env.APP_URL || 'http://localhost:3000'}/tutorials`,
    expiryMinutes: process.env.OTP_EXPIRE_MINUTES || '15'
  };
  
  // Merge with provided variables
  const allVariables = { ...defaultVars, ...variables };
  
  // Replace all variables
  Object.keys(allVariables).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processedTemplate = processedTemplate.replace(regex, allVariables[key] || '');
  });
  
  return processedTemplate;
};

// Enhanced send email function
const sendEnhancedEmail = async (options) => {
  try {
    const transporter = createEnhancedTransporter();
    
    // Verify transporter configuration in production
    if (process.env.NODE_ENV === 'production') {
      await transporter.verify();
    }
    
    const mailOptions = {
      from: `"${process.env.FROM_NAME || 'CRM Application'}" <${process.env.SMTP_EMAIL || process.env.EMAIL_FROM}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      headers: {
        'X-Priority': options.priority || '3',
        'X-MSMail-Priority': options.priority === '1' ? 'High' : 'Normal',
        'X-Mailer': 'CRM-System-v2.0',
        'List-Unsubscribe': options.unsubscribeUrl ? `<${options.unsubscribeUrl}>` : undefined
      }
    };
    
    // Add attachments if provided
    if (options.attachments) {
      mailOptions.attachments = options.attachments;
    }
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    logEmailActivity('SENT', {
      messageId: info.messageId,
      to: options.to,
      subject: options.subject,
      accepted: info.accepted,
      rejected: info.rejected
    });
    
    return {
      success: true,
      messageId: info.messageId,
      message: 'Email sent successfully',
      accepted: info.accepted,
      rejected: info.rejected
    };
    
  } catch (error) {
    logEmailActivity('ERROR', {
      error: error.message,
      to: options.to,
      subject: options.subject,
      code: error.code
    });
    
    return {
      success: false,
      error: error.message,
      message: 'Failed to send email',
      code: error.code
    };
  }
};

// Enhanced OTP email with advanced template
const sendAdvancedOTPEmail = async (email, userName, otpCode) => {
  try {
    const template = getFallbackTemplate('otpAdvanced');
    const html = replaceTemplateVariables(template, {
      userName: userName || 'User',
      otpCode,
      email
    });
    
    return await sendEnhancedEmail({
      to: email,
      subject: `🔐 ${process.env.APP_NAME || 'CRM'} - Email Verification Code`,
      html,
      priority: '2' // High priority
    });
  } catch (error) {
    console.error('Failed to send advanced OTP email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Enhanced welcome email with advanced template
const sendAdvancedWelcomeEmail = async (user) => {
  try {
    const template = getFallbackTemplate('welcomeAdvanced');
    const html = replaceTemplateVariables(template, {
      userName: user.name || 'User',
      email: user.email
    });
    
    return await sendEnhancedEmail({
      to: user.email,
      subject: `🎉 Welcome to ${process.env.APP_NAME || 'CRM Application'}! Your Success Journey Begins Now`,
      html
    });
  } catch (error) {
    console.error('Failed to send advanced welcome email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send bulk email with rate limiting
const sendBulkEmail = async (emails, subject, template, variables = {}) => {
  const results = [];
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];
    try {
      const html = replaceTemplateVariables(template, {
        ...variables,
        email: email.email,
        userName: email.name || 'User'
      });
      
      const result = await sendEnhancedEmail({
        to: email.email,
        subject,
        html
      });
      
      results.push({
        email: email.email,
        success: result.success,
        messageId: result.messageId,
        error: result.error
      });
      
      // Add progressive delay to avoid rate limiting
      const delayMs = Math.min(100 + (i * 10), 1000); // Progressive delay up to 1 second
      await delay(delayMs);
      
      // Log progress every 10 emails
      if ((i + 1) % 10 === 0) {
        console.log(`✅ Bulk email progress: ${i + 1}/${emails.length} emails processed`);
      }
      
    } catch (error) {
      results.push({
        email: email.email,
        success: false,
        error: error.message
      });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.length - successCount;
  
  console.log(`📊 Bulk email summary: ${successCount} sent, ${failureCount} failed`);
  
  return {
    results,
    summary: {
      total: results.length,
      successful: successCount,
      failed: failureCount,
      successRate: ((successCount / results.length) * 100).toFixed(2) + '%'
    }
  };
};

// Test email configuration
const testEmailConfiguration = async () => {
  try {
    const transporter = createEnhancedTransporter();
    await transporter.verify();
    
    console.log('✅ Email configuration is valid');
    return { 
      success: true, 
      message: 'Email configuration is valid',
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT === '465'
    };
  } catch (error) {
    console.error('❌ Email configuration error:', error.message);
    return { 
      success: false, 
      error: error.message,
      recommendations: [
        'Check SMTP_HOST, SMTP_PORT, SMTP_EMAIL, and SMTP_PASSWORD environment variables',
        'Ensure email credentials are correct',
        'Verify firewall settings allow SMTP connections',
        'Consider using app-specific passwords for Gmail'
      ]
    };
  }
};

// Email health check
const checkEmailHealth = async () => {
  try {
    const testResult = await testEmailConfiguration();
    const timestamp = new Date().toISOString();
    
    return {
      timestamp,
      status: testResult.success ? 'healthy' : 'unhealthy',
      details: testResult,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    };
  } catch (error) {
    return {
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error.message
    };
  }
};

module.exports = {
  // Original functions (for backward compatibility)
  sendOTPEmail: sendAdvancedOTPEmail,
  sendWelcomeEmail: sendAdvancedWelcomeEmail,
  sendPasswordResetEmail: require('./emailService').sendPasswordResetEmail, // Use original
  
  // Enhanced functions
  sendEnhancedEmail,
  sendAdvancedOTPEmail,
  sendAdvancedWelcomeEmail,
  sendBulkEmail,
  testEmailConfiguration,
  checkEmailHealth,
  
  // Utility functions
  loadTemplate,
  replaceTemplateVariables,
  createEnhancedTransporter
};
