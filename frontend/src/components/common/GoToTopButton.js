import { useState, useEffect } from 'react';
import { 
  Fab, 
  useTheme, 
  alpha,
  Fade
} from '@mui/material';
import { 
  KeyboardArrowUp as KeyboardArrowUpIcon 
} from '@mui/icons-material';

function GoToTopButton() {
  const theme = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsVisible(scrollTop > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <Fade in={isVisible}>
      <Fab
        onClick={scrollToTop}
        color="primary"
        aria-label="scroll back to top"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
          '&:hover': {
            background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
            transform: 'translateY(-2px)',
            boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.5)}`,
          },
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          width: 56,
          height: 56,
        }}
      >
        <KeyboardArrowUpIcon sx={{ fontSize: 28 }} />
      </Fab>
    </Fade>
  );
}

export default GoToTopButton;
