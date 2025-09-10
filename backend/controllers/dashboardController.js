const Customer = require('../models/Customer');
const Lead = require('../models/Lead');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/error');

// @desc    Get dashboard overview
// @route   GET /api/dashboard
// @access  Private
const getDashboard = asyncHandler(async (req, res, next) => {
  // Build match query based on user role
  const isAdmin = req.user.role === 'admin';
  const userFilter = isAdmin ? {} : { ownerId: req.user._id };
  const leadFilter = isAdmin ? {} : { assignedTo: req.user._id };

  // Get current date info
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  // Customer metrics
  const totalCustomers = await Customer.countDocuments(userFilter);
  const activeCustomers = await Customer.countDocuments({ ...userFilter, status: 'active' });
  const newCustomersThisMonth = await Customer.countDocuments({
    ...userFilter,
    createdAt: { $gte: startOfMonth }
  });

  // Lead metrics
  const totalLeads = await Lead.countDocuments(leadFilter);
  const openLeads = await Lead.countDocuments({
    ...leadFilter,
    status: { $nin: ['Converted', 'Lost'] }
  });
  const convertedLeads = await Lead.countDocuments({ ...leadFilter, status: 'Converted' });
  const newLeadsThisMonth = await Lead.countDocuments({
    ...leadFilter,
    createdAt: { $gte: startOfMonth }
  });

  // Revenue metrics
  const totalValue = await Lead.aggregate([
    { $match: leadFilter },
    { $group: { _id: null, total: { $sum: '$value' } } }
  ]);

  const convertedValue = await Lead.aggregate([
    { $match: { ...leadFilter, status: 'Converted' } },
    { $group: { _id: null, total: { $sum: '$value' } } }
  ]);

  const pipelineValue = await Lead.aggregate([
    { $match: { ...leadFilter, status: { $nin: ['Converted', 'Lost'] } } },
    { $group: { _id: null, total: { $sum: { $multiply: ['$value', { $divide: ['$probability', 100] }] } } } }
  ]);

  // Overdue leads
  const overdueLeads = await Lead.countDocuments({
    ...leadFilter,
    expectedCloseDate: { $lt: new Date() },
    status: { $nin: ['Converted', 'Lost'] }
  });

  // Recent activities (last 10)
  const recentLeads = await Lead.find(leadFilter)
    .populate('customerId', 'name company')
    .populate('assignedTo', 'name')
    .sort('-createdAt')
    .limit(10)
    .select('title status value expectedCloseDate');

  // Lead status breakdown
  const leadStatusBreakdown = await Lead.aggregate([
    { $match: leadFilter },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$value' }
      }
    }
  ]);

  // Lead sources breakdown
  const leadSourcesBreakdown = await Lead.aggregate([
    { $match: leadFilter },
    {
      $group: {
        _id: '$source',
        count: { $sum: 1 },
        totalValue: { $sum: '$value' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // Top customers by lead value
  const topCustomers = await Customer.find(userFilter)
    .populate('ownerId', 'name')
    .sort('-totalLeadValue')
    .limit(5)
    .select('name company totalLeadValue leadsCount');

  // Upcoming follow-ups (next 7 days)
  const upcomingFollowUps = await Lead.find({
    ...leadFilter,
    nextFollowUp: {
      $gte: new Date(),
      $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    status: { $nin: ['Converted', 'Lost'] }
  })
    .populate('customerId', 'name company')
    .sort('nextFollowUp')
    .limit(10)
    .select('title nextFollowUp status');

  // Monthly performance for charts (last 6 months)
  const monthlyPerformance = await Lead.aggregate([
    {
      $match: {
        ...leadFilter,
        createdAt: {
          $gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
        }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        leadsCreated: { $sum: 1 },
        totalValue: { $sum: '$value' },
        conversions: {
          $sum: {
            $cond: [{ $eq: ['$status', 'Converted'] }, 1, 0]
          }
        },
        conversionValue: {
          $sum: {
            $cond: [{ $eq: ['$status', 'Converted'] }, '$value', 0]
          }
        }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // Conversion rate calculation
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  // Team performance (admin only)
  let teamPerformance = null;
  if (isAdmin) {
    teamPerformance = await User.aggregate([
      { $match: { role: 'user', isActive: true } },
      {
        $lookup: {
          from: 'leads',
          localField: '_id',
          foreignField: 'assignedTo',
          as: 'leads'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          totalLeads: { $size: '$leads' },
          convertedLeads: {
            $size: {
              $filter: {
                input: '$leads',
                cond: { $eq: ['$$this.status', 'Converted'] }
              }
            }
          },
          totalValue: { $sum: '$leads.value' },
          conversionRate: {
            $cond: [
              { $gt: [{ $size: '$leads' }, 0] },
              {
                $multiply: [
                  {
                    $divide: [
                      {
                        $size: {
                          $filter: {
                            input: '$leads',
                            cond: { $eq: ['$$this.status', 'Converted'] }
                          }
                        }
                      },
                      { $size: '$leads' }
                    ]
                  },
                  100
                ]
              },
              0
            ]
          }
        }
      },
      { $sort: { totalValue: -1 } },
      { $limit: 10 }
    ]);
  }

  res.status(200).json({
    success: true,
    data: {
      overview: {
        customers: {
          total: totalCustomers,
          active: activeCustomers,
          newThisMonth: newCustomersThisMonth
        },
        leads: {
          total: totalLeads,
          open: openLeads,
          converted: convertedLeads,
          newThisMonth: newLeadsThisMonth,
          overdue: overdueLeads,
          conversionRate
        },
        revenue: {
          totalValue: totalValue[0]?.total || 0,
          convertedValue: convertedValue[0]?.total || 0,
          pipelineValue: pipelineValue[0]?.total || 0
        }
      },
      charts: {
        leadStatusBreakdown,
        leadSourcesBreakdown,
        monthlyPerformance
      },
      lists: {
        recentLeads,
        topCustomers,
        upcomingFollowUps
      },
      ...(teamPerformance && { teamPerformance })
    }
  });
});

// @desc    Get sales funnel data
// @route   GET /api/dashboard/funnel
// @access  Private
const getSalesFunnel = asyncHandler(async (req, res, next) => {
  const leadFilter = req.user.role === 'admin' ? {} : { assignedTo: req.user._id };

  const funnelData = await Lead.aggregate([
    { $match: leadFilter },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$value' },
        avgValue: { $avg: '$value' }
      }
    },
    {
      $project: {
        status: '$_id',
        count: 1,
        totalValue: 1,
        avgValue: { $round: ['$avgValue', 2] }
      }
    }
  ]);

  // Define the sales funnel stages in order
  const stages = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Converted', 'Lost'];
  
  const organizedFunnel = stages.map(stage => {
    const stageData = funnelData.find(item => item.status === stage);
    return {
      stage,
      count: stageData?.count || 0,
      totalValue: stageData?.totalValue || 0,
      avgValue: stageData?.avgValue || 0
    };
  });

  res.status(200).json({
    success: true,
    data: {
      funnel: organizedFunnel
    }
  });
});

// @desc    Get revenue analytics
// @route   GET /api/dashboard/revenue
// @access  Private
const getRevenueAnalytics = asyncHandler(async (req, res, next) => {
  const leadFilter = req.user.role === 'admin' ? {} : { assignedTo: req.user._id };

  // Monthly revenue for the last 12 months
  const monthlyRevenue = await Lead.aggregate([
    {
      $match: {
        ...leadFilter,
        status: 'Converted',
        actualCloseDate: {
          $gte: new Date(new Date().setMonth(new Date().getMonth() - 12))
        }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$actualCloseDate' },
          month: { $month: '$actualCloseDate' }
        },
        revenue: { $sum: '$value' },
        deals: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // Revenue by source
  const revenueBySource = await Lead.aggregate([
    {
      $match: {
        ...leadFilter,
        status: 'Converted'
      }
    },
    {
      $group: {
        _id: '$source',
        revenue: { $sum: '$value' },
        deals: { $sum: 1 },
        avgDealSize: { $avg: '$value' }
      }
    },
    { $sort: { revenue: -1 } }
  ]);

  // Top deals (converted)
  const topDeals = await Lead.find({
    ...leadFilter,
    status: 'Converted'
  })
    .populate('customerId', 'name company')
    .sort('-value')
    .limit(10)
    .select('title value actualCloseDate');

  // Revenue forecast (weighted pipeline value)
  const forecast = await Lead.aggregate([
    {
      $match: {
        ...leadFilter,
        status: { $nin: ['Converted', 'Lost'] }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$expectedCloseDate' },
          month: { $month: '$expectedCloseDate' }
        },
        potentialRevenue: { $sum: '$value' },
        weightedRevenue: { $sum: { $multiply: ['$value', { $divide: ['$probability', 100] }] } },
        deals: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    { $limit: 6 } // Next 6 months
  ]);

  res.status(200).json({
    success: true,
    data: {
      monthlyRevenue,
      revenueBySource,
      topDeals,
      forecast
    }
  });
});

// @desc    Get activity feed
// @route   GET /api/dashboard/activity
// @access  Private
const getActivityFeed = asyncHandler(async (req, res, next) => {
  const leadFilter = req.user.role === 'admin' ? {} : { assignedTo: req.user._id };

  // Recent lead activities
  const recentActivities = await Lead.aggregate([
    { $match: leadFilter },
    { $unwind: '$activities' },
    { $sort: { 'activities.date': -1 } },
    { $limit: 20 },
    {
      $lookup: {
        from: 'customers',
        localField: 'customerId',
        foreignField: '_id',
        as: 'customer'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'activities.userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $project: {
        type: '$activities.type',
        description: '$activities.description',
        date: '$activities.date',
        leadTitle: '$title',
        customerName: { $arrayElemAt: ['$customer.name', 0] },
        userName: { $arrayElemAt: ['$user.name', 0] }
      }
    }
  ]);

  // Recent status changes
  const recentStatusChanges = await Lead.find(leadFilter)
    .populate('customerId', 'name company')
    .populate('assignedTo', 'name')
    .sort('-updatedAt')
    .limit(10)
    .select('title status updatedAt');

  res.status(200).json({
    success: true,
    data: {
      recentActivities,
      recentStatusChanges
    }
  });
});

module.exports = {
  getDashboard,
  getSalesFunnel,
  getRevenueAnalytics,
  getActivityFeed
};
