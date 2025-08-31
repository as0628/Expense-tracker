const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const signupRoutes = require("./routes/signupRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const orderRoutes = require("./routes/orderRoutes");
const premiumexpenseRoutes = require("./routes/premiumexpenseRoutes");
const passwordRoutes = require("./routes/passwordRoutes");

const app = express();

// ===== Middlewares =====
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Morgan Logger → save logs in "access.log"
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);
app.use(morgan("combined", { stream: accessLogStream }));

// ===== Routes =====
app.use("/api/auth", signupRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/premiumexpenses", premiumexpenseRoutes);
app.use("/password", passwordRoutes);

// ===== Centralized Error Handler =====
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ===== Start Server =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
