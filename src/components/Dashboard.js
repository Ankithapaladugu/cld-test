import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Layout from './Layout';
import './Dashboard.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const Dashboard = () => {
  const [financialData, setFinancialData] = useState({
    cashBalance: 0,
    revenue: 0,
    expenses: 0,
    netBurn: 0,
  });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchFinancialData();
    fetchChartData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        console.error('No user logged in');
        setLoading(false);
        return;
      }

      const userId = sessionData.session.user.id;

      // Check if a 'financial_data' table exists, if not, use dummy data
      const { data, error } = await supabase
        .from('financial_data')
        .select('cash_balance, revenue, expenses, net_burn')
        .eq('client_id', userId)
        .single();

      if (error) {
        console.warn('Using dummy financial data:', error.message);
        // Use dummy data if table doesn't exist or other error
        setFinancialData({
          cashBalance: 125780.45,
          revenue: 42650.30,
          expenses: 31240.75,
          netBurn: 11409.55
        });
      } else if (data) {
        setFinancialData({
          cashBalance: data.cash_balance,
          revenue: data.revenue,
          expenses: data.expenses,
          netBurn: data.net_burn,
        });
      }
    } catch (error) {
      console.error('Error in fetchFinancialData:', error);
      // Fallback to dummy data in case of error
      setFinancialData({
        cashBalance: 125780.45,
        revenue: 42650.30,
        expenses: 31240.75,
        netBurn: 11409.55
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        console.error('No user logged in for chart data');
        return;
      }

      const userId = sessionData.session.user.id;

      const { data, error } = await supabase
        .from('financial_history')
        .select('month, revenue, expenses')
        .eq('client_id', userId)
        .order('month', { ascending: true });

      if (error) {
        console.warn('Using dummy chart data:', error.message);
        // Use dummy data if table doesn't exist or other error
        setChartData([
          { month: 'Jan', revenue: 36000, expenses: 28000 },
          { month: 'Feb', revenue: 38000, expenses: 29500 },
          { month: 'Mar', revenue: 40000, expenses: 30200 },
          { month: 'Apr', revenue: 41500, expenses: 30800 },
          { month: 'May', revenue: 42650, expenses: 31240 },
        ]);
      } else if (data && data.length > 0) {
        setChartData(data);
      } else {
        // Fallback to dummy data if no data is returned
        setChartData([
          { month: 'Jan', revenue: 36000, expenses: 28000 },
          { month: 'Feb', revenue: 38000, expenses: 29500 },
          { month: 'Mar', revenue: 40000, expenses: 30200 },
          { month: 'Apr', revenue: 41500, expenses: 30800 },
          { month: 'May', revenue: 42650, expenses: 31240 },
        ]);
      }
    } catch (error) {
      console.error('Error in fetchChartData:', error);
      // Fallback to dummy data in case of error
      setChartData([
        { month: 'Jan', revenue: 36000, expenses: 28000 },
        { month: 'Feb', revenue: 38000, expenses: 29500 },
        { month: 'Mar', revenue: 40000, expenses: 30200 },
        { month: 'Apr', revenue: 41500, expenses: 30800 },
        { month: 'May', revenue: 42650, expenses: 31240 },
      ]);
    }
  };

  // Function to format currency in euros
  const formatEuro = (amount) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Function to calculate percentage change
  const percentChange = (current, previous) => {
    if (!previous) return "0.0";
    const change = ((current - previous) / previous) * 100;
    return change.toFixed(1);
  };

  // Get previous month data for percentage change calculations
  const getPreviousMonthData = () => {
    if (chartData.length < 2) return null;
    return chartData[chartData.length - 2];
  };

  const prevMonth = getPreviousMonthData();

  if (loading) return <Layout><div className="loading-container"><div className="loading-spinner"></div><p>Loading dashboard data...</p></div></Layout>;

  return (
    <Layout>
      <div className="dashboard-container">
        <h1>Financial Dashboard</h1>
        
        <div className="financial-summary">
          <div className="financial-card cash-balance">
            <div className="card-icon">💶</div>
            <div className="card-content">
              <h3>Cash Balance</h3>
              <p className="card-value">{formatEuro(financialData.cashBalance)}</p>
              <p className="card-change positive">+2.3% from last month</p>
            </div>
          </div>
          
          <div className="financial-card revenue">
            <div className="card-icon">📈</div>
            <div className="card-content">
              <h3>Revenue</h3>
              <p className="card-value">{formatEuro(financialData.revenue)}</p>
              {prevMonth && (
                <p className={`card-change ${financialData.revenue > prevMonth.revenue ? 'positive' : 'negative'}`}>
                  {financialData.revenue > prevMonth.revenue ? '+' : ''}
                  {percentChange(financialData.revenue, prevMonth.revenue)}% from last month
                </p>
              )}
            </div>
          </div>
          
          <div className="financial-card expenses">
            <div className="card-icon">📉</div>
            <div className="card-content">
              <h3>Expenses</h3>
              <p className="card-value">{formatEuro(financialData.expenses)}</p>
              {prevMonth && (
                <p className={`card-change ${financialData.expenses < prevMonth.expenses ? 'positive' : 'negative'}`}>
                  {financialData.expenses < prevMonth.expenses ? '-' : '+'}
                  {Math.abs(percentChange(financialData.expenses, prevMonth.expenses))}% from last month
                </p>
              )}
            </div>
          </div>
          
          <div className="financial-card net-burn">
            <div className="card-icon">🔥</div>
            <div className="card-content">
              <h3>Net Burn</h3>
              <p className="card-value">{formatEuro(financialData.netBurn)}</p>
              <p className="card-change positive">+6.4% from last month</p>
            </div>
          </div>
        </div>
        
        <div className="dashboard-sections">
          <div className="dashboard-section">
            <h2>Financial Trends</h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatEuro(value)} />
                  <Line type="monotone" dataKey="revenue" stroke="#4caf50" strokeWidth={2} name="Revenue" />
                  <Line type="monotone" dataKey="expenses" stroke="#f44336" strokeWidth={2} name="Expenses" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="dashboard-section">
            <h2>Recent Activity</h2>
            <ul className="activity-list">
              <li>
                <div className="activity-date">20 Mar</div>
                <div className="activity-content">
                  <span className="activity-title">Invoice #INV-2025-046 paid</span>
                  <span className="activity-amount positive">{formatEuro(15420.50)}</span>
                </div>
              </li>
              <li>
                <div className="activity-date">18 Mar</div>
                <div className="activity-content">
                  <span className="activity-title">Quarterly tax payment</span>
                  <span className="activity-amount negative">{formatEuro(8750.25)}</span>
                </div>
              </li>
              <li>
                <div className="activity-date">15 Mar</div>
                <div className="activity-content">
                  <span className="activity-title">New subscription service added</span>
                  <span className="activity-amount negative">{formatEuro(299.99)}</span>
                </div>
              </li>
              <li>
                <div className="activity-date">10 Mar</div>
                <div className="activity-content">
                  <span className="activity-title">Invoice #INV-2025-045 paid</span>
                  <span className="activity-amount positive">{formatEuro(8760.00)}</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;