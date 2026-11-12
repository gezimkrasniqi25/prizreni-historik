import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import MonumentsPage from './pages/MonumentsPage';
import MonumentDetailPage from './pages/MonumentDetailPage';
import MapPage from './pages/MapPage';
import Explore3DPage from './pages/Explore3DPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import {
  ForgotPasswordPage,
  LoginPage,
  RegisterPage,
  ResetPasswordPage,
  VerifyEmailPage,
} from './pages/AuthPages';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="monuments" element={<MonumentsPage />} />
        <Route path="monuments/:slug" element={<MonumentDetailPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="explore-3d" element={<Explore3DPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="verify-email" element={<VerifyEmailPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="*" element={<HomePage />} />
      </Route>
    </Routes>
  );
}
