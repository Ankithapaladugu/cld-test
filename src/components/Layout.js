import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import Header from './Header';
import Sidebar from './Sidebar';
import './Layout.css';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const Layout = ({ children }) => {
  const [userEmail, setUserEmail] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();
      
      // If no session, redirect to login
      if (!data.session) {
        navigate('/login');
        return;
      }
      
      setUserEmail(data.session.user.email);
    };
    
    getUser();
  }, [navigate]);

  return (
    <div className="app-container">
      <Header userEmail={userEmail} />
      <Sidebar />
      <main className="app-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;