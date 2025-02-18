// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');  // Added for handling Cross-Origin Resource Sharing
const authRoutes = require('./routes/auth');
const exerciseRoutes = require('./routes/exercise');


const leaderboardRoutes = require('./routes/leaderboard'); // Import leaderboard routes

require('dotenv').config(); // Load environment variables from .env file

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());  // Enable CORS for all routes
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// MongoDB Connection
const uri = process.env.ATLAS_URI;
mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // useCreateIndex: true,  // needed for older versions of mongoose
    // useFindAndModify: false // needed for older versions of mongoose
})
.then(() => console.log('MongoDB database connection established successfully'))
.catch(err => console.log(err));

const connection = mongoose.connection;
connection.once('open', () => {
  console.log("MongoDB database connection established successfully");
})

// Routes
app.use('/auth', authRoutes);
app.use('/exercises', exerciseRoutes);
app.use('/leaderboard', leaderboardRoutes); // Use leaderboard routes


app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
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
