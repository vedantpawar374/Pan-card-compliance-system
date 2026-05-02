import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';

// Import Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PanDetails from './pages/PanDetails';
import Form16Details from './pages/Form16Details';
import TaxAnalysis from './pages/TaxAnalysis';
import ComplianceTasks from './pages/ComplianceTasks';

// Import Styles
import './App.css';

function App() {
  return (
    <AppProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pan-details" element={<PanDetails />} />
          <Route path="/form16-details" element={<Form16Details />} />
          <Route path="/tax-analysis" element={<TaxAnalysis />} />
          <Route path="/compliance-tasks" element={<ComplianceTasks />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;
