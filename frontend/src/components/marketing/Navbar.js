import { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Container,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useTheme,
  alpha,
  Avatar,
  Chip,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';

function MarketingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Services', path: '/services' },
    { label: 'Contact', path: '/contact' }
  ];

  const isActive = (path) => location.pathname === path;

  const drawer = (
    <Box sx={{ width: 260, pt: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            component="img"
            src="/ao-logo.png"
            alt="AO Counsellor HUB Logo"
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1,
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
              border: `2px solid ${alpha(theme.palette.background.paper, 0.8)}`,
              objectFit: 'contain',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'scale(1.05) rotate(2deg)',
                boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`
              }
            }}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 700, 
              fontSize: '0.95rem',
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1.1,
              letterSpacing: '-0.02em'
            }}>
              AO Counsellor HUB
            </Typography>
            <Typography variant="caption" sx={{ 
              fontWeight: 500, 
              fontSize: '0.65rem',
              color: theme.palette.text.secondary,
              lineHeight: 1.2,
              letterSpacing: '0.02em'
            }}>
              Student Management Platform
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleDrawerToggle} size="small">
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>
      <List sx={{ px: 1 }}>
        {navItems.map((item) => (
          <ListItem 
            key={item.label} 
            component={Link} 
            to={item.path}
            onClick={handleDrawerToggle}
            sx={{
              mx: 0.5,
              borderRadius: 1.5,
              mb: 0.3,
              py: 0.8,
              background: isActive(item.path) ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)` : 'transparent',
              '&:hover': {
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                transform: 'translateX(4px)',
                transition: 'all 0.3s ease'
              }
            }}
          >
            <ListItemText 
              primary={item.label} 
              sx={{
                '& .MuiTypography-root': {
                  fontWeight: isActive(item.path) ? 600 : 500,
                  fontSize: '0.9rem',
                  color: isActive(item.path) ? theme.palette.primary.main : theme.palette.text.primary
                }
              }}
            />
          </ListItem>
        ))}
        <ListItem sx={{ mt: 1.5, px: 0.5 }}>
          <Button
            component={Link}
            to="/login"
            variant="contained"
            fullWidth
            startIcon={<DashboardIcon sx={{ fontSize: 16 }} />}
            endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
            sx={{
              py: 1,
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8rem',
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              boxShadow: `0 3px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.35)}`,
                background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            Counsellor Login
          </Button>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar 
        position="static" 
        elevation={0}
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          position: 'sticky',
          top: 0,
          zIndex: 1200,
          height: { xs: 60, sm: 70 }
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
          <Toolbar sx={{ 
            px: 0, 
            py: 0, 
            minHeight: { xs: 60, sm: 70 },
            height: { xs: 60, sm: 70 },
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 0 }}>
              <Box
                component="img"
                src="/ao-logo.png"
                alt="AO Counsellor HUB Logo"
                sx={{
                  width: { xs: 44, sm: 48 },
                  height: { xs: 44, sm: 48 },
                  borderRadius: 1,
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                  border: `2px solid ${alpha(theme.palette.background.paper, 0.8)}`,
                  objectFit: 'contain',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'scale(1.05) rotate(2deg)',
                    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`
                  }
                }}
              />
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: '1rem', sm: '1.1rem' },
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em'
                  }}
                >
                  AO Counsellor HUB
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 500,
                    fontSize: { xs: '0.65rem', sm: '0.7rem' },
                    color: theme.palette.text.secondary,
                    lineHeight: 1.2,
                    letterSpacing: '0.02em'
                  }}
                >
                  Student Management Platform
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5, flexGrow: 0 }}>
              {navItems.map((item) => (
                <Button
                  key={item.label}
                  component={Link}
                  to={item.path}
                  sx={{
                    color: isActive(item.path) ? theme.palette.primary.main : theme.palette.text.primary,
                    fontWeight: isActive(item.path) ? 600 : 500,
                    textTransform: 'none',
                    fontSize: '0.85rem',
                    px: 1.5,
                    py: 0.8,
                    borderRadius: 1.5,
                    minWidth: 'auto',
                    background: isActive(item.path) ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)` : 'transparent',
                    '&:hover': {
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                      transform: 'translateY(-1px)',
                      boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.1)}`
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  {item.label}
                </Button>
              ))}
              
              <Button
                component={Link}
                to="/login"
                variant="contained"
                startIcon={<PersonIcon sx={{ fontSize: 16 }} />}
                endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                sx={{
                  ml: 1.5,
                  py: 0.8,
                  px: 2,
                  borderRadius: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  minWidth: 'auto',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  boxShadow: `0 3px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.35)}`,
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                Counsellor Login
              </Button>
            </Box>

            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexGrow: 0 }}>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{
                  color: theme.palette.primary.main,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
                  width: 36,
                  height: 36,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(theme.palette.secondary.main, 0.12)} 100%)`,
                    transform: 'scale(1.05)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <MenuIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: 260,
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.98)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
            backdropFilter: 'blur(20px)',
            border: 'none',
            boxShadow: `0 6px 24px ${alpha(theme.palette.common.black, 0.08)}`
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
}

export default MarketingNavbar;