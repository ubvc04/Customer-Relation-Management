const Lead = require('../models/Lead');
const Customer = require('../models/Customer');
const { asyncHandler } = require('../middleware/error');
const {
  getPagination,
  buildPaginationResponse,
  buildSortQuery,
  buildDateRangeQuery,
  calculateLeadScore
} = require('../utils/helpers');

// @desc    Get all leads for a customer
// @route   GET /api/customers/:customerId/leads
// @access  Private
const getCustomerLeads = asyncHandler(async (req, res, next) => {
  const { customerId } = req.params;
  const { page, limit, skip } = getPagination(req.query.page, req.query.limit);
  const sort = buildSortQuery(req.query.sort);

  // Verify customer exists and user has access
  const customer = await Customer.findById(customerId);
  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found'
    });
  }

  // Check access rights
  if (req.user.role !== 'admin' && customer.ownerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this customer\'s leads'
    });
  }

  // Build filter query
  let filter = { customerId };

  // Status filter
  if (req.query.status) {
    filter.status = req.query.status;
  }

  // Priority filter
  if (req.query.priority) {
    filter.priority = req.query.priority;
  }

  // Source filter
  if (req.query.source) {
    filter.source = req.query.source;
  }

  // Date range filter
  if (req.query.startDate || req.query.endDate) {
    const dateFilter = buildDateRangeQuery('createdAt', req.query.startDate, req.query.endDate);
    filter = { ...filter, ...dateFilter };
  }

  // Value range filter
  if (req.query.minValue) {
    filter.value = { ...filter.value, $gte: parseFloat(req.query.minValue) };
  }
  if (req.query.maxValue) {
    filter.value = { ...filter.value, $lte: parseFloat(req.query.maxValue) };
  }

  // Execute query
  const leads = await Lead.find(filter)
    .populate('customerId', 'name company email')
    .populate('assignedTo', 'name email')
    .populate('activities.userId', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  // Get total count for pagination
  const total = await Lead.countDocuments(filter);

  // Build response with pagination
  const response = buildPaginationResponse(leads, total, page, limit);

  res.status(200).json({
    success: true,
    count: leads.length,
    ...response
  });
});

// @desc    Get all leads (with filtering)
// @route   GET /api/leads
// @access  Private
const getAllLeads = asyncHandler(async (req, res, next) => {
  const { page, limit, skip } = getPagination(req.query.page, req.query.limit);
  const sort = buildSortQuery(req.query.sort);

  // Build filter query
  let filter = {};

  // Role-based filtering
  if (req.user.role !== 'admin') {
    filter.assignedTo = req.user._id;
  } else if (req.query.assignedTo) {
    filter.assignedTo = req.query.assignedTo;
  }

  // Status filter
  if (req.query.status) {
    const statuses = Array.isArray(req.query.status) ? req.query.status : [req.query.status];
    filter.status = { $in: statuses };
  }

  // Priority filter
  if (req.query.priority) {
    filter.priority = req.query.priority;
  }

  // Source filter
  if (req.query.source) {
    filter.source = req.query.source;
  }

  // Search in title or description
  if (req.query.q) {
    const searchRegex = { $regex: req.query.q, $options: 'i' };
    filter.$or = [
      { title: searchRegex },
      { description: searchRegex }
    ];
  }

  // Date range filter
  if (req.query.startDate || req.query.endDate) {
    const dateFilter = buildDateRangeQuery('expectedCloseDate', req.query.startDate, req.query.endDate);
    filter = { ...filter, ...dateFilter };
  }

  // Overdue filter
  if (req.query.overdue === 'true') {
    filter.expectedCloseDate = { $lt: new Date() };
    filter.status = { $nin: ['Converted', 'Lost'] };
  }

  // Execute query
  const leads = await Lead.find(filter)
    .populate('customerId', 'name company email')
    .populate('assignedTo', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  // Get total count for pagination
  const total = await Lead.countDocuments(filter);

  // Build response with pagination
  const response = buildPaginationResponse(leads, total, page, limit);

  res.status(200).json({
    success: true,
    count: leads.length,
    ...response
  });
});

// @desc    Get single lead
// @route   GET /api/leads/:id
// @access  Private
const getLead = asyncHandler(async (req, res, next) => {
  let query = Lead.findById(req.params.id)
    .populate('customerId', 'name company email phone')
    .populate('assignedTo', 'name email')
    .populate('activities.userId', 'name email');

  // Role-based access control
  if (req.user.role !== 'admin') {
    query = query.where({ assignedTo: req.user._id });
  }

  const lead = await query;

  if (!lead) {
    return res.status(404).json({
      success: false,
      message: 'Lead not found'
    });
  }

  // Calculate lead score
  const leadScore = calculateLeadScore(lead);

  res.status(200).json({
    success: true,
    data: {
      lead: {
        ...lead.toObject(),
        leadScore
      }
    }
  });
});

// @desc    Create new lead for customer
// @route   POST /api/customers/:customerId/leads
// @access  Private
const createLead = asyncHandler(async (req, res, next) => {
  const { customerId } = req.params;

  // Verify customer exists and user has access
  const customer = await Customer.findById(customerId);
  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found'
    });
  }

  // Check access rights
  if (req.user.role !== 'admin' && customer.ownerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to create leads for this customer'
    });
  }

  // Add customer and assigned user to lead data
  req.body.customerId = customerId;
  req.body.assignedTo = req.body.assignedTo || req.user._id;

  const lead = await Lead.create(req.body);

  // Populate the created lead
  await lead.populate([
    { path: 'customerId', select: 'name company email' },
    { path: 'assignedTo', select: 'name email' }
  ]);

  res.status(201).json({
    success: true,
    message: 'Lead created successfully',
    data: {
      lead
    }
  });
});

// @desc    Update lead
// @route   PUT /api/leads/:id
// @access  Private
const updateLead = asyncHandler(async (req, res, next) => {
  let query = { _id: req.params.id };

  // Role-based access control
  if (req.user.role !== 'admin') {
    query.assignedTo = req.user._id;
  }

  const lead = await Lead.findOneAndUpdate(
    query,
    req.body,
    {
      new: true,
      runValidators: true
    }
  ).populate([
    { path: 'customerId', select: 'name company email' },
    { path: 'assignedTo', select: 'name email' },
    { path: 'activities.userId', select: 'name email' }
  ]);

  if (!lead) {
    return res.status(404).json({
      success: false,
      message: 'Lead not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Lead updated successfully',
    data: {
      lead
    }
  });
});

// @desc    Delete lead
// @route   DELETE /api/leads/:id
// @access  Private
const deleteLead = asyncHandler(async (req, res, next) => {
  let query = { _id: req.params.id };

  // Role-based access control
  if (req.user.role !== 'admin') {
    query.assignedTo = req.user._id;
  }

  const lead = await Lead.findOneAndDelete(query);

  if (!lead) {
    return res.status(404).json({
      success: false,
      message: 'Lead not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Lead deleted successfully',
    data: {}
  });
});

// @desc    Add activity to lead
// @route   POST /api/leads/:id/activities
// @access  Private
const addActivity = asyncHandler(async (req, res, next) => {
  let query = { _id: req.params.id };

  // Role-based access control
  if (req.user.role !== 'admin') {
    query.assignedTo = req.user._id;
  }

  const lead = await Lead.findOne(query);

  if (!lead) {
    return res.status(404).json({
      success: false,
      message: 'Lead not found'
    });
  }

  // Add user ID to activity
  req.body.userId = req.user._id;

  // Add activity to lead
  await lead.addActivity(req.body);

  // Populate and return updated lead
  await lead.populate([
    { path: 'customerId', select: 'name company email' },
    { path: 'assignedTo', select: 'name email' },
    { path: 'activities.userId', select: 'name email' }
  ]);

  res.status(201).json({
    success: true,
    message: 'Activity added successfully',
    data: {
      lead
    }
  });
});

// @desc    Get lead statistics
// @route   GET /api/leads/stats
// @access  Private
const getLeadStats = asyncHandler(async (req, res, next) => {
  // Build match query based on user role
  const matchQuery = req.user.role === 'admin' ? {} : { assignedTo: req.user._id };

  // Get basic stats
  const totalLeads = await Lead.countDocuments(matchQuery);
  const openLeads = await Lead.countDocuments({
    ...matchQuery,
    status: { $nin: ['Converted', 'Lost'] }
  });
  const convertedLeads = await Lead.countDocuments({ ...matchQuery, status: 'Converted' });
  const lostLeads = await Lead.countDocuments({ ...matchQuery, status: 'Lost' });

  // Get leads added this month
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);

  const newLeadsThisMonth = await Lead.countDocuments({
    ...matchQuery,
    createdAt: { $gte: thisMonth }
  });

  // Get overdue leads
  const overdueLeads = await Lead.countDocuments({
    ...matchQuery,
    expectedCloseDate: { $lt: new Date() },
    status: { $nin: ['Converted', 'Lost'] }
  });

  // Get conversion rate
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  // Get status breakdown with values
  const statusStats = await Lead.getStats(req.user.role === 'admin' ? null : req.user._id);

  // Get conversion funnel
  const conversionFunnel = await Lead.getConversionFunnel(req.user.role === 'admin' ? null : req.user._id);

  // Get top leads by value
  const topLeads = await Lead.find({
    ...matchQuery,
    status: { $nin: ['Converted', 'Lost'] }
  })
    .populate('customerId', 'name company')
    .sort('-value')
    .limit(5)
    .select('title value probability status expectedCloseDate');

  // Get leads by source
  const leadsBySource = await Lead.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$source',
        count: { $sum: 1 },
        totalValue: { $sum: '$value' },
        avgValue: { $avg: '$value' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // Get monthly performance
  const monthlyPerformance = await Lead.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        leads: { $sum: 1 },
        value: { $sum: '$value' },
        conversions: {
          $sum: {
            $cond: [{ $eq: ['$status', 'Converted'] }, 1, 0]
          }
        }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 12 }
  ]);

  res.status(200).json({
    success: true,
    data: {
      overview: {
        totalLeads,
        openLeads,
        convertedLeads,
        lostLeads,
        newLeadsThisMonth,
        overdueLeads,
        conversionRate
      },
      statusStats: statusStats[0] || { statusBreakdown: [], totalLeads: 0, totalValue: 0, totalWeightedValue: 0 },
      conversionFunnel,
      topLeads,
      leadsBySource,
      monthlyPerformance
    }
  });
});

// @desc    Get overdue leads
// @route   GET /api/leads/overdue
// @access  Private
const getOverdueLeads = asyncHandler(async (req, res, next) => {
  const matchQuery = req.user.role === 'admin' ? {} : { assignedTo: req.user._id };

  const overdueLeads = await Lead.find({
    ...matchQuery,
    expectedCloseDate: { $lt: new Date() },
    status: { $nin: ['Converted', 'Lost'] }
  })
    .populate('customerId', 'name company email')
    .populate('assignedTo', 'name email')
    .sort('expectedCloseDate')
    .limit(50);

  res.status(200).json({
    success: true,
    count: overdueLeads.length,
    data: {
      leads: overdueLeads
    }
  });
});

// @desc    Update lead status
// @route   PATCH /api/leads/:id/status
// @access  Private
const updateLeadStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({
      success: false,
      message: 'Status is required'
    });
  }

  let query = { _id: req.params.id };

  // Role-based access control
  if (req.user.role !== 'admin') {
    query.assignedTo = req.user._id;
  }

  const lead = await Lead.findOneAndUpdate(
    query,
    { status },
    { new: true, runValidators: true }
  ).populate([
    { path: 'customerId', select: 'name company email' },
    { path: 'assignedTo', select: 'name email' }
  ]);

  if (!lead) {
    return res.status(404).json({
      success: false,
      message: 'Lead not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Lead status updated successfully',
    data: {
      lead
    }
  });
});

module.exports = {
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
};
