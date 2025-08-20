const mysql = require('mysql2');
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Root@0697',
  database: 'expense_tracker'
}).promise(); // <- add .promise() here

db.connect(err => {
  if (err) {
    console.error('DB connection error:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL database');
});

module.exports = db;
