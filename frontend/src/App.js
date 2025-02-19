import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import Profile from './components/Profile';
import Navbar from './components/Navbar';
import ExerciseDetection from './components/ExerciseDetection';
import Challenges from './components/Challenges';

function App() {
    return (
        <Router>
            <AuthProvider>
                <div className="min-h-screen bg-gray-100">
                  <Navbar />
                    <Routes>
                        <Route path="/login" element={<Auth />} />
                        <Route
                            path="/"
                            element={
                                <PrivateRoute>
                                    <Dashboard />
                                </PrivateRoute>
                            }
                        />
                         <Route
                            path="/profile"
                            element={
                                <PrivateRoute>
                                    <Profile />
                                </PrivateRoute>
                            }
                        />
                        <Route
                          path="/exercise"
                          element={
                            <PrivateRoute>
                              <ExerciseDetection />
                            </PrivateRoute>
                          }
                        />
                        <Route
                        path="/challenges"
                            element={
                                <PrivateRoute>
                                    <Challenges />
                                </PrivateRoute>
                            }
                        />
                        
                    </Routes>
                </div>
            </AuthProvider>
        </Router>
    );
}

export default App;

// import { useEffect, useState } from "react";

// function App() {
//   const [message, setMessage] = useState("");

//   useEffect(() => {
//     fetch("http://localhost:5000/")
//       .then((res) => res.text())
//       .then((data) => setMessage(data));
//   }, []);

//   return (
//     <div className="flex items-center justify-center h-screen text-xl font-bold">
//       {message || "Loading..."}
//     </div>
//   );
// }

// export default App;

