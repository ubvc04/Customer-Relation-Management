const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name can not be more than 50 characters'],
    match: [/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false,
    validate: {
      validator: function(password) {
        // Password strength validation
        const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?\":{}|<>])/;
        return strongPassword.test(password);
      },
      message: 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
    }
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'manager', 'sales', 'support'],
    default: 'user'
  },
  avatar: {
    type: String,
    default: function() {
      // Generate Gravatar URL based on email
      const hash = crypto.createHash('md5').update(this.email).digest('hex');
      return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=200`;
    }
  },
  
  // Email verification fields
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationDate: {
    type: Date
  },
  otpCode: String,
  otpExpires: Date,
  otpAttempts: {
    type: Number,
    default: 0,
    max: 5
  },
  
  // Account status and security
  isActive: {
    type: Boolean,
    default: true
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  suspensionReason: String,
  suspensionDate: Date,
  
  // Login tracking and security
  loginAttempts: {
    type: Number,
    default: 0,
    max: 5
  },
  lockUntil: Date,
  lastLogin: {
    type: Date
  },
  lastLogout: {
    type: Date
  },
  lastLoginIP: String,
  lastLoginUserAgent: String,
  loginHistory: [{
    ip: String,
    userAgent: String,
    loginTime: {
      type: Date,
      default: Date.now
    },
    location: {
      country: String,
      city: String,
      region: String
    }
  }],
  
  // Registration tracking
  registrationIP: String,
  registrationUserAgent: String,
  registrationDate: {
    type: Date,
    default: Date.now
  },
  
  // Password reset
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  passwordChangedAt: Date,
  passwordHistory: [{
    passwordHash: String,
    changedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Two-factor authentication
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: String,
  backupCodes: [String],
  
  // Security preferences
  securitySettings: {
    loginNotifications: {
      type: Boolean,
      default: true
    },
    passwordChangeNotifications: {
      type: Boolean,
      default: true
    },
    accountActivityNotifications: {
      type: Boolean,
      default: true
    },
    sessionTimeout: {
      type: Number,
      default: 30 // minutes
    }
  },
  
  // Profile information
  profile: {
    firstName: String,
    lastName: String,
    phone: {
      type: String,
      match: [/^\+?[\d\s\-\(\)]{10,}$/, 'Please add a valid phone number']
    },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say']
    },
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    },
    company: String,
    jobTitle: String,
    department: String,
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot be more than 500 characters']
    },
    website: {
      type: String,
      match: [/^https?:\/\/.+/, 'Please add a valid URL']
    },
    socialLinks: {
      linkedin: String,
      twitter: String,
      github: String
    }
  },
  
  // Preferences and settings
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    dateFormat: {
      type: String,
      enum: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'],
      default: 'MM/DD/YYYY'
    },
    currency: {
      type: String,
      default: 'USD'
    },
    notifications: {
      email: {
        marketing: { type: Boolean, default: false },
        updates: { type: Boolean, default: true },
        security: { type: Boolean, default: true },
        reminders: { type: Boolean, default: true }
      },
      push: {
        enabled: { type: Boolean, default: true },
        marketing: { type: Boolean, default: false },
        updates: { type: Boolean, default: true },
        reminders: { type: Boolean, default: true }
      }
    }
  },
  
  // Analytics and tracking
  analytics: {
    totalLogins: {
      type: Number,
      default: 0
    },
    lastActivityDate: {
      type: Date,
      default: Date.now
    },
    totalSessionTime: {
      type: Number,
      default: 0 // in minutes
    },
    averageSessionTime: {
      type: Number,
      default: 0 // in minutes
    },
    activityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  
  // Subscription and plan information
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'canceled', 'past_due'],
      default: 'active'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: Date,
    renewalDate: Date,
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'paypal', 'bank_transfer', 'invoice']
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
UserSchema.index({ email: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ 'subscription.plan': 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ lastLogin: -1 });

// Virtual fields
UserSchema.virtual('fullName').get(function() {
  if (this.profile && this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.name;
});

UserSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

UserSchema.virtual('daysUntilPasswordExpiry').get(function() {
  if (!this.passwordChangedAt) return null;
  const passwordAge = Date.now() - this.passwordChangedAt;
  const maxPasswordAge = 90 * 24 * 60 * 60 * 1000; // 90 days
  const daysLeft = Math.ceil((maxPasswordAge - passwordAge) / (24 * 60 * 60 * 1000));
  return Math.max(0, daysLeft);
});

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) {
    return next();
  }

  // Store old password in history
  if (this.password && !this.isNew) {
    this.passwordHistory.push({
      passwordHash: this.password,
      changedAt: new Date()
    });
    
    // Keep only last 5 passwords
    if (this.passwordHistory.length > 5) {
      this.passwordHistory = this.passwordHistory.slice(-5);
    }
    
    this.passwordChangedAt = new Date();
  }

  // Hash password
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  
  next();
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if password was used recently
UserSchema.methods.isPasswordRecentlyUsed = async function(candidatePassword) {
  for (const oldPassword of this.passwordHistory) {
    const isMatch = await bcrypt.compare(candidatePassword, oldPassword.passwordHash);
    if (isMatch) return true;
  }
  return false;
};

// Method to generate OTP
UserSchema.methods.generateOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otpCode = crypto.createHash('sha256').update(otp).digest('hex');
  this.otpExpires = Date.now() + (parseInt(process.env.OTP_EXPIRE_MINUTES) || 15) * 60 * 1000;
  this.otpAttempts = 0;
  
  return otp; // Return plain OTP for email
};

// Method to verify OTP
UserSchema.methods.verifyOTP = function(candidateOTP) {
  if (this.otpAttempts >= 5) {
    return false;
  }
  
  const hashedOTP = crypto.createHash('sha256').update(candidateOTP).digest('hex');
  
  if (this.otpCode !== hashedOTP) {
    this.otpAttempts += 1;
    return false;
  }
  
  if (this.otpExpires < Date.now()) {
    return false;
  }
  
  return true;
};

// Method to clear OTP
UserSchema.methods.clearOTP = function() {
  this.otpCode = undefined;
  this.otpExpires = undefined;
  this.otpAttempts = 0;
};

// Method to handle login attempts
UserSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: {
        lockUntil: 1
      },
      $set: {
        loginAttempts: 1
      }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 attempts for 30 minutes
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 30 * 60 * 1000 }; // 30 minutes
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
UserSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: {
      loginAttempts: 1,
      lockUntil: 1
    }
  });
};

// Method to update last login
UserSchema.methods.updateLastLogin = async function(ip, userAgent) {
  this.lastLogin = new Date();
  this.lastLoginIP = ip;
  this.lastLoginUserAgent = userAgent;
  this.analytics.totalLogins += 1;
  this.analytics.lastActivityDate = new Date();
  
  // Add to login history
  this.loginHistory.push({
    ip,
    userAgent,
    loginTime: new Date()
  });
  
  // Keep only last 10 login records
  if (this.loginHistory.length > 10) {
    this.loginHistory = this.loginHistory.slice(-10);
  }
  
  await this.save({ validateBeforeSave: false });
};

// Method to generate password reset token
UserSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');
  
  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Set expire time (10 minutes)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  
  return resetToken;
};

// Method to calculate activity score
UserSchema.methods.calculateActivityScore = function() {
  const now = new Date();
  const accountAge = (now - this.createdAt) / (1000 * 60 * 60 * 24); // days
  const daysSinceLastLogin = this.lastLogin ? 
    (now - this.lastLogin) / (1000 * 60 * 60 * 24) : accountAge;
  
  let score = 0;
  
  // Login frequency (40 points)
  if (daysSinceLastLogin < 1) score += 40;
  else if (daysSinceLastLogin < 7) score += 30;
  else if (daysSinceLastLogin < 30) score += 20;
  else if (daysSinceLastLogin < 90) score += 10;
  
  // Email verification (20 points)
  if (this.isEmailVerified) score += 20;
  
  // Profile completion (20 points)
  let profileFields = 0;
  if (this.profile) {
    if (this.profile.firstName) profileFields++;
    if (this.profile.lastName) profileFields++;
    if (this.profile.phone) profileFields++;
    if (this.profile.company) profileFields++;
    if (this.profile.bio) profileFields++;
  }
  score += (profileFields / 5) * 20;
  
  // Account age bonus (10 points)
  if (accountAge > 90) score += 10;
  else if (accountAge > 30) score += 5;
  
  // Security features (10 points)
  if (this.twoFactorEnabled) score += 10;
  else if (this.securitySettings.loginNotifications) score += 5;
  
  this.analytics.activityScore = Math.min(100, Math.max(0, score));
  return this.analytics.activityScore;
};

// Static method to find users by activity
UserSchema.statics.findActiveUsers = function(days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.find({
    isActive: true,
    lastLogin: { $gte: cutoffDate }
  }).sort({ lastLogin: -1 });
};

// Static method to find users by role
UserSchema.statics.findByRole = function(role) {
  return this.find({ role, isActive: true });
};

// Method to serialize user for JWT
UserSchema.methods.toAuthJSON = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    avatar: this.avatar,
    isEmailVerified: this.isEmailVerified,
    preferences: this.preferences,
    subscription: this.subscription
  };
};

module.exports = mongoose.model('User', UserSchema);
