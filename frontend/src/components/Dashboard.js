import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import Leaderboard from './Leaderboard';
import axios from 'axios';
import { Activity, Award, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

function Dashboard() {
  const { currentUser } = useAuth();
  const [userStats, setUserStats] = useState({
    totalWorkouts: 0,
    totalExercises: 0,
    points: 0,
    rank: 0
  });

  useEffect(() => {
    const fetchUserStats = async () => {
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          const response = await axios.get('http://localhost:5000/routes/auth/profile', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUserStats(response.data.exerciseStats);
        } catch (error) {
          console.error('Error fetching user stats:', error);
        }
      }
    };

    fetchUserStats();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error logging out:", error.message);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-xl shadow-md p-6 transition-transform hover:transform hover:scale-105">
      <div className={`inline-flex items-center justify-center p-3 rounded-lg ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h3 className="text-lg font-semibold mt-4">{title}</h3>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {currentUser?.email?.split('@')[0]}!
          </h1>
          <p className="mt-2 text-gray-600">
            Track your fitness journey and compete with others
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Workouts"
            value={userStats.totalWorkouts}
            icon={Activity}
            color="bg-blue-500"
          />
          <StatCard
            title="Exercises Done"
            value={userStats.totalExercises}
            icon={Award}
            color="bg-green-500"
          />
          <StatCard
            title="Total Points"
            value={userStats.points}
            icon={TrendingUp}
            color="bg-purple-500"
          />
          <StatCard
            title="Global Rank"
            value={userStats.rank || '-'}
            icon={Users}
            color="bg-orange-500"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <Link
                to="/exercise"
                className="flex items-center justify-center px-4 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                Start Workout
              </Link>
              <Link
                to="/challenges"
                className="flex items-center justify-center px-4 py-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
              >
                View Challenges
              </Link>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            {/* Add recent activity component here */}
            <p className="text-gray-600">No recent activities</p>
          </div>
        </div>

        {/* Leaderboard Section */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">Global Leaderboard</h2>
          <Leaderboard />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;