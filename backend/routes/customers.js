const express = require('express');
const {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerStats,
  searchCustomers,
  exportCustomers,
  bulkUpdateCustomers
} = require('../controllers/customerController');

const { protect, authorize } = require('../middleware/auth');
const { validate, customerValidation, queryValidation } = require('../middleware/validation');

// Include other resource routers
const leadRouter = require('./leads');

const router = express.Router();

// Re-route into other resource routers
router.use('/:customerId/leads', leadRouter);

// Protect all routes
router.use(protect);

// Public customer routes (for authenticated users)
router
  .route('/')
  .get(getCustomers)
  .post(validate(customerValidation.create), createCustomer);

router.get('/stats', getCustomerStats);
router.get('/search', searchCustomers);
router.get('/export', exportCustomers);
router.patch('/bulk', bulkUpdateCustomers);

router
  .route('/:id')
  .get(getCustomer)
  .put(validate(customerValidation.update), updateCustomer)
  .delete(deleteCustomer);

module.exports = router;
