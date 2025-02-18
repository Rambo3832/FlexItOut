// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const verifyToken = require('../middleware/auth');

// Helper function to update user stats
const updateUserStats = async (userId, score, accuracy) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.log(`User not found with ID: ${userId}`);
      return;
    }

    // Update total score, exercise count, and recalculate accuracy
    user.exerciseStats.points += score;
    user.exerciseStats.totalExercises += 1;

    // Update accuracy (can be improved with more sophisticated logic)
    user.exerciseStats.accuracy = accuracy;

    await user.save();
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
};

// Register or update user
router.post('/register', verifyToken, async (req, res) => {
  try {
    const { username, email, profile } = req.body;
    const firebaseUID = req.user.uid;

    // Check if user already exists
    let user = await User.findOne({ firebaseUID });

    if (user) {
      // Update existing user
      user = await User.findOneAndUpdate(
        { firebaseUID },
        {
          email,
          username,
          profile,
        },
        { new: true }
      );
    } else {
      // Create new user
      user = new User({
        firebaseUID,
        email,
        username,
        profile,
      });
      await user.save();
    }

    res.json(user);
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Profile Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { username, profile } = req.body;
    const user = await User.findOneAndUpdate(
      { firebaseUID: req.user.uid },
      {
        username,
        profile,
      },
      { new: true }
    );
    res.json(user);
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Post endpoint to update user stats
router.post('/updateStats', verifyToken, async (req, res) => {
  try {
    // Extract data from request body
    const { score, accuracy } = req.body;

    // Get the user ID from the verified token
    const userId = req.user.uid;

    // Call the helper function to update user stats
    await updateUserStats(userId, score, accuracy);

    // Respond with a success message
    res.status(200).json({ message: 'User stats updated successfully' });
  } catch (error) {
    console.error('Error in /updateStats endpoint:', error);
    res.status(500).json({ message: 'Failed to update user stats', error: error.message });
  }
});

module.exports = router;


// // backend/routes/auth.js
// const express = require('express');
// const router = express.Router();
// const User = require('../models/User');
// const verifyToken = require('../middleware/auth');

// // Register or update user
// router.post('/register', verifyToken, async (req, res) => {
//   try {
//     const { username, email, profile } = req.body;
//     const firebaseUID = req.user.uid;

//     // Check if user already exists
//     let user = await User.findOne({ firebaseUID });

//     if (user) {
//       // Update existing user
//       user = await User.findOneAndUpdate(
//         { firebaseUID },
//         {
//           email,
//           username,
//           profile,
//         },
//         { new: true }
//       );
//     } else {
//       // Create new user
//       user = new User({
//         firebaseUID,
//         email,
//         username,
//         profile,
//       });
//       await user.save();
//     }

//     res.json(user);
//   } catch (error) {
//     console.error('Register Error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });

// // Get user profile
// router.get('/profile', verifyToken, async (req, res) => {
//   try {
//     const user = await User.findOne({ firebaseUID: req.user.uid });
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }
//     res.json(user);
//   } catch (error) {
//     console.error('Profile Error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });

// // Update user profile
// router.put('/profile', verifyToken, async (req, res) => {
//   try {
//     const { username, profile } = req.body;
//     const user = await User.findOneAndUpdate(
//       { firebaseUID: req.user.uid },
//       {
//         username,
//         profile,
//       },
//       { new: true }
//     );
//     res.json(user);
//   } catch (error) {
//     console.error('Update Profile Error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });

// module.exports = router;