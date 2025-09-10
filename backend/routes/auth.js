const express = require('express');
const {
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
} = require('../controllers/authController');

const { protect, authorize } = require('../middleware/auth');
const { validate, userValidation } = require('../middleware/validation');
const { authLimiter } = require('../middleware/security');

const router = express.Router();

// Apply auth rate limiting to all auth routes
router.use(authLimiter);

// Public routes
router.post('/register', validate(userValidation.register), register);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', validate(userValidation.login), login);
router.post('/demo-login', demoLogin); // Demo login without database
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

// Protected routes
router.use(protect); // All routes after this middleware are protected

router.post('/logout', logout);
router.get('/me', getMe);
router.put('/me', validate(userValidation.updateProfile), updateDetails);
router.put('/password', validate(userValidation.changePassword), updatePassword);

// Admin only routes
router.get('/stats', authorize('admin'), getUserStats);

module.exports = router;
