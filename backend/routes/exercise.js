const router = require('express').Router();
const ExerciseRecord = require('../models/ExerciseRecord');
const verifyToken = require('../middleware/auth'); // Ensure correct import

router.post('/record', verifyToken, async (req, res) => {
  try {
    const { exerciseType, reps, accuracy, score, duration } = req.body;
    const record = new ExerciseRecord({
      userId: req.user.uid,
      exerciseType,
      reps,
      accuracy,
      score,
      duration
    });
    await record.save();
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/history', verifyToken, async (req, res) => {
  try {
    const records = await ExerciseRecord.find({ userId: req.user.uid })
      .sort({ timestamp: -1 })
      .limit(10);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; // Ensure the router is properly exported
