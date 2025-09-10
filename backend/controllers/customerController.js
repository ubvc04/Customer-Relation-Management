const Customer = require('../models/Customer');
const Lead = require('../models/Lead');
const { asyncHandler } = require('../middleware/error');
const {
  getPagination,
  buildPaginationResponse,
  buildSortQuery,
  buildSearchQuery,
  buildDateRangeQuery
} = require('../utils/helpers');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
const getCustomers = asyncHandler(async (req, res, next) => {
  const { page, limit, skip } = getPagination(req.query.page, req.query.limit);
  const sort = buildSortQuery(req.query.sort);

  // Build filter query
  let filter = {};

  // Role-based filtering
  if (req.user.role !== 'admin') {
    filter.ownerId = req.user._id;
  } else if (req.query.ownerId) {
    filter.ownerId = req.query.ownerId;
  }

  // Search functionality
  if (req.query.q) {
    const searchRegex = { $regex: req.query.q, $options: 'i' };
    filter.$or = [
      { name: searchRegex },
      { company: searchRegex },
      { email: searchRegex }
    ];
  }

  // Status filter
  if (req.query.status) {
    filter.status = req.query.status;
  }

  // Industry filter
  if (req.query.industry) {
    filter.industry = req.query.industry;
  }

  // Date range filter
  if (req.query.startDate || req.query.endDate) {
    const dateFilter = buildDateRangeQuery('createdAt', req.query.startDate, req.query.endDate);
    filter = { ...filter, ...dateFilter };
  }

  // Tags filter
  if (req.query.tags) {
    const tags = Array.isArray(req.query.tags) ? req.query.tags : [req.query.tags];
    filter.tags = { $in: tags };
  }

  // Execute query
  const customers = await Customer.find(filter)
    .populate('ownerId', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  // Get total count for pagination
  const total = await Customer.countDocuments(filter);

  // Build response with pagination
  const response = buildPaginationResponse(customers, total, page, limit);

  res.status(200).json({
    success: true,
    count: customers.length,
    ...response
  });
});

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
const getCustomer = asyncHandler(async (req, res, next) => {
  let query = Customer.findById(req.params.id).populate('ownerId', 'name email');

  // Role-based access control
  if (req.user.role !== 'admin') {
    query = query.where({ ownerId: req.user._id });
  }

  const customer = await query;

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found'
    });
  }

  // Get customer's leads
  const leads = await Lead.find({ customerId: customer._id })
    .populate('assignedTo', 'name email')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    data: {
      customer: {
        ...customer.toObject(),
        leads
      }
    }
  });
});

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private
const createCustomer = asyncHandler(async (req, res, next) => {
  // Add user as owner
  req.body.ownerId = req.user._id;

  // Check if customer with email already exists for this user
  const existingCustomer = await Customer.findOne({
    email: req.body.email,
    ownerId: req.user._id
  });

  if (existingCustomer) {
    return res.status(400).json({
      success: false,
      message: 'Customer with this email already exists'
    });
  }

  const customer = await Customer.create(req.body);

  // Populate owner info
  await customer.populate('ownerId', 'name email');

  res.status(201).json({
    success: true,
    message: 'Customer created successfully',
    data: {
      customer
    }
  });
});

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = asyncHandler(async (req, res, next) => {
  let query = { _id: req.params.id };

  // Role-based access control
  if (req.user.role !== 'admin') {
    query.ownerId = req.user._id;
  }

  // Check if updating email and if it already exists
  if (req.body.email) {
    const existingCustomer = await Customer.findOne({
      email: req.body.email,
      _id: { $ne: req.params.id },
      ownerId: req.user.role === 'admin' ? (req.body.ownerId || req.user._id) : req.user._id
    });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Customer with this email already exists'
      });
    }
  }

  const customer = await Customer.findOneAndUpdate(
    query,
    req.body,
    {
      new: true,
      runValidators: true
    }
  ).populate('ownerId', 'name email');

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Customer updated successfully',
    data: {
      customer
    }
  });
});

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private
const deleteCustomer = asyncHandler(async (req, res, next) => {
  let query = { _id: req.params.id };

  // Role-based access control
  if (req.user.role !== 'admin') {
    query.ownerId = req.user._id;
  }

  const customer = await Customer.findOne(query);

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found'
    });
  }

  // Check if customer has leads
  const leadsCount = await Lead.countDocuments({ customerId: customer._id });

  if (leadsCount > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete customer. Customer has ${leadsCount} associated lead(s). Please delete or reassign leads first.`
    });
  }

  await customer.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Customer deleted successfully',
    data: {}
  });
});

// @desc    Get customer statistics
// @route   GET /api/customers/stats
// @access  Private
const getCustomerStats = asyncHandler(async (req, res, next) => {
  // Build match query based on user role
  const matchQuery = req.user.role === 'admin' ? {} : { ownerId: req.user._id };

  // Get basic stats
  const totalCustomers = await Customer.countDocuments(matchQuery);
  const activeCustomers = await Customer.countDocuments({ ...matchQuery, status: 'active' });
  const prospects = await Customer.countDocuments({ ...matchQuery, status: 'prospect' });

  // Get customers added this month
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);

  const newCustomersThisMonth = await Customer.countDocuments({
    ...matchQuery,
    createdAt: { $gte: thisMonth }
  });

  // Get status breakdown
  const statusBreakdown = await Customer.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$totalLeadValue' }
      }
    }
  ]);

  // Get industry breakdown
  const industryBreakdown = await Customer.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$industry',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  // Get top customers by lead value
  const topCustomers = await Customer.find(matchQuery)
    .populate('ownerId', 'name email')
    .sort('-totalLeadValue')
    .limit(5)
    .select('name company totalLeadValue leadsCount');

  // Get customers with most leads
  const customersWithMostLeads = await Customer.find(matchQuery)
    .populate('ownerId', 'name email')
    .sort('-leadsCount')
    .limit(5)
    .select('name company leadsCount totalLeadValue');

  // Get monthly growth
  const monthlyGrowth = await Customer.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 12 }
  ]);

  res.status(200).json({
    success: true,
    data: {
      overview: {
        totalCustomers,
        activeCustomers,
        prospects,
        newCustomersThisMonth
      },
      statusBreakdown,
      industryBreakdown,
      topCustomers,
      customersWithMostLeads,
      monthlyGrowth
    }
  });
});

// @desc    Search customers
// @route   GET /api/customers/search
// @access  Private
const searchCustomers = asyncHandler(async (req, res, next) => {
  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Search query must be at least 2 characters long'
    });
  }

  // Build filter query
  let filter = {
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { company: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { phone: { $regex: q, $options: 'i' } }
    ]
  };

  // Role-based filtering
  if (req.user.role !== 'admin') {
    filter.ownerId = req.user._id;
  }

  const customers = await Customer.find(filter)
    .populate('ownerId', 'name email')
    .select('name company email phone status totalLeadValue leadsCount')
    .limit(20)
    .sort({ name: 1 });

  res.status(200).json({
    success: true,
    count: customers.length,
    data: {
      customers
    }
  });
});

// @desc    Export customers
// @route   GET /api/customers/export
// @access  Private
const exportCustomers = asyncHandler(async (req, res, next) => {
  // Build filter query based on user role
  const filter = req.user.role === 'admin' ? {} : { ownerId: req.user._id };

  const customers = await Customer.find(filter)
    .populate('ownerId', 'name email')
    .select('-__v')
    .sort('-createdAt');

  // In a real application, you might want to generate CSV or Excel file
  // For now, we'll return JSON data
  res.status(200).json({
    success: true,
    message: 'Customer data exported successfully',
    count: customers.length,
    data: {
      customers,
      exportDate: new Date().toISOString(),
      exportedBy: req.user.name
    }
  });
});

// @desc    Bulk update customers
// @route   PATCH /api/customers/bulk
// @access  Private
const bulkUpdateCustomers = asyncHandler(async (req, res, next) => {
  const { customerIds, updates } = req.body;

  if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Customer IDs array is required'
    });
  }

  if (!updates || Object.keys(updates).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Updates object is required'
    });
  }

  // Build filter query
  let filter = { _id: { $in: customerIds } };

  // Role-based access control
  if (req.user.role !== 'admin') {
    filter.ownerId = req.user._id;
  }

  const result = await Customer.updateMany(filter, updates, {
    runValidators: true
  });

  res.status(200).json({
    success: true,
    message: `${result.modifiedCount} customers updated successfully`,
    data: {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    }
  });
});

module.exports = {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerStats,
  searchCustomers,
  exportCustomers,
  bulkUpdateCustomers
};
