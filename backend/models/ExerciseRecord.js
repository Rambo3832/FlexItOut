// models/ExerciseRecord.js
const mongoose = require('mongoose');

const exerciseRecordSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true // Add index for better query performance
  },
  exerciseType: {
    type: String,
    required: true,
    enum: ['pushup', 'squat'] // Restrict to valid exercise types
  },
  reps: {
    type: Number,
    required: true,
    min: 0
  },
  accuracy: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  score: {
    type: Number,
    required: true,
    min: 0
  },
  duration: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  // Add timestamps for createdAt and updatedAt
  timestamps: true,
  // Transform _id to id in JSON responses
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
    }
  }
});



// });

// // Add a pre-save middleware to validate data
// exerciseRecordSchema.pre('save', function(next) {
//   if (this.reps < 0) this.reps = 0;
//   if (this.accuracy < 0) this.accuracy = 0;
//   if (this.accuracy > 100) this.accuracy = 100;
//   if (this.score < 0) this.score = 0;
//   next();
// });

module.exports = mongoose.model('ExerciseRecord', exerciseRecordSchema);