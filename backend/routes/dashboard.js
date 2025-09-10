const express = require('express');
const {
  getDashboard,
  getSalesFunnel,
  getRevenueAnalytics,
  getActivityFeed
} = require('../controllers/dashboardController');

const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

router.get('/', getDashboard);
router.get('/funnel', getSalesFunnel);
router.get('/revenue', getRevenueAnalytics);
router.get('/activity', getActivityFeed);

module.exports = router;
