const express = require('express');
const {
  getCustomerLeads,
  getAllLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  addActivity,
  getLeadStats,
  getOverdueLeads,
  updateLeadStatus
} = require('../controllers/leadController');

const { protect } = require('../middleware/auth');
const { validate, leadValidation } = require('../middleware/validation');

const router = express.Router({ mergeParams: true });

// Protect all routes
router.use(protect);

// Routes that work with customerId parameter (from customers router)
router
  .route('/')
  .get(getCustomerLeads)
  .post(validate(leadValidation.create), createLead);

// Standalone lead routes (when accessed directly via /api/leads)
router.get('/all', getAllLeads);
router.get('/stats', getLeadStats);
router.get('/overdue', getOverdueLeads);

router
  .route('/:id')
  .get(getLead)
  .put(validate(leadValidation.update), updateLead)
  .delete(deleteLead);

router.post('/:id/activities', validate(leadValidation.addActivity), addActivity);
router.patch('/:id/status', updateLeadStatus);

module.exports = router;
