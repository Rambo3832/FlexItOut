import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import Leaderboard from './Leaderboard';
import axios from 'axios';


function Dashboard() {
  const { currentUser } = useAuth();

  useEffect(() => {
    const registerUser = async () => {
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          await axios.post('http://localhost:5000/routes/auth/register', {
            email: currentUser.email,
            username: currentUser.email.split('@')[0], // Default username from email
            profile: {
              fitnessLevel: 'beginner'
            }
          }, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        } catch (error) {
          console.error('Error registering user:', error);
        }
      }
    };

    registerUser();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error logging out:", error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white mx-8 md:mx-0 shadow rounded-3xl sm:p-10">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h2 className="text-2xl font-bold mb-4">Welcome to FlexItOut!</h2>
                <p>Logged in as: {currentUser?.email}</p>
                <button 
                  onClick={handleLogout} 
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition duration-200 mt-4"
                >
                  Logout
                </button>
              </div>
              <Leaderboard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;