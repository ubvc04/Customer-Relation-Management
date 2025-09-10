const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// Send token response
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  // Create token
  const token = generateToken(user._id);

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  };

  // Remove password from output
  user.password = undefined;

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      message,
      token,
      data: {
        user
      }
    });
};

// Generate random string
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Hash string
const hashString = (str) => {
  return crypto.createHash('sha256').update(str).digest('hex');
};

// Generate verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
};

// Format phone number
const formatPhoneNumber = (phone) => {
  if (!phone) return null;
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone; // Return original if can't format
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

// Validate phone format
const isValidPhone = (phone) => {
  const phoneRegex = /^[\+]?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone);
};

// Sanitize string for search
const sanitizeSearchQuery = (query) => {
  if (!query) return '';
  return query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Pagination helper
const getPagination = (page = 1, limit = 10) => {
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);
  
  const validPage = pageNumber > 0 ? pageNumber : 1;
  const validLimit = limitNumber > 0 && limitNumber <= 100 ? limitNumber : 10;
  
  const skip = (validPage - 1) * validLimit;
  
  return {
    page: validPage,
    limit: validLimit,
    skip
  };
};

// Build pagination response
const buildPaginationResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null
    }
  };
};

// Sort helper
const buildSortQuery = (sortString = '-createdAt') => {
  const sortFields = {};
  
  sortString.split(',').forEach(field => {
    const trimmedField = field.trim();
    if (trimmedField.startsWith('-')) {
      sortFields[trimmedField.substring(1)] = -1;
    } else {
      sortFields[trimmedField] = 1;
    }
  });
  
  return sortFields;
};

// Search query builder
const buildSearchQuery = (searchParams, allowedFields = []) => {
  const query = {};
  
  Object.keys(searchParams).forEach(key => {
    if (allowedFields.includes(key) && searchParams[key]) {
      const value = searchParams[key];
      
      if (typeof value === 'string') {
        // Text search
        query[key] = { $regex: sanitizeSearchQuery(value), $options: 'i' };
      } else if (Array.isArray(value)) {
        // Array of values
        query[key] = { $in: value };
      } else {
        // Exact match
        query[key] = value;
      }
    }
  });
  
  return query;
};

// Date range query builder
const buildDateRangeQuery = (field, startDate, endDate) => {
  const query = {};
  
  if (startDate || endDate) {
    query[field] = {};
    
    if (startDate) {
      query[field].$gte = new Date(startDate);
    }
    
    if (endDate) {
      query[field].$lte = new Date(endDate);
    }
  }
  
  return query;
};

// Generate slug from string
const generateSlug = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Calculate percentage
const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

// Format currency
const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
};

// Calculate lead score (example scoring algorithm)
const calculateLeadScore = (lead) => {
  let score = 0;
  
  // Value-based scoring
  if (lead.value > 100000) score += 30;
  else if (lead.value > 50000) score += 20;
  else if (lead.value > 10000) score += 10;
  else score += 5;
  
  // Status-based scoring
  const statusScores = {
    'New': 10,
    'Contacted': 20,
    'Qualified': 40,
    'Proposal': 60,
    'Negotiation': 80,
    'Converted': 100,
    'Lost': 0
  };
  score += statusScores[lead.status] || 0;
  
  // Priority-based scoring
  const priorityScores = {
    'high': 20,
    'medium': 10,
    'low': 5
  };
  score += priorityScores[lead.priority] || 0;
  
  // Activity-based scoring
  score += Math.min(lead.activities.length * 5, 25);
  
  return Math.min(score, 100); // Cap at 100
};

// Async retry wrapper
const retry = async (fn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
};

// Email Configuration
const createEmailTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send email utility
const sendEmail = async (options) => {
  try {
    const transporter = createEmailTransporter();
    
    const mailOptions = {
      from: `CRM System <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      html: options.html || options.message
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

// Send welcome email
const sendWelcomeEmail = async (user) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333; text-align: center;">Welcome to CRM System!</h1>
      <p>Hello ${user.name},</p>
      <p>Welcome to our CRM system! Your account has been successfully created.</p>
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3>Your Account Details:</h3>
        <p><strong>Name:</strong> ${user.name}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Role:</strong> ${user.role}</p>
      </div>
      <p>You can now log in to your account and start managing your customers and leads.</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL}/login" 
           style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Login to Your Account
        </a>
      </p>
      <p>If you have any questions, please don't hesitate to contact our support team.</p>
      <p>Best regards,<br>The CRM Team</p>
    </div>
  `;

  return await sendEmail({
    email: user.email,
    subject: 'Welcome to CRM System!',
    html
  });
};

// Send password reset email
const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333; text-align: center;">Password Reset Request</h1>
      <p>Hello ${user.name},</p>
      <p>You have requested to reset your password. Click the button below to reset your password:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background-color: #dc3545; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Password
        </a>
      </p>
      <p>This link will expire in 10 minutes for security reasons.</p>
      <p>If you did not request this password reset, please ignore this email and your password will remain unchanged.</p>
      <p>Best regards,<br>The CRM Team</p>
    </div>
  `;

  return await sendEmail({
    email: user.email,
    subject: 'Password Reset Request - CRM System',
    html
  });
};

// Send verification email
const sendVerificationEmail = async (user, verificationCode) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333; text-align: center;">Email Verification</h1>
      <p>Hello ${user.name},</p>
      <p>Please verify your email address by using the verification code below:</p>
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
        <h2 style="color: #007bff; font-size: 32px; letter-spacing: 5px; margin: 0;">${verificationCode}</h2>
      </div>
      <p>This verification code will expire in 15 minutes.</p>
      <p>If you did not create an account, please ignore this email.</p>
      <p>Best regards,<br>The CRM Team</p>
    </div>
  `;

  return await sendEmail({
    email: user.email,
    subject: 'Email Verification - CRM System',
    html
  });
};

// Send lead notification email
const sendLeadNotificationEmail = async (user, lead) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333; text-align: center;">New Lead Assignment</h1>
      <p>Hello ${user.name},</p>
      <p>A new lead has been assigned to you:</p>
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3>Lead Details:</h3>
        <p><strong>Name:</strong> ${lead.name}</p>
        <p><strong>Company:</strong> ${lead.company}</p>
        <p><strong>Email:</strong> ${lead.email}</p>
        <p><strong>Phone:</strong> ${lead.phone}</p>
        <p><strong>Value:</strong> ${formatCurrency(lead.value)}</p>
        <p><strong>Priority:</strong> ${lead.priority}</p>
        <p><strong>Source:</strong> ${lead.source}</p>
      </div>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL}/leads/${lead._id}" 
           style="background-color: #28a745; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">
          View Lead Details
        </a>
      </p>
      <p>Please follow up with this lead as soon as possible.</p>
      <p>Best regards,<br>The CRM Team</p>
    </div>
  `;

  return await sendEmail({
    email: user.email,
    subject: `New Lead Assignment: ${lead.name} - CRM System`,
    html
  });
};

module.exports = {
  generateToken,
  sendTokenResponse,
  generateRandomString,
  hashString,
  generateVerificationCode,
  formatPhoneNumber,
  isValidEmail,
  isValidPhone,
  sanitizeSearchQuery,
  getPagination,
  buildPaginationResponse,
  buildSortQuery,
  buildSearchQuery,
  buildDateRangeQuery,
  generateSlug,
  calculatePercentage,
  formatCurrency,
  calculateLeadScore,
  retry,
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendLeadNotificationEmail
};
