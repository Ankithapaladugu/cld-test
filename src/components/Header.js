import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import './Header.css';
import logo from '../assests/logo.png';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const Header = ({ userEmail }) => {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error.message);
    }
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  return (
    <header className="app-header">
      <div className="header-logo">
        <img src={logo} alt="Company Logo" />
      </div>
      
      {/* Header spacer to replace search bar and maintain layout */}
      <div className="header-spacer"></div>
      
      <div className="header-actions">
        {/* Voice Assistant with improved icon */}
        <div className="voice-assistant">
          <button className="icon-button" title="Voice Assistant">
            <span className="assistant-icon">🎙️</span>
          </button>
        </div>

        {/* Client Support with bot image */}
        <div className="client-support">
          <button 
            className="icon-button" 
            title="Client Support" 
            onClick={() => navigate('/support')}
          >
            <span className="support-icon">🤖</span>
          </button>
        </div>
        
        {/* Notifications - empty but kept for layout consistency */}
        <div className="notifications">
          <button 
            className="icon-button" 
            title="Notifications"
          >
            🔔
          </button>
        </div>
        
        {/* User Profile */}
        <div className="user-profile">
          <div className="user-avatar" onClick={toggleUserMenu}>
            {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
          </div>
          
          {showUserMenu && (
            <div className="dropdown-menu user-dropdown">
              <div className="user-info">
                <div className="user-avatar-large">
                  {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="user-details">
                  <span className="user-name">{userEmail || 'User'}</span>
                  <span className="user-role">Client</span>
                </div>
              </div>
              
              <ul className="user-menu-list">
                
                <li onClick={() => navigate('/settings')}>
                  <span className="menu-icon">⚙️</span>
                  <span>Settings</span>
                </li>
                <li onClick={handleLogout}>
                  <span className="menu-icon">🚪</span>
                  <span>Logout</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;