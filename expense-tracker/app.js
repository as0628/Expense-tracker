const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const signupRoutes = require('./routes/signupRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const orderRoutes = require('./routes/orderRoutes'); // ✅ add premium routes

const app = express(); // ✅ Create app first

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/auth', signupRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/order', orderRoutes); // ✅ mount premium routes

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
