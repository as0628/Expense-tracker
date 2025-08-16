const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const signupRoutes = require('./routes/signupRoutes');
const expenseRoutes = require('./routes/expenseRoutes');

const app = express(); // ✅ Create app first

app.use(cors()); // ✅ Now you can use it
app.use(bodyParser.json());

app.use('/api/auth', signupRoutes);
app.use('/api/expenses', expenseRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
