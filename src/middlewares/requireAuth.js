const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'No valid token, authorization denied' });

  try {
    const decoded = jwt.verify(token, 'MY_SECRET_KEY');
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ msg: 'Token is not valid' });
  }
};
