import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award } from 'lucide-react';
import axios from 'axios';

const Leaderboard = () => {
  const [timeFilter, setTimeFilter] = useState('weekly');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboardData();
  }, [timeFilter]);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/leaderboard/${timeFilter}`);
      setLeaderboardData(response.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index) => {
    switch(index) {
      case 0:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 1:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 2:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center font-bold">{index + 1}</span>;
    }
  };

  if (loading) {
    return <div className="text-center p-4">Loading leaderboard...</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Fitness Leaderboard</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setTimeFilter('weekly')}
            className={`px-3 py-1 rounded ${
              timeFilter === 'weekly' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Weekly
          </button>
          <button 
            onClick={() => setTimeFilter('monthly')}
            className={`px-3 py-1 rounded ${
              timeFilter === 'monthly' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Monthly
          </button>
          <button 
            onClick={() => setTimeFilter('allTime')}
            className={`px-3 py-1 rounded ${
              timeFilter === 'allTime' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {leaderboardData.map((user, index) => (
          <div 
            key={user._id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-4">
              {getRankIcon(index)}
              <div>
                <h3 className="font-semibold">{user.username}</h3>
                <p className="text-sm text-gray-600">
                  {user.exerciseCount} exercises • {user.accuracy}% accuracy
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-bold text-lg">{user.totalScore}</p>
                <p className="text-sm text-gray-600">{user.streak} day streak</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;