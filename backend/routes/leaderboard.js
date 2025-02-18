// backend/routes/leaderboard.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get leaderboard data
router.get('/:timeFrame', async (req, res) => {
  try {
    const { timeFrame } = req.params;
    let query = {};
    
    // Add time-based filtering if needed
    if (timeFrame === 'weekly') {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      query.lastExerciseDate = { $gte: lastWeek };
    } else if (timeFrame === 'monthly') {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      query.lastExerciseDate = { $gte: lastMonth };
    }

    const leaderboard = await User.find(query)
      .sort({ totalScore: -1 })
      .limit(10)
      .select('username totalScore exerciseCount accuracy streak');

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;