import { useState } from "react";
import { auth } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";

function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isResetMode, setIsResetMode] = useState(false);

  const handleSignup = async () => {
    try {
      setError("");
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
    } catch (error) {
      let errorMessage = "An error occurred during sign up";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "Email already in use";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password should be at least 6 characters";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email address";
      }
      setError(errorMessage);
      console.error(error.message);
    }
  };

  const handleLogin = async () => {
    try {
      setError("");
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
    } catch (error) {
      let errorMessage = "An error occurred during login";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = "Invalid email or password";
      }
      setError(errorMessage);
      console.error(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      setError("");
      await signOut(auth);
      setUser(null);
    } catch (error) {
      setError("Error logging out");
      console.error(error.message);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    try {
      setError("");
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent! Please check your inbox.");
      setIsResetMode(false);
    } catch (error) {
      let errorMessage = "Failed to send password reset email";
      if (error.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email address";
      }
      setError(errorMessage);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{message}</span>
        </div>
      )}
      
      {user ? (
        <div className="text-center">
          <h2 className="mb-4">Welcome, {user.email}</h2>
          <button 
            onClick={handleLogout} 
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition duration-200"
          >
            Logout
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 w-full max-w-md p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-center mb-4">
            {isResetMode ? "Reset Password" : "Login or Sign Up"}
          </h2>
          
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {!isResetMode && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}

          {isResetMode ? (
            <>
              <button 
                onClick={handlePasswordReset}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition duration-200"
              >
                Send Reset Link
              </button>
              <button 
                onClick={() => setIsResetMode(false)}
                className="text-gray-600 hover:text-gray-800 transition duration-200"
              >
                Back to Login
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={handleSignup}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition duration-200"
              >
                Sign Up
              </button>
              <button 
                onClick={handleLogin}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition duration-200"
              >
                Login
              </button>
              <button 
                onClick={() => setIsResetMode(true)}
                className="text-blue-500 hover:text-blue-700 transition duration-200"
              >
                Forgot Password?
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Auth;