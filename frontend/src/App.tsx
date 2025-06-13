import './App.scss'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import SignInSide from './pages/Login/Sign-In/SignInSide'
import SignUp from './pages/Login/Sign-Up/SignUp'
import HomePage from './pages/Home/HomePage'
import { AuthProvider, useAuth } from './contexts/AuthContext'

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuth, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>; // You can replace this with a proper loading component
  }
  
  return isAuth ? <>{children}</> : <Navigate to="/signin" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/signin" element={<SignInSide />} />
      <Route path="/signup" element={<SignUp />} />
      <Route 
        path="/home" 
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        } 
      />
      {/* For development, allow direct access to HomePage without auth check */}
      <Route path="/home-dev" element={<HomePage />} />
      {/* Redirect root to signin page */}
      <Route path="/" element={<Navigate to="/signin" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}

export default App
