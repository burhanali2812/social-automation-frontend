import logo from './logo.svg';
import './App.css';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Add_Company from './pages/Add_Company';
import Companies from './pages/Companies';
import SocialMediaConnection from './pages/SocialMediaConnection';
function App() {
  return (
    <Routes>
    <Route path="/" element={<Login />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/companies/add" element={<Add_Company />} />
    <Route path="/companies" element={<Companies />} />
    <Route path="/social-accounts" element={<SocialMediaConnection />} />

    </Routes>
  );
}

export default App;

