const express = require('express');
const router = express.Router();
const { 
  getPremiumExpenses, 
  addPremiumExpense, 
  updatePremiumExpense, 
  deletePremiumExpense,
  getLeaderboard,getReport,downloadReport,getExportHistory
} = require('../controllers/premiumexpenseController');
const auth = require('../middleware/auth'); 

router.get('/', auth, getPremiumExpenses);
router.post('/', auth, addPremiumExpense);
router.put('/:id', auth, updatePremiumExpense);
router.delete('/:id', auth, deletePremiumExpense);
router.get('/report', auth, getReport);
router.get("/download", auth, downloadReport);
router.get('/leaderboard', auth, getLeaderboard);
router.get("/history", auth, getExportHistory);


module.exports = router;
