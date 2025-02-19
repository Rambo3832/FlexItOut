import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
  const { currentUser } = useAuth();

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-gray-800">
              FlexItOut
            </Link>
          </div>
          
          {currentUser && (
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-gray-700 hover:text-gray-900">
                Dashboard
              </Link>
              <Link to="/challenges" className="text-gray-700 hover:text-gray-900">
                Challenges
              </Link>
              <Link to="/profile" className="text-gray-700 hover:text-gray-900">
                Profile
              </Link>
              <Link to="/exercise" className="text-gray-700 hover:text-gray-900">
                Exercise
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;