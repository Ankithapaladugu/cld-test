import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import './Login.css'; // Reuse the login styles

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  // Check if user is authenticated on page load
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      
      // If no session, redirect to login
      
    };
    
    checkSession();
  }, [navigate]);

  // Function to check password requirements
  const validatePassword = (password) => {
    const minLength = 6;
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    if (password.length < minLength) {
      return "Password must be at least 6 characters long";
    }
    
    if (!hasLowerCase) {
      return "Password must include at least one lowercase letter";
    }
    
    if (!hasUpperCase) {
      return "Password must include at least one uppercase letter";
    }
    
    if (!hasDigit) {
      return "Password must include at least one number";
    }
    
    if (!hasSymbol) {
      return "Password must include at least one special character";
    }
    
    return null; // No error
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Toggle confirm password visibility
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Update password using Supabase
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) throw error;
      
      setMessage('Password has been reset successfully. Redirecting to login...');
      
      // Sign out the user
      await supabase.auth.signOut();
      
      // Redirect to login page after successful password reset
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error) {
      console.error('Error resetting password:', error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-container">
        <div className="login-form-wrapper">
          <h1>Reset Your Password</h1>
          <p className="login-subtitle">Please enter a new password for your account</p>
          
          <form onSubmit={handlePasswordReset}>
            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your new password"
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
              <div className="password-requirements">
                <small>Password must be at least 6 characters and include:</small>
                <ul>
                  <li className={/[a-z]/.test(password) ? "requirement-met" : ""}>Lowercase letter</li>
                  <li className={/[A-Z]/.test(password) ? "requirement-met" : ""}>Uppercase letter</li>
                  <li className={/\d/.test(password) ? "requirement-met" : ""}>Number</li>
                  <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? "requirement-met" : ""}>Special character</li>
                </ul>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-input-container">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  required
                />
                <button 
                  type="button" 
                  className="password-toggle-btn"
                  onClick={toggleConfirmPasswordVisibility}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <i className="password-eye-icon">👁️</i>
                  ) : (
                    <i className="password-eye-icon">👁️‍🗨️</i>
                  )}
                </button>
              </div>
            </div>
            
            <button 
              type="submit" 
              className="login-button"
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            
            <div className="back-to-login">
              <a href="#" onClick={(e) => {
                e.preventDefault();
                navigate('/login');
              }}>Back to Login</a>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;