import logo from './logo.svg';
import './App.css';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Add_Company from './pages/Add_Company';
import Companies from './pages/Companies';
import SocialMediaConnection from './pages/SocialMediaConnection';
import UploadMedia from './pages/UploadMedia';
import ShowAllMedia from './pages/ShowAllMedia';
import ManualPosting from './pages/ManualPosting';
import PrivacyPolicies from './pages/PrivacyPolicies';
import TermsAndConditions from './pages/TermsAndConditions';
import LandingPage from './pages/LandingPage';
function App() {
  return (
    <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/companies/add" element={<Add_Company />} />
    <Route path="/companies" element={<Companies />} />
    <Route path="/social-accounts" element={<SocialMediaConnection />} />
    <Route path="/manual-posting" element={<ManualPosting />} />
    <Route path="/media/upload" element={<UploadMedia />} />
    <Route path="/media" element={<ShowAllMedia />} />
    <Route path='/privacy' element={<PrivacyPolicies />} />
    <Route path='/terms' element={<TermsAndConditions />} />
    <Route path='/' element={<LandingPage />} />

    </Routes>
  );
}

export default App;

