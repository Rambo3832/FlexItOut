const router = require('express').Router();
const ExerciseRecord = require('../models/ExerciseRecord');
const verifyToken = require('../middleware/auth'); // Ensure correct import

router.post('/record', verifyToken, async (req, res) => {
  try {
    const { exerciseType, reps, accuracy, score, duration } = req.body;
    
    // Validate required fields
    if (!exerciseType || !reps || !accuracy || !score) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['exerciseType', 'reps', 'accuracy', 'score']
      });
    }

    const record = new ExerciseRecord({
      userId: req.user.uid,
      exerciseType,
      reps,
      accuracy,
      score,
      duration: duration || 0
    });

    const savedRecord = await record.save();
    console.log('Exercise record saved:', savedRecord);
    
    res.status(201).json(savedRecord);
  } catch (error) {
    console.error('Error saving exercise record:', error);
    res.status(500).json({ 
      error: 'Failed to save exercise record',
      details: error.message 
    });
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
