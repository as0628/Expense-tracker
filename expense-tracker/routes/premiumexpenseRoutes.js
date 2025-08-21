const express = require('express');
const router = express.Router();
const { 
  getPremiumExpenses, 
  addPremiumExpense, 
  updatePremiumExpense, 
  deletePremiumExpense,
  getLeaderboard,getReport
} = require('../controllers/premiumexpenseController');
const auth = require('../middleware/auth'); // middleware to verify token

// Premium expenses CRUD
router.get('/', auth, getPremiumExpenses);
router.post('/', auth, addPremiumExpense);
router.put('/:id', auth, updatePremiumExpense);
router.delete('/:id', auth, deletePremiumExpense);
router.get('/report', auth, getReport);


// Leaderboard route
router.get('/leaderboard', auth, getLeaderboard);

module.exports = router;
