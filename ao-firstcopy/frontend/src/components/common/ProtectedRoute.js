import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = user.role?.toLowerCase?.() || user.role;

  if (allowedRoles && !allowedRoles.map((role) => role.toLowerCase()).includes((userRole || '').toLowerCase())) {
    const defaultRoutes = {
      admin: '/admin/dashboard',
      counselor: '/counselor/dashboard',
      telecaller: '/telecaller/dashboard',
      marketing: '/marketing/dashboard',
      b2b_marketing: '/b2b-marketing/dashboard'
    };
    const fallbackRoute = defaultRoutes[(userRole || '').toLowerCase()] || '/login';
    return <Navigate to={fallbackRoute} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute; 