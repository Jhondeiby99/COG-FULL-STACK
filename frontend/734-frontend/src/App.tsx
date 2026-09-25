import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Home } from './pages/home';
import { Login } from './pages/login';
import { FoundationProfile } from './pages/foundation-profile';
import { SignUp } from './pages/sign-up';
import './styles/global.css';

import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/fundacion" element={<FoundationProfile />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
