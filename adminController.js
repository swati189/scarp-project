const User = require('../models/User');
const Request = require('../models/Request');
const Collector = require('../models/Collector');
const Recycler = require('../models/Recycler');
const Transaction = require('../models/Transaction');

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private (admin)
const getDashboardStats = async (req, res, next) => {
  try {
    const [totalUsers, totalCollectors, totalRecyclers, totalRequests] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Collector.countDocuments(),
      Recycler.countDocuments(),
      Request.countDocuments(),
    ]);

    const statusCounts = await Request.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const scrapTypeCounts = await Request.aggregate([
      { $group: { _id: '$scrapType', count: { $sum: 1 } } }
    ]);

    const recentRequests = await Request.find()
      .populate('userId', 'name email')
      .populate('collectorId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const totalRevenue = await Transaction.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalCollectors,
        totalRecyclers,
        totalRequests,
        statusCounts: statusCounts.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {}),
        scrapTypeCounts: scrapTypeCounts.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {}),
        recentRequests,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (admin)
const getAllUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({ success: true, users, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/toggle
// @access  Private (admin)
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot deactivate admin' });

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, isActive: user.isActive });
  } catch (error) {
    next(error);
  }
};

// @desc    Change user role (admin)
// @route   PUT /api/admin/users/:id/role
// @access  Private (admin)
const changeUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const allowedRoles = ['user', 'collector', 'recycler', 'admin'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.status(200).json({ success: true, message: 'Role updated', user });
  } catch (error) {
    next(error);
  }
};

// @desc    Get transactions
// @route   GET /api/admin/transactions
// @access  Private (admin)
const getTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const transactions = await Transaction.find()
      .populate('userId', 'name email')
      .populate('collectorId', 'name email')
      .populate('recyclerId', 'name')
      .populate('requestId', 'scrapType status')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments();

    res.status(200).json({ success: true, transactions, total });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats, getAllUsers, toggleUserStatus, changeUserRole, getTransactions };
