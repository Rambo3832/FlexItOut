// models/ExerciseRecord.js
const mongoose = require('mongoose');

const exerciseRecordSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  exerciseType: {
    type: String,
    required: true
  },
  reps: {
    type: Number,
    required: true
  },
  accuracy: {
    type: Number,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  duration: Number,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ExerciseRecord', exerciseRecordSchema);