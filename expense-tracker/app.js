const express = require("express");
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

const app = express();//create app instance
app.use(cors());    //enables CORS globally                   
app.use(express.json());//middleware that parses JSON request bodies
app.use(express.urlencoded({ extended: true })); //middleware that parses URL-encoded bodies

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);// Open (or create) a file named "access.log" in this folder.
// "flags: 'a'" means append mode → new logs will be added
// at the end of the file instead of deleting old ones.


app.use(morgan("combined", { stream: accessLogStream })); // Log every HTTP request in "combined" format and save it to access.log

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/signup.html"));
});


app.use("/api/auth", signupRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/premiumexpenses", premiumexpenseRoutes);
app.use("/password", passwordRoutes);


app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
