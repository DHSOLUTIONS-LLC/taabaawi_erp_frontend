// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType?: 'employee' | 'admin';
}

export default function ProtectedRoute({ 
  children, 
  requiredUserType 
}: ProtectedRouteProps) {
  const { token, userType } = useSelector((state: RootState) => state.auth);
  
  // Check if user is authenticated
  if (!token) {
    return <Navigate to={requiredUserType === 'admin' ? '/admin_login' : '/login'} replace />;
  }
  
  // Check if user type matches required user type
  if (requiredUserType && userType !== requiredUserType) {
    // Redirect to appropriate dashboard based on user type
    return <Navigate to={userType === 'admin' ? '/admin' : '/'} replace />;
  }
  
  return <>{children}</>;
}