import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';

// --- VISUAL UPGRADE ---
// This adds the "AI Fog" animation behind all pages
import NeuralBackground from './components/ui/NeuralBackground';
import FloatingChatbot from './components/FloatingChatbot';

// --- CORE PAGES ---
import Landing from './pages/Landing'; // IMPORTANT: Ensure your file is named 'Landing.jsx'
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Records from './pages/Records';
import Clinician from './pages/Clinician';
import Scanner from './pages/Scanner';
import Chat from './pages/Chat';
import PurchaseCorner from './pages/PurchaseCorner';
import Appointments from './pages/Appointments';
import Profile from './pages/Profile';
import Fitness from './pages/Fitness';
import Emergency from './pages/Emergency';

// --- AUTH PROTECTOR ---
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('uhlis_user_id');
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      {/* The Living Background Layer */}
      <NeuralBackground />
      
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        
        {/* Main User App */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        
        {/* Core Medical Tools */}
        <Route path="/records" element={<ProtectedRoute><Records /></ProtectedRoute>} />
        <Route path="/clinician" element={<ProtectedRoute><Clinician /></ProtectedRoute>} />
        <Route path="/scanner" element={<ProtectedRoute><Scanner /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        
        {/* Integrated Medical Exchange */}
        <Route path="/purchase" element={<ProtectedRoute><PurchaseCorner /></ProtectedRoute>} />
        
        {/* New Pages */}
        <Route path="/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/fitness" element={<ProtectedRoute><Fitness /></ProtectedRoute>} />
        <Route path="/emergency" element={<ProtectedRoute><Emergency /></ProtectedRoute>} />
      </Routes>

      {/* Floating AI Health Copilot — available on all pages except landing */}
      <FloatingChatbot />
    </Router>
  );
}

export default App;