const express = require('express');
const router = express.Router();
const Challenge = require('../models/Challenge');
const verifyToken = require('../middleware/auth');

// Create a new challenge
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, description, exerciseType, targetReps, startDate, endDate } = req.body;

    const challenge = new Challenge({
      title,
      description,
      exerciseType,
      targetReps,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      createdBy: req.user.uid,
      participants: [{
        userId: req.user.uid,
        username: req.user.email.split('@')[0],
        completedReps: 0
      }]
    });

    await challenge.save();
    res.status(201).json(challenge);
  } catch (error) {
    res.status(500).json({ message: 'Error creating challenge', error: error.message });
  }
});

// Get all active challenges
router.get('/', verifyToken, async (req, res) => {
  try {
    const challenges = await Challenge.find({
      status: 'active',
      endDate: { $gte: new Date() }
    }).sort({ startDate: 1 });
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching challenges', error: error.message });
  }
});

// Join a challenge
router.post('/:id/join', verifyToken, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    if (challenge.participants.some(p => p.userId === req.user.uid)) {
      return res.status(400).json({ message: 'Already participating in this challenge' });
    }

    challenge.participants.push({
      userId: req.user.uid,
      username: req.user.email.split('@')[0],
      completedReps: 0
    });

    await challenge.save();
    res.json(challenge);
  } catch (error) {
    res.status(500).json({ message: 'Error joining challenge', error: error.message });
  }
});

// Update challenge progress
router.put('/:id/progress', verifyToken, async (req, res) => {
  try {
    const { reps, accuracy, score } = req.body;
    const challenge = await Challenge.findById(req.params.id);
    
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    const participant = challenge.participants.find(p => p.userId === req.user.uid);
    if (!participant) {
      return res.status(400).json({ message: 'Not participating in this challenge' });
    }

    participant.completedReps += reps;
    participant.accuracy = accuracy;
    participant.score += score;
    participant.lastUpdated = new Date();

    await challenge.save();
    res.json(challenge);
  } catch (error) {
    res.status(500).json({ message: 'Error updating progress', error: error.message });
  }
});

module.exports = router; 