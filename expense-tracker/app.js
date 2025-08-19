const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require("dotenv").config();

const signupRoutes = require('./routes/signupRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const orderRoutes = require('./routes/orderRoutes');
const premiumexpenseRoutes = require('./routes/premiumexpenseRoutes');

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/auth', signupRoutes);                 // Signup & Login
app.use('/api/expenses', expenseRoutes);            // Normal expenses
app.use('/api/order', orderRoutes);                 // Payments
app.use('/api/premiumexpenses', premiumexpenseRoutes); // Premium expenses + leaderboard

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
