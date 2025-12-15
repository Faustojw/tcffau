import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { StationProvider } from './context/StationContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { RegisterStation } from './pages/RegisterStation';
import { DashboardOperator } from './pages/DashboardOperator';
import { DashboardUser } from './pages/DashboardUser';
import { DashboardAdmin } from './pages/DashboardAdmin';
import { StationDetails } from './pages/StationDetails';
import { UserRole } from './types';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactElement, allowedRoles?: UserRole[] }> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Carregando...</div>;
  
  if (!user) return <Navigate to="/login" replace />;

  // Redirect to home if user role is not allowed
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <StationProvider>
            <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100 font-sans">
              <Navbar />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/register-station" element={<RegisterStation />} />
                  <Route path="/stations/:id" element={<StationDetails />} />
                  
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute allowedRoles={[UserRole.USER]}>
                        <DashboardUser />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/operator" 
                    element={
                      <ProtectedRoute allowedRoles={[UserRole.OPERATOR]}>
                        <DashboardOperator />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/admin" 
                    element={
                      <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                        <DashboardAdmin />
                      </ProtectedRoute>
                    } 
                  />
                </Routes>
              </main>
              <Footer />
            </div>
          </StationProvider>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;