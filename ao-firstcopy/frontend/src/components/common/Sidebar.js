// src/components/common/Sidebar.js
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Toolbar,
  Divider
} from '@mui/material';
import {
  Dashboard,
  People,
  School,
  Assessment,
  Settings,
  Person,
  Description,
  Assignment
} from '@mui/icons-material';

const drawerWidth = 240;

function Sidebar({ role }) {
  const location = useLocation();
  const navigate = useNavigate();

  const adminMenuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/admin' },
    { text: 'Counselors', icon: <People />, path: '/admin/counselors' },
    { text: 'All Students', icon: <School />, path: '/admin/students' },
    { text: 'Analytics', icon: <Assessment />, path: '/admin/analytics' },
    { text: 'Settings', icon: <Settings />, path: '/admin/settings' }
  ];

  const counselorMenuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'My Students', icon: <Person />, path: '/dashboard/students' },
    { text: 'Documents', icon: <Description />, path: '/dashboard/documents' },
    { text: 'Applications', icon: <Assignment />, path: '/dashboard/applications' }
  ];

  const menuItems = role === 'admin' ? adminMenuItems : counselorMenuItems;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Toolbar /> {/* Add spacing for app bar */}
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}

export default Sidebar;