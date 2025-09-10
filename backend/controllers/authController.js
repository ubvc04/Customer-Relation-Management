const User = require('../models/User');
const { asyncHandler } = require('../middleware/error');
const { sendTokenResponse } = require('../utils/helpers');
const { sendOTPEmail, sendWelcomeEmail } = require('../utils/emailService');

// @desc    Register user (sends OTP for verification)
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Check if MongoDB is connected
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database connection unavailable. Please try again later.',
      code: 'DATABASE_UNAVAILABLE'
    });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    if (existingUser.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists and is verified. Please login instead.'
      });
    } else {
      // User exists but not verified, resend OTP
      const otp = existingUser.generateOTP();
      await existingUser.save({ validateBeforeSave: false });

      // Send OTP email
      const emailResult = await sendOTPEmail(email, name, otp);
      
      if (emailResult.success) {
        return res.status(200).json({
          success: true,
          message: 'OTP resent to your email address. Please verify to complete registration.',
          data: {
            email: existingUser.email,
            requiresVerification: true
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

  // Create user with email unverified
  const user = await User.create({
    name,
    email,
    password,
    role,
    isEmailVerified: false
  });

  // Generate OTP
  const otp = user.generateOTP();
  await user.save({ validateBeforeSave: false });

  // Send OTP email
  const emailResult = await sendOTPEmail(email, name, otp);
  
  if (emailResult.success) {
    res.status(201).json({
      success: true,
      message: 'Registration initiated. Please check your email for OTP verification.',
      data: {
        email: user.email,
        requiresVerification: true
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

  // Find user by email
  const user = await User.findOne({ email });
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (user.isEmailVerified) {
    return res.status(400).json({
      success: false,
      message: 'Email already verified. Please login.'
    });
  }

  // Verify OTP
  const verificationResult = user.verifyOTP(otp);
  
  if (!verificationResult.success) {
    await user.save({ validateBeforeSave: false });
    return res.status(400).json({
      success: false,
      message: verificationResult.message
    });
  }

  // Save user as verified
  await user.save({ validateBeforeSave: false });

  // Send welcome email
  await sendWelcomeEmail(user.email, user.name);

  // Update last login and send token
  await user.updateLastLogin();

  sendTokenResponse(user, 200, res, 'Email verified successfully. Registration complete!');
});

// @desc    Resend OTP
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

  const user = await User.findOne({ email });
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (user.isEmailVerified) {
    return res.status(400).json({
      success: false,
      message: 'Email already verified'
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
      message: 'New OTP sent to your email address'
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please try again.'
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password'
    });
  }

  // Check if MongoDB is connected
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database connection unavailable. Please try again later.',
      code: 'DATABASE_UNAVAILABLE'
    });
  }

  // Check for user (include password since it's select: false)
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Account is deactivated. Please contact administrator.'
    });
  }

  // Check if email is verified
  if (!user.isEmailVerified) {
    return res.status(401).json({
      success: false,
      message: 'Please verify your email before logging in. Check your inbox for OTP.',
      code: 'EMAIL_NOT_VERIFIED',
      data: {
        email: user.email,
        requiresVerification: true
      }
    });
  }

  // Check if password matches
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Update last login
  await user.updateLastLogin();

  sendTokenResponse(user, 200, res, 'Login successful');
});

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'Logout successful',
    data: {}
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate('customers', 'name company email');

  res.status(200).json({
    success: true,
    data: {
      user
    }
  });
});

// @desc    Update user details
// @route   PUT /api/auth/me
// @access  Private
const updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
    avatar: req.body.avatar
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(key => {
    if (fieldsToUpdate[key] === undefined) {
      delete fieldsToUpdate[key];
    }
  });

  // Check if email is being changed and if it already exists
  if (fieldsToUpdate.email && fieldsToUpdate.email !== req.user.email) {
    const existingUser = await User.findOne({ email: fieldsToUpdate.email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use'
      });
    }
  }

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user
    }
  });
});

// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
const updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.comparePassword(req.body.currentPassword))) {
    return res.status(401).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res, 'Password updated successfully');
});

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'There is no user with that email'
    });
  }

  // Get reset token
  const resetToken = user.generatePasswordResetToken();

  await user.save({ validateBeforeSave: false });

  // Create reset url
  const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/resetpassword/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

  try {
    // In a real application, you would send an email here
    // For now, we'll just return the reset token for testing
    res.status(200).json({
      success: true,
      message: 'Password reset email sent',
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });
  } catch (err) {
    console.log(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return res.status(500).json({
      success: false,
      message: 'Email could not be sent'
    });
  }
});

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
const resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = require('crypto')
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token'
    });
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res, 'Password reset successfully');
});

// @desc    Get user stats (Admin only)
// @route   GET /api/auth/stats
// @access  Private/Admin
const getUserStats = asyncHandler(async (req, res, next) => {
  const stats = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        active: {
          $sum: {
            $cond: [{ $eq: ['$isActive', true] }, 1, 0]
          }
        }
      }
    }
  ]);

  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isActive: true });
  const newUsersThisMonth = await User.countDocuments({
    createdAt: {
      $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    }
  });

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      roleBreakdown: stats
    }
  });
});

// @desc    Demo login (works without database)
// @route   POST /api/auth/demo-login
// @access  Public
const demoLogin = asyncHandler(async (req, res, next) => {
  // Create demo user data without requiring credentials
  const demoUser = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Demo User',
    email: 'demo@crm.com',
    role: 'manager',
    isActive: true,
    avatar: null,
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Generate JWT token for demo user
  const jwt = require('jsonwebtoken');
  const token = jwt.sign(
    { id: demoUser._id, email: demoUser.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );

  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res.status(200).cookie('token', token, options).json({
    success: true,
    message: 'Demo login successful (database not required)',
    token,
    data: {
      user: demoUser
    },
    isDemoMode: true
  });
});

module.exports = {
  register,
  verifyOTP,
  resendOTP,
  login,
  logout,
  getMe,
  updateDetails,
  updatePassword,
  forgotPassword,
  resetPassword,
  getUserStats,
  demoLogin
};
