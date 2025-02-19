// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');  // Added for handling Cross-Origin Resource Sharing
const authRoutes = require('./routes/auth');
const exerciseRoutes = require('./routes/exercise');
const challengeRoutes = require('./routes/challenges');
const User = require('./models/User');

const leaderboardRoutes = require('./routes/leaderboard'); // Import leaderboard routes

require('dotenv').config(); // Load environment variables from .env file

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());  // Enable CORS for all routes
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use('/challenges', challengeRoutes);

// MongoDB Connection with SSL options
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  family: 4, // Use IPv4, skip trying IPv6
  replicaSet: 'atlas-nij53x-shard-0', // Your replica set name from the error
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

const connection = mongoose.connection;
connection.once('open', async () => {
  console.log("MongoDB database connection established successfully");

  try {
    // Test write operation
    const testDoc = new ExerciseRecord({
      userId: 'test',
      exerciseType: 'pushup',
      reps: 1,
      accuracy: 100,
      score: 100
    });
    await testDoc.save();
    console.log('Test document written successfully');
    await ExerciseRecord.deleteOne({ userId: 'test' });
  } catch (error) {
    console.error('Test write failed:', error);
  }
});

const user = require('./models/User');

// Add this after your middleware setup but before other routes
const ExerciseRecord = require('./models/ExerciseRecord');

// Test route
app.post('/test-connection', async (req, res) => {
    try {
        // 1. Test database connection
        const dbState = mongoose.connection.readyState;
        console.log('Database connection state:', dbState);
        // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting

        // 2. Test creating and saving a document
        const testRecord = new ExerciseRecord({
            userId: 'test-user',
            exerciseType: 'pushup',
            reps: 10,
            accuracy: 95,
            score: 950,
            duration: 60
        });

        const savedRecord = await testRecord.save();
        console.log('Test record saved:', savedRecord);

        // 3. Test retrieving the document
        const foundRecord = await ExerciseRecord.findById(savedRecord._id);
        console.log('Found record:', foundRecord);

        // 4. Clean up test data
        await ExerciseRecord.findByIdAndDelete(savedRecord._id);
        console.log('Test record cleaned up');

        res.json({
            success: true,
            connectionState: dbState,
            testRecord: savedRecord
        });
    } catch (error) {
        console.error('Test failed:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
});

// Routes
app.use('/routes/auth', authRoutes);
app.use('/routes/exercise', exerciseRoutes);
app.use('/routes/challenges', challengeRoutes);
app.use('/leaderboard', leaderboardRoutes); // Use leaderboard routes

// app.use('/auth', authRoutes);
// app.use('/exercises', exerciseRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: 'Internal server error', 
    error: err.message 
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});

// After MongoDB connection
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.once('open', () => {
  console.log('MongoDB connected successfully');
  // List all collections
  mongoose.connection.db.listCollections().toArray((err, collections) => {
    if (err) {
      console.error('Error listing collections:', err);
    } else {
      console.log('Available collections:', collections.map(c => c.name));
    }
  });
});




// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//     firebaseUID: {
//         type: String,
//         required: true,
//         unique: true
//     },
//     email: {
//         type: String,
//         required: true,
//         unique: true
//     },
//     username: {
//         type: String,
//         required: true,
//         unique: true
//     },
//     profile: {
//         height: Number,
//         weight: Number,
//         fitnessLevel: {
//             type: String,
//             enum: ['beginner', 'intermediate', 'advanced'],
//             default: 'beginner'
//         }
//     },
//     exerciseStats: {
//         totalWorkouts: { type: Number, default: 0 },
//         totalExercises: { type: Number, default: 0 },
//         points: { type: Number, default: 0 }
//     },
//     createdAt: {
//         type: Date,
//         default: Date.now
//     }
// });

// module.exports = mongoose.model('User', userSchema);



// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// require("dotenv").config();

// const app = express();
// app.use(cors());
// app.use(express.json());

// const PORT = process.env.PORT || 5000;
// const MONGO_URI = process.env.MONGO_URI;

// // Connect to MongoDB
// mongoose
//   .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => console.log("MongoDB Connected"))
//   .catch((err) => console.error(err));

// // Test API route
// app.get("/", (req, res) => {
//   res.send("Backend is running!");
// });

// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
