const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../secret'); 

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1]; // ✅ split "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // { id, email }
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};
