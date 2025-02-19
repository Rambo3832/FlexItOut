import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

function Challenges() {
  const { currentUser } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: '',
    exerciseType: 'pushup',
    targetReps: 100,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  const [showCreateForm, setShowCreateForm] = useState(false);



  const fetchChallenges = async () => {
    try {
      console.log('Fetching challenges...');
      const token = await currentUser.getIdToken();
      console.log('Got token for fetch:', token);
      
      const response = await axios.get('http://localhost:5000/challenges', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Fetched challenges:', response.data);
      setChallenges(response.data);
    } catch (error) {
      console.error('Error fetching challenges:', error.response?.data || error.message);
      alert('Failed to fetch challenges: ' + (error.response?.data?.message || error.message));
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    try {
      console.log('Creating challenge with data:', newChallenge);
      const token = await currentUser.getIdToken();
      console.log('Got token:', token);
      
      const response = await axios.post('http://localhost:5000/challenges', newChallenge, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Challenge created:', response.data);
      setShowCreateForm(false);
      fetchChallenges();
    } catch (error) {
      console.error('Error creating challenge:', error.response?.data || error.message);
      alert('Failed to create challenge: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleJoinChallenge = async (challengeId) => {
    try {
      await axios.post(`http://localhost:5000/challenges/${challengeId}/join`, {}, {
        headers: { Authorization: `Bearer ${await currentUser.getIdToken()}` }
      });
      fetchChallenges();
    } catch (error) {
      console.error('Error joining challenge:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Active Challenges</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {showCreateForm ? 'Cancel' : 'Create Challenge'}
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateChallenge} className="mb-8 space-y-4 bg-white p-6 rounded-lg shadow">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={newChallenge.title}
              onChange={(e) => setNewChallenge({...newChallenge, title: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={newChallenge.description}
              onChange={(e) => setNewChallenge({...newChallenge, description: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Exercise Type</label>
              <select
                value={newChallenge.exerciseType}
                onChange={(e) => setNewChallenge({...newChallenge, exerciseType: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="pushup">Push-ups</option>
                <option value="squat">Squats</option>
                <option value="lunges">Lunges</option>
                <option value="plank">Plank</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Target Reps</label>
              <input
                type="number"
                value={newChallenge.targetReps}
                onChange={(e) => setNewChallenge({...newChallenge, targetReps: parseInt(e.target.value)})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                min="1"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={newChallenge.startDate}
                onChange={(e) => setNewChallenge({...newChallenge, startDate: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                value={newChallenge.endDate}
                onChange={(e) => setNewChallenge({...newChallenge, endDate: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
          >
            Create Challenge
          </button>
        </form>
      )}

      <div className="space-y-4">
        {challenges.map((challenge) => (
          <div key={challenge._id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold">{challenge.title}</h3>
                <p className="text-gray-600">{challenge.description}</p>
              </div>
              {!challenge.participants.some(p => p.userId === currentUser.uid) && (
                <button
                  onClick={() => handleJoinChallenge(challenge._id)}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Join Challenge
                </button>
              )}
            </div>

            <div className="mt-4">
              <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Exercise:</span>{' '}
                  {challenge.exerciseType.charAt(0).toUpperCase() + challenge.exerciseType.slice(1)}
                </div>
                <div>
                  <span className="font-medium">Target:</span> {challenge.targetReps} reps
                </div>
                <div>
                  <span className="font-medium">Participants:</span> {challenge.participants.length}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-medium mb-2">Leaderboard</h4>
              <div className="space-y-2">
                {[...challenge.participants]
                  .sort((a, b) => b.score - a.score)
                  .map((participant, index) => (
                    <div key={participant.userId} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="w-6 text-gray-500">{index + 1}.</span>
                        <span className={participant.userId === currentUser.uid ? "font-bold" : ""}>
                          {participant.username}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">{participant.completedReps}</span> reps
                        <span className="ml-2 text-gray-500">({participant.accuracy}% accuracy)</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Challenges; 