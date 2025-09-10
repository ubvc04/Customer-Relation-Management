const User = require('../models/EnhancedUser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { asyncHandler } = require('../middleware/error');
const { sendOTPEmail, sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/emailService');

// Enhanced token generation with refresh tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m'
  });
  
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
  });
  
  return { accessToken, refreshToken };
};

// Enhanced password validation
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?\":{}|<>]/.test(password);
  
  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!hasNumbers) {
    errors.push('Password must contain at least one number');
  }
  if (!hasSpecialChar) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// @desc    Enhanced user registration with email verification
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Enhanced input validation
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide name, email, and password'
    });
  }

  // Password strength validation
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Password does not meet security requirements',
      errors: passwordValidation.errors
    });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  
  if (existingUser) {
    if (existingUser.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    } else {
      // Resend verification OTP for unverified user
      const otp = existingUser.generateOTP();
      await existingUser.save({ validateBeforeSave: false });
      
      const emailResult = await sendOTPEmail(email, name, otp);
      
      if (emailResult.success) {
        return res.status(200).json({
          success: true,
          message: 'Verification OTP resent to your email address',
          data: {
            email: existingUser.email,
            requiresVerification: true,
            otpExpiresIn: parseInt(process.env.OTP_EXPIRE_MINUTES) || 15
          }
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Failed to send verification email. Please try again.'
        });
      }
    }
  }

  // Create new user
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    role: role || 'user',
    isEmailVerified: false,
    registrationIP: req.ip,
    registrationUserAgent: req.get('User-Agent')
  });

  // Generate OTP for email verification
  const otp = user.generateOTP();
  await user.save({ validateBeforeSave: false });

  // Send verification email
  const emailResult = await sendOTPEmail(email, name, otp);
  
  if (emailResult.success) {
    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for verification OTP.',
      data: {
        email: user.email,
        requiresVerification: true,
        otpExpiresIn: parseInt(process.env.OTP_EXPIRE_MINUTES) || 15
      }
    });
  } else {
    // Delete user if email fails
    await User.findByIdAndDelete(user._id);
    return res.status(500).json({
      success: false,
      message: 'Failed to send verification email. Please try again.'
    });
  }
});

// @desc    Verify OTP and complete registration
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Email and OTP are required'
    });
  }

  const user = await User.findOne({ 
    email: email.toLowerCase(),
    otpCode: otp,
    otpExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired OTP'
    });
  }

  // Verify OTP
  const isValidOTP = user.verifyOTP(otp);
  
  if (!isValidOTP) {
    return res.status(400).json({
      success: false,
      message: 'Invalid OTP. Please try again.',
      attemptsRemaining: user.otpAttempts
    });
  }

  // Mark email as verified and clear OTP
  user.isEmailVerified = true;
  user.emailVerificationDate = new Date();
  user.clearOTP();
  await user.save();

  // Send welcome email
  await sendWelcomeEmail(user);

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id);

  // Set refresh token as HTTP-only cookie
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };

  res.cookie('refreshToken', refreshToken, cookieOptions);

  // Update last login
  await user.updateLastLogin(req.ip, req.get('User-Agent'));

  res.status(200).json({
    success: true,
    message: 'Email verified successfully. Welcome!',
    token: accessToken,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin
      }
    }
  });
});

// @desc    Enhanced user login with security features
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res, next) => {
  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password'
    });
  }

  // Find user and include password
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password +loginAttempts +lockUntil');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if account is locked
  if (user.isLocked) {
    return res.status(423).json({
      success: false,
      message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.',
      lockUntil: user.lockUntil
    });
  }

  // Verify password
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    // Increment failed attempts
    await user.incLoginAttempts();
    
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
      attemptsRemaining: Math.max(0, 5 - user.loginAttempts)
    });
  }

  // Check if email is verified
  if (!user.isEmailVerified) {
    // Generate new OTP for unverified users
    const otp = user.generateOTP();
    await user.save({ validateBeforeSave: false });
    
    await sendOTPEmail(user.email, user.name, otp);
    
    return res.status(401).json({
      success: false,
      message: 'Please verify your email before logging in. A new OTP has been sent.',
      code: 'EMAIL_NOT_VERIFIED',
      data: {
        email: user.email,
        requiresVerification: true
      }
    });
  }

  // Check if account is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Account is deactivated. Please contact administrator.'
    });
  }

  // Reset failed attempts on successful login
  if (user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }

  // Generate tokens
  const tokenExpiry = rememberMe ? '30d' : '24h';
  const { accessToken, refreshToken } = generateTokens(user._id);

  // Set refresh token as HTTP-only cookie
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
  };

  res.cookie('refreshToken', refreshToken, cookieOptions);

  // Update last login with security info
  await user.updateLastLogin(req.ip, req.get('User-Agent'));

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token: accessToken,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin
      }
    }
  });
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Private
const refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken: tokenFromCookie } = req.cookies;
  const tokenFromBody = req.body.refreshToken;
  
  const refreshTokenValue = tokenFromCookie || tokenFromBody;

  if (!refreshTokenValue) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token not provided'
    });
  }

  try {
    const decoded = jwt.verify(refreshTokenValue, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

    // Set new refresh token as cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    };

    res.cookie('refreshToken', newRefreshToken, cookieOptions);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      token: accessToken
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

// @desc    Enhanced logout with session cleanup
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res, next) => {
  // Clear refresh token cookie
  res.clearCookie('refreshToken');

  // Update user's last logout time
  if (req.user) {
    req.user.lastLogout = new Date();
    await req.user.save({ validateBeforeSave: false });
  }

  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-password');

  res.status(200).json({
    success: true,
    data: {
      user
    }
  });
});

// @desc    Resend OTP for email verification
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOTP = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (user.isEmailVerified) {
    return res.status(400).json({
      success: false,
      message: 'Email is already verified'
    });
  }

  // Generate new OTP
  const otp = user.generateOTP();
  await user.save({ validateBeforeSave: false });

  // Send OTP email
  const emailResult = await sendOTPEmail(email, user.name, otp);

  if (emailResult.success) {
    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        email: user.email,
        otpExpiresIn: parseInt(process.env.OTP_EXPIRE_MINUTES) || 15
      }
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please try again.'
    });
  }
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Generate reset token
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  // Send reset email
  const emailResult = await sendPasswordResetEmail(user, resetToken);

  if (emailResult.success) {
    res.status(200).json({
      success: true,
      message: 'Password reset email sent'
    });
  } else {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(500).json({
      success: false,
      message: 'Email could not be sent'
    });
  }
});

module.exports = {
  register,
  verifyOTP,
  login,
  refreshToken,
  logout,
  getMe,
  resendOTP,
  forgotPassword
};
