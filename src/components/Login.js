import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import loginImage from '../assests/login.png'; 
import logo from '../assests/logo.png';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [isResetMode, setIsResetMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Add state for password visibility
  const navigate = useNavigate();

  // Handle sign-in with Supabase
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Use email as username for Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      });

      if (error) throw error;
      
      console.log('Login successful:', data);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error during login:', error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset request
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      // Send password reset email through Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(username, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      
      setMessage('Password reset instructions sent to your email.');
    } catch (error) {
      console.error('Error requesting password reset:', error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle between login and password reset views
  const toggleResetMode = () => {
    setIsResetMode(!isResetMode);
    setError(null);
    setMessage(null);
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      {/* Add the logo at the top left */}
      <div className="company-logo">
        <img src={logo} alt="Company Logo" />
      </div>
      
      <div className="login-form-container">
        <div className="login-form-wrapper">
          {!isResetMode ? (
            // Login Form
            <>
              <h1>Welcome Back</h1>
              <p className="login-subtitle">Please enter your credentials to log in</p>
              
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label htmlFor="username">Email</label>
                  <input
                    type="email"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <div className="password-input-container">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                    <button 
                      type="button" 
                      className="password-toggle-btn"
                      onClick={togglePasswordVisibility}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <i className="password-eye-icon">👁️</i>
                      ) : (
                        <i className="password-eye-icon">👁️‍🗨️</i>
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="forgot-password">
                  <a href="#" onClick={(e) => {
                    e.preventDefault();
                    toggleResetMode();
                  }}>Forgot Password?</a>
                </div>
                
                <button 
                  type="submit" 
                  className="login-button"
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
                
                {error && <div className="error-message">{error}</div>}
              </form>
            </>
          ) : (
            // Password Reset Form
            <>
              <h1>Reset Password</h1>
              <p className="login-subtitle">Enter your email to receive a password reset link</p>
              
              <form onSubmit={handlePasswordReset}>
                <div className="form-group">
                  <label htmlFor="reset-email">Email</label>
                  <input
                    type="email"
                    id="reset-email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="login-button"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
                
                <div className="back-to-login">
                  <a href="#" onClick={(e) => {
                    e.preventDefault();
                    toggleResetMode();
                  }}>Back to Login</a>
                </div>
                
                {error && <div className="error-message">{error}</div>}
                {message && <div className="success-message">{message}</div>}
              </form>
            </>
          )}
        </div>
      </div>
      
      <div className="login-image-container">
        <img src={loginImage} alt="Login" className="login-image" />
      </div>
    </div>
  );
}

export default Login;