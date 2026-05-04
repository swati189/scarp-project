const protect = (req, res, next) => {
  try {
    // abhi ke liye simple pass-through middleware
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized' });
  }
};

module.exports = { protect };