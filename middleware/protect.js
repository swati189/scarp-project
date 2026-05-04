const protect = (req, res, next) => {
  try {
    // temporary simple middleware (no JWT for now)
    req.user = { id: "dummyUser" };
    next();
  } catch (error) {
    res.status(401).json({ message: "Not authorized" });
  }
};

module.exports = { protect };