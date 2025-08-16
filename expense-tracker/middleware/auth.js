const jwt = require("jsonwebtoken");
require("dotenv").config();

const { SECRET_KEY } = process.env;

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, error: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1]; // ✅ split "Bearer <token>"
    const decoded = jwt.verify(token, SECRET_KEY);

    req.user = decoded; // { id, email }
    next();
  } catch (err) {
    return res.status(403).json({ success: false, error: "Invalid or expired token" });
  }
};
