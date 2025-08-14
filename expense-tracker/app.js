const express = require('express');
const bodyParser = require('body-parser');
const signupRoutes = require('./routes/signupRoutes');

const app = express();
app.use(bodyParser.json());

app.use('/api/auth', signupRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
