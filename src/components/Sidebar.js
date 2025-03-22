import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-toggle" onClick={toggleSidebar}>
        {collapsed ? '>' : '<'}
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          <li>
            <NavLink to="/dashboard" className={({isActive}) => isActive ? 'active' : ''}>
              <span className="icon">📊</span>
              {!collapsed && <span className="label">Dashboard</span>}
            </NavLink>
          </li>
          <li>
            <NavLink to="/financial-overview" className={({isActive}) => isActive ? 'active' : ''}>
              <span className="icon">💰</span>
              {!collapsed && <span className="label">Financial Overview</span>}
            </NavLink>
          </li>
          <li>
            <NavLink to="/invoices" className={({isActive}) => isActive ? 'active' : ''}>
              <span className="icon">📝</span>
              {!collapsed && <span className="label">Invoices</span>}
            </NavLink>
          </li>
          <li>
            <NavLink to="/documents" className={({isActive}) => isActive ? 'active' : ''}>
              <span className="icon">📄</span>
              {!collapsed && <span className="label">Documents</span>}
            </NavLink>
          </li>
          <li>
            <NavLink to="/services" className={({isActive}) => isActive ? 'active' : ''}>
              <span className="icon">🛠️</span>
              {!collapsed && <span className="label">Services</span>}
            </NavLink>
          </li>
          <li>
            <NavLink to="/profile" className={({isActive}) => isActive ? 'active' : ''}>
              <span className="icon">👤</span>
              {!collapsed && <span className="label">Profile</span>}
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;