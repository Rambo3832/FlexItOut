const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firebaseUID: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    profile: {
        height: Number,
        weight: Number,
        fitnessLevel: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced'],
            default: 'beginner'
        }
    },
    exerciseStats: {
        totalWorkouts: { type: Number, default: 0 },
        totalExercises: { type: Number, default: 0 },
        points: { type: Number, default: 0 }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);

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
