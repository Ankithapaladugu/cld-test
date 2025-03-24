import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

import KYCDocuments from './components/KYCDocuments';
import FinancialDocuments from './components/FinancialDocuments';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/documents/kyc" element={<KYCDocuments />} />
        <Route path="/documents/financial" element={<FinancialDocuments />} />
       

        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;