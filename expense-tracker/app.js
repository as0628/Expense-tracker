const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require("dotenv").config();

const signupRoutes = require('./routes/signupRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const orderRoutes = require('./routes/orderRoutes');
const premiumexpenseRoutes = require('./routes/premiumexpenseRoutes');
const passwordRoutes = require("./routes/passwordRoutes");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true })); // <--- ADD THIS

// Routes
app.use('/api/auth', signupRoutes);                 
app.use('/api/expenses', expenseRoutes);            
app.use('/api/order', orderRoutes);                 
app.use('/api/premiumexpenses', premiumexpenseRoutes); 
app.use("/password", passwordRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
